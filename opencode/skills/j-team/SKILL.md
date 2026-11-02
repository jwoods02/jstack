---
name: J Team
description: JStack on OpenCode. Maps j-mode's Cursor terms to OpenCode, and runs parallel builders as separate sessions in git worktrees through the jteam script. Load it together with j-mode on OpenCode.
disable-model-invocation: true
---

# J team

j-mode was written for Cursor. On OpenCode, read it with the substitutions below. Where this file and j-mode disagree, this file wins on OpenCode. Everything else in j-mode holds as written.

## Terms

| j-mode says | On OpenCode |
|---|---|
| The Task tool, `subagent_type: X`, `run_in_background: true` | The `subagent` tool with `agent: X` and `background: true` |
| `j-agent` | `j-agent`. It loads j-mode itself, so the kickoff needs no path. |
| `generalPurpose` | `general`. It can't start subagents, so use `j-agent` when the child must start its own. |
| Readonly | The `explore` agent |
| `comment-sicko` | `explore`, told to read `../../agents/comment-sicko.md` from j-mode's skill directory and act as it |
| The `model` line in `jstack-models.mdc` | The same role's line in the OpenCode model map (see Models) |
| The Project chat, the coordinator | None. Each stream's session starts its own builders and reviewers (see below). Stream sessions share the board, and James makes cross-stream calls. |
| The Project's task tracker | The repo's issue tracker for work the team should see. The repo's board for the agents' own streams (see The board). |
| The Project's shared context | The docs folder your instructions name, and the repo's own docs |
| `/loop`, timers, CI subscriptions | Start the wait (for example `gh pr checks <n> --watch`) as a background shell command. OpenCode wakes the session when it ends. |
| `.cursor/skills/` | `.opencode/skills/` |
| Chat history in `~/.cursor/projects/*/agent-transcripts` | OpenCode sessions, read with `jteam ls` and `jteam peek` |
| A skill's file under `~/.cursor/plugins/` | Load it with the skill tool by its ID |

## Models

The model map is `jstack-models.md` in the OpenCode config directory (`~/.config/opencode/`). It uses the role names from `jstack-models.mdc`, with OpenCode model IDs in `provider/model#variant` form. Pass the role's model as `model` on every `subagent` call and as the model argument to `jteam spawn`. If the file is missing, leave `model` unset so the child inherits.

## One session per job

These rules replace j-mode's rows for the coordinator, architect, plan reviewer, builder, reviewer and parallel builders.

- Each stream is its own top-level session, in its own git worktree, started with `jteam spawn` or by James in the app. James can open any of them and type into it. Use a subagent only for work that reports back to the session that started it: plan reviewers, reviewers, `/interrogate`'s reviewers, explorers and helpers.
- Each session does one job: an architect, an investigator, or a builder for one PR. It runs its own plan reviewer and reviewers as subagents and decides what to act on. An architect gets a fresh plan reviewer for a plan of three or more PRs, ends with j-mode's decision list, and stops for James in its own session. A builder starts a fresh `j-agent` reviewer on the `reviewer` model once CI is green, or runs `/interrogate` itself for a big change and judges the findings, and runs the rounds until the review passes.
- James talks to sessions directly, so calls inside a stream belong in that stream's session. A session puts its calls to James there, in place of j-mode's coordinator relay, and posts each draft PR link there too. When James makes a call inside the session, such as approving a PR, pausing reviewers or changing scope, the session's board row names it, for example "James approved the PR in-session".
- Sessions spawn sessions with `jteam spawn`, and each footer names its parent. Once James agrees a plan, the architect spawns the builder sessions. A PR train is one session per PR. When session 1 is ready for the next PR to stack on it, it spawns session 2 and names its branch as the base in the brief. Session 2 then resets its new branch onto that one.
- Any session can start the next one, so no stream waits on another.
- A session's reviewers are subagents, so only their verdicts land in its context. j-mode's rule about resuming below about 400k tokens is for Cursor's resumed subagents and doesn't apply to stream sessions.
- A session changes only its own worktree and branch, plus the board and docs. If its setup fails, or a tool, credential or anything shared outside the worktree is broken (global toolchains, `~/.config/opencode`, the main checkout), it marks its board row blocked, says so in its session, and waits. James fixes it once. Parallel sessions repairing the same shared thing clobber each other.
- Before starting a stream, check the board's open rows for a shared branch, files, a migration number, or a local resource the repo's instructions name, such as a dev stack or test database.
- Before you report "ready for review", check that the verdict's head commit equals `gh pr view <n> --json headRefOid`. A verdict for an older head is stale.
- Scratch files go in a directory named for your session ID under the shared temp dir, or inside your worktree. Never use a fixed name another session could also pick.

## The board

The board for a repo comes from a mapping line in `~/.config/opencode/AGENTS.md`, in the form `JStack boards: <repo> -> <path>`, for example `JStack boards: resonance-service -> ~/git/docs/resonance/board.md`. With no mapping line for the repo, it is `.opencode/jstack-board.md` at the repo root. Any session may edit the board and docs. Keep it short, and rewrite what's stale. Use the edit tool rather than overwriting the whole file.

Every session follows this protocol.

1. **Start.** Read the board for the repo you are in. Delete rows whose PR is merged. Check the open rows for shared branches, files, migration numbers and the shared-resources slot.
2. **Before you build.** Write your row: stream, ticket, branch, session, PR and state.
3. **Finish.** Set the state to "Ready for James" with the PR link, the head commit the review passed on, and any migration number or shared file you hold. Spawn the next session if the plan says so.

A shared slot, such as the local stack, has one line that names its holder. Ask before you take a slot someone else holds. `jteam status` shows what has gone stale.

## jteam

The script is `scripts/jteam` in this skill's directory. It needs the OpenCode V2 CLI, `git` and `jq`.

```text
jteam self                                   this session's ID
jteam ls [limit]                             top-level sessions: id, state, idle time, agent, title, directory
jteam peek <session> [n]                     last n messages from both sides (default 4), oldest first, each labelled and cut to 1500 chars
jteam send [--now] <session> <text...>       queue a message; --now delivers it mid-turn
jteam spawn <repo> <branch|-> <title> <brief-file|-> [model] [agent]
jteam status [board]                         stale board rows, sessions with no row, your draft PRs with CI, prunable worktrees
jteam prune [--dry-run] [repo]               remove clean worktrees whose PR is merged, with their branches, and archive their sessions
jteam rm <worktree> [--force]                remove one worktree and archive its sessions; the branch is kept
```

`spawn` uses OpenCode's own worktrees, so the session belongs to the repo's project and the worktree shows up in the app. It prunes the repo first. Then it creates the worktree off origin's default branch, at the configured `worktree.directory`, named `<repo>-<branch>`, and creates the branch. OpenCode runs the project's start command in the new worktree. `spawn` sets that command to `~/.config/opencode/worktree-setup/<repo>.sh` when the file exists, so worktrees made in the app get the same setup. Last, it starts a session (agent `JMode` by default). The session gets the brief plus a footer naming its own session ID, the worktree, the setup result and the session that started it. The session reads the board itself at start (see The board). Setup can take minutes, so run `spawn` with a 10-minute shell timeout. For work that changes no files, such as an investigation or a review of someone's PR, pass `-` as the branch. The session then runs in the main checkout, with no worktree.

A spawn brief carries what j-mode's kickoff needs: the job, the scope and what is out of scope, the finish check, and James's standing orders that apply. Name branches the way the repo's instructions ask.

A plain `send` waits until the receiver's current turn ends. Use `--now` only when the message changes what the receiver is doing right now, such as a stop or a fix that unblocks it.

`send` and `spawn` tag their messages in the message metadata, so `peek` can tell James's own turns from agent traffic. It labels each message `[james]`, `[assistant]`, `[send from <session>]` or `[brief from <session>]`. Messages sent before the tag existed, or by other API clients, show as `[sent]`.

Don't poll. Use the board, `status`, `ls` and `peek` when James asks for status, or before you write a brief about a stream. `status` is a read-only report and changes nothing. A flagged board row is yours to fix with the edit tool, and a worktree it lists is cleared by `prune`.

Worktrees clean up after themselves. `prune` removes one once its PR is merged, the worktree is clean, and its commits are all in the merged PR. It runs on every `spawn`. Run it yourself when James says PRs have merged, or `prune --dry-run` to see what it would remove. When a stream ends without a merge (abandoned, superseded, or a test), run `rm` on its worktree from outside it. The branch is kept.
