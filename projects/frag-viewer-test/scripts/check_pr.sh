#!/bin/bash
# PR Check Script for frag-viewer-test
# Runs type checking and build verification

set -e

echo "🔍 Running PR checks for frag-viewer-test..."

# Navigate to project directory
cd "$(dirname "$0")/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Type check
echo "🔷 Running TypeScript type check..."
npm run typecheck

# Build
echo "🔨 Building project..."
npm run build

echo "✅ All checks passed!"
