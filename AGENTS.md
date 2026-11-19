# Working on JStack

JStack is prompts for agents, and Claude's latest models follow clear instructions closely. Prompt them the way Anthropic's [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) describe. Say what you want and why, in plain words. Don't shout, and don't script steps the model can work out. Heavy rules make these models over-apply them.

Add a rule only when you've seen an agent do the wrong thing, and fix that tendency in as few words as you can. Prefer deleting or rewording an existing line to adding a new one. Before adding, ask whether the model would get it right without being told. A rule that must always hold belongs in `opencode.example.json` permissions or in `scripts/jteam`, not in prose.

The agents are in `agents/` and the skills in `skills/`. Keep them short. About 2,500 words together is a guide, not a target. A clear 3,000 beats a broken 2,500, so cut lines that don't earn their place and keep any that make an agent clearer or more reliable. Run `wc -w agents/*.md skills/*/SKILL.md` before and after a change. A skill's frontmatter `name` matches its directory.

This repo is public, so keep anything internal to an employer and any secrets out of it.

After changing `scripts/jteam`, run `bash scripts/test-jteam-watch.sh` and `bash scripts/test-jteam-status.sh`. There is no CI.
