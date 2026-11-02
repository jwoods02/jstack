import { afterEach, describe, expect, test } from "bun:test"
import { comment, fixturePr, review, rollup, storage, world } from "./harness"

const stops: (() => Promise<void>)[] = []
afterEach(async () => {
  while (stops.length) await stops.pop()!()
  delete (globalThis as any).__jstackGithub
})

function start(w: ReturnType<typeof world>, deps: Record<string, unknown> = {}) {
  const runner = w.runner(deps)
  stops.push(runner.stop)
  return runner
}

describe("plugin", () => {
  test("CI finishing wakes once with the state stored, and a restart doesn't resend", async () => {
    const store = storage()
    const w = world({ store })
    let clock = 1_000_000
    w.gh.set(fixturePr({ rollup: rollup("PENDING") }))
    const runner = start(w, { now: () => clock })
    await runner.tick()
    w.gh.set(fixturePr({ rollup: rollup("SUCCESS") }))
    clock += 30_000
    await runner.tick()
    clock += 30_000
    await runner.tick()
    expect(w.calls.prompts.map((p) => p.text)).toEqual([expect.stringContaining("CI passed on aaaaaaa")])
    expect(store.map.get("pr/jwoods02/jstack#13").checks).toBe("passed")
    await runner.stop()

    const again = world({ store, gh: w.gh })
    await start(again).tick()
    expect(again.calls.prompts).toHaveLength(0)
  })

  test("no sessions in scope means no gh calls", async () => {
    const w = world()
    w.sessions.get("ses_owner")!.location.directory = "/outside/wt"
    await start(w).tick()
    expect(w.gh.calls).toHaveLength(0)
  })

  test("a branch with no PR costs one discovery call, then none", async () => {
    const w = world()
    const runner = start(w)
    for (let i = 0; i < 12; i++) await runner.tick()
    expect(w.gh.calls).toHaveLength(1)
  })

  test("a title James typed stays", async () => {
    const w = world()
    w.sessions.get("ses_owner")!.title = "James typed this"
    w.gh.set(fixturePr())
    await start(w).tick()
    expect(w.calls.titles).toHaveLength(0)
  })

  test("a bot comment wakes the owner", async () => {
    const w = world()
    let clock = 1_000_000
    w.gh.set(fixturePr())
    const runner = start(w, { now: () => clock })
    await runner.tick()
    w.gh.set(fixturePr({ comments: [comment("c1", "2026-11-02T10:00:00Z")] }))
    clock += 5 * 60_000
    await runner.tick()
    expect(w.calls.prompts.map((p) => p.text)).toEqual([expect.stringContaining("comment from cursor: hello")])
  })

  test("every one of 21 PR comments between polls wakes", async () => {
    const w = world()
    let clock = 1_000_000
    const old = Array.from({ length: 30 }, (_, i) => comment(`old${i}`, `2026-11-02T09:${String(i).padStart(2, "0")}:00Z`, "jwoods02"))
    w.gh.set(fixturePr({ comments: old }))
    const runner = start(w, { now: () => clock })
    await runner.tick()
    const fresh = Array.from({ length: 21 }, (_, i) => comment(`new${i}`, `2026-11-02T10:${String(i).padStart(2, "0")}:00Z`))
    w.gh.set(fixturePr({ comments: [...old, ...fresh] }))
    clock += 5 * 60_000
    await runner.tick()
    expect(w.calls.prompts).toHaveLength(1)
    expect(w.calls.prompts[0].text.match(/comment from cursor/g)).toHaveLength(21)
    clock += 5 * 60_000
    await runner.tick()
    expect(w.calls.prompts).toHaveLength(1)
  })

  test("a reply in the oldest of 21 review threads wakes with its text", async () => {
    const w = world()
    let clock = 1_000_000
    const inline = (id: string, body: string) => ({ body, url: `https://x/${id}` })
    const threads = Array.from({ length: 21 }, (_, i) => review(`r${i}`, `2026-11-02T09:${String(i).padStart(2, "0")}:00Z`, "copilot", "COMMENTED", "", [inline(`t${i}`, "nit")]))
    w.gh.set(fixturePr({ reviews: threads }))
    const runner = start(w, { now: () => clock })
    await runner.tick()
    const reply = review("reply", "2026-11-02T10:00:00Z", "cursor", "COMMENTED", "", [inline("reply-comment", "Fixed in the next push?")])
    w.gh.set(fixturePr({ reviews: [...threads, reply] }))
    clock += 5 * 60_000
    await runner.tick()
    expect(w.calls.prompts.map((p) => p.text)).toEqual([expect.stringContaining("review comment from cursor: Fixed in the next push? https://x/reply-comment")])
  })

  test("a review with inline comments wakes once, with its verdict and count", async () => {
    const w = world()
    let clock = 1_000_000
    w.gh.set(fixturePr())
    const runner = start(w, { now: () => clock })
    await runner.tick()
    const inline = [{ body: "one", url: "https://x/1" }, { body: "two", url: "https://x/2" }]
    w.gh.set(fixturePr({ reviews: [review("rv", "2026-11-02T10:00:00Z", "jwoods02", "CHANGES_REQUESTED", "Needs work", inline)] }))
    clock += 5 * 60_000
    await runner.tick()
    expect(w.calls.prompts[0].text).toContain("review (changes requested, 2 comments) from jwoods02: Needs work https://x/rv")
  })
})
