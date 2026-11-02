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
  "repo view") echo fixture/repo;;
  "pr view") n="$3"; eval "echo \${PR_$n:-}";;
  "pr list") echo '[]';;
esac
EOF
printf '#!/usr/bin/env bash\necho "[]"\n' >"$tmp/bin/opencode"
chmod +x "$tmp/bin/gh" "$tmp/bin/opencode"

cat >"$tmp/board.md" <<'EOF'
| Stream | Ticket | Branch | Session | PR | State |
|---|---|---|---|---|---|
| Stacked stream | none | `jw/a` | none | #1 → #2 → #3 | Working |
| Single stream | none | `jw/b` | none | #4 | Working |
EOF

fail=0
check() {
  local want="$1" pr1="$2" pr2="$3" pr3="$4" out got
  out="$(cd "$tmp/repo" && PATH="$tmp/bin:$PATH" OPENCODE_BIN="$tmp/bin/opencode" PR_1="$pr1" PR_2="$pr2" PR_3="$pr3" PR_4=OPEN \
    "$JTEAM" status "$tmp/board.md" 2>&1)"
  if grep -q '^ *Stacked stream' <<<"$out"; then got=stale; else got=fresh; fi
  if [ "$got" = "$want" ]; then echo "ok   $pr1 $pr2 $pr3 -> $got"; else echo "FAIL $pr1 $pr2 $pr3 -> $got, want $want"; fail=1; fi
}

check fresh OPEN OPEN OPEN
check fresh MERGED OPEN OPEN
check fresh MERGED MERGED OPEN
check fresh MERGED CLOSED ""
check stale MERGED MERGED MERGED
check stale MERGED CLOSED MERGED

single="$(cd "$tmp/repo" && PATH="$tmp/bin:$PATH" OPENCODE_BIN="$tmp/bin/opencode" PR_1=OPEN PR_2=OPEN PR_3=OPEN PR_4=MERGED \
  "$JTEAM" status "$tmp/board.md" 2>&1)"
if grep -q '^ *Single stream.*#4 is MERGED' <<<"$single"; then echo "ok   single merged PR -> stale"; else echo "FAIL single merged PR not stale"; fail=1; fi

exit "$fail"
