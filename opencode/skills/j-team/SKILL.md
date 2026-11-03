---
name: J Team
description: j-mode's host file for OpenCode. Maps j-mode and its skills to OpenCode's subagents, model map, sessions, worktrees, compaction and board, and carries the jteam script. Load it after j-mode in every OpenCode session and subagent.
disable-model-invocation: true
---

# J team

This is j-mode's host file for OpenCode. j-mode holds the workflow. This file says how to run it with OpenCode's tools. Where the two disagree, this file wins on OpenCode.

## Skills written for Cursor

j-mode is host-neutral, but some skills it calls (`how`, `why`, `interrogate`, `arena`, `swarm`, `reflect`, `no-comments`) still name Cursor's tools. Read them this way.

| A skill says | On OpenCode |
|---|---|
| The Task tool, `subagent_type: X`, `run_in_background: true` | The `subagent` tool with `agent: X` and `background: true` |
| `j-agent` | `j-agent`. It loads j-mode and this file itself, so the kickoff needs no path. |
| `generalPurpose` | `general`. It can't start subagents, so use `j-agent` when the child must start its own. |
| `readonly: true` | The `explore` agent |
| `comment-sicko` | `explore`, told to read `../../agents/comment-sicko.md` from j-mode's skill directory and act as it |
| The `jstack-models.mdc` rule | The model map below |
| `.cursor/skills/` | `.opencode/skills/` |
| Chat history in `agent-transcripts/` | OpenCode sessions. List them with `jteam ls`, and read one with `opencode api get "/api/session/<id>/message?limit=40&order=desc"`. |
| A skill's file under `~/.cursor/plugins/` | Load the skill with the skill tool by its ID |

## Models

The model map is `jstack-models.md` in `~/.config/opencode/`. It uses the role names from `jstack-models.mdc`, with OpenCode model IDs in `provider/model#variant` form. Pass the role's model as `model` on every `subagent` call. If the file is missing, leave `model` unset so the child inherits.

## Sessions

James opens every top-level session himself, and j-mode's brief for a new chat is what he pastes into one. Leads start subagents in the background.

**Compaction.** OpenCode compacts a session automatically near its context limit, and a summary replaces the older conversation, including the j-mode and j-team text. A lead plans in its own context, so at go:

1. Write the plan doc and your board line, and start the first builder.
2. If the session is over about 150k tokens, request compaction with `opencode api post "/api/session/$(jteam self)/compact" --data '{}'`. It runs at the next safe point.
3. End the turn with the wait line (see Waits). The builder's report wakes the session after the summary.

After any compaction, load j-mode and j-team again before you act.

## Worktrees

A stream that changes files has one worktree, made at go. A one-off builder with no lead makes its own the same way before its first edit.

1. Run `jteam worktree <repo> <branch>` with a 10-minute shell timeout. It prunes merged worktrees, makes an OpenCode worktree off origin's default branch with the branch checked out, and runs the repo's setup.
2. Move your session there with `session_move` (`tools.opencode.session_move` in code mode), so `jteam ls` and `jteam status` see it in its worktree.

Investigations and reviews of someone else's PR need no worktree. They run in the main checkout and change no files there.

Every branch of the stream's stack lives in its worktree, because `gh stack add` makes and checks out each next branch in place. Builders and reviewers take turns in it, and nothing else uses it while one is running. A reviewer tests a checked-out head, so a builder can't switch branches under it. While you wait on James about one PR, you can check out a later branch and build there.

A session changes only its own worktree and branches, plus the board and docs. If setup fails, or a tool, credential or anything shared outside the worktree is broken (global toolchains, `~/.config/opencode`, the main checkout, commit signing), mark your board line blocked, say so in your session, and wait. James fixes it once, and parallel sessions repairing the same shared thing clobber each other.

Scratch files go in a directory named for your session ID under the shared temp dir, or inside your worktree. Never use a fixed name another session could also pick.

## Each PR

- **The builder.** Start a fresh `j-agent` on the `builder` model, in the stream's worktree, on the next stack branch. Use another builder line only when the agreed plan names it for that PR. A builder that turns out harder than planned reports back, and you ask James before restarting it a level up.
- **The builder's watch.** The builder opens or pushes the draft PR, then runs `jteam watch <n>` in the foreground with a shell timeout of about 45 minutes. Shell commands time out after 2 minutes by default. On a red run it fixes, pushes and watches again. On a green run, including one with no checks, it triages the bot findings in the report per j-mode's `references/bugbot-triage.md`. A fix means a push, so it watches again. Once a head is green with its findings triaged, it reports "ready for review" with that head commit.
- **Repos with no CI.** The builder still runs `jteam watch` to collect bot findings. The PR then passes on its review plus the plan's finish check run locally, and the PR body says so.
- **The lead's part.** The lead doesn't watch CI. It posts the PR link in its session, starts the reviewer, and judges the findings. A passing verdict's head must equal `gh pr view <n> --json headRefOid`.

## Waits

- A subagent never ends its turn with background work running. It ends done, blocked or needing a call, and says which. Builders and reviewers run their waits in the foreground. A builder that once ended its turn with CI and reviewers still running cost its stream three hours, because nothing woke the lead when they finished.
- A session that ends a turn on a wait says so in its last line. The line names what it waits on, the head commit, when the wait started and what the session does next. For example: "Waiting on the reviewer for #946 at `50c0fe7`, started 14:05. I start PR 2 once it passes."
- A top-level session watching a PR on its own runs `jteam watch <n>` as a background shell command, and OpenCode wakes the session when it ends.

## Stacks

Drive `gh stack` non-interactively:

- `gh stack init` makes the stack, and `gh stack add <branch>` adds each next branch.
- `gh stack submit --auto` opens the PRs as drafts.
- `gh stack rebase` then `gh stack push` cascade a fix in a lower PR up the stack.
- `gh stack sync` runs after James merges a lower PR, and `--prune` deletes merged branches.
- `gh stack view --json` reads the state.

Agents never merge, mark ready or unstack. The global `opencode.json` denies `gh stack merge*`, `gh stack submit *--open*`, `gh stack link *--open*` and `gh stack unstack*`. The gh-stack skill documents `merge` and `--open`, and this file overrides it. gh-stack keeps its metadata in the git dir every worktree of the clone shares, so only one lead touches a stack.

## The board

A repo has a board only if `~/.config/opencode/AGENTS.md` has a mapping line for it, in the form `JStack boards: <repo> -> <path>`. With no line, there is no board, and the session uses its own todo list.

The board is a short list. Each stream is one line, grouped by what it waits on. The detail (calls, evidence, history) lives in the stream's plan and handoff docs, which the line links to. CI and PR state come from GitHub through `jteam status`, so the line needn't repeat them.

```markdown
## Needs James
- **Auth: remove WorkOS** · RES-380, RES-393 · lead `ses_…` · #934 → #947 · calls 6 and 7 on #934 open · [plan](2026-11-02-auth-workos-removal-plan.md)

## Running
- **Chat context sweep** · RES-389 · lead `ses_…` · #946 → #953 · building PR 3 · [scope](2026-11-02-chat-context-sweep-scope.md)

## Proposed
- RES-342: read-only pre-checks for deleting the in-cluster Temporal server.

## Shared resources
- Local stack: held by `ses_…` since 3 Nov, for an end-to-end run on #947.

## Calls worth remembering
- 2 Nov: sign-in goes in alongside WorkOS first.
```

Every session with a board follows this protocol:

1. **Start.** Read the board. Delete lines whose PRs are all merged. Check the open lines for a shared branch, files, a migration number or a shared resource.
2. **Go.** A lead, or a long-running investigation James will come back to, writes its line. A one-off question doesn't.
3. **On a change of state.** Move the line between sections and rewrite its few words of state. Don't narrate each event, because the stream's doc holds the history.
4. **Finish.** Move the line to Needs James as "Ready for James" with each PR and the head its review passed on, and any migration number or shared file it holds.

When James makes a call in your session, such as approving a PR or changing scope, put it in the stream's doc and say so in the line's state. A shared resource has one line naming its holder. Ask before you take a resource someone else holds. Use the edit tool on the board rather than overwriting it.

## jteam

The script is `scripts/jteam` in this skill's directory. It needs the OpenCode V2 CLI, `git`, `jq` and `gh`.

```text
jteam self                          this session's ID
jteam ls [limit]                    top-level sessions: id, state, idle time, agent, title, directory
jteam worktree <repo> <branch>      prune, then a new OpenCode worktree and branch off origin's default branch, set up
jteam status [board]                stale board lines, sessions with no line, your draft PRs with CI, prunable worktrees
jteam watch <pr> [repo-dir]         wait on the PR's checks, then report CI and each review and comment since the head
jteam prune [--dry-run] [repo]      remove clean worktrees whose PR is merged, with their branches, and archive their sessions
jteam rm <worktree> [--force]       remove one worktree and archive its sessions; the branch is kept
```

- **`worktree`** prints the worktree's path and the setup result. The setup is `~/.config/opencode/worktree-setup/<repo>.sh` when it exists.
- **`status`** changes nothing. It reads a line as stale once every PR it names is merged or closed, or every session it names is archived.
- **`watch`** exits 0 when CI passes or the PR has no checks, 1 when a check fails, and 2 when checks are pending or `gh` errors. Bugbot's check passes even when it finds bugs, so read its findings in the report.
- **`prune`** keeps any worktree with changes or commits its merged PR lacks. Run it when James says PRs have merged. `gh stack sync --prune` deletes a stack's other merged branches.
- **`rm`** is for a stream that ends without a merge. Run it from outside the worktree.

Don't poll. Use the board, `status` and `ls` when James asks for status.
