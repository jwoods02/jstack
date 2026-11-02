# JStack on OpenCode

The skills and principles in [`../jstack/skills/`](../jstack/skills/) run unchanged on [OpenCode](https://opencode.ai) V2. This folder adds only what OpenCode does differently. That's two agents, a model map template and the [`j-team`](skills/j-team/SKILL.md) skill, which maps j-mode's Cursor terms to OpenCode and carries the `jteam` script.

## How it works

A **stream** is a piece of work, and its **lead** is the one top-level session that owns it end to end. You talk to the lead. It plans the work with you, stops for your decisions, and once you say go it runs the whole stack of PRs in one git worktree. Each PR gets a builder subagent, then reviewers the lead starts and judges, before the lead moves to the next PR. Layered work ships as a [GitHub stack](https://github.com/github/gh-stack), and the stream keeps one row on a shared board file. Independent work is its own stream with its own lead, and you make the cross-stream calls. Sessions that only investigate, design or build one thing do that job and stop. `jteam status` shows what has gone stale.

| Agent | Mode | Job |
|---|---|---|
| [`JMode`](agents/JMode.md) | primary | j-mode for one top-level session. It does the job you give it, and becomes a stream's lead once you agree a plan. |
| [`j-agent`](agents/j-agent.md) | subagent | Builders, reviewers and helpers that a lead or other session starts |

Both load `j-mode` and then `j-team` before their first reply.

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
5. Optional: tell your agents where each repo's board lives with one line per repo in `~/.config/opencode/AGENTS.md`, in the form `JStack boards: <repo> -> <path>`, for example `JStack boards: my-app -> ~/docs/my-app/board.md`. Sessions read the board at start and keep their row current, and `jteam status` reads it too. A repo with no line uses `.opencode/jstack-board.md` at its root.
6. Optional: for each repo that needs setup in a fresh worktree (env files, dependency install), add an executable `~/.config/opencode/worktree-setup/<repo-name>.sh`. `jteam spawn` makes it the project's start command, so OpenCode runs it inside every new worktree, including ones you create in the app. Have it write its output to `$(git rev-parse --git-dir)/worktree-setup.log` and end with the line `worktree setup ok`, which is how `jteam` knows it worked. `git worktree list --porcelain | awk 'NR == 1 { print $2 }'` gives it the main checkout.

Skills load from the clone, so `git pull` updates them. Copy the agents again when they change.

## Use it

Open a session with `JMode`, the default agent, and give it a job, exactly as with `/j-mode` in Cursor. Agree its plan and say go, and it leads the stream through every PR. A lead whose context gets heavy hands the same worktree to a fresh lead with `jteam spawn --continue`. Run `jteam status` any time to see stale board rows, sessions with no row, your draft PRs with CI state, and the worktrees `jteam prune` would remove.

## Worktrees and local resources

Each stream has one OpenCode worktree, so its session belongs to the repo's project, and every branch of its stack lives there. `jteam prune`, which runs on every spawn, removes a worktree and its branch once the checked-out branch's PR is merged and nothing local is left. `gh stack sync --prune` deletes a stack's other merged branches. Each worktree needs its own env files and dependencies, which the setup script handles. Ten worktrees can't all run the same local stack. Ports clash, and so can test databases and job queues. Keep one stack for the repo. Its line on the board names the session holding it, and a session asks before taking it. The others rely on typecheck, unit tests and CI.
