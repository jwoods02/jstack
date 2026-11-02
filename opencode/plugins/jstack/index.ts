import { execFile } from "node:child_process"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join } from "node:path"
import * as M from "./model"

type Options = { scope?: string; gh?: string; log?: string }
type TitleRecord = { set?: string; setAt?: number; task?: string; james?: string }
type Tracked = { owner: M.Owner; branch: string; numbers: Set<number>; lookup: boolean }
type ShellRun = { sessionID: string; kind: "push" | "post"; start: number }
type Post = { sessionID: string; start: number; end?: number }
type Shared = { leader?: string; shells: Map<string, ShellRun>; done: Set<string>; pushed: Set<string> }
type RunResult = { ok: boolean; stdout: string; stderr: string }
type Polled = { tracked: Tracked; key: string; number: number; prev?: M.PrState; next: M.PrState; changes: M.Change[] }
export type Deps = {
  run: (command: string, args: string[], cwd?: string, signal?: AbortSignal) => Promise<RunResult>
  now?: () => number
}

const DRAIN_MS = 10_000
const PUSH_FAST_MS = 2 * 60_000
const SELF_POST_SLACK_MS = 30_000
const OPEN_POST_MS = 60_000
const POST_KEEP_MS = 24 * 60 * 60_000

function run(command: string, args: string[], cwd?: string, signal?: AbortSignal) {
  return new Promise<RunResult>((resolve) =>
    execFile(command, args, { cwd, signal, maxBuffer: 32 * 1024 * 1024, timeout: 60_000 }, (error, stdout, stderr) =>
      resolve({ ok: !error, stdout: String(stdout), stderr: String(stderr || error?.message || "") }),
    ),
  )
}

const configDir = () => join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode")

function boardPath(main: string) {
  try {
    const repo = basename(main)
    for (const line of readFileSync(join(configDir(), "AGENTS.md"), "utf8").split("\n")) {
      const match = line.match(/^JStack boards:\s*(.+?)\s*->\s*(.+?)\s*$/)
      if (match && match[1] === repo) return match[2].replace(/^~(?=\/)/, homedir())
    }
  } catch {}
  return join(main, ".opencode", "jstack-board.md")
}

const readText = (path: string) => {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return ""
  }
}

export function createRunner(ctx: any, { run, now = Date.now }: Deps) {
  const options: Options = ctx.options ?? {}
  const gh = options.gh ?? "gh"
  const me = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`
  const abort = new AbortController()
  const log = (msg: string, extra: Record<string, unknown> = {}) => {
    if (options.log) appendFileSync(options.log, JSON.stringify({ at: new Date().toISOString(), me, msg, ...extra }) + "\n")
  }

  const gitCache = new Map<string, M.GitInfo | null>()
  const tracked = new Map<string, Tracked>()
  const due = new Map<string, M.Due>()
  const latest = new Map<string, M.PrState>()
  const shared: Shared = ((globalThis as any).__jstackGithub ??= { shells: new Map(), done: new Set(), pushed: new Set() })
  const dirty = new Set<string>()
  const contexts = new Map<string, { updated: number; recent: any[] }>()
  let current: Promise<void> | undefined
  let stopped = false
  let soon: ReturnType<typeof setTimeout> | undefined

  const fence = () => !stopped && (shared.leader ??= me) === me

  async function gitInfo(directory: string): Promise<M.GitInfo | null> {
    const paths = await run("git", ["-C", directory, "rev-parse", "--path-format=absolute", "--show-toplevel", "--git-common-dir"])
    if (!paths.ok) return null
    const [top, common] = paths.stdout.trim().split("\n")
    const branch = (await run("git", ["-C", directory, "branch", "--show-current"])).stdout.trim()
    const repo = M.parseRemote((await run("git", ["-C", directory, "remote", "get-url", "origin"])).stdout)
    return repo ? { top, main: dirname(common), branch, repo } : null
  }

  async function listSessions(): Promise<M.SessionRef[]> {
    const sessions: M.SessionRef[] = []
    let page = await ctx.session.list({ limit: 100 })
    for (;;) {
      const items: any[] = page?.data ?? page?.items ?? (Array.isArray(page) ? page : [])
      for (const s of items) {
        sessions.push({
          id: s.id,
          title: s.title ?? "",
          directory: s.location?.directory ?? "",
          parentID: s.parentID,
          archived: !!s.time?.archived,
          updated: s.time?.updated ?? 0,
        })
      }
      const next = page?.cursor?.next
      if (!next) return sessions
      page = await ctx.session.list({ cursor: next, limit: 100 })
    }
  }

  async function ownedNow(owner: M.Owner) {
    const s = await ctx.session.get({ sessionID: owner.sessionID }).catch(() => undefined)
    const directory = s?.location?.directory
    if (s && !s.parentID && !s.time?.archived && directory === owner.directory && M.inScope(directory, options.scope)) return s
    log("not owned now", { sessionID: owner.sessionID, directory })
  }

  async function messages(owner: M.Owner): Promise<any[]> {
    const cached = contexts.get(owner.sessionID)
    if (cached?.updated === owner.updated) return cached.recent
    const context: any[] = (await ctx.session.context({ sessionID: owner.sessionID })) ?? []
    const recent = context.slice(-40).reverse()
    contexts.set(owner.sessionID, { updated: owner.updated, recent })
    return recent
  }

  async function stackNumbers(owner: M.Owner) {
    if (!existsSync(join(owner.main, ".git", "gh-stack"))) return []
    log("gh", { args: "stack view --json", dir: owner.top })
    const view = await run(gh, ["stack", "view", "--json"], owner.top, abort.signal)
    if (!view.ok) return []
    try {
      return M.stackPrs(JSON.parse(view.stdout), owner.branch)
    } catch {
      return []
    }
  }

  async function loadPosts() {
    const posts: Post[] = []
    for (let after: string | undefined, more = true; more; ) {
      const page = await ctx.storage.scan({ prefix: "post/", after })
      for (const { key, value } of page.entries) {
        if (now() - (value.end ?? value.start) < POST_KEEP_MS) posts.push(value)
        else if (fence()) await ctx.storage.remove(key)
      }
      after = page.next
      more = !!after
    }
    return posts
  }

  function ignoreFor(sessionID: string, viewer: string, posts: Post[]) {
    return (item: M.Activity) => {
      if (item.author !== viewer) return false
      const at = Date.parse(item.at)
      return posts.some((p) => p.sessionID === sessionID && at >= p.start - 5_000 && at <= (p.end ?? p.start + OPEN_POST_MS) + SELF_POST_SLACK_MS)
    }
  }

  async function waitingOnJames(owner: M.Owner, recent: any[]) {
    if (M.boardWaiting(readText(boardPath(owner.main)), owner.sessionID)) return true
    const lastAssistant = recent.find((m) => m.type === "assistant")
    const text = (lastAssistant?.content ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n")
    return M.askedJames(text)
  }

  async function syncTitle(owner: M.Owner, prs: M.PrState[]) {
    const key = `title/${owner.sessionID}`
    const record = ((await ctx.storage.get(key)) as TitleRecord | undefined) ?? {}
    const current = owner.title
    if (current && current === record.james) return
    const recent = await messages(owner)
    let task = record.task
    if (current && current !== record.set) {
      if (!M.selfRenamed(recent, current, record.setAt)) {
        if (fence()) await ctx.storage.set(key, { ...record, james: current })
        log("title kept", { sessionID: owner.sessionID, title: current })
        return
      }
      task = current
    }
    const want = M.sessionTitle(prs, task, await waitingOnJames(owner, recent))
    if (!want || want === current) return
    const live = await ownedNow(owner)
    if (!live || (live.title ?? "") !== current || !fence()) return
    await ctx.session.update({ sessionID: owner.sessionID, title: want })
    await ctx.storage.set(key, { set: want, setAt: now(), task })
    log("title", { sessionID: owner.sessionID, title: want })
  }

  async function refresh() {
    const sessions = (await listSessions()).filter((s) => !s.parentID && !s.archived && M.inScope(s.directory, options.scope))
    for (const s of sessions) if (!gitCache.has(s.directory)) gitCache.set(s.directory, await gitInfo(s.directory))
    const owners = M.buildMap(sessions, (d) => gitCache.get(d) ?? undefined, options.scope)
    const live = new Set(owners.map((o) => o.top))
    for (const top of tracked.keys()) if (!live.has(top)) tracked.delete(top)
    for (const owner of owners) {
      const held = tracked.get(owner.top)
      if (held && held.branch === owner.branch && !dirty.has(owner.sessionID)) {
        held.owner = owner
        continue
      }
      dirty.delete(owner.sessionID)
      const kept = held?.branch === owner.branch ? [...held.numbers] : []
      tracked.set(owner.top, { owner, branch: owner.branch, numbers: new Set([...kept, ...(await stackNumbers(owner))]), lookup: true })
    }
  }

  function dueTargets(at: number): M.Target[] {
    const targets = new Map<string, M.Target>()
    const target = (repo: M.Repo) => {
      const key = M.repoKey(repo)
      if (!targets.has(key)) targets.set(key, { repo, numbers: [], branches: [] })
      return targets.get(key)!
    }
    for (const t of tracked.values()) {
      if (t.lookup) target(t.owner.repo).branches.push(t.branch)
      for (const n of t.numbers) if (M.isDue(due.get(M.prKey(t.owner.repo, n)), at)) target(t.owner.repo).numbers.push(n)
    }
    return [...targets.values()].map((t) => ({ ...t, numbers: [...new Set(t.numbers)], branches: [...new Set(t.branches)] }))
  }

  async function graphql(query: string, extra: Record<string, unknown>) {
    log("gh", { args: "api graphql", ...extra })
    const response = await run(gh, ["api", "graphql", "-f", `query=${query}`], undefined, abort.signal)
    try {
      const data = JSON.parse(response.stdout).data
      if (data) return data
    } catch {}
    log("gh failed", { error: response.stderr.slice(0, 500) })
  }

  async function completeActivity(repo: M.Repo, number: number, node: any, prev: M.PrState | undefined) {
    for (let missing = M.missingPages(node, prev); Object.keys(missing).length; missing = M.missingPages(node, prev)) {
      const page = (await graphql(M.pageQuery(repo, number, missing), { page: M.prKey(repo, number), missing }))?.r0?.[`p${number}`]
      if (!page) return undefined
      node = M.mergePage(node, page, missing)
    }
    return node
  }

  async function poll(list: M.Target[], at: number) {
    const data = await graphql(M.buildQuery(list), { prs: list.flatMap((t) => t.numbers), branches: list.flatMap((t) => t.branches) })
    if (!data) return
    const result = M.parseResult(list, data)
    const posts = await loadPosts()

    const bySession = new Map<string, Polled[]>()
    for (const t of tracked.values()) {
      if (t.lookup && result.branches.has(M.branchKey(t.owner.repo, t.branch))) {
        const found = result.branches.get(M.branchKey(t.owner.repo, t.branch))
        if (found) t.numbers.add(found)
        t.lookup = false
      }
      for (const n of [...t.numbers]) {
        const key = M.prKey(t.owner.repo, n)
        const node = result.prs.get(key)
        if (!node) continue
        const prev = (await ctx.storage.get(`pr/${key}`)) as M.PrState | undefined
        const complete = await completeActivity(t.owner.repo, n, node, prev)
        if (!complete) continue
        const fetched = M.parsePr(complete)
        if (fetched.manyChecks) log("checks past 100, counts decide pending", { pr: key })
        const changes = M.diff(prev, fetched.state, fetched.activity, ignoreFor(t.owner.sessionID, result.viewer, posts))
        const polled = { tracked: t, key, number: n, prev, next: fetched.state, changes }
        bySession.set(t.owner.sessionID, [...(bySession.get(t.owner.sessionID) ?? []), polled])
      }
    }

    for (const [sessionID, polled] of bySession) {
      const changed = polled.filter((p) => p.changes.length).map((p) => ({ pr: p.next, changes: p.changes }))
      if (changed.length && !(await ownedNow(polled[0].tracked.owner))) continue
      if (!fence()) return
      for (const p of polled) if (JSON.stringify(p.prev) !== JSON.stringify(p.next)) await ctx.storage.set(`pr/${p.key}`, p.next)
      for (const p of polled) {
        due.set(p.key, { checks: p.next.checks, checkedAt: at, fastUntil: due.get(p.key)?.fastUntil ?? 0 })
        latest.set(p.key, p.next)
        if (p.next.state !== "OPEN") p.tracked.numbers.delete(p.number)
      }
      if (!changed.length) continue
      const text = M.wakeText(changed)
      if (!fence()) return log("wake dropped", { sessionID, text })
      await ctx.session.prompt({ sessionID, text, delivery: "queue", metadata: { jteam: { kind: "github" } } })
      log("wake", { sessionID, text })
    }
  }

  async function tick() {
    if (current || stopped) return
    current = work().finally(() => (current = undefined))
    await current
  }

  async function work() {
    try {
      if (!fence()) return
      const at = now()
      for (const sessionID of shared.pushed) pushed(sessionID)
      shared.pushed.clear()
      await refresh()
      const list = dueTargets(at)
      if (list.length) await poll(list, at)
      for (const t of tracked.values()) {
        const prs = [...t.numbers].flatMap((n) => latest.get(M.prKey(t.owner.repo, n)) ?? [])
        if (prs.length) await syncTitle(t.owner, prs).catch((error) => log("title failed", { sessionID: t.owner.sessionID, error: String(error) }))
      }
    } catch (error) {
      log("tick failed", { error: String((error as Error)?.stack ?? error) })
    }
  }

  function pushed(sessionID: string) {
    dirty.add(sessionID)
    for (const t of tracked.values()) {
      if (t.owner.sessionID !== sessionID) continue
      for (const n of t.numbers) {
        const key = M.prKey(t.owner.repo, n)
        due.set(key, { checks: due.get(key)?.checks ?? "none", checkedAt: 0, fastUntil: now() + PUSH_FAST_MS })
      }
    }
  }

  async function onEvent(event: any) {
    if (event.type === "shell.created") {
      const info = event.data?.info
      const sessionID = info?.metadata?.sessionID
      if (!sessionID || !info.command || shared.shells.has(info.id) || shared.done.has(info.id)) return
      const kind = M.isPushCommand(info.command) ? "push" : M.isPostCommand(info.command) ? "post" : undefined
      if (!kind) return
      const shell = { sessionID, kind, start: now() } as const
      shared.shells.set(info.id, shell)
      if (kind === "post") await ctx.storage.set(`post/${info.id}`, { sessionID, start: shell.start })
    } else if (event.type === "shell.exited") {
      const id = event.data?.id
      const shell = shared.shells.get(id)
      if (shell) {
        shared.shells.delete(id)
        shared.done.add(id)
        if (shared.done.size > 500) shared.done.delete(shared.done.values().next().value!)
        shared.pushed.add(shell.sessionID)
        log("shell", { sessionID: shell.sessionID, kind: shell.kind })
        if (shell.kind === "post") await ctx.storage.set(`post/${id}`, { sessionID: shell.sessionID, start: shell.start, end: now() })
      }
      if (!shared.done.has(id)) return
      clearTimeout(soon)
      soon = setTimeout(() => void tick(), 2_000)
    } else if (event.type === "vcs.branch.updated") {
      const directory = event.location?.directory
      for (const [key, info] of gitCache) if (key === directory || info?.top === directory) gitCache.delete(key)
    }
  }

  async function stop() {
    stopped = true
    clearTimeout(soon)
    abort.abort()
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([current, new Promise((resolve) => (timer = setTimeout(resolve, DRAIN_MS)))])
    clearTimeout(timer)
    if (shared.leader === me) shared.leader = undefined
  }

  return { tick, onEvent, stop, log, options }
}

export default {
  id: "jstack",
  setup(ctx: any) {
    const { tick, onEvent, stop, log, options } = createRunner(ctx, { run })
    const controller = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ types: ["shell.created", "shell.exited", "vcs.branch.updated"], signal: controller.signal })) {
        await onEvent(event).catch((error) => log("event failed", { error: String(error) }))
      }
    })().catch((error) => {
      if (!controller.signal.aborted) log("events failed", { error: String(error) })
    })

    const first = setTimeout(() => void tick(), 3_000)
    const timer = setInterval(() => void tick(), M.FAST_MS)
    log("setup", { location: ctx.location?.directory, scope: options.scope })

    return async () => {
      controller.abort()
      clearTimeout(first)
      clearInterval(timer)
      await stop()
    }
  },
}
