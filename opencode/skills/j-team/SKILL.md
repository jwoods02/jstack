---
name: J Team
description: JStack on OpenCode. Maps j-mode's Cursor terms to OpenCode, and has a lead session own each stream end to end, in one git worktree, with builders and reviewers as subagents and GitHub stacks for layered work. Load it together with j-mode on OpenCode.
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
| The Project chat, the coordinator | The stream's lead, which starts its own builders and reviewers (see Streams and leads). Leads share the board, and James makes cross-stream calls. |
| The Project's task tracker | The repo's issue tracker for work the team should see. The repo's board for the agents' own streams (see The board). |
| The Project's shared context | The docs folder your instructions name, and the repo's own docs |
| `/loop`, timers, CI subscriptions | A top-level session starts the wait (for example `gh pr checks <n> --watch`) as a background shell command. OpenCode wakes the session when it ends. A subagent runs its waits in the foreground (see Waits). |
| `.cursor/skills/` | `.opencode/skills/` |
| Chat history in `~/.cursor/projects/*/agent-transcripts` | OpenCode sessions, read with `jteam ls` and `jteam peek` |
| A skill's file under `~/.cursor/plugins/` | Load it with the skill tool by its ID |

## Models

The model map is `jstack-models.md` in the OpenCode config directory (`~/.config/opencode/`). It uses the role names from `jstack-models.mdc`, with OpenCode model IDs in `provider/model#variant` form. Pass the role's model as `model` on every `subagent` call and as the model argument to `jteam spawn`. If the file is missing, leave `model` unset so the child inherits.

## Streams and leads

These rules replace j-mode's rows for the coordinator, builder, reviewer and parallel builders. A **stream** is a piece of work, one row on the board. Its **lead** is the top-level session that owns it end to end.

A session does the job its first message gives it. An architect, an investigator or a one-off builder does that job and stops. A one-off builder starts and judges its own reviewers as in step 3 below, and stops once the review passes. When James agrees a plan and says go, the session becomes the stream's lead. James talks to sessions directly, so a lead puts its calls to James in its own session, in place of j-mode's coordinator relay.

### How a lead runs a stream

1. **Pick up.** Read the board, check `jteam ls` and the open rows for anyone on the same area, and write your row.
2. **Plan.** Work out the plan yourself or with architect subagents. A plan of three or more PRs gets a fresh plan reviewer. End with j-mode's decision list and stop for James.
3. **Run the stack.** Once James says go, work through the stack one PR at a time, with every builder and reviewer as a subagent. For each PR:
   1. Start a fresh `j-agent` builder on the `builder` model, in the stream's worktree, on the next stack branch. Use another builder line only when the agreed plan names it for that PR. A builder that turns out harder than planned reports back, and you ask James before restarting it a level up.
   2. The builder builds, opens the draft PR in the stack, pushes, reports the head commit and ends. It doesn't wait on CI or start reviewers.
   3. Wait for CI. With the jstack plugin installed, its `[github]` message (`metadata.jteam.kind = "github"`) wakes you when CI ends. Without the plugin, run one background `gh pr checks <n> --watch`. Send a red run back to the builder. When the repo has no CI, skip the wait. The PR then passes on its review plus the plan's finish check run locally, and the PR body says so. Once CI is green or skipped, post the PR link in your session. Start one fresh `j-agent` reviewer on the `reviewer` model, or an `/interrogate` pass for a big change. You judge the findings.
   4. Send fixes back to the same builder or a fresh one. Round 2 is one fresh reviewer on the fix commits only.
   5. Move on once the review passes, CI is green where the repo has it, and the passing verdict's head commit equals `gh pr view <n> --json headRefOid`. A verdict for an older head is stale.
4. **Finish.** For a big change, run the milestone reviewer once on the top of the stack. Then set your row to "Ready for James" with the whole stack and each PR's reviewed head. James merges.

Only summaries and verdicts land in a lead's context. j-mode's resume rule applies to builder subagents.

### Waits

- A subagent never ends its turn with background work running. It ends done, blocked or needing a call, and says which. Builders and reviewers run their waits in the foreground. Leads still start subagents in the background.
- A session that ends a turn on a wait says so in its last line. The line names what it waits on, the head commit, when the wait started and what the session does next. For example: "Waiting on CI for #946 at `50c0fe7`, started 14:05. I start PR 2 once it and round 2 pass."

### Ask James

Ask in your session, and wait on that PR, when:

- a call comes up that the agreed plan doesn't cover;
- a review finding changes scope or design, or you want to decline an Act-on finding;
- anything is irreversible or touches production;
- something shared is broken, or another stream holds a shared resource;
- CI fails twice in code the PR didn't touch.

While you wait, keep building later PRs that don't depend on the answer. When James makes a call in your session, such as approving a PR, pausing reviewers or changing scope, your board row names it, for example "James approved the PR in-session".

### Other top-level sessions

- Fan-out inside a stream uses subagents: builders, reviewers, explorers and helpers. Work that would go faster in parallel stays in the stream, and its builders take turns in the stream's worktree. It never becomes a new top-level session.
- `jteam spawn` is only for genuinely new or different work, and only once James agrees to it. If the board or `jteam ls` shows a stream already on it, tell James which. Before spawning, check the board's open rows for a shared branch, files, a migration number, or a local resource the repo's instructions name, such as a dev stack or test database.
- When your own context gets heavy, write a handoff note, spawn a fresh lead on the same worktree with `jteam spawn --continue`, say so, and stop.

### One worktree per stream

A stream has one worktree, made when the lead starts building. The lead that makes it moves its own session there with `session_move` (`tools.opencode.session_move` in code mode), so the jstack plugin and `jteam` map the session to its branch. A session started by `jteam spawn` already runs there. Every branch in its stack lives there, because `gh stack add` makes and checks out each next branch in place. Builders and reviewers take turns in it, and nothing else uses it while one is running. A reviewer tests a checked-out head, so a builder can't switch branches under it. While you wait on James about one PR, you can check out a later branch and build there.

A session changes only its own worktree and branches, plus the board and docs. If its setup fails, or a tool, credential or anything shared outside the worktree is broken (global toolchains, `~/.config/opencode`, the main checkout), it marks its board row blocked, says so in its session, and waits. James fixes it once. Parallel sessions repairing the same shared thing clobber each other.

Scratch files go in a directory named for your session ID under the shared temp dir, or inside your worktree. Never use a fixed name another session could also pick.

### PRs and stacks

- A PR does a full chunk of work. Keep PRs few and the work contained. When a big change splits into layers a reviewer would read separately, ship them as a GitHub stack, each layer passing CI on its own. Otherwise ship one PR.
- j-mode's big-change cues hold, except "a chain of three or more PRs", which doesn't apply on OpenCode. The lead weighs the cues with what it knows about the stream to decide on `/interrogate` and the milestone review.
- Drive `gh stack` non-interactively:
  - `gh stack init` makes the stack.
  - `gh stack add <branch>` adds each next branch.
  - `gh stack submit --auto` opens the PRs as drafts.
  - `gh stack rebase` then `gh stack push` cascade a fix in a lower PR up the stack.
  - `gh stack sync` runs after James merges a lower PR, and `--prune` deletes merged branches.
  - `gh stack view --json` reads the state.
- Agents never merge, mark ready or unstack. The global `opencode.json` denies `gh stack merge*`, `gh stack submit *--open*`, `gh stack link *--open*` and `gh stack unstack*`. The gh-stack skill documents `merge` and `--open`, and this file overrides it.
- gh-stack keeps its metadata in the git dir every worktree of the clone shares. Its commands lock against each other, but other git commands don't. One lead per stack, and only that stream's worktree touches its branches.

## The board

The board for a repo comes from a mapping line in `~/.config/opencode/AGENTS.md`, in the form `JStack boards: <repo> -> <path>`, for example `JStack boards: resonance-service -> ~/git/docs/resonance/board.md`. With no mapping line for the repo, it is `.opencode/jstack-board.md` at the repo root. Any session may edit the board and docs. Keep it short, and rewrite what's stale. Use the edit tool rather than overwriting the whole file.

Every session follows this protocol.

1. **Start.** Read the board for the repo you are in. Delete rows whose PRs are all merged. Check the open rows for shared branches, files, migration numbers and the shared-resources slot.
2. **Before you build.** Write your row: stream, ticket, branch, session, PR and state. A stream has one row, not one per PR. The PR cell lists the stack in order, for example `#934 → #950 → #951`.
3. **Finish.** Set the state to "Ready for James" with the PR links, the head commit each review passed on, and any migration number or shared file you hold.

A shared slot, such as the local stack, has one line that names its holder. Ask before you take a slot someone else holds. `jteam status` shows what has gone stale.

## jteam

The script is `scripts/jteam` in this skill's directory. It needs the OpenCode V2 CLI, `git` and `jq`.

```text
jteam self                                   this session's ID
jteam ls [limit]                             top-level sessions: id, state, idle time, agent, title, directory
jteam peek <session> [n]                     last n messages from both sides (default 4), oldest first, each labelled and cut to 1500 chars
jteam send [--now] <session> <text...>       queue a message; --now delivers it mid-turn
jteam spawn <repo> <branch|-> <title> <brief-file|-> [model] [agent]
jteam spawn --continue <worktree> <title> <brief-file|-> [model] [agent]
jteam status [board]                         stale board rows, sessions with no row, your draft PRs with CI, prunable worktrees
jteam prune [--dry-run] [repo]               remove clean worktrees whose PR is merged, with their branches, and archive their sessions
jteam rm <worktree> [--force]                remove one worktree and archive its sessions; the branch is kept
```

`spawn` uses OpenCode's own worktrees, so the session belongs to the repo's project and the worktree shows up in the app. It prunes the repo first. Then it creates the worktree off origin's default branch, at the configured `worktree.directory`, named `<repo>-<branch>`, and creates the branch. OpenCode runs the project's start command in the new worktree. `spawn` sets that command to `~/.config/opencode/worktree-setup/<repo>.sh` when the file exists, so worktrees made in the app get the same setup. Last, it starts a session (agent `JMode` by default). The session gets the brief plus a footer naming its own session ID, the worktree, the setup result and the session that started it. The session reads the board itself at start (see The board). Setup can take minutes, so run `spawn` with a 10-minute shell timeout. For work that changes no files, such as an investigation or a review of someone's PR, pass `-` as the branch. The session then runs in the main checkout, with no worktree.

`spawn --continue <worktree>` is for handoffs. It starts the session in an existing worktree on the branch already checked out there. It doesn't prune, run setup, or make a worktree or branch, and its footer names the worktree and branch.

`status` reads a row as stale once every PR in its PR cell is merged or closed, or once every session it names is archived.

A spawn brief carries what j-mode's kickoff needs: the job, the scope and what is out of scope, the finish check, and James's standing orders that apply. Name branches `<type>/<ticket>-<slug>`, with `<type>` the PR title's conventional-commit type, for example `feat/res-391-chat-prompt`. With no ticket, use `<type>/<slug>`.

A plain `send` waits until the receiver's current turn ends. Use `--now` only when the message changes what the receiver is doing right now, such as a stop or a fix that unblocks it.

`send` and `spawn` tag their messages in the message metadata, so `peek` can tell James's own turns from agent traffic. It labels each message `[james]`, `[assistant]`, `[send from <session>]` or `[brief from <session>]`. Messages sent before the tag existed, or by other API clients, show as `[sent]`.

Don't poll. Use the board, `status`, `ls` and `peek` when James asks for status, or before you write a brief about a stream. `status` is a read-only report and changes nothing. A flagged board row is yours to fix with the edit tool, and a worktree it lists is cleared by `prune`.

Worktrees clean up after themselves. `prune` removes one once its PR is merged, the worktree is clean, and its commits are all in the merged PR. It runs on every `spawn` that makes a worktree. Run it yourself when James says PRs have merged, or `prune --dry-run` to see what it would remove. When a stream ends without a merge (abandoned, superseded, or a test), run `rm` on its worktree from outside it. The branch is kept. A stack's worktree goes once the PR of its checked-out branch is merged and nothing local is left. `gh stack sync --prune` deletes the stack's other merged branches.
