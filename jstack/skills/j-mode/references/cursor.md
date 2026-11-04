# J mode on Cursor

This is j-mode's host file for Cursor. It says how j-mode's words map to Cursor's tools.

## Chats

- **Lead.** In a Cursor Project, the Project chat is the lead for every thread of work in the Project, because James works in that one chat. It starts builders and reviewers and briefs James. A chat outside a Project is a one-off, and does the job itself as j-mode describes.
- **Shared context.** The project's docs are the Project's shared context, and each plan or handoff doc holds its state. Outside a Project, use the chat's own todo list.
- **Earlier chats.** Read them from the workspace's `agent-transcripts/` directory. Don't glob across `~/.cursor/projects/*/`, which reads unrelated projects' chats.
- **Project skills.** These live in `.cursor/skills/`.
- **New chats.** JStack has no tested way for an agent to open a top-level Cursor chat, so give James the brief to paste into one.

## Subagents

- Start each one with the Task tool, `subagent_type: "j-agent"`, `run_in_background: true`, in agent mode. Readonly mode strips MCP access.
- If `j-agent` isn't an available `subagent_type` (for example, in a cloud worker where the plugin didn't load), use `generalPurpose`. Put j-mode's absolute path in the prompt and tell the worker to read it in full first.
- Where a skill says readonly, set `readonly: true` when the Task tool offers it.
- The model map is the always-applied `jstack-models.mdc` rule. Pass the role's slug as `model`.
- Use a `-fast` slug only when something is urgent: CI or `main` is red, or James is blocked right now.
- If the Task tool rejects a slug, use the closest valid slug of the same family and say so.

## Waits

- For a short wait, run one blocking `gh pr checks --watch`.
- For a wait over about 20 minutes, end the turn and subscribe to a timer with `/loop`, or to CI events. Subscribe to merged, ready for review and CI conclusion, not every push.
- End every watch with a clear stand-down.

## PRs

Cursor's built-in PR tool opens PRs ready for review by default, so set `draft: true` every time.
