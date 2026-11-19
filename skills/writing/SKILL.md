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

## Examples

A reply James understood straight away, after he said the jargon lost him:

> Imagine a practice exam for a new grader. The answer key says what a careful human would score each paper. We split the papers into three piles: one the tuner can study, one for checking each tweak, and a sealed pile that is the final exam.
>
> The tool that writes the answer key respected the seal too, so it could never write answers onto the sealed pile. To work around that, it copied the sealed files from version to version without opening them. If a copy had the same name as the version you were editing, it used the copy and quietly dropped your latest edits.
>
> Now only the commands that grade are kept out of the sealed pile. The answer-key command can see everything but only prints counts. Short version: the lock was on the wrong door.

A PR body James would sign:

> `watch` spent about 30 minutes of every bot finding waiting on a check that does nothing. This stops it.
>
> **Where the time went.** The autofix check sits in progress for exactly 30 minutes after any finding, and `watch` waited for every check. Four watches after a finding took 33 to 44 minutes. Watches without one took 5 to 7.
>
> **What changed.** `watch` polls every 10 seconds and ignores the autofix check. It also waits up to a minute for checks to appear after a push, so callers drop their `sleep`.
>
> **Looked at and not done.** Five other watch tools poll the same API. Polling was never the cost, so the script stays.
>
> **Verified.** The test script passes 28 checks, including the autofix case. A live run returned in under 3 minutes.
>
> Low risk. One script change with tests.
