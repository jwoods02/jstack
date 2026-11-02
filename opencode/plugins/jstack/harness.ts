import { createRunner } from "./index"

export type FixturePr = {
  number: number
  title: string
  state: "OPEN" | "CLOSED" | "MERGED"
  isDraft: boolean
  headRefOid: string
  branch: string
  rollup: any
  comments: any[]
  reviews: any[]
}

export const SHA = "a".repeat(40)
export const REPO = { owner: "jwoods02", name: "jstack" }

export function fixturePr(overrides: Partial<FixturePr> = {}): FixturePr {
  return { number: 13, title: "feat: Test PR", state: "OPEN", isDraft: true, headRefOid: SHA, branch: "feat/x", rollup: null, comments: [], reviews: [], ...overrides }
}

export const comment = (id: string, at: string, author = "cursor", body = "hello") => ({ id, author: { login: author }, body, createdAt: at, url: `https://x/${id}` })

export const review = (id: string, at: string, author = "cursor", state = "COMMENTED", body = "", inline: any[] = []) => ({
  id,
  author: { login: author },
  state,
  body,
  submittedAt: at,
  url: `https://x/${id}`,
  comments: { totalCount: inline.length, nodes: inline.slice(0, 1) },
})

export const rollup = (state: string, contexts: any[] = []) => ({ state, contexts: { nodes: contexts, pageInfo: { hasNextPage: false } } })
export const checkRun = (name: string, status: string, conclusion: string | null) => ({ __typename: "CheckRun", name, status, conclusion })

function slice(items: any[], args: string) {
  const last = Number(args.match(/last:\s*(\d+)/)?.[1] ?? items.length)
  const before = args.match(/before:\s*"([^"]*)"/)?.[1]
  const end = before === undefined ? items.length : Number(before)
  const start = Math.max(0, end - last)
  return { pageInfo: { hasPreviousPage: start > 0, startCursor: String(start) }, nodes: items.slice(start, end) }
}

export function github(viewer = "jwoods02") {
  const prs = new Map<number, FixturePr>()
  const calls: string[] = []
  let beforeAnswer: (() => void | Promise<void>) | undefined

  function node(pr: FixturePr, query: string) {
    const args = (field: string) => [...query.matchAll(new RegExp(`\\b${field}\\(([^)]*last:[^)]*)\\)`, "g"))][0]?.[1] ?? ""
    const commentArgs = args("comments")
    const reviewArgs = args("reviews")
    return {
      number: pr.number,
      title: pr.title,
      url: `https://github.com/jwoods02/jstack/pull/${pr.number}`,
      state: pr.state,
      isDraft: pr.isDraft,
      headRefOid: pr.headRefOid,
      headRefName: pr.branch,
      commits: { nodes: [{ commit: { statusCheckRollup: pr.rollup } }] },
      comments: slice(pr.comments, commentArgs),
      reviews: slice(pr.reviews, reviewArgs),
      reviewThreads: { nodes: [] },
    }
  }

  function answer(query: string) {
    const data: any = { viewer: { login: viewer } }
    for (const m of query.matchAll(/(r\d+): repository\(owner: "(.*?)", name: "(.*?)"\) \{([\s\S]*?)\n  \}/g)) {
      const out: any = {}
      for (const p of m[4].matchAll(/(p\d+): pullRequest\(number: (\d+)\)/g)) {
        const pr = prs.get(Number(p[2]))
        out[p[1]] = pr ? node(pr, query) : null
      }
      for (const b of m[4].matchAll(/(b\d+): pullRequests\(headRefName: (".*?")([^)]*)\)/g)) {
        const branch = JSON.parse(b[2])
        const open = /states: OPEN/.test(b[3])
        const found = [...prs.values()].filter((pr) => pr.branch === branch && (!open || pr.state === "OPEN")).sort((a, z) => z.number - a.number)
        out[b[1]] = { nodes: found.slice(0, 1).map((pr) => node(pr, query)) }
      }
      data[m[1]] = out
    }
    return data
  }

  return {
    prs,
    calls,
    set(pr: FixturePr) {
      prs.set(pr.number, pr)
    },
    before(hook: (() => void | Promise<void>) | undefined) {
      beforeAnswer = hook
    },
    async graphql(query: string) {
      calls.push(query)
      await beforeAnswer?.()
      return JSON.stringify({ data: answer(query) })
    },
  }
}

export type Worktree = { top: string; main: string; branch: string }

export function storage(map = new Map<string, any>()) {
  return {
    map,
    async get(key: string) {
      return structuredClone(map.get(key))
    },
    async set(key: string, value: any) {
      map.set(key, structuredClone(value))
    },
    async remove(key: string) {
      map.delete(key)
    },
    async scan({ prefix }: { prefix: string }) {
      return { entries: [...map].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => ({ key, value: structuredClone(value) })) }
    },
  }
}

export type FixtureSession = { id: string; title: string; location: { directory: string }; parentID?: string; time: { updated: number; archived?: number } }

export function world(options: { gh?: ReturnType<typeof github>; store?: ReturnType<typeof storage>; scope?: string } = {}) {
  const gh = options.gh ?? github()
  const store = options.store ?? storage()
  const worktrees = new Map<string, Worktree>([["/scratch/wt", { top: "/scratch/wt", main: "/scratch/main", branch: "feat/x" }]])
  const sessions = new Map<string, FixtureSession>([["ses_owner", { id: "ses_owner", title: "", location: { directory: "/scratch/wt" }, time: { updated: 1 } }]])
  const context = new Map<string, any[]>()
  const calls = { prompts: [] as any[], titles: [] as any[], context: 0 }
  const hooks: { context?: () => void; get?: () => void | Promise<void> } = {}

  async function run(command: string, args: string[]) {
    if (command === "git") {
      const dir = args[args.indexOf("-C") + 1]
      const wt = worktrees.get(dir)
      if (!wt) return { ok: false, stdout: "", stderr: "not a repo" }
      if (args.includes("rev-parse")) return { ok: true, stdout: `${wt.top}\n${wt.main}/.git\n`, stderr: "" }
      if (args.includes("branch")) return { ok: true, stdout: `${wt.branch}\n`, stderr: "" }
      return { ok: true, stdout: "git@github.com:jwoods02/jstack.git\n", stderr: "" }
    }
    if (args[0] === "api" && args[1] === "graphql") {
      const query = args.find((a) => a.startsWith("query="))!.slice("query=".length)
      return { ok: true, stdout: await gh.graphql(query), stderr: "" }
    }
    return { ok: false, stdout: "", stderr: "unsupported" }
  }

  const ctx = {
    options: { scope: options.scope ?? "/scratch", gh: "fixture-gh" },
    storage: store,
    location: { directory: "/scratch/wt" },
    session: {
      async list() {
        return { data: [...sessions.values()].map((s) => structuredClone(s)) }
      },
      async get({ sessionID }: { sessionID: string }) {
        await hooks.get?.()
        const s = sessions.get(sessionID)
        if (!s) throw new Error("not found")
        return structuredClone(s)
      },
      async context({ sessionID }: { sessionID: string }) {
        calls.context++
        hooks.context?.()
        return structuredClone(context.get(sessionID) ?? [])
      },
      async update(input: any) {
        const s = sessions.get(input.sessionID)!
        calls.titles.push({ ...input, directory: s.location.directory, previous: s.title })
        s.title = input.title
      },
      async prompt(input: any) {
        const s = sessions.get(input.sessionID)!
        calls.prompts.push({ ...input, directory: s.location.directory })
        return input
      },
    },
    event: { async *subscribe() {} },
  }

  return { gh, store, worktrees, sessions, context, calls, hooks, ctx, run, runner: (deps: Record<string, unknown> = {}) => createRunner(ctx, { run, ...deps }) }
}

export const renameCall = (title: string, at: number) => ({
  type: "assistant",
  time: { created: at },
  content: [{ type: "tool", name: "execute", time: { created: at, completed: at }, state: { status: "completed", input: { code: `await tools.opencode.session_rename({ title: ${JSON.stringify(title)} })` } } }],
})

export const said = (text: string, at = 1) => ({ type: "assistant", time: { created: at }, content: [{ type: "text", text }] })
