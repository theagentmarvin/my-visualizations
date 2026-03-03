#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "[coder-skill] Running architecture pattern checks..."
fail=0

# 1) Disallow direct fragments.core.load usage
echo "- Checking for fragments.core.load usage (forbidden)"
if grep -R --line-number "fragments\.core\.load" -- "projects" || true; then
  echo "ERROR: fragments.core.load found. Use FragmentsAdapter or fragments.load() with awaited result instead." >&2
  grep -R --line-number "fragments\.core\.load" -- "projects" || true
  fail=1
else
  echo "  OK"
fi

# 2) Require awaiting fragments.load(...) when present (best-effort)
echo "- Checking for fragments.load\( without await (best-effort)"
# Find lines with fragments.load( but not containing await on same line
awk '/fragments\.load\(/ {print FILENAME":"FNR":"$0}' projects/* 2>/dev/null | while IFS= read -r line; do
  if ! echo "$line" | grep -q "await"; then
    echo "WARN: fragments.load used without 'await' (or wrapped). Review: $line" >&2
    fail=1
  fi
done

# 3) Warn about manual THREE.Raycaster usage (prefer OBC.Raycasters)
echo "- Checking for raw THREE.Raycaster usage (warning)"
if grep -R --line-number "new[[:space:]]\+THREE\.Raycaster" -- "projects" || true; then
  echo "WARN: raw THREE.Raycaster usage found. Prefer components.get(OBC.Raycasters).get(world) when working with fragments." >&2
  grep -R --line-number "new[[:space:]]\+THREE\.Raycaster" -- "projects" || true
else
  echo "  OK"
fi

# 4) Ensure ResizeObserver or window.resize handler exists in viewer files (best-effort)
echo "- Checking for ResizeObserver presence in viewer implementations"
if ! grep -R --line-number "ResizeObserver\|\.resize()\|onWindowResize" -- "projects" | grep viewer.ts >/dev/null 2>&1; then
  echo "WARN: No ResizeObserver/resize call detected in viewer.ts files. Ensure renderer resize is invoked when container changes size." >&2
  # list viewer.ts files
  grep -R --line-number "viewer.ts" projects || true
else
  echo "  OK"
fi

# 5) Ensure worker init usage (best-effort)
echo "- Checking for fragments.init(workerUrl) or worker setup"
if ! grep -R --line-number "fragments\.init\(|worker\.mjs" -- "projects" >/dev/null 2>&1; then
  echo "WARN: No fragments.init(workerUrl) or worker.mjs fetch detected. Viewer may fail to load fragments in browser contexts." >&2
else
  echo "  OK"
fi

if [ "$fail" -ne 0 ]; then
  echo "[coder-skill] Architecture checks failed (see errors above)." >&2
  exit 2
fi

echo "[coder-skill] Architecture pattern checks passed (or only non-fatal warnings present)."
