#!/usr/bin/env bash
set -euo pipefail

JTEAM="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/opencode/skills/j-team/scripts/jteam"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/repo"
git -C "$tmp/repo" init -q
cat >"$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
case "$1 $2" in
  "pr checks")
    if [ "$4" = --watch ]; then [ -z "${WATCH_ERR:-}" ] || { echo "$WATCH_ERR" >&2; exit 1; }; exit 0; fi
    [ -z "${CHECKS_ERR:-}" ] || { echo "$CHECKS_ERR" >&2; exit 1; }
    echo "$CHECKS"; exit "${CHECKS_RC:-0}";;
  "pr view") echo '{"number": 7, "title": "Fixture PR", "headRefOid": "abcdef1234567890",
    "commits": [{"committedDate": "2026-11-01T09:00:00Z"}]}';;
  "api repos/{owner}/{repo}/commits/abcdef1234567890") echo 2026-11-02T12:00:00Z;;
  "api --paginate")
    case "$3" in
      */pulls/7/reviews) echo '[
        {"user": {"login": "cursor[bot]"}, "state": "COMMENTED", "body": "Old finding\nmore", "html_url": "https://x/old", "submitted_at": "2026-11-02T11:00:00Z"},
        {"user": {"login": "cursor[bot]"}, "state": "COMMENTED", "body": "New finding\nmore", "html_url": "https://x/new", "submitted_at": "2026-11-02T13:00:00Z"}]';;
      *) echo '[]';;
    esac;;
esac
EOF
chmod +x "$tmp/bin/gh"

fail=0
run() { (cd "$tmp/repo" && export PATH="$tmp/bin:$PATH" CHECKS="$1" "${@:2}" && "$JTEAM" watch 7 2>&1); }
exits() { if [ "$2" = "$3" ]; then echo "ok   $1 exits $3"; else echo "FAIL $1 exits $2, want $3"; fail=1; fi; }
expect() {
  if grep -qF -- "$2" <<<"$3"; then echo "ok   $1"; else echo "FAIL $1: no '$2' in:"; sed 's/^/     /' <<<"$3"; fail=1; fi
}
expect_not() {
  if grep -qF -- "$2" <<<"$3"; then echo "FAIL $1: '$2' in:"; sed 's/^/     /' <<<"$3"; fail=1; else echo "ok   $1"; fi
}

rc=0; out="$(run '[{"name": "lint", "bucket": "pass"}, {"name": "Cursor Bugbot", "bucket": "pass"}]')" || rc=$?
expect "pass case reports CI passed" "CI passed" "$out"
expect "report names the PR and head" "#7 Fixture PR (head abcdef1)" "$out"
exits "pass case" "$rc" 0
expect "review after the head commit is shown" "review by cursor[bot] COMMENTED: New finding https://x/new" "$out"
expect_not "review before the head commit is hidden" "Old finding" "$out"

rc=0; out="$(run '[{"name": "lint", "bucket": "fail"}, {"name": "test", "bucket": "pass"}]')" || rc=$?
expect "fail case names the failing check" "CI failed: lint" "$out"
expect_not "fail case doesn't name a passing check" "CI failed: lint, test" "$out"
exits "fail case" "$rc" 1

nochecks="no checks reported on the 'fixture' branch"
rc=0; out="$(run '' WATCH_ERR="$nochecks" CHECKS_ERR="$nochecks")" || rc=$?
expect "no checks reports CI passed (no checks)" "CI passed (no checks)" "$out"
exits "no checks" "$rc" 0

rc=0; out="$(run '' CHECKS_ERR="HTTP 502: Bad Gateway")" || rc=$?
expect "checks query error shows gh's error" "CI unreadable (gh pr checks exited 1): HTTP 502: Bad Gateway" "$out"
expect_not "checks query error isn't reported as passed" "CI passed" "$out"
exits "checks query error" "$rc" 2

rc=0; out="$(run '[{"name": "test", "bucket": "pending"}]' WATCH_ERR="HTTP 502: Bad Gateway" CHECKS_RC=8)" || rc=$?
expect "watch error with checks pending says pending" "CI pending: test (watch exited 1: HTTP 502: Bad Gateway)" "$out"
exits "watch error" "$rc" 2

rc=0; out="$(run '[{"name": "test", "bucket": "pending"}]' CHECKS_RC=8)" || rc=$?
expect "checks still pending after the watch say pending" "CI pending: test" "$out"
exits "pending" "$rc" 2

exit "$fail"
