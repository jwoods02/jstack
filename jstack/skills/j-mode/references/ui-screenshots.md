# UI screenshots

For any change a user can see. Builders, reviewers and verifiers follow it. The aim is that James finds every image in one folder and gets them into the PR with no browser hunting.

## Where they go

One flat folder per thread, named in the project's docs the way its `AGENTS.md` says (for Resonance, `~/git/docs/resonance/YYYY-MM-DD-<thread-slug>-shots/`). With no project docs, use the session's scratch dir. No sub-folders. Never commit screenshots to the repo, push them to a branch or upload them as release assets.

Working shots can have any name. The shots for the PR are the **PR set**, named `pr-<n>-<state>-<before|after>.png`, where `<n>` is the order they appear in the PR body and a before sits directly before its after. For example `pr-1-menu-google-before.png`, `pr-2-menu-google-after.png`. A PR set is the one place James looks, so copy a working shot in under its PR name instead of renaming it away from the evidence.

Take a before for every state you change, from the base, before you edit. A new screen has only an after. Cover each state the PR touches, such as default, hover, error and mobile.

## Looking at them

An image read opens one file. A folder read lists names, and a glob or a pile of paths in one message still shows one image. So open each file in its own read, and never say you reviewed the set. In your report, list the files you opened by name. A shot you didn't open is unchecked, so say so.

## In the PR body

Put a **Screenshots** section after the summary, with a Before and After table with one row per state. Check the host's `gh` first with `gh pr create --help | grep -- --attach`.

- **`gh` has `--attach` (v2.99.0 and later).** Write each image into the body as `![alt](/absolute/path/pr-1-menu-google-before.png)` and pass the same path with `--attach` on `gh pr create` or `gh pr edit`. `gh` uploads it and rewrites the path in place. Not run yet. This is from GitHub's changelog.
- **No `--attach`.** Leave a placeholder cell for each image holding only its file name, such as `pr-1-menu-google-before.png`, and add a line under the table saying the images are to be dragged in. Never open a browser, log in, or try an unofficial upload hack. Before v2.99.0, `gh` can't upload images, so James drags them in.

After the PR is open, in the placeholder case run `open <the shots folder>` on macOS so Finder shows the PR set in order. End the report with the folder path, the PR set's file names in body order, and the PR link, so dragging each file into its placeholder is all James has to do.
