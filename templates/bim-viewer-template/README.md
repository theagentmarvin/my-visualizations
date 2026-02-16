# BIM Viewer Template

IFC file viewer powered by That Open Components and Three.js.

## Features

- 🏗️ IFC file loading (drag-and-drop or file picker)
- 🎯 3D navigation with OrbitControls
- 🔍 Element selection and property inspection
- 📏 Basic measurement tools
- 📱 Responsive layout

## Tech Stack

- **React** - UI framework
- **That Open Components** - BIM functionality
- **Three.js** - 3D rendering
- **Vite** - Build tool

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Usage

1. Click "Load IFC" or drag IFC file onto viewer
2. Navigate with mouse (orbit, pan, zoom)
3. Click elements to view properties
4. Use toolbar for measurements

## Project Structure

```
src/
├── App.jsx              # Main application
├── components/
│   ├── Viewer.jsx       # 3D viewer component
│   ├── PropertyPanel.jsx # Property display
│   └── Toolbar.jsx      # Tool controls
└── utils/
    ├── ifcLoader.js     # IFC loading logic
    └── selection.js     # Object selection
```

## Customization

### Add Custom Tools

Edit `src/components/Toolbar.jsx`:

```javascript
const tools = [
  { id: 'measure', icon: '📏', label: 'Measure' },
  { id: 'section', icon: '✂️', label: 'Section' },
  // Add your tool here
];
```

### Style the Interface

Edit `src/App.css` or use Tailwind classes.

### Extend IFC Parsing

Edit `src/utils/ifcLoader.js` to extract additional properties.

## Deployment

### GitHub Pages

1. Update `vite.config.js` with your base path
2. Build: `npm run build`
3. Deploy `dist/` folder to gh-pages branch

### Vercel/Netlify

Connect repository and auto-deploy on push.

## Troubleshooting

**IFC file not loading:**
- Check file is valid IFC (2x3 or 4)
- Verify CORS if loading from URL
- Check browser console for errors

**Poor performance:**
- Large IFC files may lag on first load
- Enable fragment optimization
- Use Web Workers (see That Open docs)

**Properties not showing:**
- Ensure IFC has embedded properties
- Check property extraction in ifcLoader.js

## Resources

- [That Open Docs](https://docs.thatopen.com/)
- [Three.js Manual](https://threejs.org/manual/)
- [IFC.js Community](https://discord.gg/FXfyR4XrKT)

## License

MIT
