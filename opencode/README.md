# JStack on OpenCode

The skills and principles in [`../jstack/skills/`](../jstack/skills/) run unchanged on [OpenCode](https://opencode.ai) V2. `j-mode` is host-neutral, and this folder adds only what OpenCode does differently. That's two agents, a model map template and the [`j-team`](skills/j-team/SKILL.md) skill, j-mode's OpenCode host file, which carries the `jteam` script.

## How it works

You open most sessions yourself, usually from a ticket, a plan doc or an idea. A session does the job you give it. Sessions that only investigate, design, review or build one thing do that job and stop.

A **thread** is a piece of work you agreed. It can run across several sessions, and its **lead** is the session you planned it with. Once you say go, the lead writes the plan to your docs, compacts itself, makes one git worktree, and runs the PRs. Each PR gets a builder subagent, then a finisher that reviews and fixes it and drafts the PR text, before the lead moves to the next PR. Layered work ships as a [GitHub stack](https://github.com/github/gh-stack). A new idea gets a new session, which the lead starts itself with a short brief and which reports to you in its own chat. The plan doc holds its state, and `jteam status` shows your draft PRs and finished worktrees.

| Agent | Mode | Job |
|---|---|---|
| [`JMode`](agents/JMode.md) | primary | j-mode for one top-level session. It does the job you give it, and becomes a thread's lead once you agree a plan. |
| [`j-agent`](agents/j-agent.md) | subagent | Builders, finishers and helpers that a lead or other session starts |

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

   The deny rules keep agents from merging, marking a PR ready or unstacking, which are yours. The gh-stack skill documents `gh stack merge` and `--open`, and `j-team` overrides it. With depth 2, a subagent the lead starts can start its own helpers, such as a finisher's `/how` explorers. `worktree.directory` puts worktrees beside each repo instead of in OpenCode's data folder.
5. Optional: for each repo that needs setup in a fresh worktree (env files, dependency install), add an executable `~/.config/opencode/worktree-setup/<repo-name>.sh`. `jteam worktree` makes it the project's start command, so OpenCode runs it inside every new worktree, including ones you create in the app. Have it write its output to `$(git rev-parse --git-dir)/worktree-setup.log` and end with the line `worktree setup ok`, which is how `jteam` knows it worked. `git worktree list --porcelain | awk 'NR == 1 { print $2 }'` gives it the main checkout.

Skills load from the clone, so `git pull` updates them. Copy the agents again when they change.

## Use it

Open a session with `JMode`, the default agent, and give it a job, exactly as with `/j-mode` in Cursor. Agree its plan and say go, and it leads the thread through every PR, fanning out to subagents within the thread. Name branches `<type>/<ticket>-<slug>`, or `<type>/<slug>` with no ticket. Run `jteam status` in a repo any time to see your draft PRs there with CI state, and the worktrees `jteam prune` would remove.

## Worktrees and local resources

Each thread has one OpenCode worktree, made by `jteam worktree`, so its session belongs to the repo's project, and every branch of its stack lives there. `jteam prune`, which `jteam worktree` runs first, removes a worktree and its branch once the checked-out branch's PR is merged and nothing local is left. `gh stack sync --prune` deletes a stack's other merged branches. Each worktree needs its own env files and dependencies, which the setup script handles. Ten worktrees can't all share one local stack. Ports clash, and so can test databases and job queues. Have each run start its own throwaway containers, such as Postgres and Redis, and put the repo's testing rule in its preferences.
