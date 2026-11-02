export type Repo = { owner: string; name: string }
export const repoKey = (repo: Repo) => `${repo.owner}/${repo.name}`

export type Checks = "none" | "pending" | "passed" | "failed"

export type PrState = {
  number: number
  title: string
  url: string
  state: "OPEN" | "CLOSED" | "MERGED"
  draft: boolean
  head: string
  checks: Checks
  failing: string[]
  activityAt: string
  activityIDs: string[]
}

export type Activity = {
  id: string
  kind: "review" | "comment" | "review comment"
  author: string
  at: string
  body: string
  url: string
  verdict?: string
}

export type Change =
  | { kind: "ci"; head: string; passed: boolean; failing: string[] }
  | { kind: "failing"; head: string; checks: string[] }
  | { kind: "activity"; item: Activity }
  | { kind: "merged" }
  | { kind: "closed" }
  | { kind: "ready" }

export type SessionRef = {
  id: string
  title: string
  directory: string
  parentID?: string
  archived?: boolean
  updated: number
}

export type GitInfo = { top: string; main: string; branch: string; repo: Repo }

export type Owner = { sessionID: string; title: string; top: string; main: string; branch: string; repo: Repo }

export function inScope(directory: string, scope: string | undefined) {
  if (!scope) return true
  const root = scope.replace(/\/+$/, "")
  return directory === root || directory.startsWith(root + "/")
}

export function buildMap(sessions: SessionRef[], git: (directory: string) => GitInfo | undefined, scope?: string): Owner[] {
  const byTop = new Map<string, Owner & { updated: number }>()
  for (const session of sessions) {
    if (session.parentID || session.archived || !inScope(session.directory, scope)) continue
    const info = git(session.directory)
    if (!info || !info.branch || info.top === info.main) continue
    const held = byTop.get(info.top)
    if (held && held.updated >= session.updated) continue
    byTop.set(info.top, { sessionID: session.id, title: session.title, updated: session.updated, ...info })
  }
  return [...byTop.values()].map(({ updated, ...owner }) => owner)
}

export function parseRemote(url: string): Repo | undefined {
  const match = url.trim().match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?\/?$/)
  return match ? { owner: match[1], name: match[2] } : undefined
}

export function stackPrs(view: unknown, branch: string): number[] {
  const branches = (view as { branches?: { name: string; pr?: { number: number; state: string } }[] })?.branches ?? []
  if (!branches.some((entry) => entry.name === branch)) return []
  return branches.flatMap((entry) => (entry.pr && entry.pr.state === "OPEN" ? [entry.pr.number] : []))
}

const PR_FIELDS = `number title url state isDraft headRefOid
  commits(last: 1) { nodes { commit { statusCheckRollup { state contexts(first: 100) {
    checkRunCountsByState { state count }
    statusContextCountsByState { state count }
    pageInfo { hasNextPage }
    nodes { __typename ... on CheckRun { name status conclusion } ... on StatusContext { context state } }
  } } } } }
  reviews(last: 20) { nodes { id author { login } state body submittedAt url } }
  comments(last: 20) { nodes { id author { login } body createdAt url } }
  reviewThreads(last: 20) { nodes { comments(last: 10) { nodes { id author { login } body createdAt url } } } }`

export type Target = { repo: Repo; numbers: number[]; branches: string[] }

export function buildQuery(targets: Target[]) {
  const repos = targets.map((target, r) => {
    const prs = target.numbers.map((n) => `p${n}: pullRequest(number: ${n}) { ...pr }`)
    const branches = target.branches.map(
      (branch, b) => `b${b}: pullRequests(headRefName: ${JSON.stringify(branch)}, states: OPEN, first: 1) { nodes { ...pr } }`,
    )
    return `r${r}: repository(owner: ${JSON.stringify(target.repo.owner)}, name: ${JSON.stringify(target.repo.name)}) {\n    ${[...prs, ...branches].join("\n    ")}\n  }`
  })
  return `query {\n  viewer { login }\n  ${repos.join("\n  ")}\n}\nfragment pr on PullRequest {\n  ${PR_FIELDS}\n}`
}

export type QueryResult = {
  viewer: string
  prs: Map<string, ReturnType<typeof parsePr>>
  branches: Map<string, number | undefined>
}

export const prKey = (repo: Repo, number: number) => `${repoKey(repo)}#${number}`
export const branchKey = (repo: Repo, branch: string) => `${repoKey(repo)}:${branch}`

export function parseResult(targets: Target[], data: any): QueryResult {
  const result: QueryResult = { viewer: data?.viewer?.login ?? "", prs: new Map(), branches: new Map() }
  targets.forEach((target, r) => {
    const repo = data?.[`r${r}`]
    if (!repo) return
    for (const n of target.numbers) {
      const node = repo[`p${n}`]
      if (node) result.prs.set(prKey(target.repo, n), parsePr(node))
    }
    target.branches.forEach((branch, b) => {
      const node = repo[`b${b}`]?.nodes?.[0]
      result.branches.set(branchKey(target.repo, branch), node?.number)
      if (node) result.prs.set(prKey(target.repo, node.number), parsePr(node))
    })
  })
  return result
}

const FAILED_RUN = new Set(["FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE"])
const FAILED_STATUS = new Set(["FAILURE", "ERROR"])
const RUNNING_RUN = new Set(["REQUESTED", "QUEUED", "IN_PROGRESS", "WAITING", "PENDING"])
const RUNNING_STATUS = new Set(["PENDING", "EXPECTED"])

function checksRunning(rollup: any) {
  const contexts = rollup.contexts ?? {}
  const counted = (counts: { state: string; count: number }[] | undefined, running: Set<string>) =>
    (counts ?? []).some((c) => running.has(c.state) && c.count > 0)
  return (
    RUNNING_STATUS.has(rollup.state) ||
    counted(contexts.checkRunCountsByState, RUNNING_RUN) ||
    counted(contexts.statusContextCountsByState, RUNNING_STATUS) ||
    (contexts.nodes ?? []).some((c: any) => (c.__typename === "CheckRun" ? c.status !== "COMPLETED" : RUNNING_STATUS.has(c.state)))
  )
}

export function parsePr(node: any): { state: PrState; activity: Activity[]; manyChecks: boolean } {
  const rollup = node.commits?.nodes?.[0]?.commit?.statusCheckRollup
  const contexts: any[] = rollup?.contexts?.nodes ?? []
  const failing = contexts.flatMap((c) =>
    c.__typename === "CheckRun" ? (FAILED_RUN.has(c.conclusion) ? [c.name] : []) : FAILED_STATUS.has(c.state) ? [c.context] : [],
  )
  const checks: Checks = !rollup ? "none" : checksRunning(rollup) ? "pending" : rollup.state === "SUCCESS" ? "passed" : "failed"
  const login = (author: any) => author?.login ?? "ghost"
  const activity: Activity[] = [
    ...(node.reviews?.nodes ?? [])
      .filter((r: any) => r.submittedAt && r.state !== "PENDING")
      .map((r: any) => ({ id: r.id, kind: "review" as const, author: login(r.author), at: r.submittedAt, body: r.body ?? "", url: r.url, verdict: r.state })),
    ...(node.comments?.nodes ?? []).map((c: any) => ({ id: c.id, kind: "comment" as const, author: login(c.author), at: c.createdAt, body: c.body ?? "", url: c.url })),
    ...(node.reviewThreads?.nodes ?? []).flatMap((t: any) =>
      (t.comments?.nodes ?? []).map((c: any) => ({ id: c.id, kind: "review comment" as const, author: login(c.author), at: c.createdAt, body: c.body ?? "", url: c.url })),
    ),
  ].sort((a, b) => a.at.localeCompare(b.at))
  const activityAt = activity.reduce((max, item) => (item.at > max ? item.at : max), "")
  return {
    state: {
      number: node.number,
      title: node.title,
      url: node.url,
      state: node.state,
      draft: node.isDraft,
      head: node.headRefOid,
      checks,
      failing: failing.sort(),
      activityAt,
      activityIDs: activity.filter((item) => item.at === activityAt).map((item) => item.id),
    },
    activity,
    manyChecks: !!rollup?.contexts?.pageInfo?.hasNextPage,
  }
}

export function diff(prev: PrState | undefined, next: PrState, activity: Activity[], ignore: (item: Activity) => boolean = () => false): Change[] {
  if (!prev) return []
  const changes: Change[] = []
  const finished = next.checks === "passed" || next.checks === "failed"
  if (finished && (prev.head !== next.head || prev.checks !== next.checks)) {
    changes.push({ kind: "ci", head: next.head, passed: next.checks === "passed", failing: next.failing })
  }
  if (next.checks === "pending") {
    const known = prev.head === next.head ? prev.failing : []
    const fresh = next.failing.filter((name) => !known.includes(name))
    if (fresh.length) changes.push({ kind: "failing", head: next.head, checks: fresh })
  }
  for (const item of activity) {
    const isNew = item.at > prev.activityAt || (item.at === prev.activityAt && !prev.activityIDs.includes(item.id))
    if (isNew && !ignore(item)) changes.push({ kind: "activity", item })
  }
  if (prev.state === "OPEN" && next.state === "MERGED") changes.push({ kind: "merged" })
  if (prev.state === "OPEN" && next.state === "CLOSED") changes.push({ kind: "closed" })
  if (prev.draft && !next.draft && next.state === "OPEN") changes.push({ kind: "ready" })
  return changes
}

const short = (sha: string) => sha.slice(0, 7)
const excerpt = (body: string) => {
  const flat = body.replace(/\s+/g, " ").trim()
  return flat.length > 200 ? flat.slice(0, 199) + "…" : flat
}

export function describe(change: Change): string {
  switch (change.kind) {
    case "ci":
      return change.passed
        ? `CI passed on ${short(change.head)}`
        : `CI failed on ${short(change.head)}${change.failing.length ? `: ${change.failing.join(", ")}` : ""}`
    case "failing":
      return `checks failing on ${short(change.head)} while others run: ${change.checks.join(", ")}`
    case "activity": {
      const { item } = change
      const what = item.kind === "review" ? `review (${item.verdict?.toLowerCase().replace(/_/g, " ")})` : item.kind
      const body = excerpt(item.body)
      return `${what} from ${item.author}${body ? `: ${body}` : ""} ${item.url}`
    }
    case "merged":
      return "merged"
    case "closed":
      return "closed without merging"
    case "ready":
      return "marked ready for review"
  }
}

export function wakeText(updates: { pr: PrState; changes: Change[] }[]): string {
  return updates
    .map(({ pr, changes }) => [`[github] #${pr.number} ${pr.title} (head ${short(pr.head)}) ${pr.url}`, ...changes.map((c) => `- ${describe(c)}`)].join("\n"))
    .join("\n\n")
}

const CONVENTIONAL = /^[a-z]+(\([^)]*\))?!?:\s*/i
const TICKET = /^\[?[A-Z][A-Z0-9]+-\d+\]?[:\s-]*|[\s-]*\(?\[?[A-Z][A-Z0-9]+-\d+\]?\)?$/

export function cleanTitle(title: string) {
  let out = title.trim().replace(CONVENTIONAL, "")
  for (let previous = ""; previous !== out; ) {
    previous = out
    out = out.replace(TICKET, "").trim()
  }
  return out || title.trim()
}

const DECORATION = /^(●\s*)?(#\d+(→#\d+)?\s+)?/

export const taskName = (title: string) => title.replace(DECORATION, "").trim()

export function sessionTitle(prs: PrState[], task: string | undefined, waiting: boolean): string | undefined {
  if (!prs.length) return undefined
  const sorted = [...prs].sort((a, b) => a.number - b.number)
  const name =
    sorted.length === 1
      ? `#${sorted[0].number} ${cleanTitle(sorted[0].title)}`
      : `#${sorted[0].number}→#${sorted[sorted.length - 1].number} ${task ? taskName(task) : cleanTitle(sorted[sorted.length - 1].title)}`
  return waiting ? `● ${name}` : name
}

export function boardWaiting(board: string, sessionID: string) {
  return board.split("\n").some((line) => line.trimStart().startsWith("|") && line.includes(sessionID) && /ready for james|waiting on james/i.test(line))
}

export function askedJames(lastAssistantText: string | undefined) {
  const last = lastAssistantText?.trim().split("\n").filter((line) => line.trim()).pop()
  return !!last && last.trim().endsWith("?")
}

export function selfRenamed(toolInputs: unknown[], title: string) {
  const needle = JSON.stringify(title).slice(1, -1)
  return toolInputs.some((input) => {
    const text = JSON.stringify(input)
    return text.includes("session_rename") && (text.includes(needle) || text.includes(JSON.stringify(needle).slice(1, -1)))
  })
}

export const isPushCommand = (command: string) => /\bgit\s+push\b|\bgh\s+pr\s+create\b|\bgh\s+stack\s+(submit|push)\b/.test(command)
export const isPostCommand = (command: string) =>
  /\bgh\s+pr\s+(comment|review)\b/.test(command) || (/\bgh\s+api\b/.test(command) && /\b(comments|reviews|replies)\b/.test(command))

export type Due = { checks: Checks; checkedAt: number; fastUntil: number }

export const FAST_MS = 30_000
export const SLOW_MS = 5 * 60_000

export function isDue(due: Due | undefined, now: number) {
  if (!due) return true
  const every = due.checks === "pending" || now < due.fastUntil ? FAST_MS : SLOW_MS
  return now - due.checkedAt >= every - FAST_MS / 2
}
