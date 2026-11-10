# JStack model map for OpenCode. Copy to ~/.config/opencode/jstack-models.md and set the IDs your providers offer.
# Role names match jstack/rules/jstack-models.mdc. IDs are provider/model#variant, through OpenRouter here. With a direct
# provider, drop the prefix: openrouter/anthropic/claude-opus-5.5 becomes anthropic/claude-opus-5-5.
# A line gives the default, then when to step down or up.
# Sol builds PRs that are mainly code, and Opus builds ones that are mainly process, prompts, docs or skills.

lead: openrouter/anthropic/claude-sonnet-5.5#high
architect: openrouter/anthropic/claude-fable-5.2#medium; down openrouter/anthropic/claude-opus-5.5#high or #medium for smaller, process or writing-heavy work; up openrouter/anthropic/claude-fable-5.2#high only for a very large change that's hard to undo, or when James asks
plan reviewer: openrouter/anthropic/claude-fable-5.2#medium; down openrouter/anthropic/claude-opus-5.5#high
builder: openrouter/openai/gpt-6.1-sol#high; down #medium for basic work; up #xhigh for hard work, or openrouter/anthropic/claude-opus-5.5#high rarely, when the lead judges Sol isn't coping
builder for process work: openrouter/anthropic/claude-opus-5.5#medium; up #high for harder pieces
finisher: openrouter/anthropic/claude-opus-5.5#high; down #medium for small PRs; up #xhigh for hard PRs
milestone reviewer: openrouter/anthropic/claude-fable-5.2#medium
holistic reviewer: openrouter/anthropic/claude-opus-5.5#high; down #medium for a small stack
explore: openrouter/anthropic/claude-haiku-5.5#high; up openrouter/anthropic/claude-sonnet-5.5#high for complex code
investigator: openrouter/anthropic/claude-opus-5.5#medium; up #high for hard questions
watcher: openrouter/anthropic/claude-sonnet-5.5#medium
judgment and prose: openrouter/anthropic/claude-opus-5.5#medium; up #high for hard calls

how explorer: openrouter/anthropic/claude-sonnet-5.5#high; down openrouter/anthropic/claude-haiku-5.5#high
how explainer: openrouter/anthropic/claude-opus-5.5#high
why investigators: openrouter/anthropic/claude-sonnet-5.5#high; down openrouter/anthropic/claude-haiku-5.5#high
why synthesizer: openrouter/anthropic/claude-opus-5.5#high
reflect tooling: openrouter/anthropic/claude-sonnet-5.5#xhigh
reflect judgment, divergent, synthesizer: openrouter/anthropic/claude-opus-5.5#high
arena runners: openrouter/anthropic/claude-opus-5.5#high, openrouter/openai/gpt-6.1-sol#high
arena cross-judge pool: openrouter/anthropic/claude-opus-5.5#xhigh
swarm workers: openrouter/anthropic/claude-sonnet-5.5#high; down openrouter/anthropic/claude-haiku-5.5#high
architect runners: openrouter/anthropic/claude-opus-5.5#high, openrouter/openai/gpt-6.1-sol#high
interrogate reviewers: openrouter/anthropic/claude-opus-5.5#high, openrouter/openai/gpt-6.1-sol#high
trail reviewer: openrouter/anthropic/claude-opus-5.5#high
comment sicko: openrouter/anthropic/claude-sonnet-5.5#high
other helpers: openrouter/anthropic/claude-sonnet-5.5#high; down openrouter/anthropic/claude-haiku-5.5#high
