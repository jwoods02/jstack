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
| The Project chat, the coordinator | The coordinator session, run by the `Orchestrator` agent |
| The Project's task tracker | The repo's issue tracker for work the team should see. The board file your instructions name for the agents' own streams. With no board named, `.opencode/jstack-board.md` at the repo root. |
| The Project's shared context | The docs folder your instructions name, and the repo's own docs |
| `/loop`, timers, CI subscriptions | Start the wait (for example `gh pr checks <n> --watch`) as a background shell command. OpenCode wakes the session when it ends. |
| `.cursor/skills/` | `.opencode/skills/` |
| Chat history in `~/.cursor/projects/*/agent-transcripts` | OpenCode sessions, read with `jteam ls` and `jteam peek` |
| A skill's file under `~/.cursor/plugins/` | Load it with the skill tool by its ID |

## Models

The model map is `jstack-models.md` in the OpenCode config directory (`~/.config/opencode/`). It uses the role names from `jstack-models.mdc`, with OpenCode model IDs in `provider/model#variant` form. Pass the role's model as `model` on every `subagent` call and as the model argument to `jteam spawn`. If the file is missing, leave `model` unset so the child inherits.

## Sessions, not subagents, for parallel work

These rules replace j-mode's rows for the coordinator, builder, reviewer and parallel builders.

- Every builder is its own top-level session, in its own git worktree, started with `jteam spawn`. James can open any of them and type into it. Use a subagent only for work that reports back to the agent that started it: reviewers, lens reviewers, explorers and helpers.
- A builder starts the reviewers for its own PR. Once CI is green, it starts a fresh `j-agent` on the `reviewer` model (or the lens reviewers for a big change), runs the rounds, and applies the fixes.
- A builder reports to the coordinator at four points: draft PR opened (with its link), review passed and ready for James, blocked on a call only James can make, and done. Each report is one or two lines, sent with the `jteam send` command at the end of the brief. If James started the session himself, there's no brief. Tell the coordinator `jteam coordinator` prints, if there is one, when the session opens a PR or hits a blocker. Otherwise report in your own session. When James makes a call inside the session, such as approving a PR, pausing reviewers or changing scope, the next report names it, for example "James approved the PR in-session".
- James talks to builder sessions directly, so calls inside a stream belong in that stream's session. A builder puts its own calls to James there, in place of j-mode's coordinator relay, and the coordinator doesn't pass his notes back. The coordinator puts cross-stream calls to James, and calls no session owns, and still sends him each draft PR link. Before it asks James a call or flags a stream's work as a surprise, it reads that session's recent human turns with `jteam peek`.
- A builder changes only its own worktree and branch. If its setup fails, or a tool, credential or anything shared outside the worktree is broken (global toolchains, `~/.config/opencode`, the main checkout), it reports blocked and waits. The coordinator fixes it once and tells every affected builder. Parallel builders repairing the same shared thing clobber each other.
- Before fanning out, the coordinator checks that no two builders share a branch, files, a migration number, or a local resource the repo's instructions name, such as a dev stack or test database.

## jteam

The script is `scripts/jteam` in this skill's directory. It needs the OpenCode V2 CLI, `git` and `jq`.

```text
jteam self                                   this session's ID
jteam coordinator                            open Orchestrator sessions, most recently active first
jteam ls [limit]                             top-level sessions: id, state, idle time, agent, title, directory
jteam peek <session> [n]                     last n messages from both sides (default 4), oldest first, each labelled and cut to 1500 chars
jteam send [--now] <session> <text...>       queue a message; --now delivers it mid-turn
jteam spawn <repo> <branch|-> <title> <brief-file|-> [model] [agent]
jteam prune [repo]                           remove clean worktrees whose PR is merged, with their branches, and archive their sessions
jteam rm <worktree> [--force]                remove one worktree and archive its sessions; the branch is kept
```

`spawn` uses OpenCode's own worktrees, so the session belongs to the repo's project and the worktree shows up in the app. It prunes the repo first. Then it creates the worktree off origin's default branch, at the configured `worktree.directory`, named `<repo>-<branch>`, and creates the branch. OpenCode runs the project's start command in the new worktree. `spawn` sets that command to `~/.config/opencode/worktree-setup/<repo>.sh` when the file exists, so worktrees made in the app get the same setup. Last, it starts a session (agent `JMode` by default). The session gets the brief plus a footer naming the worktree, the setup result and the exact report command. Setup can take minutes, so run `spawn` with a 10-minute shell timeout. For work that changes no files, such as an investigation or a review of someone's PR, pass `-` as the branch. The session then runs in the main checkout, with no worktree.

A spawn brief carries what j-mode's kickoff needs: the job, the scope and what is out of scope, the finish check, and James's standing orders that apply. Name branches the way the repo's instructions ask.

A plain `send` waits until the receiver's current turn ends. Use `--now` only when the message changes what the receiver is doing right now, such as a stop or a fix that unblocks it.

`send` and `spawn` tag their messages in the message metadata, so `peek` can tell James's own turns from agent traffic. It labels each message `[james]`, `[assistant]`, `[send from <session>]` or `[brief from <session>]`. Messages sent before the tag existed, or by other API clients, show as `[sent]`.

Don't poll. Builders report when something changes. Use `ls` and `peek` when James asks for status, or before you write a brief about a stream.

Worktrees clean up after themselves. `prune` removes one once its PR is merged, the worktree is clean, and its commits are all in the merged PR. It runs on every `spawn`. Run it yourself when James says PRs have merged. When a stream ends without a merge (abandoned, superseded, or a test), the coordinator runs `rm` on its worktree and keeps the branch.
