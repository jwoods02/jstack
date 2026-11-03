# JStack on OpenCode

The skills and principles in [`../jstack/skills/`](../jstack/skills/) run unchanged on [OpenCode](https://opencode.ai) V2. `j-mode` is host-neutral, and this folder adds only what OpenCode does differently. That's two agents, a model map template and the [`j-team`](skills/j-team/SKILL.md) skill, j-mode's OpenCode host file, which carries the `jteam` script.

## How it works

You open each session yourself, usually from a ticket, a board line or an idea. A session does the job you give it. Sessions that only investigate, design, review or build one thing do that job and stop.

A **stream** is a piece of work you agreed, and its **lead** is the session you planned it with. Once you say go, the lead writes the plan to your docs, compacts itself if its context is large, makes one git worktree, and runs the PRs. Each PR gets a builder subagent, then a reviewer the lead starts and judges, before the lead moves to the next PR. Layered work ships as a [GitHub stack](https://github.com/github/gh-stack). A new idea gets a new session, and the lead hands you a short brief to paste into it. In a repo with a board, the stream keeps one line on it, and `jteam status` shows what has gone stale.

| Agent | Mode | Job |
|---|---|---|
| [`JMode`](agents/JMode.md) | primary | j-mode for one top-level session. It does the job you give it, and becomes a stream's lead once you agree a plan. |
| [`j-agent`](agents/j-agent.md) | subagent | Builders, reviewers and helpers that a lead or other session starts |

Both load `j-mode` and then `j-team` before their first reply, and `JMode` loads them again after a compaction.

## Install

You need OpenCode V2 with its `opencode` CLI on your PATH, plus `git`, `jq` and `gh`.

1. Clone this repo, for example to `~/src/jstack`. Install the `gh stack` extension and its agent skill:

   ```sh
   gh extension install github/gh-stack
   gh skill install github/gh-stack gh-stack --agent opencode --scope user
   ```
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
     "permissions": [
       { "action": "shell", "resource": "gh pr merge *", "effect": "deny" },
       { "action": "shell", "resource": "gh pr ready *", "effect": "deny" },
       { "action": "shell", "resource": "gh stack merge*", "effect": "deny" },
       { "action": "shell", "resource": "gh stack submit *--open*", "effect": "deny" },
       { "action": "shell", "resource": "gh stack link *--open*", "effect": "deny" },
       { "action": "shell", "resource": "gh stack unstack*", "effect": "deny" },
     ],
   }
   ```

   The deny rules keep agents from merging, marking a PR ready or unstacking, which are yours. The gh-stack skill documents `gh stack merge` and `--open`, and `j-team` overrides it. With depth 2, a reviewer that a lead starts can run `/interrogate`'s own reviewers. `worktree.directory` puts worktrees beside each repo instead of in OpenCode's data folder.
5. Optional: give a repo a board with one line in `~/.config/opencode/AGENTS.md`, in the form `JStack boards: <repo> -> <path>`, for example `JStack boards: my-app -> ~/docs/my-app/board.md`. Sessions read the board at start and keep their stream's line current, and `jteam status` reads it too. A repo with no line has no board. `j-team` shows the board's shape.
6. Optional: for each repo that needs setup in a fresh worktree (env files, dependency install), add an executable `~/.config/opencode/worktree-setup/<repo-name>.sh`. `jteam worktree` makes it the project's start command, so OpenCode runs it inside every new worktree, including ones you create in the app. Have it write its output to `$(git rev-parse --git-dir)/worktree-setup.log` and end with the line `worktree setup ok`, which is how `jteam` knows it worked. `git worktree list --porcelain | awk 'NR == 1 { print $2 }'` gives it the main checkout.

Skills load from the clone, so `git pull` updates them. Copy the agents again when they change.

## Use it

Open a session with `JMode`, the default agent, and give it a job, exactly as with `/j-mode` in Cursor. Agree its plan and say go, and it leads the stream through every PR, fanning out to subagents within the stream. Name branches `<type>/<ticket>-<slug>`, or `<type>/<slug>` with no ticket. Run `jteam status` any time to see stale board lines, sessions with no line, your draft PRs with CI state, and the worktrees `jteam prune` would remove.

## Worktrees and local resources

Each stream has one OpenCode worktree, made by `jteam worktree`, so its session belongs to the repo's project, and every branch of its stack lives there. `jteam prune`, which `jteam worktree` runs first, removes a worktree and its branch once the checked-out branch's PR is merged and nothing local is left. `gh stack sync --prune` deletes a stack's other merged branches. Each worktree needs its own env files and dependencies, which the setup script handles. Ten worktrees can't all run the same local stack. Ports clash, and so can test databases and job queues. Keep one stack for the repo. Its line on the board names the session holding it, and a session asks before taking it. The others rely on typecheck, unit tests and CI.
