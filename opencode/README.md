# JStack on OpenCode

The skills and principles in [`../jstack/skills/`](../jstack/skills/) run unchanged on [OpenCode](https://opencode.ai) V2. This folder adds only what OpenCode does differently. That's two agents, a model map template and the [`j-team`](skills/j-team/SKILL.md) skill, which maps j-mode's Cursor terms to OpenCode and carries the `jteam` script.

## How it works

Parallel work runs as separate sessions, not subagents. Each stream gets its own top-level session in its own git worktree, so you can open any thread and talk to it. Each session does one job (an architect, an investigator, or a builder for one PR), runs its own reviewers as subagents, keeps its row on a shared board file, and spawns the next session when the work hands on. You make the cross-stream calls. `jteam status` shows what has gone stale.

| Agent | Mode | Job |
|---|---|---|
| [`JMode`](agents/JMode.md) | primary | j-mode for a single thread: architect, builder, reviewer or investigator. Spawned builders run as `JMode`. |
| [`j-agent`](agents/j-agent.md) | subagent | Reviewers and helpers started during a j-mode run |

Both load `j-mode` and then `j-team` before their first reply.

## Install

You need OpenCode V2 with its `opencode` CLI on your PATH, plus `git`, `jq` and `gh`.

1. Clone this repo, for example to `~/src/jstack`.
2. Copy [`agents/`](agents/) into `~/.config/opencode/agents/`.
3. Copy [`jstack-models.example.md`](jstack-models.example.md) to `~/.config/opencode/jstack-models.md` and set model IDs your providers offer.
4. Add this to `~/.config/opencode/opencode.json`:

   ```jsonc
   {
     "$schema": "https://opencode.ai/config.json",
     "default_agent": "JMode",
     "skills": ["~/src/jstack/jstack/skills", "~/src/jstack/opencode/skills"],
     "worktree": { "directory": "../worktrees" },
     "experimental": { "subagent_depth": 2 },
   }
   ```

   With depth 2, a reviewer that a builder starts can run `/interrogate`'s own reviewers. `worktree.directory` puts worktrees beside each repo instead of in OpenCode's data folder.
5. Optional: tell your agents where each repo's board lives with one line per repo in `~/.config/opencode/AGENTS.md`, in the form `JStack boards: <repo> -> <path>`, for example `JStack boards: my-app -> ~/docs/my-app/board.md`. Sessions read the board at start and keep their row current, and `jteam status` reads it too. A repo with no line uses `.opencode/jstack-board.md` at its root.
6. Optional: for each repo that needs setup in a fresh worktree (env files, dependency install), add an executable `~/.config/opencode/worktree-setup/<repo-name>.sh`. `jteam spawn` makes it the project's start command, so OpenCode runs it inside every new worktree, including ones you create in the app. Have it write its output to `$(git rev-parse --git-dir)/worktree-setup.log` and end with the line `worktree setup ok`, which is how `jteam` knows it worked. `git worktree list --porcelain | awk 'NR == 1 { print $2 }'` gives it the main checkout.

Skills load from the clone, so `git pull` updates them. Copy the agents again when they change.

## Use it

Open a session with `JMode`, the default agent, and give it one job, exactly as with `/j-mode` in Cursor. When the work hands on, it starts the next session with `jteam spawn`. Run `jteam status` any time to see stale board rows, sessions with no row, your draft PRs with CI state, and the worktrees `jteam prune` would remove.

## Worktrees and local resources

Builders run in OpenCode worktrees, so their sessions belong to the repo's project. `jteam prune`, which runs on every spawn, removes a worktree and its branch once the PR is merged and nothing local is left. Each worktree needs its own env files and dependencies, which the setup script handles. Ten worktrees can't all run the same local stack. Ports clash, and so can test databases and job queues. Keep one stack for the repo. Its line on the board names the session holding it, and a session asks before taking it. The others rely on typecheck, unit tests and CI.
