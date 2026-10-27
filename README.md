# JStack

JStack is James Woods's personal adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack), the agent-workflow plugin by Lauren Tan ([poteto](https://x.com/poteto)). It is Cursor-only. It starts with every setup step already done, and it will be cut down and adapted to how James works, one step at a time.

## v1 scope

- The plugin lives in [`jstack/`](jstack/). It is upstream release 0.15.25, renamed to JStack and with setup removed; otherwise it works the same.
- James's model choices ship as [`jstack/rules/jstack-models.mdc`](jstack/rules/jstack-models.mdc), an always-applied plugin rule.
- Setup is removed: the setup skill, its first-run offers, and references to the user-level rule file. [UPSTREAM.md](UPSTREAM.md) lists every change.
- A root [marketplace manifest](.cursor-plugin/marketplace.json) lets Cursor install the plugin from this repo. The plugin is named `jstack`.

To install it, open Cursor's Customize, choose From GitHub Repository, and add this repo. Don't install the upstream plugin alongside it, because both ship the same skill names. To change a model, edit the rule file.

## Models

The models were chosen with two sources, [CursorBench 4.0](https://cursor.com/cursorbench) and the [Artificial Analysis](https://artificialanalysis.ai) Intelligence Index, under these rules:

- Anthropic leads every role, and no OpenAI models are used.
- Gemini only takes a second seat on panels that an Anthropic agent leads.
- Opus runs at High by default and at Extra High only where deeper reasoning changes the outcome. Code delegates follow James's builder rule instead, starting on Opus Medium.
- Agents never start on Max but may escalate to it for the hardest work.
- Each level is used as written, without the usual per-job lowering in `j-mode`.

| Role | Model | Why |
|---|---|---|
| Code delegates (feature, refactoring, bug fix, perf, hillclimb) | Opus 5.5 Medium by default; Opus 5.5 High for a very complex change; Sonnet 5.5 High for very well-planned work; Sonnet 5.5 Extra High for a simple change with some ambiguity | James's builder rule (27 Oct). Opus Medium scores 52.5% on CursorBench at $2.91 a task; agents pick the tier from one line in the rule file |
| Hardest tasks | Opus 5.5 Extra High | The gnarliest changes, where extra reasoning pays off |
| Judgment and prose | Opus 5.5 High | Everyday judgment; High ties Extra High on CursorBench (56.0%) at 57% of the cost |
| `how` explainer | Opus 5.5 High | Synthesizes what the explorers already traced, with the code at hand |
| `why` synthesizer | Opus 5.5 Extra High | Grades thin, conflicting evidence into confidence levels, where over-claiming is the main failure |
| `reflect` judgment, divergent and synthesizer seats | Opus 5.5 Extra High | Its accepted findings become skill edits that every later run follows |
| Arena runners | Opus 5.5 High + Gemini 4 Argon High | Runners only generate candidates for the parent to pick from; Gemini adds a different model's take |
| Arena judge | Opus 5.5 Extra High | Its verdict steers the pick, so Anthropic keeps it |
| Architect runners | Opus 5.5 Extra High + Gemini 4 Argon High | Type and module shape is hard to undo; Gemini gives a structurally different second design |
| Interrogate reviewers | Opus 5.5 Extra High + Gemini 4 Argon High | Review is where depth catches bugs; Gemini's findings are weighed by the Opus lead |
| `how` explorers, `why` investigators, `reflect` tooling | Sonnet 5.5 Extra High | Read-only helpers; Gemini scores the same but costs more per task |
| Swarm workers | Sonnet 5.5 High | Verification lanes run at exactly this level and in numbers; 47.8% at $1.20 a task |

These models are not used:

- OpenAI models.
- Muse Wonder, which trails Gemini on both sources.
- Grok, Composer and Fable, which score lower or cost more.

Gemini has no UX or visual role yet, because no role is UX-specific.

## Upstream merges

[UPSTREAM.md](UPSTREAM.md) records the last merged upstream version, every removal and change, and the merge steps.

## Direction

Later versions will cut and change JStack, one PR at a time, from a backlog agreed with James. The backlog covers draft-only PRs, no agent merges, and similar changes. Each step adds to UPSTREAM.md, so upstream merges stay mechanical.

## License

MIT. The upstream code (pstack) is copyright (c) 2026 Lauren Tan, and James Woods's changes are copyright (c) 2026 James Woods. See [`jstack/LICENSE`](jstack/LICENSE).
