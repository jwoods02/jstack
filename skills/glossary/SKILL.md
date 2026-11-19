---
name: glossary
description: Keeps a project's words consistent with its glossary. Use when naming a new concept, when a term seems to mean two things, or when writing or editing a project's glossary.
---

# Glossary

Adapted from Matt Pocock's [domain-modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling) skill (MIT, copyright 2026 Matt Pocock).

A project's words drift. The UI says one thing, the API another and the code a third, and agents invent a fourth. A glossary maps them, so everyone can tell which words name the same thing and which don't.

## Using it

Look for `GLOSSARY.md` at the repo root, or the file the repo's `AGENTS.md` points to. Don't create one until a term is actually settled.

- Use the glossary's word in prose, PR text and new names.
- When James or the code uses a word that conflicts with it, say so straight away. "The glossary defines cancellation as a whole order, but you seem to mean one line item. Which is it?"
- When a word is vague or overloaded, propose a precise one and ask.
- Check claims against the code, and point out where they differ.

## Two words are not always a mistake

A glossary is a mapping, not a ban list. When the UI, the API and the code use different words, check whether they name the same thing before merging them. Keep both when they mean different things, and record how they relate. For example, the UI may say "workspace" where the API says `project` and billing says `account`. Workspace and project may be aliases, while an account owns several projects. One word for all three would hide that.

Don't rename APIs, database columns or workflow identifiers to tidy prose. Record the alias instead.

## Writing it

Add a term as soon as it's settled. Each entry gives the term, a one-line meaning, its other names marked as aliases or different things, and an example if it helps. Leave implementation details out, because a glossary isn't a spec.
