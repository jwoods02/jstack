# Upstream tracking

JStack tracks pstack, Lauren Tan's plugin in [`cursor/plugins`](https://github.com/cursor/plugins/tree/main/pstack). This file is the only place that names upstream paths.

## Last merged

- Upstream: `cursor/plugins`, path `pstack/`.
- Commit: `99743e9c151c8537cbbf1f98bb38f34ef3368453`, merged 15 Oct 2026.
- Version: 0.15.25.
- Upstream `pstack/` tree hash at import: `0d5fd349cbc77d054eed60f0e8cdfbea86321ff9`.

## Path mapping

| Upstream | JStack |
|---|---|
| `pstack/` | `jstack/` |
| `~/.cursor/rules/pstack-models.mdc`, written by upstream setup | `jstack/rules/jstack-models.mdc`, shipped in the plugin |
| `pstack/skills/setup-pstack/` | removed |

The rename itself is mechanical, and [`scripts/rename-upstream.py`](scripts/rename-upstream.py) reproduces it on files or on an upstream diff:

- Paths, code spans and link targets become `jstack`.
- Markdown prose becomes `JStack`.
- It matches whole words only, so "upstack" is untouched.
- Lines that link to `github.com/cursor/plugins` are left as written.

## Removed

- `skills/setup-pstack/`. Setup is done once; its result is `rules/jstack-models.mdc`.

## Added

- `jstack/rules/jstack-models.mdc`. James's model per role, in the format setup writes, shipped as an always-applied plugin rule.
- `.cursor-plugin/marketplace.json`. Lets Cursor install the plugin from this repo.
- `scripts/rename-upstream.py`, `README.md` and `UPSTREAM.md` at the repo root.

## Changed

All paths are inside `jstack/`.

- **Everywhere:** "pstack" becomes JStack, per the rename rules above.
- **`README.md`:** poteto's first-person intro is replaced by a short JStack intro that credits poteto. Install, getting started and the model split change as described under setup.
- **`.cursor-plugin/plugin.json` and `plugin.json`:** these fields change.
  - The name is `jstack` and the display name is `jstack`.
  - The homepage and repository point to `jwoods02/jstack`.
  - The Cursor manifest adds `"rules": "./rules/"`.
- **`skills/poteto-help/SKILL.md`:** public-copy links point to `jwoods02/jstack`. The setup changes below also apply.
- **Setup removed:**
  - `skills/poteto-mode/SKILL.md`: the Subagents section points to the shipped rule instead of `/setup-pstack`.
  - `skills/arena/SKILL.md`, `swarm/SKILL.md` and `interrogate/SKILL.md`: the user-level rule path becomes "the `jstack-models.mdc` rule".
  - `skills/poteto-help/SKILL.md`: the model-rule check, the first-run setup offer, the setup steps and the setup table row are removed. The cost and troubleshooting advice now point to the rule file.
  - `docs/guide/01-setup.md`: rewritten as "Install and run a first task", with no setup and no verification offer.
  - `docs/guide/README.md`, `02-poteto-mode.md`, `04-design.md` and `10-recipes-and-pitfalls.md`: links and setup references updated.
  - `automations/benny/FOR_AGENTS.md`, `README.md` and `skills/setup-benny/SKILL.md`: the settings snippet enables `jstack`.

## How to merge a new release

1. Add `https://github.com/cursor/plugins` as a remote named `upstream`, then fetch it.
2. Run `git diff <last-merged> <new> -- pstack/ | python3 scripts/rename-upstream.py --patch > upstream.patch`. This maps paths to `jstack/` and renames prose the same way.
3. Run `git apply --reject upstream.patch`. Hunks next to JStack's own changes come back as `.rej` files; resolve each one against the Changed list. When this was tested on upstream's last commit, 4 of 5 files applied cleanly, and the fifth conflicted where JStack had edited the adjacent line.
4. Skip upstream edits to `setup-pstack`. If upstream's setup adds or renames a model role, add the role to `jstack/rules/jstack-models.mdc`, because a missing role falls back to upstream's default.
5. Point any new reference to `/setup-pstack` or `~/.cursor/rules/pstack-models.mdc` at the shipped rule instead.
6. Update "Last merged" and add a row to the merge log.

## Merge log

| Date | Upstream commit | Version | JStack PR |
|---|---|---|---|
| 2026-10-15 | `99743e9c` | 0.15.25 | [#1](https://github.com/jwoods02/jstack/pull/1) (import) |
