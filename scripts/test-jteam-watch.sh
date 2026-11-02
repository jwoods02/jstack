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
  "pr checks") [ "$4" = --watch ] && exit 0; echo "$CHECKS";;
  "pr view") echo '{"number": 7, "title": "Fixture PR", "headRefOid": "abcdef1234567890",
    "commits": [{"committedDate": "2026-11-01T09:00:00Z"}, {"committedDate": "2026-11-02T12:00:00Z"}]}';;
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
run() { (cd "$tmp/repo" && PATH="$tmp/bin:$PATH" CHECKS="$1" "$JTEAM" watch 7 2>&1); }
expect() {
  if grep -qF -- "$2" <<<"$3"; then echo "ok   $1"; else echo "FAIL $1: no '$2' in:"; sed 's/^/     /' <<<"$3"; fail=1; fi
}
expect_not() {
  if grep -qF -- "$2" <<<"$3"; then echo "FAIL $1: '$2' in:"; sed 's/^/     /' <<<"$3"; fail=1; else echo "ok   $1"; fi
}

rc=0; out="$(run '[{"name": "lint", "bucket": "pass"}, {"name": "Cursor Bugbot", "bucket": "pass"}]')" || rc=$?
expect "pass case reports CI passed" "CI passed" "$out"
expect "report names the PR and head" "#7 Fixture PR (head abcdef1)" "$out"
if [ "$rc" = 0 ]; then echo "ok   pass case exits 0"; else echo "FAIL pass case exits $rc"; fail=1; fi
expect "review after the head commit is shown" "review by cursor[bot] COMMENTED: New finding https://x/new" "$out"
expect_not "review before the head commit is hidden" "Old finding" "$out"

rc=0; out="$(run '[{"name": "lint", "bucket": "fail"}, {"name": "test", "bucket": "pass"}]')" || rc=$?
expect "fail case names the failing check" "CI failed: lint" "$out"
expect_not "fail case doesn't name a passing check" "CI failed: lint, test" "$out"
if [ "$rc" = 1 ]; then echo "ok   fail case exits 1"; else echo "FAIL fail case exits $rc"; fail=1; fi

exit "$fail"
