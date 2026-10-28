# The JStack guide

<img src="../assets/logo.svg" alt="JStack logo" width="96" />

JStack is James Woods's personal adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (poteto). It keeps pstack's skills and principles and runs James's own Cursor Project workflow through `/j-mode`.

## Install

In Cursor, open Customize, choose From GitHub Repository, and add `jwoods02/jstack`. Install the `jstack` plugin. The models are already chosen in [`rules/jstack-models.mdc`](../rules/jstack-models.mdc), so there is nothing to configure.

## Start a task

Type `/j-mode`, then the goal and a check that can pass or fail:

```text
/j-mode users get two emails after a retry. repro first, then fix. done means one email per retry in the integration log.
```

To keep `/j-mode` on for the whole chat, pick it from the `/` menu and press Option+Enter (Mac) or Alt+Enter (Windows). Say "new task" when you switch subjects.

## The jobs

`/j-mode` picks one job. The full table, with models, is in [`j-mode`](../skills/j-mode/SKILL.md).

- **Investigator.** Answers "how does X work?" or "why is Y like this?". No PR.
- **Architect.** Designs a big or unclear change and ends with a short decision list for you to answer.
- **Builder.** One per PR. Opens a draft PR, gets CI green and says "ready for review".
- **Reviewer.** A fresh agent per PR once CI is green, at most three rounds. Big changes get three lens reviewers. The last PR of a milestone or big chain also gets a milestone review before you merge.
- **Parallel builders.** As many builder and reviewer pairs as there are independent tasks. One builder per PR or task.

In a Project, the coordinator chat picks the jobs and briefs you. In a single chat, the chat does the job itself.

## Rules that always hold

- PRs stay draft. No agent marks a PR ready, merges it or tags a release. You do all three.
- Production is read-only unless you allow a specific action.
- Your standing orders win over anything else in JStack.
- JStack is the default for every Project. A Project's preferences hold only what is specific to that project.

## Prompts worth copying

```text
/j-mode how does run cancellation work? don't change any code.
/j-mode design rate limiting for external webhooks. give me the decisions to make.
/j-mode build these three changes in parallel, one builder and reviewer each.
/j-mode i'm going to bed. finish the migration. done means zero old callers and all fixtures pass.
```

## Skills worth knowing

- `/how`, `/why` and `/teach` explain code, its history, or both, in plain words.
- `/interrogate` has two models try to break a diff.
- `/tdd` writes the failing test first.
- `/benchmark-checklist` vets a measured number before you trust it.
- `/create-verification-skill` gives agents a scripted way to drive your app.
- `/show-me-your-work` keeps a decision log you can audit later.
- `/bro` restates the last reply in plain words.

Unsure which one fits? Ask `/j-help`.
