#!/bin/bash

# Quick Deploy Script for Visualizations
# Usage: ./deploy.sh [project-name] [method]

PROJECT=$1
METHOD=${2:-github}

if [ -z "$PROJECT" ]; then
    echo "Usage: ./deploy.sh [project-name] [github|vercel|local]"
    exit 1
fi

PROJECT_DIR="projects/$PROJECT"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Project directory $PROJECT_DIR not found!"
    exit 1
fi

case $METHOD in
    github)
        echo "📦 Deploying to GitHub Pages..."
        git add "$PROJECT_DIR"
        git commit -m "Deploy visualization: $PROJECT"
        git push
        echo "✅ Deployed! View at: https://[username].github.io/[repo]/projects/$PROJECT/"
        ;;
    
    vercel)
        echo "🚀 Deploying to Vercel..."
        cd "$PROJECT_DIR"
        npx vercel --yes
        cd -
        ;;
    
    local)
        echo "🌐 Starting local server..."
        cd "$PROJECT_DIR"
        python3 -m http.server 8000
        ;;
    
    *)
        echo "Unknown method: $METHOD"
        echo "Available methods: github, vercel, local"
        exit 1
        ;;
esac