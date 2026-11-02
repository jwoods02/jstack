import { afterEach, describe, expect, test } from "bun:test"
import { comment, fixturePr, rollup, storage, world } from "./harness"

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
})
