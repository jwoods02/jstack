---
name: J Team
description: j-mode's host file for OpenCode. Maps j-mode and its skills to OpenCode's subagents, model map, sessions, worktrees and compaction, and carries the jteam script. Load it after j-mode in every OpenCode session and subagent.
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
| `readonly: true` | The `explore` agent, always on the `explore` line |
| `comment-sicko` | `explore`, told to read `../../agents/comment-sicko.md` from j-mode's skill directory and act as it |
| The `jstack-models.mdc` rule | The model map below |
| `.cursor/skills/` | `.opencode/skills/` |
| Chat history in `agent-transcripts/` | OpenCode sessions. List them with `opencode session list`, and read one with `opencode api get "/api/session/<id>/message?limit=40&order=desc"`. |
| A skill's file under `~/.cursor/plugins/` | Load the skill with the skill tool by its ID |

## Models

The model map is `jstack-models.md` in `~/.config/opencode/`. It uses the role names from `jstack-models.mdc`, with OpenCode model IDs in `provider/model#variant` form. Pass the role's model as `model` on every `subagent` call. If the file is missing, leave `model` unset so the child inherits. Nobody spawns the lead, so its `lead` line only records the `JMode` agent's model, which `opencode.json` sets under `agents.JMode.model`.

## Sessions

Leads start subagents in the background. Work outside the thread gets its own top-level session, which a top-level session starts itself with OpenCode's own CLI. Run both commands below as background shell commands.

- **Start a new top-level session.** Write the brief to a file in your scratch dir. From the target repo, run `opencode run --agent JMode --model <role's model> --title '<job>' --auto -f <brief file> "Your brief is in the attached file. Follow it."`, with the model from the new session's role line in the model map. Tell James you started it. It reports to James in its own session, not to the one that started it.
- **Send another session a message.** Run `opencode run -s <session id> -f <file> "<short pointer>"`. Use it to pass on follow-ups and scope changes.
- **Find sessions.** `jteam ls` lists top-level sessions across projects. `opencode session list` lists the current project's.

**Compaction.** OpenCode compacts a session automatically near its context limit, and a summary replaces the older conversation, including the j-mode and j-team text. A lead plans in its own context, so at go it writes the plan doc, starts the first builder, requests compaction with `opencode api post "/api/session/$(jteam self)/compact" --data '{}'`, and ends the turn with the wait line (see Waits). Compaction runs at the next safe point, and the builder's report wakes the session after the summary.

After any compaction, load j-mode and j-team again before you act.

## Worktrees

A thread that changes files has one worktree, made at go. A one-off builder with no lead makes its own the same way before its first edit.

1. Run `jteam worktree <repo> <branch>` with a 10-minute shell timeout. It prunes merged worktrees, makes an OpenCode worktree off origin's default branch with the branch checked out, and runs the repo's setup.
2. Move your session there with `session_move` (`tools.opencode.session_move` in code mode), so `jteam ls` and `jteam status` see it in its worktree.

Investigations and reviews of someone else's PR need no worktree. They run in the main checkout and change no files there.

Every branch of the stack lives in its worktree, because `gh stack add` makes and checks out each next branch in place. Builders and reviewers take turns in it, and nothing else uses it while one is running. A reviewer tests a checked-out head, so a builder can't switch branches under it. While you wait on James about one PR, you can check out a later branch and build there.

A session changes only its own worktree and branches, plus the project's docs. If setup fails, or something shared outside the worktree that the job needs is broken (commit signing, a hook, a credential, global config such as `~/.config/opencode`, the main checkout), say so in your session, note it in the plan doc, and wait. James fixes it once, and parallel sessions repairing the same shared thing clobber each other.

Scratch files go in a directory from `mktemp -d` under the shared temp dir, or inside your worktree. Never use a fixed name another session could also pick.

## Each PR

- **The builder.** Start a fresh `j-agent` on the builder line j-mode picks for the PR, in the worktree, on the next stack branch. A builder that turns out harder than planned reports back, and you ask James before restarting it a level up.
- **The reviewer's watch.** CI runs while the reviewer works, so its last step is `jteam watch <n>` in the foreground with a shell timeout of about 45 minutes. Shell commands time out after 2 minutes by default. The report gives CI's result and each bot or human review since the head, and the reviewer fixes the real ones before its verdict. In a repo with no CI the watch still collects bot findings, and the PR passes on the reviewer's verdict plus the plan's finish check run locally.
- **The lead's part.** The lead starts the reviewer on the `reviewer` line, and posts the PR link in its session once the reviewer reports. It runs `jteam watch <n>` itself, as a background shell command, only when no reviewer is running, such as after a late fix. A passing verdict's head must equal `gh pr view <n> --json headRefOid`.

## Waits

- A subagent never ends its turn with background work running. It ends done, blocked or needing a call, and says which. Builders and reviewers run their waits in the foreground, because nothing wakes the lead when background work finishes.
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

## jteam

The script is `scripts/jteam` in this skill's directory. It isn't on PATH, so call it by its full path, the base directory shown when this skill loads followed by `/scripts/jteam`. This file writes it as `jteam` for short. It needs the OpenCode V2 CLI, `git`, `jq` and `gh`.

Prefer OpenCode's own commands and tools, documented in this skill. jteam covers only what OpenCode can't do, so a new subcommand needs a reason the platform can't meet.

Leads, reviewers and one-off builders run it. Architects and investigators don't need it. Their brief gives the PR, the head and the paths, and `gh` reads PR state.

```text
jteam self                          this session's ID
jteam ls [limit]                    top-level sessions: id, state, idle time, agent, title, directory
jteam worktree <repo> <branch>      prune, then a new OpenCode worktree and branch off origin's default branch, set up
jteam status                        your open draft PRs in this repo with CI, and prunable worktrees
jteam watch <pr> [repo-dir]         wait on the PR's checks, then report CI and each review and comment since the head
jteam prune [--dry-run] [repo]      remove clean worktrees whose PR is merged, with their branches, and archive their sessions
jteam rm <worktree> [--force]       remove one worktree and archive its sessions; the branch is kept
```

- **`worktree`** prints the worktree's path and the setup result. The setup is `~/.config/opencode/worktree-setup/<repo>.sh` when it exists.
- **`status`** changes nothing. Run it inside a repo or one of its worktrees. It lists only that repo's PRs.
- **`watch`** waits for every check except `Cursor Bugbot Autofix`, which sits in progress for 30 minutes whenever Bugbot finds something. It exits 0 when CI passes or the PR has no checks, 1 when a check fails, and 2 when checks are pending or `gh` errors. Bugbot's check passes even when it finds bugs, so read its findings in the report.
- **`prune`** keeps any worktree with changes or commits its merged PR lacks. Run it when James says PRs have merged. `gh stack sync --prune` deletes a stack's other merged branches.
- **`rm`** is for a thread that ends without a merge. Run it from outside the worktree.

Don't poll. Use the plan doc, `status` and `ls` when James asks for status.
