# Upstream tracking

JStack tracks [pstack](https://github.com/cursor/plugins/tree/main/pstack) from `cursor/plugins`. The plugin lives in `pstack/`, so upstream paths match this repo's paths exactly.

## Last merged

- Upstream: `cursor/plugins`, path `pstack/`.
- Commit: `99743e9c151c8537cbbf1f98bb38f34ef3368453`, merged 15 Oct 2026.
- Version: pstack 0.15.25.
- `pstack/` tree hash at import: `0d5fd349cbc77d054eed60f0e8cdfbea86321ff9`.

## Removed

- `pstack/skills/setup-pstack/`. Setup is done once; its result is `pstack/rules/pstack-models.mdc`.

## Added

- `pstack/rules/pstack-models.mdc`. James's model per role, in the format setup writes, shipped as an always-applied plugin rule.
- `.cursor-plugin/marketplace.json`. Lets Cursor install the plugin from this repo.
- `README.md` and `UPSTREAM.md` at the repo root.

## Changed

- `pstack/.cursor-plugin/plugin.json`: the name and display name are `jstack`, and `"rules": "./rules/"` is added.
- `pstack/skills/poteto-mode/SKILL.md`: the Subagents section points to the shipped `pstack-models.mdc` rule instead of `/setup-pstack`, in three phrases.
- `pstack/skills/arena/SKILL.md`, `swarm/SKILL.md` and `interrogate/SKILL.md`: `~/.cursor/rules/pstack-models.mdc` becomes "the `pstack-models.mdc` rule".
- `pstack/skills/poteto-help/SKILL.md`: these setup pieces change.
  - The model-rule check and first-run setup offer are removed.
  - "Get set up" now means install from `jwoods02/jstack`, with models already chosen.
  - The cost advice says to edit the rule.
  - The `/setup-pstack` table row is removed and two troubleshooting rows are reworded.
- `pstack/README.md`: install from GitHub, a one-step get started, the model split described, and the setup row and paragraph removed.
- `pstack/docs/guide/01-setup.md`: rewritten as "Install and run a first task". It has no setup step and no verification offer, and the cost advice says to edit the rule. The first-task section is unchanged.
- `pstack/docs/guide/README.md`, `02-poteto-mode.md`, `04-design.md` and `10-recipes-and-pitfalls.md`: link text and setup references updated.
- `pstack/automations/benny/FOR_AGENTS.md`, `README.md` and `skills/setup-benny/SKILL.md`: the settings snippet enables `jstack` instead of `pstack`.

## How to merge a new release

1. Add `https://github.com/cursor/plugins` as a remote named `upstream`, then fetch it.
2. Run `git diff <last-merged> <new> -- pstack/ | git apply -3`, then resolve any conflicts.
3. Keep every item in Removed, Added and Changed. If upstream edited a changed file, re-apply the change on top of upstream's version.
4. Skip upstream edits to `setup-pstack`. If the new release's setup adds or renames a model role, add that role to `pstack/rules/pstack-models.mdc`, because a role missing from the rule falls back to upstream's default.
5. Rewrite any new reference to `/setup-pstack` or `~/.cursor/rules/pstack-models.mdc` so it points to the shipped rule.
6. Update "Last merged" and add a row to the merge log.

## Merge log

| Date | Upstream commit | Version | JStack PR |
|---|---|---|---|
| 2026-10-15 | `99743e9c` | 0.15.25 | [#1](https://github.com/jwoods02/jstack/pull/1) (import) |
