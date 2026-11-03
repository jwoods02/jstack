# JStack model map for OpenCode. Copy to ~/.config/opencode/jstack-models.md and set the IDs your providers offer.
# Role names match jstack/rules/jstack-models.mdc. IDs are provider/model#variant.
# A reviewer from a different model family than the builder catches more, so reviewers use another family here.

lead: anthropic/claude-opus-5-5#high
architect: anthropic/claude-opus-5-5#high
architect for load-bearing designs: anthropic/claude-opus-5-5#xhigh
plan reviewer: anthropic/claude-opus-5-5#high
plan reviewer for load-bearing plans: anthropic/claude-opus-5-5#xhigh
builder: anthropic/claude-opus-5-5#medium
builder for a very complex change: anthropic/claude-opus-5-5#high
builder for very well-planned work: anthropic/claude-sonnet-5-5#high
builder for a simple change with some ambiguity: anthropic/claude-sonnet-5-5#xhigh
hardest tasks: anthropic/claude-opus-5-5#xhigh
reviewer: openai/gpt-6.1-sol#high
investigator: anthropic/claude-sonnet-5-5#high
watcher: anthropic/claude-sonnet-5-5#medium
judgment and prose: anthropic/claude-opus-5-5#high
milestone reviewer: anthropic/claude-opus-5-5#high

how explorer: anthropic/claude-sonnet-5-5#xhigh
how explainer: anthropic/claude-opus-5-5#high
why investigators: anthropic/claude-sonnet-5-5#xhigh
why synthesizer: anthropic/claude-opus-5-5#high
reflect tooling: anthropic/claude-sonnet-5-5#xhigh
reflect judgment, divergent, synthesizer: anthropic/claude-opus-5-5#high
arena runners: anthropic/claude-opus-5-5#high, openai/gpt-6.1-sol#high
arena cross-judge pool: anthropic/claude-opus-5-5#xhigh
swarm workers: anthropic/claude-sonnet-5-5#high
architect runners: anthropic/claude-opus-5-5#high, openai/gpt-6.1-sol#high
interrogate reviewers: anthropic/claude-opus-5-5#high, openai/gpt-6.1-sol#high
trail reviewer: anthropic/claude-opus-5-5#high
comment sicko: anthropic/claude-sonnet-5-5#high
other helpers: anthropic/claude-sonnet-5-5#high
