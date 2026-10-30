#!/usr/bin/env bash
# Quick Deploy Script for Visualizations — with quality gates (2026-10-30)
# Usage: ./deploy.sh <project-name> [github|local]
# Gates: git identity -> HTML validation -> commit/push -> live-URL poll.
set -uo pipefail

REPO="/home/marvin/.openclaw/workspace/viz-deploy"
BASE_URL="https://theagentmarvin.github.io/my-visualizations"
PROJECT="${1:-}"
METHOD="${2:-github}"

if [ -z "$PROJECT" ]; then
    echo "Usage: ./deploy.sh <project-name> [github|local]"
    exit 1
fi
cd "$REPO" || exit 1
PROJECT_DIR="projects/$PROJECT"
[ -d "$PROJECT_DIR" ] || { echo "❌ Project directory $PROJECT_DIR not found!"; exit 1; }

# --- Gate 1: git identity (repo-local, never global) ---
git config user.name  >/dev/null 2>&1 || git config user.name  "Marvin (Butler)"
git config user.email >/dev/null 2>&1 || git config user.email "butler@openclaw.local"

# --- Gate 2: HTML well-formedness (tag balance + non-empty) ---
echo "🔍 Validating HTML..."
FAIL=0
for f in "$PROJECT_DIR"/*.html; do
    [ -e "$f" ] || continue
    if ! python3 - "$f" <<'PY'
import sys
from html.parser import HTMLParser
VOID = {"meta","link","br","hr","img","input","source","track","wbr",
        "area","base","col","embed","param"}
class Checker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack=[]; self.errors=[]
    def handle_starttag(self,tag,attrs):
        if tag not in VOID: self.stack.append(tag)
    def handle_endtag(self,tag):
        if tag in VOID: return
        if self.stack and self.stack[-1]==tag:
            self.stack.pop()
        elif tag in self.stack:
            # pop until match (tolerates minor nesting slips)
            while self.stack and self.stack[-1]!=tag:
                self.errors.append(f"unclosed <{self.stack.pop()}>")
            self.stack.pop()
        else:
            self.errors.append(f"stray </{tag}>")
src=open(sys.argv[1]).read()
if len(src.strip())<50:
    print("ERROR: file is empty/trivial"); sys.exit(1)
c=Checker(); c.feed(src)
leftover=[t for t in c.stack if t not in ("html","body")]
if c.errors or leftover:
    print("ERRORS:", (c.errors+leftover)[:8]); sys.exit(1)
print(f"OK: {sys.argv[1]} ({len(src)} bytes)")
PY
    then
        FAIL=1
    fi
done
[ "$FAIL" -eq 0 ] || { echo "❌ Validation failed — not deploying. Fix the HTML and re-run."; exit 1; }

case $METHOD in
github)
    # --- Gate 3: commit + push (idempotent) ---
    echo "📦 Deploying to GitHub Pages..."
    rm -f "$PROJECT_DIR/.wtest"
    git add "$PROJECT_DIR"
    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit."
    else
        git commit -m "Deploy visualization: $PROJECT" && git push 2>&1 | tail -3
    fi

    # --- Gate 4: live-URL poll (Pages build lag) ---
    URL="$BASE_URL/$PROJECT_DIR/"
    echo "⏳ Verifying $URL"
    CODE=000
    for i in $(seq 1 8); do
        CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL" || echo 000)
        [ "$CODE" = "200" ] && { echo "✅ Live: $URL"; exit 0; }
        sleep 20
    done
    echo "❌ Not live after 160s (last HTTP $CODE): $URL"
    exit 1
    ;;
local)
    echo "🌐 Serving locally at http://localhost:8000/$PROJECT_DIR/ ..."
    python3 -m http.server 8000 -d "$REPO"
    ;;
*)
    echo "Unknown method: $METHOD (use github|local)"
    exit 1
    ;;
esac
