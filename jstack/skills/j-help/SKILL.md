---
name: j-help
description: Guides users through JStack (James Woods's adaptation of pstack by Lauren Tan), /j-mode, and picking the job, skill, or principle for a task. Type /j-help with a question.
disable-model-invocation: true
---

# J help

JStack is James Woods's personal adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (poteto). Say so whenever the user asks what JStack is or where it came from.

Answer the user's question about JStack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a JStack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use JStack to fix this bug", is not a help question. Read [`j-mode`](../j-mode/SKILL.md), do the work under it, and mention once that a Custom Mode keeps it on.

This file maps questions to the skills and the guide that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point into the installed plugin, which the user may not be able to open, so give the user the file's public copy: `https://github.com/jwoods02/jstack/blob/main/jstack/` followed by its path.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up
- Start a task with `/j-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make JStack my own

Check the state that changes the answer, and mention it only when it does:

- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/create-verification-skill` when the question is about proving a change works.

## Get set up

1. Install from Customize in the sidebar: From GitHub Repository, then `jwoods02/jstack`.
2. Nothing to configure. The plugin ships [`rules/jstack-models.mdc`](../../rules/jstack-models.mdc), which already maps a model to each role. Edit that file to change one. Changes apply to new chats.
3. Start a real task with `/j-mode`, a goal, and a check that can pass or fail.

Installing changes nothing until the user invokes a skill, apart from the always-applied model rule. No skill loads from the user's words alone. The [README](../../README.md) and [the guide](../../docs/guide.md) have the details. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

If cost is the worry, say where the tokens go and how to spend fewer. JStack spends extra tokens on subagents and review panels. Edit the role lines in `rules/jstack-models.mdc` to pick lower effort or cheaper models. A role set to `auto` or `inherit-parent` runs on the chat's model, which saves tokens when the chat runs on Auto or a cheaper model. A shorter panel list runs fewer subagents, one for each entry. Save `/j-mode` for work that needs rigor.

JStack is built for Cursor. Its skills use the Agent Skills format, so other tools can read them. But most workflow skills, including `/j-mode`, `/how`, `/why`, and `/teach`, spawn Cursor subagents with per-role models, and Custom Modes and `/loop` are Cursor features, so those parts may not work there.

## Start a task with `/j-mode`

`/j-mode` picks one job: architect, builder, reviewer, investigator, or up to three builder and reviewer pairs at once. It runs the skills that job needs. PRs stay draft, and James merges. A good prompt states the goal and how to tell it's done. It doesn't list skills, because the job already picks them. Read [`references/prompting.md`](references/prompting.md) before you help word one. [The guide](../../docs/guide.md) has examples.

Whether `/j-mode` stays on depends on how the user starts it:

- Enter on `/j-mode` attaches the skill to one message. It fades as the chat moves on.
- Option+Enter on Mac or Alt+Enter on Windows, or Use as Mode from the skill entry, makes it a Custom Mode. It stays in context every turn until the user exits the mode, and it stays out of casual turns.
- Cursor's docs list Custom Modes in the Agents Window and the CLI. Elsewhere, start each new task with `/j-mode`.

Link [Cursor's skills docs](https://cursor.com/docs/skills) when this comes up. Mid-chat, "new task" makes the mode pick a fresh job. `/j-mode` already uses `j-agent` for every builder, reviewer and helper it spawns. To get the same style from a subagent of your own, spawn it with `subagent_type: "j-agent"`.

## Pick a skill

The default answer is `/j-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the job gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/j-mode`](../j-mode/SKILL.md) |
| Check that the agent understood their goal and the problem before it starts | [`/in-your-own-words`](../in-your-own-words/SKILL.md) |
| Aim a task higher before starting: more expert, more outcome-focused, not overspecified | [`/sharpen`](../sharpen/SKILL.md) |
| Know how code works now, or where new code should live | [`/how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/teach`](../teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`/recall`](../recall/SKILL.md) |
| Catch up on what changed in this chat since their last message, in a few plain sentences and small visuals, with enough context to decide each action item | [`/ketchup`](../ketchup/SKILL.md) |
| Know what a small diff could break outside itself | [`/blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, as cloud agents | [`/swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/tdd`](../tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/no-comments`](../no-comments/SKILL.md) |
| Clean AI tells out of prose | [`/unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/technical-writing`](../technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`/bro`](../bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Plan a one-off run that fits none of `/j-mode`'s jobs | [`/figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`/show-me-your-work`](../show-me-your-work/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`/automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`/correct`](../correct/SKILL.md) |
| Find their way around JStack | `/j-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/how` explains what the code does. `/why` explains the reasons. `/teach` runs one or both and explains the result plainly.
- `/arena` gives every worker the same brief and merges the best parts. `/swarm` splits work into slices or a race and returns one report.
- `/architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/interrogate` reviews the diff. `/blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/recall` rebuilds context across recent chats. `/ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch follows the Start section of `/j-mode`.
- `/figure-it-out` designs one rigorous run that fits none of the jobs. Long unattended work uses `/j-mode`'s finish check with `/loop`.

Not in JStack:

- `/loop` and `/create-skill` are Cursor built-ins.
- If the slash menu shows a command this file doesn't list, another plugin or Cursor provides it.

## Jobs and principles

Jobs are sections of `/j-mode`, not skills, so they have no slash command. Describing the task picks one:

- "How does X work?" or "why is Y like this?" runs the investigator. No PR.
- "Design X", or any big change, runs the architect. It ends with a short decision list and stops for the user.
- "Fix", "build" or "change X" runs a builder. It opens a draft PR, and a fresh reviewer starts once CI is green.
- Several independent changes run as up to three builder and reviewer pairs at once.

No agent marks a PR ready or merges it. The user does both. JStack has no planning skill. Plans of three or more PRs get a plan review before any builder starts.

Principles are one-rule skills that `/j-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/principle-<name>` still loads one on demand. The Principles section of [`j-mode`](../j-mode/SKILL.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | It was started with Enter. Start it as a Custom Mode, or start each task with `/j-mode`. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | The `jstack-models.mdc` rule applies to new chats. Start one. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Skills load when the user types them or when `/j-mode` runs them, and it doesn't run every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree, or run them as cloud agents, which each get their own machine. |
| An overnight run moved but finished nothing | `/loop` needs a check that can pass or fail, not a duration. See [the guide](../../docs/guide.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers, and [`references/recipes.md`](references/recipes.md) has prompts worth copying.

## Make JStack my own

- [`/automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/j-mode`.
- [`/reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/j-mode write a skill for <workflow>` runs a builder and a reviewer on the JStack repo. Anything agents read needs a live run on the real models before the user merges it.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.


## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
