# Quick Visualization Deployment System

This system allows you to quickly deploy single-page charts and visualizations online.

## Setup Options

### Option 1: GitHub Pages (Recommended - Free & Simple)
1. Create a GitHub repository for your visualizations
2. Enable GitHub Pages in repository settings
3. Deploy to `https://[username].github.io/[repo-name]/`

### Option 2: Vercel (Instant deploys)
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy with one command: `vercel`

### Option 3: Netlify (Drag & drop)
1. Build your visualization
2. Drag the folder to netlify.com

## Quick Start Template

```html
<!DOCTYPE html>
<html>
<head>
    <title>Data Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .chart-container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="chart-container">
        <h1>Your Chart Title</h1>
        <canvas id="myChart"></canvas>
        <div id="plotly-chart"></div>
    </div>
    <script>
        // Your visualization code here
    </script>
</body>
</html>
```

## Deployment Workflow

1. Create visualization in `viz-deploy/projects/[project-name]/index.html`
2. Test locally: `python -m http.server 8000`
3. Deploy:
   - GitHub: `git add . && git commit -m "Add viz" && git push`
   - Vercel: `cd projects/[project-name] && vercel`
   - Netlify: Drag folder to netlify.com

## Directory Structure

```
viz-deploy/
├── README.md
├── templates/
│   ├── chart-js.html
│   ├── d3.html
│   └── plotly.html
└── projects/
    ├── sample-chart/
    └── [your-projects]/
```