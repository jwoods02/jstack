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
    [ -z "${CHECKS_ERR:-}" ] || { echo "$CHECKS_ERR" >&2; exit 1; }
    calls="$(cat "$CALLS_FILE" 2>/dev/null || echo 0)"; echo $((calls + 1)) >"$CALLS_FILE"
    echo "$CHECKS" | sed -n "$((calls + 1))p" | grep . || echo "$CHECKS" | tail -n 1
    exit "${CHECKS_RC:-0}";;
  "pr view") echo '{"number": 7, "title": "Fixture PR", "headRefOid": "abcdef1234567890",
    "commits": [{"committedDate": "2026-11-01T09:00:00Z"}]}';;
  "api repos/{owner}/{repo}/commits/abcdef1234567890") echo 2026-11-02T12:00:00Z;;
  "api --paginate")
    [ "$3" != "${FAILING_ENDPOINT:-}" ] || { echo "HTTP 502: Bad Gateway ($3)" >&2; exit 1; }
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
run() { rm -f "$tmp/calls"; (cd "$tmp/repo" && export PATH="$tmp/bin:$PATH" CALLS_FILE="$tmp/calls" CHECKS="$1" JTEAM_CHECK_INTERVAL=0 JTEAM_CHECK_GRACE=0 "${@:2}" && "$JTEAM" watch 7 2>&1); }
calls() { cat "$tmp/calls"; }
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

rc=0; out="$(run '[{"name": "test", "bucket": "pending"}]
[{"name": "test", "bucket": "pending"}]
[{"name": "test", "bucket": "pass"}]')" || rc=$?
expect "pending checks are polled until they pass" "CI passed" "$out"
[ "$(calls)" = 3 ] && echo "ok   polled three times" || { echo "FAIL polled $(calls) times, want 3"; fail=1; }
exits "polled to pass" "$rc" 0

rc=0; out="$(run '[{"name": "lint", "bucket": "fail"}, {"name": "slow", "bucket": "pending"}]')" || rc=$?
expect "a failure ends the watch while another check is pending" "CI failed: lint" "$out"
expect "a failure names what is still running" "still running: slow" "$out"
[ "$(calls)" = 1 ] && echo "ok   failed fast after one poll" || { echo "FAIL polled $(calls) times, want 1"; fail=1; }
exits "fail fast" "$rc" 1

rc=0; out="$(run '[{"name": "lint", "bucket": "pass"}, {"name": "Cursor Bugbot Autofix", "bucket": "pending"}]')" || rc=$?
expect "an in-progress Bugbot Autofix doesn't hold the watch" "CI passed" "$out"
[ "$(calls)" = 1 ] && echo "ok   passed after one poll" || { echo "FAIL polled $(calls) times, want 1"; fail=1; }
exits "autofix pending" "$rc" 0

nochecks="no checks reported on the 'fixture' branch"
rc=0; out="$(run '' CHECKS_ERR="$nochecks")" || rc=$?
expect "no checks reports CI passed (no checks)" "CI passed (no checks)" "$out"
exits "no checks" "$rc" 0

rc=0; out="$(run '' CHECKS_ERR="HTTP 502: Bad Gateway")" || rc=$?
expect "checks query error shows gh's error" "CI unreadable (gh pr checks exited 1): HTTP 502: Bad Gateway" "$out"
expect_not "checks query error isn't reported as passed" "CI passed" "$out"
exits "checks query error" "$rc" 2

rc=0; out="$(cd "$tmp/repo" && PATH="$tmp/bin:$PATH" CALLS_FILE="$tmp/calls" "$JTEAM" findings 7 2>&1)" || rc=$?
expect "findings lists a review after the head commit" "review by cursor[bot] COMMENTED: New finding https://x/new" "$out"
expect_not "findings doesn't report CI" "CI " "$out"
exits "findings" "$rc" 0

for endpoint in pulls/7/reviews pulls/7/comments issues/7/comments; do
  rc=0; out="$(run '[{"name": "test", "bucket": "pass"}]' FAILING_ENDPOINT="repos/{owner}/{repo}/$endpoint")" || rc=$?
  expect "failed $endpoint query shows gh's error" "HTTP 502: Bad Gateway (repos/{owner}/{repo}/$endpoint)" "$out"
  expect "failed $endpoint query is named" "Findings unreadable: $endpoint" "$out"
  exits "failed $endpoint query" "$rc" 2
done

exit "$fail"
