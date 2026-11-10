# PR and ticket text

PR descriptions and tickets are read by people who have none of James's files, chats or agents. Write for a colleague who opens the link cold. Load `/technical-writing`, `/unslop` and, when installed, `james-voice` with its PR samples.

A builder opens the PR with the body `Draft. Description to follow.` and hands over a verification note. The finisher drafts the description from the plan doc and the diff, and the lead adds the calls made in the chat.

Tell the story to a human. Open with why the PR exists, who it's for and what changes for them. Then what it does, grouped the way a reviewer reads it. Then the decisions and trade-offs, including the ones made in the chat: what was chosen, what was rejected and why. Then how it was verified, and what a reviewer or deployer has to do or know, such as migrations, flags, rollout order and what's left out. End with the ticket line and the risk line. Write James's calls in first person and credit agent digging plainly, as `james-voice` says.

If the repo has a PR template, use its headings in order and fill each one. Otherwise follow the shape above. Keep any bot's marker block at the end of the body, such as Bugbot's `<!-- CURSOR_SUMMARY -->`, and replace only the text above it.

Nothing in a PR or ticket points at something only James has. That means no `~/git/docs`, plan docs, session ids or local paths. Say the decision and the reason in the text. Don't upload a doc to make a reference work. Attach UI screenshots, and anything else only when James asks. Leave out the agent process too: no builders, review rounds or plan amendments.

A ticket says what and why to someone who wasn't in the chat: the problem, the outcome, what's in and out of scope, and how to tell it's done. Plans and reproduction logs go in a collapsible "Agent notes" section, which follows the same rule.
