# 📊 Visualization Deployment Instructions for Coder

You have access to a GitHub Pages deployment system for data visualizations.

## Quick Reference

- **Workspace**: `/home/marvin/.openclaw/workspace/viz-deploy/`
- **Live Base URL**: `https://theagentmarvin.github.io/my-visualizations/`
- **Deploy Command**: `./deploy.sh PROJECT-NAME github`

## Your Workflow

### 1. Create Visualization
```bash
cd /home/marvin/.openclaw/workspace/viz-deploy

# Option A: Start from template
cp templates/chart-js.html projects/PROJECT-NAME/index.html

# Option B: Create from scratch
mkdir -p projects/PROJECT-NAME
# Create your index.html with visualization
```

### 2. Test Locally
```bash
./deploy.sh PROJECT-NAME local
# Opens at http://localhost:8000
# Ctrl+C to stop
```

### 3. Deploy to GitHub Pages
```bash
./deploy.sh PROJECT-NAME github
```

### 4. Return the Live URL
```
Live at: https://theagentmarvin.github.io/my-visualizations/projects/PROJECT-NAME/
```

## Available Libraries (CDN)

All templates include these via CDN:

- **Chart.js**: Simple, beautiful charts
- **Plotly**: Interactive, scientific plots  
- **D3.js**: Custom, complex visualizations

## Project Structure
```
viz-deploy/
├── templates/
│   ├── chart-js.html    # Line, bar, pie charts
│   └── plotly.html      # Interactive plots
├── projects/
│   ├── sample-dashboard/  # Example to reference
│   └── YOUR-PROJECT/     # Your new visualizations
└── deploy.sh            # Deployment script
```

## Best Practices

1. **Responsive Design**: Use relative units, test mobile view
2. **Clear Titles**: Every chart needs context
3. **Fast Loading**: Keep data reasonable, use CDNs
4. **Self-Contained**: Each project in one folder
5. **URL-Friendly Names**: `sales-2024` not `Sales Report 2024!`

## Example: Quick Sales Chart

```html
<!DOCTYPE html>
<html>
<head>
    <title>Q1 Sales Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 40px auto;
            padding: 20px;
        }
        .chart-container { 
            position: relative; 
            height: 400px; 
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <h1>Q1 2024 Sales Performance</h1>
    <div class="chart-container">
        <canvas id="salesChart"></canvas>
    </div>
    
    <script>
        new Chart(document.getElementById('salesChart'), {
            type: 'bar',
            data: {
                labels: ['January', 'February', 'March'],
                datasets: [{
                    label: 'Sales ($)',
                    data: [45000, 52000, 58000],
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
```

Save as `projects/q1-sales/index.html`, then `./deploy.sh q1-sales github`

## When Spawned by Butler

The butler will give you specific requirements like:
- "Create a dashboard showing X, Y, Z metrics"
- "Make an interactive comparison chart"
- "Build a KPI report with gauges"

Always:
1. Create the visualization in a new project folder
2. Deploy it
3. Return the live URL in your response

The deployment takes 1-2 minutes to go live on GitHub Pages.

---

## ⚠️ CRITICAL: That Open Components Pick/Highlighter API Usage

**Always use @thatopen/components pick/highlighter APIs for selection in fragment projects; do not use raw three.js raycast against fragment scene.**

### Why This Matters

Fragment models use instanced geometry and specialized rendering pipelines that raw three.js raycasting cannot properly interpret. Using `THREE.Raycaster` directly against fragment meshes produces inconsistent results, misses instanced elements, and bypasses the engine's optimization systems. The `@thatopen/components` Raycasters API and `@thatopen/components-front` Highlighter are specifically designed to handle fragment-specific geometry types, instance IDs, and model hierarchies correctly.

### Required Pattern

When implementing selection/picking in any fragment-based project:

1. **Use the Raycasters component** from `@thatopen/components`:
   ```typescript
   const casters = components.get(OBC.Raycasters);
   const raycaster = casters.get(world);
   const result = await raycaster.castRay(); // Returns fragment-aware result
   ```

2. **Use the Highlighter component** from `@thatopen/components-front`:
   ```typescript
   const highlighter = components.get(OBCF.Highlighter);
   await highlighter.setup({ world });
   
   // Highlight with model context
   const modelIdMap = { [result.fragments.modelId]: new Set([result.localId]) };
   await highlighter.highlight("selection", modelIdMap);
   ```

3. **Reference implementation**: See `projects/ifc-test-1/src/main.ts` for the canonical usage pattern.

### Defensive Fallback

If the engine pick API must be bypassed (emergency only), wrap raw raycasting in try/catch and filter meshes to only those with `geometry.attributes.position` defined. See `projects/fragment-viewer-properties/src/viewer.ts` for the fallbackRaycast() implementation.

### Checklist for Fragment Projects

- [ ] Selection uses `OBC.Raycasters` API, not `THREE.Raycaster` directly
- [ ] Highlighting uses `OBCF.Highlighter`, not manual material manipulation
- [ ] Comments reference `projects/ifc-test-1/src/main.ts` as the canonical example
- [ ] Defensive fallback is wrapped in try/catch with proper error logging
