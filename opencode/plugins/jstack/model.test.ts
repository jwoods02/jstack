import { describe, expect, test } from "bun:test"
import live from "./fixtures/azure-47790-rollup.json"
import * as M from "./model"

const repo = { owner: "jwoods02", name: "jstack" }

function prNode(overrides: Record<string, any> = {}) {
  return {
    number: 12,
    title: "feat(opencode): [RES-391] Sessions say what they wait on",
    url: "https://github.com/jwoods02/jstack/pull/12",
    state: "OPEN",
    isDraft: true,
    headRefOid: "da94c0facaeeac8dfa5f0fdf6b7b0a5c0df402a5",
    commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
    reviews: { nodes: [] },
    comments: { nodes: [] },
    ...overrides,
  }
}

const rollup = (state: string, contexts: any[] = []) => ({ nodes: [{ commit: { statusCheckRollup: { state, contexts: { nodes: contexts } } } }] })
const run = (name: string, status: string, conclusion: string | null) => ({ __typename: "CheckRun", name, status, conclusion })
const comment = (id: string, author: string, createdAt: string, body = "looks good") => ({ id, author: { login: author }, body, createdAt, url: `https://x/${id}` })

const parse = (overrides: Record<string, any> = {}) => M.parsePr(prNode(overrides))
const step = (before: Record<string, any>, after: Record<string, any>, ignore?: (item: M.Activity) => boolean) => {
  const next = parse(after)
  return M.diff(parse(before).state, next.state, next.activity, ignore)
}

describe("titles", () => {
  test("strips the conventional-commit prefix and ticket", () => {
    expect(M.cleanTitle("feat(auth): Sign in with Sanity alongside WorkOS")).toBe("Sign in with Sanity alongside WorkOS")
    expect(M.cleanTitle("fix: [RES-391] Chat prompt")).toBe("Chat prompt")
    expect(M.cleanTitle("RES-12: chore cleanup")).toBe("chore cleanup")
    expect(M.cleanTitle("feat!: Breaking thing (RES-9)")).toBe("Breaking thing")
    expect(M.cleanTitle("Plain title")).toBe("Plain title")
  })

  test("one PR uses the PR title, a stack uses the task name", () => {
    const pr = (number: number, title: string) => ({ ...parse().state, number, title })
    expect(M.sessionTitle([pr(934, "feat(auth): Sign in with Sanity alongside WorkOS")], "whatever", false)).toBe("#934 Sign in with Sanity alongside WorkOS")
    expect(M.sessionTitle([pr(952, "feat: b"), pr(946, "feat: a")], "Chat context sweep", false)).toBe("#946→#952 Chat context sweep")
    expect(M.sessionTitle([pr(946, "feat: a"), pr(952, "feat: Top layer")], undefined, false)).toBe("#946→#952 Top layer")
    expect(M.sessionTitle([pr(934, "feat: Thing")], undefined, true)).toBe("● #934 Thing")
    expect(M.sessionTitle([], "x", true)).toBeUndefined()
  })

  test("a task name drops the plugin's own decoration", () => {
    expect(M.taskName("● #946→#952 Chat context sweep")).toBe("Chat context sweep")
    expect(M.taskName("#934 Sign in")).toBe("Sign in")
    expect(M.taskName("Chat context sweep")).toBe("Chat context sweep")
    expect(M.sessionTitle([{ ...parse().state, number: 1 }, { ...parse().state, number: 2 }], "● #1→#2 Sweep", false)).toBe("#1→#2 Sweep")
  })

  test("waiting on James comes from the board row or a closing question", () => {
    const board = "| Stream | Session | State |\n|---|---|---|\n| Sweep | ses_abc | Ready for James |\n| Other | ses_def | building |"
    expect(M.boardWaiting(board, "ses_abc")).toBe(true)
    expect(M.boardWaiting(board, "ses_def")).toBe(false)
    expect(M.boardWaiting("ses_abc is waiting on james", "ses_abc")).toBe(false)
    expect(M.askedJames("Done.\n\nShould I split this into two PRs?\n")).toBe(true)
    expect(M.askedJames("Is it fine? Yes. Shipped.")).toBe(false)
    expect(M.askedJames(undefined)).toBe(false)
  })

  test("a self rename shows in the session's own session_rename call", () => {
    const codeMode = { code: 'await tools.opencode.session_rename({ title: "Chat context sweep" })' }
    expect(M.selfRenamed([codeMode], "Chat context sweep")).toBe(true)
    expect(M.selfRenamed([{ title: "Chat context sweep" }], "Chat context sweep")).toBe(false)
    expect(M.selfRenamed([codeMode], "James typed this")).toBe(false)
  })
})

describe("map", () => {
  const git = (table: Record<string, M.GitInfo | undefined>) => (directory: string) => table[directory]
  const info = (top: string, branch: string): M.GitInfo => ({ top, main: "/repo", branch, repo })
  const session = (id: string, directory: string, extra: Partial<M.SessionRef> = {}): M.SessionRef => ({ id, title: id, directory, updated: 1, ...extra })

  test("top-level unarchived sessions in worktrees own their branch", () => {
    const owners = M.buildMap(
      [
        session("lead", "/wt/a"),
        session("child", "/wt/a", { parentID: "lead", updated: 9 }),
        session("archived", "/wt/b", { archived: true }),
        session("main", "/repo"),
        session("detached", "/wt/c"),
        session("nogit", "/tmp/x"),
      ],
      git({ "/wt/a": info("/wt/a", "feat/a"), "/wt/b": info("/wt/b", "feat/b"), "/repo": info("/repo", "main"), "/wt/c": info("/wt/c", "") }),
    )
    expect(owners.map((o) => [o.sessionID, o.branch])).toEqual([["lead", "feat/a"]])
  })

  test("a subdirectory maps to its worktree, and the latest session wins a shared worktree", () => {
    const owners = M.buildMap(
      [session("old", "/wt/a", { updated: 1 }), session("new", "/wt/a/pkg", { updated: 5 })],
      git({ "/wt/a": info("/wt/a", "feat/a"), "/wt/a/pkg": info("/wt/a", "feat/a") }),
    )
    expect(owners.map((o) => o.sessionID)).toEqual(["new"])
  })

  test("scope limits the map to one directory tree", () => {
    const table = git({ "/scratch/wt": info("/scratch/wt", "feat/x"), "/scratchy/wt": info("/scratchy/wt", "feat/y") })
    const owners = M.buildMap([session("in", "/scratch/wt"), session("out", "/scratchy/wt")], table, "/scratch/")
    expect(owners.map((o) => o.sessionID)).toEqual(["in"])
  })

  test("a stack's PRs come from gh stack view when the branch is in it", () => {
    const view = {
      currentBranch: "feat/b",
      branches: [
        { name: "feat/a", pr: { number: 946, state: "MERGED" } },
        { name: "feat/b", pr: { number: 950, state: "OPEN" } },
        { name: "feat/c", pr: { number: 952, state: "OPEN" } },
        { name: "feat/d" },
      ],
    }
    expect(M.stackPrs(view, "feat/b")).toEqual([946, 950, 952])
    expect(M.stackPrs(view, "feat/z")).toEqual([])
  })

  test("remotes parse to owner and name", () => {
    expect(M.parseRemote("git@github.com:jwoods02/jstack.git")).toEqual(repo)
    expect(M.parseRemote("https://github.com/jwoods02/jstack\n")).toEqual(repo)
    expect(M.parseRemote("https://gitlab.com/a/b.git")).toBeUndefined()
  })
})

describe("change detection", () => {
  test("the first sighting is a baseline", () => {
    const next = parse({ commits: rollup("FAILURE") })
    expect(M.diff(undefined, next.state, next.activity)).toEqual([])
  })

  test("CI finishing on the head wakes once, with failing names", () => {
    const pending = { commits: rollup("PENDING", [run("lint", "IN_PROGRESS", null)]) }
    const failed = { commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), run("test", "COMPLETED", "SUCCESS")]) }
    expect(step(pending, failed)).toEqual([{ kind: "ci", head: prNode().headRefOid, passed: false, failing: ["lint"] }])
    expect(step(failed, failed)).toEqual([])
    expect(step(pending, { commits: rollup("SUCCESS") })).toEqual([{ kind: "ci", head: prNode().headRefOid, passed: true, failing: [] }])
  })

  test("CI finishing on a new head wakes even if pending was never seen", () => {
    const changes = step({ commits: rollup("SUCCESS") }, { headRefOid: "b".repeat(40), commits: rollup("SUCCESS") })
    expect(changes).toEqual([{ kind: "ci", head: "b".repeat(40), passed: true, failing: [] }])
  })

  test("a failure rollup with checks still running is pending", () => {
    const mixed = { commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), run("test", "IN_PROGRESS", null)]) }
    expect(parse(mixed).state.checks).toBe("pending")
    const status = (context: string, state: string) => ({ __typename: "StatusContext", context, state })
    expect(parse({ commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), status("deploy", "EXPECTED")]) }).state.checks).toBe("pending")
    expect(parse({ commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), status("deploy", "PENDING")]) }).state.checks).toBe("pending")
    expect(parse({ commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), status("deploy", "SUCCESS")]) }).state.checks).toBe("failed")
  })

  test("a real GitHub failure rollup with a queued run is pending", () => {
    expect(live.commits.nodes[0].commit.statusCheckRollup.state).toBe("FAILURE")
    const parsed = parse({ commits: live.commits })
    expect(parsed.state.checks).toBe("pending")
    expect(parsed.state.failing).toEqual(["Automated merging requirements met"])
  })

  test("past 100 contexts, the counts decide whether checks still run", () => {
    const done = Array.from({ length: 100 }, (_, i) => run(`job${i}`, "COMPLETED", "SUCCESS"))
    const many = (counts: { state: string; count: number }[]) => ({
      nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS", contexts: { nodes: done, pageInfo: { hasNextPage: true }, checkRunCountsByState: counts, statusContextCountsByState: [] } } } }],
    })
    expect(parse({ commits: many([{ state: "SUCCESS", count: 100 }, { state: "QUEUED", count: 3 }]) }).state.checks).toBe("pending")
    expect(parse({ commits: many([{ state: "SUCCESS", count: 103 }]) }).state.checks).toBe("passed")
  })

  test("CI is finished only once every check completes", () => {
    const early = { commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), run("test", "QUEUED", null)]) }
    const late = { commits: rollup("FAILURE", [run("lint", "COMPLETED", "FAILURE"), run("test", "COMPLETED", "FAILURE")]) }
    expect(step({ commits: rollup("PENDING") }, early)).toEqual([{ kind: "failing", head: prNode().headRefOid, checks: ["lint"] }])
    expect(step(early, late)).toEqual([{ kind: "ci", head: prNode().headRefOid, passed: false, failing: ["lint", "test"] }])
    expect(M.isDue({ checks: parse(early).state.checks, checkedAt: 0, fastUntil: 0 }, 30_000)).toBe(true)
  })

  test("the query asks for complete check counts", () => {
    const query = M.buildQuery([{ repo, numbers: [12], branches: [] }])
    expect(query).toContain("checkRunCountsByState { state count }")
    expect(query).toContain("statusContextCountsByState { state count }")
  })

  test("no checks at all never wakes", () => {
    expect(step({}, { headRefOid: "c".repeat(40) })).toEqual([])
  })

  test("a check failing while others run wakes once per new failure", () => {
    const one = { commits: rollup("PENDING", [run("lint", "COMPLETED", "FAILURE"), run("test", "IN_PROGRESS", null)]) }
    const two = { commits: rollup("PENDING", [run("lint", "COMPLETED", "FAILURE"), run("e2e", "COMPLETED", "TIMED_OUT")]) }
    expect(step({ commits: rollup("PENDING") }, one)).toEqual([{ kind: "failing", head: prNode().headRefOid, checks: ["lint"] }])
    expect(step(one, one)).toEqual([])
    expect(step(one, two)).toEqual([{ kind: "failing", head: prNode().headRefOid, checks: ["e2e"] }])
  })

  test("new reviews, review comments and PR comments from anyone wake, old ones don't", () => {
    const before = { comments: { nodes: [comment("c1", "jwoods02", "2026-11-02T10:00:00Z")] } }
    const after = {
      comments: { nodes: [comment("c1", "jwoods02", "2026-11-02T10:00:00Z"), comment("c2", "cursor", "2026-11-02T10:05:00Z", "Bug: off by one")] },
      reviews: {
        nodes: [
          { id: "r1", author: { login: "jwoods02" }, state: "CHANGES_REQUESTED", body: "", submittedAt: "2026-11-02T10:06:00Z", url: "u" },
          { id: "t1", author: { login: "copilot" }, state: "COMMENTED", body: "", submittedAt: "2026-11-02T10:06:00Z", url: "u", comments: { totalCount: 1, nodes: [{ body: "nit", url: "v" }] } },
          { id: "r0", author: { login: "x" }, state: "PENDING", submittedAt: null },
        ],
      },
    }
    const changes = step(before, after)
    expect(changes.map((c) => c.kind === "activity" && [c.item.kind, c.item.author])).toEqual([
      ["comment", "cursor"],
      ["review", "jwoods02"],
      ["review comment", "copilot"],
    ])
    expect(step(after, after)).toEqual([])
  })

  test("an item in the same second as the watermark still counts once", () => {
    const at = "2026-11-02T10:00:00Z"
    const before = { comments: { nodes: [comment("c1", "a", at)] } }
    const after = { comments: { nodes: [comment("c1", "a", at), comment("c2", "b", at)] } }
    expect(step(before, after).map((c) => c.kind === "activity" && c.item.id)).toEqual(["c2"])
    expect(step(after, after)).toEqual([])
  })

  test("the owning session's own posts are ignored", () => {
    const after = { comments: { nodes: [comment("c9", "jwoods02", "2026-11-02T10:00:00Z"), comment("c8", "cursor", "2026-11-02T10:00:01Z")] } }
    const changes = step({}, after, (item) => item.author === "jwoods02")
    expect(changes.map((c) => c.kind === "activity" && c.item.id)).toEqual(["c8"])
  })

  test("merged, closed and ready", () => {
    expect(step({}, { state: "MERGED", isDraft: false })).toEqual([{ kind: "merged" }])
    expect(step({}, { state: "CLOSED" })).toEqual([{ kind: "closed" }])
    expect(step({}, { isDraft: false })).toEqual([{ kind: "ready" }])
    expect(step({ isDraft: false }, { isDraft: false })).toEqual([])
  })

  test("the wake-up names the PR, head and each change", () => {
    const pr = parse().state
    const text = M.wakeText([{ pr, changes: [{ kind: "ci", head: pr.head, passed: false, failing: ["lint", "test"] }, { kind: "ready" }] }])
    expect(text).toBe(
      `[github] #12 feat(opencode): [RES-391] Sessions say what they wait on (head da94c0f) https://github.com/jwoods02/jstack/pull/12\n- CI failed on da94c0f: lint, test\n- marked ready for review`,
    )
  })
})

describe("activity pages", () => {
  const page = (connection: "comments" | "reviews", at: string[], hasPreviousPage: boolean) => ({
    [connection]: {
      pageInfo: { hasPreviousPage, startCursor: "cur" },
      nodes: at.map((t, i) => (connection === "comments" ? comment(`c${i}`, "a", t) : { id: `r${i}`, state: "COMMENTED", body: "x", submittedAt: t, url: "u" })),
    },
  })
  const seen = { ...parse().state, activityAt: "2026-11-02T10:00:00Z" }

  test("a page that reaches back to the watermark is complete", () => {
    expect(M.missingPages(prNode(page("comments", ["2026-11-02T09:59:00Z", "2026-11-02T10:01:00Z"], true)), seen)).toEqual({})
    expect(M.missingPages(prNode(page("comments", ["2026-11-02T10:01:00Z"], false)), seen)).toEqual({})
  })

  test("a page newer than the watermark, or level with it, needs the page before", () => {
    expect(M.missingPages(prNode(page("comments", ["2026-11-02T10:01:00Z"], true)), seen)).toEqual({ comments: "cur" })
    expect(M.missingPages(prNode(page("reviews", ["2026-11-02T10:00:00Z"], true)), seen)).toEqual({ reviews: "cur" })
  })

  test("the first sighting is a baseline and needs no pages", () => {
    expect(M.missingPages(prNode(page("comments", ["2026-11-02T10:01:00Z"], true)), undefined)).toEqual({})
  })

  test("an older page goes in front of the newer one", () => {
    const node = prNode(page("comments", ["2026-11-02T10:01:00Z"], true))
    const older = { comments: { pageInfo: { hasPreviousPage: false, startCursor: "x" }, nodes: [comment("c9", "a", "2026-11-02T09:00:00Z")] } }
    const merged = M.mergePage(node, older, { comments: "cur" })
    expect(merged.comments.nodes.map((c: any) => c.id)).toEqual(["c9", "c0"])
    expect(M.missingPages(merged, seen)).toEqual({})
    expect(M.pageQuery(repo, 12, { comments: "cur" })).toContain('comments(last: 100, before: "cur")')
  })
})

describe("cadence and commands", () => {
  test("pending checks poll every 30s, others every five minutes", () => {
    expect(M.isDue(undefined, 0)).toBe(true)
    expect(M.isDue({ checks: "pending", checkedAt: 0, fastUntil: 0 }, 30_000)).toBe(true)
    expect(M.isDue({ checks: "passed", checkedAt: 0, fastUntil: 0 }, 30_000)).toBe(false)
    expect(M.isDue({ checks: "passed", checkedAt: 0, fastUntil: 0 }, 300_000)).toBe(true)
    expect(M.isDue({ checks: "none", checkedAt: 0, fastUntil: 60_000 }, 30_000)).toBe(true)
  })

  test("push and post commands", () => {
    for (const c of ["git push -u origin HEAD", "cd x && git push --force-with-lease", "gh pr create --draft", "gh stack submit --auto", "gh stack push"]) expect(M.isPushCommand(c)).toBe(true)
    for (const c of ["git status", "gh pr view 12", "git pushd"]) expect(M.isPushCommand(c)).toBe(false)
    for (const c of ["gh pr comment 12 -b hi", "gh pr review 12 --approve", "gh api repos/o/r/pulls/12/comments -f body=x"]) expect(M.isPostCommand(c)).toBe(true)
    expect(M.isPostCommand("gh pr view 12 --comments")).toBe(false)
  })

  test("one query covers every due PR and branch lookup", () => {
    const query = M.buildQuery([{ repo, numbers: [12, 13], branches: ["feat/x"] }])
    expect(query).toContain('r0: repository(owner: "jwoods02", name: "jstack")')
    expect(query).toContain("p12: pullRequest(number: 12)")
    expect(query).toContain('b0: pullRequests(headRefName: "feat/x", first: 1, orderBy: { field: CREATED_AT, direction: DESC })')
    const result = M.parseResult([{ repo, numbers: [12], branches: ["feat/x", "feat/none"] }], {
      viewer: { login: "jwoods02" },
      r0: { p12: prNode(), b0: { nodes: [prNode({ number: 13 })] }, b1: { nodes: [] } },
    })
    expect(result.viewer).toBe("jwoods02")
    expect([...result.prs.keys()]).toEqual(["jwoods02/jstack#12", "jwoods02/jstack#13"])
    expect(result.branches.get("jwoods02/jstack:feat/x")).toBe(13)
    expect(result.branches.get("jwoods02/jstack:feat/none")).toBeUndefined()
  })
})
