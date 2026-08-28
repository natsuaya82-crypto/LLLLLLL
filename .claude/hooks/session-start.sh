#!/bin/bash
# Every session starts from a fresh clone, so everything a session is supposed
# to do FIRST has to happen here, or it happens never.
#
# Three of them, and the third is the one this file exists for.
#
#   1  install the commit hook. tools/pre-commit has been in the repo for a
#      long time and was installed in nobody's clone: core.hooksPath is a
#      LOCAL git setting, so it does not travel, and a session that never runs
#      `git config core.hooksPath tools` never runs the fast checks at all.
#
#   2  npm install, best effort. The checks fall back to a globally installed
#      playwright, so this failing is not fatal -- but a local one is what the
#      repo actually declares.
#
#   3  say who else is in the tree. docs/SESSIONS.md rule 4 says to run
#      `git log --oneline --all -- <file>` before touching a file, and a rule
#      somebody has to remember is a rule that gets skipped -- this session's
#      own leader skipped rule 3's `git fetch` and worked 208 commits behind
#      for half a day. So the fetch happens here and the answer is printed
#      before anybody has typed anything.
#
# Idempotent and non-interactive. Nothing here fails the session: a session
# that cannot fetch is a session working offline, which is worse but not
# broken, and it needs to be TOLD that rather than stopped.

set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}" || exit 0

# ---- 1. the commit hook, which does not travel with a clone ---------------
git config core.hooksPath tools 2>/dev/null \
  && echo "hooks: core.hooksPath=tools — tools/pre-commit runs on every commit" \
  || echo "hooks: could not set core.hooksPath; run 'git config core.hooksPath tools'"

# ---- 2. dependencies, best effort -----------------------------------------
if [ ! -d node_modules ]; then
  echo "npm: installing (playwright, capacitor)…"
  if npm install --no-audit --no-fund >/dev/null 2>&1; then
    echo "npm: ok"
  else
    echo "npm: install failed — the checks fall back to a global playwright, so this is survivable. 'npm test' will say if it is not."
  fi
else
  echo "npm: node_modules already here"
fi

# ---- 3. who else is in the tree -------------------------------------------
if git fetch --all --prune --quiet 2>/dev/null; then
  echo ""
  echo "master: $(git log --oneline -1 origin/master 2>/dev/null || echo unknown)"

  ahead=""
  for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin \
             | grep -v '^origin/master$' | grep -v '^origin/HEAD'); do
    n=$(git rev-list --count origin/master.."$b" 2>/dev/null || echo 0)
    [ "$n" -gt 0 ] && ahead="$ahead  $b (+$n)"
  done
  if [ -n "$ahead" ]; then
    echo "branches ahead of master:$ahead"
    echo "  ^ another session's work. Never merge, rebase or cherry-pick it — docs/SESSIONS.md rule 6."
  else
    echo "branches ahead of master: none"
  fi

  # www/index.html is the named hazard: every screen's CSS is in one file.
  hz=""
  for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin \
             | grep -v '^origin/master$' | grep -v '^origin/HEAD'); do
    n=$(git rev-list --count origin/master.."$b" -- www/index.html 2>/dev/null || echo 0)
    [ "$n" -gt 0 ] && hz="$hz $b"
  done
  if [ -n "$hz" ]; then
    echo "www/index.html is being changed on:$hz"
    echo "  ^ one session at a time owns that file. If it is not yours, stop and report."
  fi
else
  echo "git: could not fetch. You may be looking at a stale master — check before deciding anything is missing."
fi

echo ""
echo "read first: docs/STATE.md, then CLAUDE.md, then docs/SESSIONS.md."
echo "the gate is 'npm test' and it is the SUB-LEADER's, once, after integrating — not a session's."
echo "the sub-leader integrates AND runs the gate. the leader dispatches and triggers the build,"
echo "and writes no feature code. (OWNER 2026-08-28)"
exit 0
