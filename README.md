# JStack

JStack is how James Woods works with coding agents in [OpenCode](https://opencode.ai), written down as three agent files, three skills and one script. It's small on purpose. Recent models follow plain instructions well, so JStack holds only what a model can't work out for itself, and rules that must always hold live in OpenCode's permissions.

## How it works

You talk to one session, `jstack`. It answers questions and makes small changes itself. For a real PR it agrees the scope with you, makes a git worktree, and starts a `builder` subagent that builds and commits locally. Then a fresh `reviewer` subagent reviews the branch, fixes what it finds, pushes once and opens a draft PR with its description, so CI and review bots run only on reviewed code. `jstack` sends you the link and watches CI, and resumes the reviewer if something real comes back. You mark PRs ready, merge and release.

## What's in it

| Path | What it is |
|---|---|
| `agents/jstack.md` | The main session |
| `agents/builder.md` | Builds one PR from a brief |
| `agents/reviewer.md` | Reviews and fixes one PR, and writes its description |
| `skills/writing` | Docs, PR descriptions, tickets and comments |
| `skills/eval-check` | Checks a measured number before you trust it |
| `skills/glossary` | Keeps a project's words consistent (optional) |
| `scripts/jteam` | Worktrees, session lists, PR status and a CI watch that OpenCode doesn't do |
| `opencode.example.json` | Models per agent, skills path and deny rules |

## Install

You need OpenCode V2, `git`, `jq` and `gh`, plus the [`gh stack`](https://github.com/github/gh-stack) extension for stacked PRs.

```sh
git clone https://github.com/jwoods02/jstack ~/src/jstack
mkdir -p ~/.config/opencode/agents ~/.local/bin
ln -s ~/src/jstack/agents/*.md ~/.config/opencode/agents/
ln -s ~/src/jstack/scripts/jteam ~/.local/bin/jteam
```

Merge `opencode.example.json` into `~/.config/opencode/opencode.json`, and change the models and the skills path to match your setup. Because the agents and script are symlinks, `git pull` updates them.

`jteam worktree` runs `~/.config/opencode/worktree-setup/<repo>.sh` in each new worktree when that file exists. Have it end with the line `worktree setup ok`.

The tests are `scripts/test-jteam-*.sh`.

## Credit

JStack started as a fork of Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), and the writing skill grew out of its writing skills. The glossary skill is adapted from Matt Pocock's [domain-modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling) skill (MIT, copyright 2026 Matt Pocock). MIT licensed, see `LICENSE`.
