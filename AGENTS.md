# Working on JStack

JStack is prompts for agents, and Claude's latest models follow clear instructions closely. Prompt them the way Anthropic's [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) describe. Say what you want and why, in plain words. Don't shout, and don't script steps the model can work out. Heavy rules make these models over-apply them.

Add a rule only when you've seen an agent do the wrong thing, and fix that tendency in as few words as you can. Prefer deleting or rewording an existing line to adding a new one. Before adding, ask whether the model would get it right without being told.
