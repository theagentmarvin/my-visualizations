# Project Templates

Ready-to-use starter templates for common development patterns.

## Available Templates

### 1. bim-viewer-template
**Purpose**: IFC viewer with That Open Components  
**Stack**: React + Vite + That Open Components + Three.js  
**Features**:
- IFC file drag-and-drop loading
- 3D viewer with OrbitControls
- Property panel on element selection
- Basic measurement tools
- Responsive layout

**Use when**: Building BIM viewers, IFC inspection tools

---

### 2. speckle-viewer-template
**Purpose**: Speckle data visualization  
**Stack**: React + Vite + Speckle Viewer API + Three.js  
**Features**:
- Stream URL input
- Object loading and display
- Property inspection
- Material and color management
- Real-time updates (WebSocket ready)

**Use when**: Integrating Speckle data, collaboration tools

---

### 3. chart-dashboard-template
**Purpose**: Data visualization dashboard  
**Stack**: React + Vite + Chart.js + Tailwind CSS  
**Features**:
- Multiple chart types (line, bar, pie, etc.)
- Responsive grid layout
- Interactive controls
- Export functionality
- Dark mode ready

**Use when**: Creating analytics dashboards, KPI reports

---

### 4. 3d-app-template
**Purpose**: Custom Three.js web application  
**Stack**: React + Vite + Three.js + Tailwind CSS  
**Features**:
- Three.js canvas with OrbitControls
- Raycasting for object selection
- UI overlay with React components
- Camera controls and settings
- Screenshot/export functionality

**Use when**: Building custom 3D visualizations, interactive experiences

---

### 5. fullstack-template
**Purpose**: Complete fullstack application  
**Stack**: React + Vite + Express + Prisma + Postgres + Docker  
**Features**:
- Frontend with React Router
- REST API with Express
- Database with Prisma ORM
- Authentication setup
- Docker Compose configuration
- GitHub Actions CI/CD

**Use when**: Building complete web applications with backend

---

## Template Structure

Each template follows this structure:

```
template-name/
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── index.html            # Entry HTML
├── README.md             # Setup and usage instructions
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main component
│   ├── components/       # Reusable components
│   └── utils/            # Helper functions
└── public/               # Static assets
```

Fullstack template adds:
```
├── server/
│   ├── index.js          # Express server
│   ├── routes/           # API routes
│   └── prisma/           # Database schema
├── docker-compose.yml    # Container orchestration
└── .github/workflows/    # CI/CD pipelines
```

---

## Using Templates

### Option 1: Copy Template
```bash
cp -r templates/bim-viewer-template viz-deploy/projects/my-project
cd viz-deploy/projects/my-project
npm install
npm run dev
```

### Option 2: Automated Script
```bash
bash templates/create-project.sh bim-viewer my-project-name
```

---

## Customization Guidelines

### 1. Update package.json
- Change `name` field
- Update `description`
- Modify `repository` URL

### 2. Configure Vite
- Set `base` for GitHub Pages deployment:
  ```javascript
  export default defineConfig({
    base: '/my-visualizations/projects/my-project/',
    // ...
  });
  ```

### 3. Update README.md
- Project-specific setup instructions
- Feature documentation
- Usage examples

### 4. Add to Main Index
Update `viz-deploy/index.html` to link to your new project:
```html
<a href="/projects/my-project/">My Project</a>
```

---

## Template Maintenance

Templates are maintained by the Coder agent and updated based on:
- New library versions
- Best practice evolution
- Common patterns discovered in projects
- User feedback

**Last Updated**: 2026-02-16
