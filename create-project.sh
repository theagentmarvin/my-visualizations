#!/bin/bash
# create-project.sh
# Quickly scaffold a new project from templates

set -e

TEMPLATES_DIR="$(dirname "$0")/templates"
PROJECTS_DIR="$(dirname "$0")/projects"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Project Scaffolder${NC}"
echo ""

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: bash create-project.sh <template-name> <project-name>"
    echo ""
    echo "Available templates:"
    ls -1 "$TEMPLATES_DIR" | grep -v README.md | sed 's/^/  - /'
    exit 1
fi

TEMPLATE=$1
PROJECT=$2
TEMPLATE_PATH="$TEMPLATES_DIR/$TEMPLATE"
PROJECT_PATH="$PROJECTS_DIR/$PROJECT"

# Validate template exists
if [ ! -d "$TEMPLATE_PATH" ]; then
    echo -e "${RED}❌ Template '$TEMPLATE' not found${NC}"
    echo ""
    echo "Available templates:"
    ls -1 "$TEMPLATES_DIR" | grep -v README.md | sed 's/^/  - /'
    exit 1
fi

# Check if project already exists
if [ -d "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Project '$PROJECT' already exists${NC}"
    exit 1
fi

echo -e "Creating project: ${GREEN}$PROJECT${NC}"
echo -e "From template: ${GREEN}$TEMPLATE${NC}"
echo ""

# Copy template
cp -r "$TEMPLATE_PATH" "$PROJECT_PATH"
cd "$PROJECT_PATH"

# Update package.json name
if [ -f "package.json" ]; then
    sed -i "s/\"name\": \".*\"/\"name\": \"$PROJECT\"/" package.json
    echo "✓ Updated package.json"
fi

# Update vite.config.js base path
if [ -f "vite.config.js" ]; then
    sed -i "s|base: '/.*'|base: '/my-visualizations/projects/$PROJECT/'|" vite.config.js
    echo "✓ Updated vite.config.js"
fi

echo ""
echo -e "${GREEN}✅ Project created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_PATH"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "To deploy:"
echo "  npm run build"
echo "  # Commit and push to trigger GitHub Pages deployment"
