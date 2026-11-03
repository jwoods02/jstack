# JStack

<img src="jstack/assets/logo.svg" alt="JStack logo" width="96" />

JStack is James Woods's personal adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack), the agent-workflow plugin by Lauren Tan ([poteto](https://x.com/poteto)). It keeps pstack's skills and principles and runs James's own Cursor Project workflow through `/j-mode`. The plugin is for Cursor, and the same skills run on OpenCode through [`opencode/`](opencode/).

## v4 scope

- The plugin lives in [`jstack/`](jstack/). It is based on upstream release 0.15.25.
- [`/j-mode`](jstack/skills/j-mode/SKILL.md) is a one-page, host-neutral router over James's jobs: lead, architect, builder, reviewer, investigator and as many builder and reviewer pairs as there are independent tasks. pstack's 23 playbooks and the tools only they used are gone.
- PRs stay draft. No agent marks a PR ready, merges it or tags a release. James's standing orders win over anything else in JStack. JStack is the default workflow for every Project, and a Project's preferences hold only what is specific to that project.
- Every role has an explicit model in [`jstack/rules/jstack-models.mdc`](jstack/rules/jstack-models.mdc), an always-applied plugin rule.
- The guide is [one page](jstack/docs/guide.md). [UPSTREAM.md](UPSTREAM.md) lists every removal and change.

To install it, open Cursor's Customize, choose From GitHub Repository, and add this repo. Don't install the upstream plugin alongside it, because both ship the same skill names. To change a model, edit the rule file.

## OpenCode

[`opencode/`](opencode/) runs the same skills on OpenCode V2, with nothing copied out of `jstack/`. `j-mode` is host-neutral. Each host has a short host file for its tools: [`references/cursor.md`](jstack/skills/j-mode/references/cursor.md) on Cursor, and the `j-team` skill on OpenCode. `opencode/` adds two agents, a model map template and `j-team`, with its `jteam` script. You open each session yourself. Once you agree a plan, the session leads the thread in one git worktree, runs every PR's builder and reviewers as subagents, and ships layered work as a GitHub stack. Install also covers the `gh stack` extension, its agent skill, and deny rules that keep agents from merging, marking ready or unstacking. See [its README](opencode/README.md).

## Jobs and models

The models were chosen with [CursorBench 4.0](https://cursor.com/cursorbench) and the [Artificial Analysis](https://artificialanalysis.ai) Intelligence Index as guides. Anthropic leads every role, and on Cursor no OpenAI models are used. The OpenCode map, which you set yourself, can put another family on the reviewer seats. Gemini only takes a second seat on panels that an Anthropic agent leads. Opus runs at High unless deeper reasoning clearly changes the outcome. Agents never start on Max but may escalate to it.

| Job or role | Model | Why |
|---|---|---|
| Lead (the Project chat on Cursor) | Opus 5.5 Medium | Plans, runs builders and reviewers, judges reviews; on Cursor, set in the Project's settings |
| Architect | Opus 5.5 High; Extra High for load-bearing designs | A load-bearing design is hard to undo |
| Plan reviewer (plans of three or more PRs) | Opus 5.5 High; Extra High for load-bearing plans | On a load-bearing plan, its verdict gates every builder |
| Builder | Opus 5.5 Medium by default; Opus 5.5 High for a very complex change; Sonnet 5.5 High for very well-planned work; Sonnet 5.5 Extra High for a simple change with some ambiguity | James's builder rule (27 Oct) |
| Hardest tasks | Opus 5.5 Extra High | Subtle concurrency, tricky algorithms and repeat-failure bugs are where depth pays |
| Reviewer (every PR) | Opus 5.5 High | High ties Extra High on CursorBench at about half the cost |
| `/interrogate` (one-way doors) | Opus 5.5 High + Gemini 4 Argon High | Two model families try to break a change that is hard to reverse, and the lead judges their findings |
| Milestone reviewer | Opus 5.5 Extra High | Runs only on a stack with a one-way door, and its verdict gates the merge |
| Investigator | Sonnet 5.5 High | Read-only questions |
| Watcher | Sonnet 5.5 Medium | Only when waiting on something long |
| Judgment and prose | Opus 5.5 High | Everyday calls inside a job |
| `how` explainer, `why` synthesizer, `reflect` seats | Opus 5.5 High | They explain or propose; nothing they say is final |
| Arena runners, architect runners | Opus 5.5 High + Gemini 4 Argon High | They produce candidates for someone else to pick |
| Arena judge | Opus 5.5 Extra High | Its verdict picks the base that later work builds on |
| Trail reviewer (`/show-me-your-work`) | Opus 5.5 High | Its flags are advice |
| `how` explorers, `why` investigators, `reflect` tooling | Sonnet 5.5 Extra High | Read-only helpers |
| Swarm workers, Comment Sicko, other helpers | Sonnet 5.5 High | Bulk checks and narrow passes |

## Upstream merges

[UPSTREAM.md](UPSTREAM.md) records the last merged upstream version, the path mapping, every removal and change, and the merge steps. [`scripts/rename-upstream.py`](scripts/rename-upstream.py) applies the renames to an upstream diff and drops changes to removed paths.

## Direction

Later versions will keep changing JStack one PR at a time, from a backlog agreed with James. Each step adds to UPSTREAM.md, so upstream merges stay mechanical.

## License

MIT. The upstream code (pstack) is copyright (c) 2026 Lauren Tan, and James Woods's changes are copyright (c) 2026 James Woods. See [`jstack/LICENSE`](jstack/LICENSE).
