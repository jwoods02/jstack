# Upstream tracking

JStack tracks pstack, Lauren Tan's plugin in [`cursor/plugins`](https://github.com/cursor/plugins/tree/main/pstack). This file is the only place that names upstream paths.

## Last merged

- Upstream: `cursor/plugins`, path `pstack/`.
- Commit: `99743e9c151c8537cbbf1f98bb38f34ef3368453`, merged 15 Oct 2026.
- Version: 0.15.25.
- JStack's own version is 3.0.0, set in both `plugin.json` files. It is not upstream's number. `agents/j-agent.md` picks the installed copy with the highest version, so a later upstream bump must not outrank it. "Last merged" records the upstream base only.
- Upstream `pstack/` tree hash at import: `0d5fd349cbc77d054eed60f0e8cdfbea86321ff9`.

## Path mapping

| Upstream | JStack |
|---|---|
| `pstack/` | `jstack/` |
| `~/.cursor/rules/pstack-models.mdc`, written by upstream setup | `jstack/rules/jstack-models.mdc`, shipped in the plugin |
| `pstack/skills/setup-pstack/` | removed (v1) |
| `pstack/skills/poteto-mode/SKILL.md` | `jstack/skills/j-mode/SKILL.md`, rewritten in v2 |
| `pstack/skills/poteto-mode/playbooks/` | removed (v2) |
| `pstack/skills/poteto-mode/scripts/` | removed (v2) |
| `pstack/skills/poteto-mode/references/` | `jstack/skills/j-mode/references/` |
| `pstack/skills/poteto-help/` | `jstack/skills/j-help/` |
| `pstack/agents/poteto-agent.md` | `jstack/agents/j-agent.md` |
| `pstack/docs/guide/` | removed (v2), replaced by `jstack/docs/guide.md` |
| `pstack/skills/make-bot-ui/` | removed (v2) |
| `pstack/assets/logo.png` | removed (v2), replaced by `jstack/assets/logo.svg` |

The rename itself is mechanical, and [`scripts/rename-upstream.py`](scripts/rename-upstream.py) reproduces it on files or on an upstream diff:

- Paths, code spans and link targets become `jstack`.
- Markdown prose becomes `JStack`.
- It matches whole words only, so "upstack" is untouched.
- `poteto-mode`, `poteto-agent` and `poteto-help` become `j-mode`, `j-agent` and `j-help` everywhere.
- The display names "Poteto Mode", "Poteto mode", "Poteto subagent" and "Poteto help" become "J Mode", "J mode", "J subagent" and "J help".
- "poteto's agent style" becomes "James's agent style", "is my style" becomes "is James's style", and the test branch prefix `poteto/` becomes `j/`.
- Lines that credit upstream are left as written, so attribution to pstack and poteto stays. These are lines that link to `github.com/cursor/plugins` or name Lauren Tan.
- In `--patch` mode, diffs for removed upstream paths are dropped and listed on stderr.

## Removed

- `skills/setup-pstack/` (v1). Setup is done once, and its result is `rules/jstack-models.mdc`.
- `skills/j-mode/playbooks/` (v2): all 23 playbooks. James's jobs in `skills/j-mode/SKILL.md` replace them.
  - Investigation, Bug fix, Perf issue, Hillclimb, Runtime forensics, Trace forensics, Feature, Refactoring, Prototype, Visual parity.
  - Authoring a skill, Eval, Babysit, Shipping, Autonomous run, Orchestrate, Autopilot-full, Autopilot-stack.
  - Session pickup, Pause safely, Multi-phase plan, Worktree cleanup, Opening a PR.
- `skills/j-mode/scripts/` (v2): the tools that only those playbooks used.
  - The PR watcher (`watch-pr/`) and the orchestration bookkeeping (`orch/`).
  - The plan checker (`check-plan.mjs` and its test) and the worktree audit (`worktree-audit.sh`).
  - The Bun installer and package files (`bootstrap.ts`, `package.json`, `bun.lock`).
- `docs/guide/` (v2): the 10-page guide, its index and its 6 images.
- `skills/make-bot-ui/` (v2): the Grok Bot webhook page skill, along with its rows in `README.md` and `skills/j-help/SKILL.md`.
- `assets/logo.png` (v2): poteto's avatar, used as the listing logo, along with the README line that credited it.

## Added

- `jstack/rules/jstack-models.mdc`. One model per role, shipped as an always-applied plugin rule. In v2 it lists James's jobs plus every skill role, and any other spawn uses `other helpers`.
- `jstack/docs/guide.md` (v2). A one-page guide.
- `jstack/assets/logo.svg` (v2). A plain, hand-made JStack logo: a white "J" on a slate-grey rounded square. `.cursor-plugin/plugin.json` points at it, and both READMEs and the guide show it.
- `.cursor-plugin/marketplace.json`. Lets Cursor install the plugin from this repo.
- `scripts/rename-upstream.py`, `README.md` and `UPSTREAM.md` at the repo root.
- `jstack/skills/interrogate/references/lenses.md` (v3). The architecture, correctness and evidence lenses for big changes, with each lens's scope, checks, handoff wording and verdict format.

## Changed

All paths are inside `jstack/`.

**Everywhere (v1).** "pstack" becomes JStack, and the poteto persona names become the `j-` names, per the rename rules above.

**Manifests (v1).** These fields change in `.cursor-plugin/plugin.json` and `plugin.json`:

- The name is `jstack`, and the display name is `JStack`.
- The description credits pstack, Lauren Tan (poteto) and the upstream link.
- The author is "James Woods, adapting pstack by Lauren Tan".
- The keywords add `poteto`.
- The homepage and repository point to `jwoods02/jstack`.
- The Cursor manifest adds `"rules": "./rules/"`.

**Attribution (v1).** These places credit pstack by Lauren Tan (poteto): `LICENSE`, the descriptions of `j-mode`, `j-help` and `j-agent`, the opening line of `j-help`, `README.md`, `docs/guide.md`, `automations/benny/README.md` and `automations/benny/skills/setup-benny/SKILL.md`.

**Setup removed (v1).**

- `skills/arena/SKILL.md`, `swarm/SKILL.md` and `interrogate/SKILL.md`: the user-level rule path becomes "the `jstack-models.mdc` rule".
- `skills/j-help/SKILL.md`: the setup offer and the setup steps are gone, and the cost advice points to the rule file.
- `automations/benny/FOR_AGENTS.md`, `README.md` and `skills/setup-benny/SKILL.md`: the settings snippet enables `jstack`.

**James's workflow (v2).**

- `skills/j-mode/SKILL.md`: rewritten as James's workflow, with Start, Jobs, PR rules, Skill triggers, Autonomy, Subagents, Writing the reply and Comments, plus a tie-break saying his standing orders win. The Principles index is kept word for word. Port only upstream changes to that index by hand.
- `rules/jstack-models.mdc`: job lines replace the playbook lines, and every role has a line. Opus defaults to High, with Extra High only for hardest tasks, load-bearing architect and plan-review work, the arena judge and `/interrogate`.
- `skills/how`, `why`, `swarm`, `arena`, `architect`, `interrogate` and `reflect` (each `SKILL.md`):
  - Their fallback models are JStack's own.
  - Fallbacks recognise only the Claude and Gemini model families.
  - The arena judge is always Anthropic.
  - `swarm`'s steps are renumbered.
- `skills/show-me-your-work/SKILL.md`: the trail reviewer uses the `trail reviewer` line, and a worker leaves that review to the coordinator.
- `skills/no-comments/SKILL.md` and `skills/recall/SKILL.md`: they use the `comment sicko` and `other helpers` lines, and `recall` resumes via `j-mode`'s Start section.
- `skills/benchmark-checklist/SKILL.md` and `skills/figure-it-out/SKILL.md`: no playbook references. `figure-it-out` plans a one-off run when no job fits.
- `agents/j-agent.md`: the parent owns the job instead of a playbook.
- `skills/j-help/SKILL.md` and its `references/`: jobs replace playbooks, links point to the one-page guide, and the recipes leave merging to James.
- `skills/j-mode/references/bugbot-triage.md`: builders and reviewers use it, instead of the Babysit playbook.
- `README.md`: rewritten around the jobs, keeping the skill and principle tables.

**James's workflow (v3).**

- `skills/j-mode/SKILL.md`:
  - Draft-only PRs stay, with `draft: true` on the built-in PR tool and a rule that the coordinator sends James the link once a draft PR has green CI.
  - A generic one-ticket-per-PR rule that follows the repo's `AGENTS.md`.
  - No builder cap. One builder per PR or task, a check for shared branches, files and migration numbers, and a resume limit for builders and reviewers (about an hour and about 400k tokens).
  - A new big-change definition built on one-way doors and load-bearing code. It is a change that is hard to reverse, or a large change to load-bearing machinery on a live production system. The list is an irreversible move, more than about 1,000 production lines, a chain of three or more PRs, and the last PR of a milestone. File count is not a signal. "Replay-sensitive workflow code" is dropped, and prototypes and projects not yet live always get one reviewer. The milestone review and the correctness lens no longer say "replays".
  - A Reviews section with one reviewer by default, three lens reviewers for big changes, rounds, verdicts that name head, base and patch id, stacks, and a milestone review.
  - Project context by role (the Project's task tracker and shared context) instead of `notes.md`, with the chat's own todo list outside a Project.
  - Builder reminders for upfront calls, narrow local tests before review, root-cause fixes, one blocking command per wait with a timer or CI subscription for long waits, and a handoff note.
  - Reviewers re-run only what CI does not. The Watcher row carries the no-polling and subscribe rules (merged, ready for review and CI conclusion, not every push). Workers end with a summary of 10 lines or fewer.
  - Autonomy additions (no production releases, a question is not an edit request), a tie-break that makes JStack the default for every Project, and a `generalPurpose` fallback when `j-agent` is missing.
  - The big-change skill trigger now names the correctness lens, and the correctness lens has no model line of its own.
- `rules/jstack-models.mdc`: adds `lens reviewers` and `milestone reviewer`. No other line changes.
- `skills/interrogate/SKILL.md`: one line on the correctness lens, and the `readonly` fallback.
- `skills/how/SKILL.md` and `skills/arena/SKILL.md`: the `readonly` fallback.
- `skills/recall/SKILL.md`: says "task tracker" instead of `notes.md`.
- `skills/j-help/SKILL.md`, `docs/guide.md`, `README.md` and the root `README.md`: synced with the changes above, with "up to three" removed.
- `plugin.json` and `.cursor-plugin/plugin.json`: version 3.0.0.

**Optional voice skill (v3.1).**

- `skills/j-mode/SKILL.md` and `skills/technical-writing/SKILL.md`: text written as James also loads his `james-voice` skill when it's installed. JStack doesn't bundle it.

## How to merge a new release

1. Add `https://github.com/cursor/plugins` as a remote named `upstream`, then fetch it.
2. Run `git diff <last-merged> <new> -- pstack/ | python3 scripts/rename-upstream.py --patch > upstream.patch`. This maps paths to `jstack/`, renames prose, and drops diffs for removed paths.
3. Run `git apply --reject upstream.patch`. Hunks next to JStack's own changes come back as `.rej` files. Resolve each one against the Changed list.
4. For `j-mode/SKILL.md`, keep JStack's version and port only upstream changes to the Principles index.
5. If upstream adds or renames a model role, add it to `jstack/rules/jstack-models.mdc`. Until then, the new role's spawns use `other helpers`.
6. Point any new reference to a removed playbook, tool, `/setup-pstack` or `~/.cursor/rules/pstack-models.mdc` at JStack's equivalent, or remove it.
7. Update "Last merged" and add a row to the merge log.

## Merge log

| Date | Upstream commit | Version | JStack PR |
|---|---|---|---|
| 2026-10-15 | `99743e9c` | 0.15.25 | [#1](https://github.com/jwoods02/jstack/pull/1) (import) |
