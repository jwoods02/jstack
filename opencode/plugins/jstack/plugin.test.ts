import { afterEach, describe, expect, test } from "bun:test"
import * as M from "./model"
import { comment, fixturePr, github, renameCall, review, rollup, storage, world } from "./harness"

const stops: (() => Promise<void>)[] = []
afterEach(async () => {
  while (stops.length) await stops.pop()!()
  delete (globalThis as any).__jstackGithub
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const baseline = (w: ReturnType<typeof world>) => w.store.map.set("pr/jwoods02/jstack#13", M.parsePr({ ...fixtureNode(), number: 13 }).state)
const fixtureNode = () => ({ number: 13, title: "feat: Test PR", url: "u", state: "OPEN", isDraft: true, headRefOid: "a".repeat(40), commits: { nodes: [] } })

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

  test("a PR merged while the service was down wakes once after restart", async () => {
    const store = storage()
    const before = world({ store })
    before.gh.set(fixturePr())
    await start(before).tick()
    expect(store.map.get("pr/jwoods02/jstack#13").state).toBe("OPEN")
    await stops.pop()!()

    before.gh.set(fixturePr({ state: "MERGED", isDraft: false }))
    const after = world({ store, gh: before.gh })
    await start(after).tick()
    expect(after.calls.prompts.map((p) => p.text)).toEqual([expect.stringMatching(/^\[github\] #13 [\s\S]*\n- merged$/)])
    await stops.pop()!()

    const again = world({ store, gh: before.gh })
    await start(again).tick()
    expect(again.calls.prompts).toHaveLength(0)
  })

  test("a merged PR never seen before sends nothing", async () => {
    const w = world()
    w.gh.set(fixturePr({ state: "MERGED", isDraft: false }))
    await start(w).tick()
    expect(w.calls.prompts).toHaveLength(0)
    expect(w.store.map.get("pr/jwoods02/jstack#13").state).toBe("MERGED")
  })

  test("instances in one process: one polls, and a clean stop hands over", async () => {
    const gh = github()
    gh.set(fixturePr())
    const a = start(world({ gh }))
    const b = start(world({ gh }))
    await Promise.all([a.tick(), b.tick()])
    expect(gh.calls).toHaveLength(1)
    await a.stop()
    await b.tick()
    expect(gh.calls).toHaveLength(2)
  })

  test("stopping during a tick drains it, and it sends nothing", async () => {
    const w = world()
    baseline(w)
    w.gh.set(fixturePr({ comments: [comment("bot", "2026-11-02T10:00:00Z")] }))
    const gate = deferred<void>()
    const entered = deferred<void>()
    const list = w.ctx.session.list
    w.ctx.session.list = async () => {
      entered.resolve()
      await gate.promise
      return list()
    }
    const runner = start(w)
    const tick = runner.tick()
    await entered.promise
    let stopped = false
    const stopping = runner.stop().then(() => (stopped = true))
    await Bun.sleep(5)
    expect(stopped).toBe(false)
    gate.resolve()
    await Promise.all([tick, stopping])
    expect(w.calls.prompts).toHaveLength(0)
    expect(w.store.map.get("pr/jwoods02/jstack#13").activityAt).toBe("")
  })
  for (const [what, change] of [
    ["moved out of scope", (s: any) => (s.location.directory = "/outside/wt")],
    ["moved to another worktree", (s: any) => (s.location.directory = "/scratch/other")],
    ["archived", (s: any) => (s.time.archived = 5)],
  ] as const) {
    test(`a session ${what} during polling gets no message or rename until it owns the PR again`, async () => {
      const w = world()
      w.worktrees.set("/scratch/other", { top: "/scratch/other", main: "/scratch/main", branch: "feat/other" })
      let clock = 1_000_000
      baseline(w)
      w.gh.set(fixturePr({ comments: [comment("bot", "2026-11-02T10:00:00Z")] }))
      const owner = w.sessions.get("ses_owner")!
      const saved = structuredClone(owner)
      w.gh.before(() => change(owner))
      const runner = start(w, { now: () => clock })
      await runner.tick()
      expect([...w.calls.prompts, ...w.calls.titles]).toEqual([])
      w.gh.before(undefined)
      w.sessions.set("ses_owner", saved)
      clock += 30_000
      await runner.tick()
      expect(w.calls.prompts.map((p) => p.text)).toEqual([expect.stringContaining("comment from cursor")])
    })
  }

  describe("titles", () => {
    function titled(title: string, renamedAt?: number) {
      const w = world()
      const owner = w.sessions.get("ses_owner")!
      owner.title = title
      if (renamedAt !== undefined) w.context.set("ses_owner", [renameCall(title, renamedAt)])
      w.gh.set(fixturePr())
      return { w, owner }
    }
    const james = (owner: any, title: string) => {
      owner.title = title
      owner.time.updated++
    }

    test("a task name the session gave itself becomes the PR title", async () => {
      const { w, owner } = titled("Task", 100)
      await start(w, { now: () => 1_000 }).tick()
      expect(owner.title).toBe("#13 Test PR")
    })

    test("James restoring the old task name keeps it", async () => {
      const { w, owner } = titled("Task", 100)
      let clock = 1_000
      const runner = start(w, { now: () => clock })
      await runner.tick()
      expect(owner.title).toBe("#13 Test PR")
      james(owner, "Task")
      clock += 30_000
      await runner.tick()
      clock += 30_000
      await runner.tick()
      expect(owner.title).toBe("Task")
    })

    test("James typing while the plugin reads the session keeps his title", async () => {
      const { w, owner } = titled("")
      w.hooks.context = () => james(owner, "Typed during poll")
      let clock = 1_000
      const runner = start(w, { now: () => clock })
      await runner.tick()
      w.hooks.context = undefined
      clock += 30_000
      await runner.tick()
      expect(owner.title).toBe("Typed during poll")
      expect(w.calls.titles).toEqual([])
    })

    test("a self-rename after James's title hands it back to the plugin", async () => {
      const { w, owner } = titled("Task", 100)
      let clock = 1_000
      const runner = start(w, { now: () => clock })
      await runner.tick()
      james(owner, "James's name")
      clock += 30_000
      await runner.tick()
      expect(owner.title).toBe("James's name")
      w.context.set("ses_owner", [renameCall("Next task", clock + 1)])
      james(owner, "Next task")
      clock += 30_000
      await runner.tick()
      expect(owner.title).toBe("#13 Test PR")
    })

    test("an unchanged session's context isn't read again", async () => {
      const { w, owner } = titled("Task", 100)
      let clock = 1_000
      const runner = start(w, { now: () => clock })
      for (let i = 0; i < 4; i++) {
        await runner.tick()
        clock += 30_000
      }
      expect(w.calls.context).toBe(2)
      owner.time.updated++
      await runner.tick()
      expect(w.calls.context).toBe(3)
    })
  })
})
