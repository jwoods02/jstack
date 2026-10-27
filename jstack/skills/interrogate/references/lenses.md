# Review lenses

j-mode runs lens reviews only for big changes. Three fresh reviewers start together, one per lens. Each reads only its own section. The coordinator merges the three verdicts into one list for the builder.

Every lens follows these rules.

- Review the final head. Name it in the verdict.
- Round 1 is a full review. Round 2 checks only the fixes, with no new nits. Round 3 converges.
- Findings sort into Act on, Consider, Noted and Dismissed.
- Re-run only what CI does not, and do not reinstall for delta checks.
- Don't write files, push or comment on the PR. Hand the verdict back to the coordinator.

## Architecture and proportionality

**Scope.** Whether the approach is right, and whether the diff is the right size for the goal. This lens reads the design, the data shapes and the module boundaries. It does not hunt for line-level bugs.

**Checks.**

- State the goal in one sentence, then name the simplest design that meets it. Say whether the PR matches that design or why it differs.
- Look for code the goal doesn't need (extra layers, one-caller wrappers, compatibility shims, speculative options) and for missing deletions of the old path.
- Check that each new type or table encodes the domain, and that illegal states can't be built.
- Check that the change doesn't split one concern across files, or merge two that should stay apart.
- Compare the size of the diff to the size of the goal. Flag any hunk that earns no place.

**Handoff.** A suspected bug goes to the correctness lens. A claim without evidence, or a doc that is now false, goes to the evidence and docs lens. Write it as "outside my lens, for the correctness reviewer" or "outside my lens, for the evidence and docs reviewer", with the file and line.

**Verdict format.**

- Verdict line (approve, approve with changes, or block).
- Head commit.
- Base commit.
- Patch id (`git diff <base>...<head> | git patch-id --stable`).
- Findings by bucket.
- What was re-run.

## Correctness

**Scope.** Whether the code does what the PR says, on every path that matters. This lens runs `/interrogate`, which uses two models, and then judges the findings itself.

**Checks.**

- Run `/interrogate` on the diff against the stated intent.
- Back each bug you claim with a failing test or script. Commit nothing. Put the test or script in the verdict so the builder can rerun it.
- A finding with no failing test is labeled "reasoned, not tested", and it can't be Act on unless the reasoning is a proof.
- Check retries, restarts, partial failures, concurrent writers and replays. Look for state that a second run can't recover from.
- Check that each new test fails when the behavior breaks.

**Handoff.** A design objection goes to the architecture lens. A false claim in the PR body, an unverified number or a stale doc goes to the evidence and docs lens. Write it as "outside my lens, for the architecture reviewer" or "outside my lens, for the evidence and docs reviewer", with the file and line.

**Verdict format.**

- Verdict line (approve, approve with changes, or block).
- Head commit.
- Base commit.
- Patch id (`git diff <base>...<head> | git patch-id --stable`).
- Findings by bucket, each with its failing test or script, or the "reasoned, not tested" label.
- What was re-run.

## Evidence and docs

**Scope.** Whether every claim in the PR is true, and whether the docs still match the code. This lens trusts no number it didn't see produced.

**Checks.**

- Re-run every claimed number and check from the PR body. Say which ran and which couldn't.
- For a measured number, apply `/benchmark-checklist`.
- Find docs, READMEs, comments and skill text that the PR makes false. List each with the line.
- Check that the PR body has a summary, what changed, how it was verified and a risk line, and that each matches the diff.
- For an irreversible move (a data migration, a deletion, a repo or service move, a credential or permission change), check for a rollback note and read it for gaps.

**Handoff.** A bug goes to the correctness lens. A design objection goes to the architecture lens. Write it as "outside my lens, for the correctness reviewer" or "outside my lens, for the architecture reviewer", with the file and line.

**Verdict format.**

- Verdict line (approve, approve with changes, or block).
- Head commit.
- Base commit.
- Patch id (`git diff <base>...<head> | git patch-id --stable`).
- Findings by bucket.
- What was re-run, with the command and the result for each.

## Milestone review

The milestone reviewer is not a lens. It runs once, on the final head, after every PR of the milestone or chain has passed its own reviews and before James merges. It re-runs the load-bearing evidence (tests, replays, measurements), each with at least one negative control that should fail. It checks the rollback path. Its verdict uses the format above and gates the merge.
