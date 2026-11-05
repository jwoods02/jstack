# JStack model map for OpenCode. Copy to ~/.config/opencode/jstack-models.md and set the IDs your providers offer.
# Role names match jstack/rules/jstack-models.mdc. IDs are provider/model#variant.
# The reviewer is a different provider from the builder, at the builder's level. Sol builds by default and Opus reviews it.
# An Opus builder at any level, including `hardest tasks`, gets the Sol High reviewer.
# Opus builds only security-sensitive, very ambiguous or one-way-door work, and Sol reviews that.
# Reviewers go up a level only for the milestone review, or a holistic review James asks for.
# The explore agent always runs on Sonnet Medium. Leads, architects and plan reviewers stay as they are.

lead: anthropic/claude-opus-5-5#medium
architect: anthropic/claude-opus-5-5#high
architect for load-bearing designs: anthropic/claude-opus-5-5#xhigh
plan reviewer: anthropic/claude-opus-5-5#high
plan reviewer for load-bearing plans: anthropic/claude-opus-5-5#xhigh
builder: openai/gpt-6.1-sol#medium
builder for a very complex change: openai/gpt-6.1-sol#high
builder for very well-planned work: openai/gpt-6.1-sol#medium
builder for a simple change with some ambiguity: openai/gpt-6.1-sol#high
builder for security-sensitive, very ambiguous or one-way-door work: anthropic/claude-opus-5-5#high
hardest tasks: anthropic/claude-opus-5-5#xhigh
reviewer: anthropic/claude-opus-5-5#medium
reviewer for a Sol High builder: anthropic/claude-opus-5-5#high
reviewer for an Opus builder: openai/gpt-6.1-sol#high
explore: anthropic/claude-sonnet-5-5#medium
investigator: anthropic/claude-sonnet-5-5#high
watcher: anthropic/claude-sonnet-5-5#medium
judgment and prose: anthropic/claude-opus-5-5#high
milestone reviewer: anthropic/claude-opus-5-5#high
milestone reviewer for an Opus-built stack: openai/gpt-6.1-sol#xhigh

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
