# JStack

JStack is James Woods's personal, Cursor-only version of [pstack](https://github.com/cursor/plugins/tree/main/pstack), the agent-workflow plugin by Lauren Tan. It starts as pstack unchanged and will be cut down and adapted to how James works, one step at a time.

## v1 scope

- pstack 0.15.25, unchanged, in [`pstack/`](pstack/).
- James's model choices, baked in as [`pstack/rules/pstack-models.mdc`](pstack/rules/pstack-models.mdc). This is the file `/setup-pstack` would write, shipped as an always-applied plugin rule so nobody has to run setup.
- A root [marketplace manifest](.cursor-plugin/marketplace.json) so Cursor can install the plugin from this repo. The plugin is named `jstack`.

Nothing else changes in v1. Install it through Cursor's Customize, then From GitHub Repository. Don't install upstream pstack alongside it, because both ship the same skill names. To change a model, edit the rule file. Don't run `/setup-pstack`, because it writes a second rule to `~/.cursor/rules/` that competes with this one.

## Models

The models were picked by [CursorBench 4.0](https://cursor.com/cursorbench) score, using Anthropic models only and never Max effort.

| Role | Model | Why |
|---|---|---|
| Code delegates (feature, refactoring, bug fix, perf, hillclimb) | Sonnet 5.5 Extra High | 53.1% at $2.81 a task: the best allowed score after Opus, and Opus reviews its work |
| Judgment and prose, hardest tasks, `how` explainer, `why` synthesizer, `reflect` judgment seats, arena and architect runners, arena judge, interrogate reviewers | Opus 5.5 Extra High | 56.0%, the top allowed score |
| `how` explorers, `why` investigators, `reflect` tooling | Sonnet 5.5 Extra High | Beats pstack's Grok defaults on both score and cost |
| Swarm workers | Sonnet 5.5 High | Verification lanes run at exactly this setting and in numbers; 47.8% at $1.20 still beats pstack's Grok 4.7 Extra High default (46.3% at $6.01) |

The rule's effort is a starting level. pstack lowers it for routine and judgment work, and the rule stops it rising above Extra High. Opus 5.5 High scores the same as Extra High on CursorBench (56.0%), so lowered judgment runs lose no benchmark score.

These models are not used:

- OpenAI models, by James's rule.
- Gemini, which is for UX work only, under an Anthropic agent; no pstack role is UX-specific.
- Muse Wonder, which scores 50.4% at best; it's a candidate second code reviewer later.
- Grok, Composer and Fable, which score lower or cost more.

## Upstream merges

The last merge was pstack 0.15.25, from `cursor/plugins` commit `99743e9c151c8537cbbf1f98bb38f34ef3368453`. The `pstack/` tree hash at the import was `0d5fd349cbc77d054eed60f0e8cdfbea86321ff9`. The first commit on this repo's history after the initial one is the pristine import.

These are the changes from upstream. Keep them through every merge:

- `pstack/rules/pstack-models.mdc` is added.
- In `pstack/.cursor-plugin/plugin.json`, the name and display name are `jstack`, and `"rules": "./rules/"` is added.
- `.cursor-plugin/marketplace.json` and this README are added at the repo root.

To merge a new release:

1. Add `https://github.com/cursor/plugins` as a remote named `upstream` and fetch it.
2. Run `git diff <last-merged> <new> -- pstack/ | git apply -3`. Paths match because the plugin stays in `pstack/`.
3. If `setup-pstack` gained or renamed a model role, add it to the rule file. A role missing from the rule falls back to the upstream default.
4. Update the commit and version above, and the change list if it grew.

## Direction

Later versions will cut and change pstack, one PR at a time, from a backlog agreed with James. The backlog covers draft-only PRs, no agent merges, removing setup, and similar changes. Each step adds to the change list above, so upstream merges stay mechanical.

## License

pstack is MIT-licensed, copyright (c) 2026 Lauren Tan. See [`pstack/LICENSE`](pstack/LICENSE).
