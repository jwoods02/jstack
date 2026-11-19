---
name: writing
description: How to write docs, PR descriptions, tickets, commit messages and code comments that a colleague understands on the first read. Use when writing or editing any of these, or a long reply that explains work.
---

# Writing

Write for a smart colleague who hasn't seen the work. They have none of your context, chats or local files. Give them a short picture of where things stand, in words they already use, then the detail they need to act.

## Saying it plainly

- Lead with the point: the answer, the decision or what changed. Background comes after, if at all.
- Use the repo's real names for files, commands and concepts. Call each thing by one name throughout. Don't coin terms, codenames or metaphors where a plain word exists.
- Say what something does, with a mechanism or a number, rather than how it feels. "A column rename fails the build" beats "types that follow your schema".
- When the reader is lost, start with one concrete example, then generalize.
- Write whole sentences with their articles and verbs. Clipped fragments and arrows make the reader decode.
- Vary sentence length. Split a sentence that carries two thoughts, and keep a long one that carries one.
- Cut words that do no work, such as "in order to", stacked hedges and chatbot sign-offs.
- Label anything you didn't run as reasoned, not tested.

These are aims, not a checklist. If following one makes a sentence worse, fix the sentence another way.

## PR descriptions

A reviewer should be able to read the body in a minute.

1. Open with the problem: why the PR exists, who it's for and what changes for them.
2. What it does, grouped the way a reviewer reads it.
3. The decisions and trade-offs, including what was rejected and why.
4. How it was verified. Use a small table for anything measured, with run counts.
5. What a reviewer or deployer needs to do or know, then the ticket line if the repo uses one, and a risk line ("Low risk" plus why).

Use the repo's PR template when it has one, and keep any bot's marker block at the end. Leave out the agent process (builders, review rounds) and anything only the author can open, such as local paths, plan docs or session IDs. A ticket follows the same rules: the problem, the outcome, the scope and how to tell it's done.

## Code comments

A comment earns its place by saying something the code can't, such as a non-obvious why or an outside constraint, in a line or two. Delete comments that narrate the code or the change. Where a comment says "don't change this", prefer a test or a type that enforces it.
