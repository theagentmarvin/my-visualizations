# GitHub Pages Setup Guide

## Quick Setup (5 minutes)

1. **Create a GitHub repository**
   ```bash
   # Initialize git in viz-deploy folder
   cd /home/marvin/.openclaw/workspace/viz-deploy
   git init
   git add .
   git commit -m "Initial visualization deployment system"
   ```

2. **Create repository on GitHub**
   - Go to https://github.com/new
   - Name it something like `my-visualizations`
   - Keep it public (required for free GitHub Pages)
   - Don't initialize with README

3. **Connect and push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/my-visualizations.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Save

5. **Your visualizations will be live at:**
   ```
   https://YOUR_USERNAME.github.io/my-visualizations/projects/PROJECT_NAME/
   ```

## Usage Workflow

1. **Create new visualization**
   ```bash
   # Copy template
   cp templates/chart-js.html projects/sales-report/index.html
   
   # Edit with your data
   nano projects/sales-report/index.html
   ```

2. **Test locally**
   ```bash
   ./deploy.sh sales-report local
   # Opens at http://localhost:8000
   ```

3. **Deploy to GitHub Pages**
   ```bash
   ./deploy.sh sales-report github
   ```

4. **Share the link**
   ```
   https://YOUR_USERNAME.github.io/my-visualizations/projects/sales-report/
   ```

## Alternative: Vercel (Even Faster)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy any project instantly**
   ```bash
   cd projects/sales-report
   vercel
   # Follow prompts, get instant URL
   ```

Benefits:
- No git required
- Instant deploys
- Custom domains available
- Preview deployments for each change