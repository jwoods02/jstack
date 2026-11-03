#!/usr/bin/env bash
set -euo pipefail

JTEAM="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/opencode/skills/j-team/scripts/jteam"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/repo" "$tmp/elsewhere"
git -C "$tmp/repo" init -q -b main
git -C "$tmp/repo" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
git -C "$tmp/repo" worktree add -q -b feat/done "$tmp/done"
git -C "$tmp/repo" worktree add -q -b feat/open "$tmp/open"
done_head="$(git -C "$tmp/done" rev-parse HEAD)"

cat >"$tmp/bin/gh" <<EOF
#!/usr/bin/env bash
case "\$*" in
  *--draft*) cat <<'JSON'
[{"number":1,"title":"green","statusCheckRollup":[{"conclusion":"SUCCESS"},{"conclusion":"SKIPPED"}]},
 {"number":2,"title":"red","statusCheckRollup":[{"conclusion":"SUCCESS"},{"conclusion":"FAILURE"}]},
 {"number":3,"title":"running","statusCheckRollup":[{"conclusion":"","status":"IN_PROGRESS"}]},
 {"number":4,"title":"bare","statusCheckRollup":[]}]
JSON
  ;;
  *"--state merged"*) echo '[{"number":9,"headRefName":"feat/done","headRefOid":"$done_head"}]';;
  *) echo "unexpected gh \$*" >&2; exit 1;;
esac
EOF
chmod +x "$tmp/bin/gh"

fail=0
expect() {
  if grep -qF -- "$2" <<<"$3"; then echo "ok   $1"; else echo "FAIL $1: no '$2' in:"; sed 's/^/     /' <<<"$3"; fail=1; fi
}
reject() {
  if grep -qiF -- "$2" <<<"$3"; then echo "FAIL $1: found '$2'"; fail=1; else echo "ok   $1"; fi
}

out="$(cd "$tmp/open" && PATH="$tmp/bin:$PATH" "$JTEAM" status 2>&1)"
expect "passing PR" "#1 green (CI passing)" "$out"
expect "failing PR" "#2 red (CI failing)" "$out"
expect "pending PR" "#3 running (CI pending)" "$out"
expect "PR with no checks" "#4 bare (no checks)" "$out"
expect "merged worktree listed" "$tmp/done and branch feat/done (PR #9 merged)" "$out"
reject "open worktree not listed" "$tmp/open " "$out"
reject "no board output" "board" "$out"

rc=0
outside="$(cd "$tmp/elsewhere" && PATH="$tmp/bin:$PATH" GIT_CEILING_DIRECTORIES="$tmp" "$JTEAM" status 2>&1)" || rc=$?
expect "outside a repo explains itself" "run it inside a repo" "$outside"
if [ "$rc" = 1 ]; then echo "ok   outside a repo exits 1"; else echo "FAIL outside a repo exited $rc"; fail=1; fi

rc=0
(cd "$tmp/open" && PATH="$tmp/bin:$PATH" "$JTEAM" status board.md >/dev/null 2>&1) || rc=$?
if [ "$rc" = 1 ]; then echo "ok   a board argument is refused"; else echo "FAIL a board argument exited $rc"; fail=1; fi

exit "$fail"
