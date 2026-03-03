#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "[coder-skill] Running quick PR checks..."

# 1) Typescript (if tsconfig exists)
if [ -f tsconfig.json ]; then
  echo "- Running tsc --noEmit"
  npx tsc --noEmit
else
  echo "- No tsconfig.json; skipping tsc"
fi

# 2) Lint (if eslint present)
if [ -f package.json ] && npx eslint -v >/dev/null 2>&1; then
  echo "- Running eslint"
  npx eslint "projects/**/*.{ts,tsx,js,jsx}" || true
else
  echo "- ESLint not available; skipping"
fi

# 3) Smoke heuristic: check dist pages for uncaught errors
# This is a lightweight check: scan dist JS bundles for 'Uncaught' or 'console.error(' patterns
if [ -d dist ]; then
  echo "- Scanning dist for obvious runtime error patterns"
  if grep -R "Uncaught\|console.error\(" dist | sed -n '1,60p'; then
    echo "[coder-skill] Warning: potential console errors found in dist (see above)"
  else
    echo "- dist scan clean"
  fi
else
  echo "- No dist directory to scan; skipping smoke heuristic"
fi

echo "[coder-skill] PR checks complete"
