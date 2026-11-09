# PR and ticket text

Use this when you write a PR description or a ticket. Both are read by people who have none of James's files, chats or agents. Write for a colleague who opens the link cold.

Load `/technical-writing` and `/unslop` first, and James's `james-voice` skill when it's installed, reading its PR samples. A PR description goes out with his name on it.

## Who writes it and when

- The lead writes the PR description, or a helper on the `judgment and prose` line that the lead briefs. Never a builder. A builder opens the PR with the placeholder body `Draft. Description to follow.` and hands over a verification note.
- Write it once the PR has passed review and its head is final. If a later push changes what the PR does, bring the body back in line with the final head before you report.
- Inputs: the diff, the ticket, the plan or handoff doc, the builder's verification note, the review verdicts and the calls James made in the chat.

## Stand-alone text

- Name no file, doc, folder, session id, worktree, or path on James's machine. That includes `~/git/docs`, plan docs, handoff notes and `/Users/...`. Nobody else can open them.
- When a doc holds a decision, state the decision and the reason in the text. When it holds a long table, include the rows that matter.
- Don't upload a doc to make a reference work. Attach a file only for UI screenshots (`gh pr create|edit --attach`) or when James asks.
- Link only things a teammate can open: tickets, other PRs, merged code, public docs, a Figma file they have access to.
- Leave out the agent process. No builders, reviewers, rounds, "plan reviewer amendments" or "round 1 of review replaced X". Describe what the code does and why, not how it got reviewed.

## Shape of a PR description

If the repo has a PR template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/pull_request_template.md`, a root `PULL_REQUEST_TEMPLATE.md`, or files in `.github/PULL_REQUEST_TEMPLATE/`), use it. Keep its headings in order and fill every one, writing "None" or "Not applicable" with a reason rather than deleting a section. If there are several templates, pick the one that matches the change and say which. If there is no template, use the shape below.

1. **Why.** Open with a short plain paragraph: the problem, who it's for and what changes for them. Then what the next engineer who owns this code inherits. A reader who stops here should still know why the PR exists.
2. **What it does.** Group by what a reviewer reads together, not by file. Name the real symbols and paths in the repo. For a stack, say where this PR sits, what it's based on and what merges with it.
3. **Decisions and trade-offs.** Each call that shaped the change: what was chosen, what was rejected and why, and what it costs. Include the calls made in the chat with James. Write his calls in first person ("I chose X over Y because"), and credit digging an agent did plainly, as `james-voice` says.
4. **Verification.** The commands and tests that prove it, and what each showed. An evidence table for anything measured, with the sample size. Say what you didn't test.
5. **For the reviewer and the deployer.** Anything to do or know: migrations and their order, flags, config, rollout steps, backfills, what to read first, known gaps and follow-ups, and what this PR leaves out.
6. **Ticket and risk.** The ticket line in the form the repo asks for, then a risk line: "no risk", "low risk", or higher with the reasons.

A PR that needs no section 5 content doesn't get one. Length follows the story. Don't paste logs or lists of commit hashes, don't narrate the diff file by file, and don't pad a small change.

## A bot's block in the body

Some bots keep a marked block at the end of the body, such as Bugbot's `<!-- CURSOR_SUMMARY -->`. Read the current body with `gh pr view <n> --json body`, and replace only the text above the marker. Keep the marker and everything below it.

## Tickets

A ticket says what and why to a teammate who wasn't in the chat.

- **Problem.** What is wrong or missing, who it affects and how you know.
- **Outcome.** What good looks like for that person.
- **Scope.** What is in and what is out.
- **Acceptance.** Checks someone can run or see.
- **Context.** Decisions already made, with the reason, and open questions.

Implementation plans, file lists and reproduction logs go in a collapsible "Agent notes" section at the end. The same stand-alone rule applies there. Check for an existing ticket before creating one. Don't paste a plan doc or link a local one.
