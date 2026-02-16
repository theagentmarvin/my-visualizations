# BIM Mobile Viewer

A mobile-optimized BIM (Building Information Modeling) viewer built with That Open Components and Three.js. Features a split-screen layout with a 3D model viewer on top and a category table below.

![BIM Mobile Viewer](https://img.shields.io/badge/BIM-Viewer-blue)
![That Open](https://img.shields.io/badge/That%20Open-Components-green)
![Three.js](https://img.shields.io/badge/Three.js-r175-orange)

## 🚀 Live Demo

**[View Live Demo](https://theagentmarvin.github.io/my-visualizations/projects/bim-mobile-viewer/)**

## 📱 Features

### 3D Viewer (Top 60%)
- **Touch Navigation**: One-finger rotate, two-finger pan, pinch-to-zoom
- **Auto-fit**: Camera automatically fits to model on load
- **Navigation Controls**: Reset view, zoom in/out, preset views (top, front, isometric)
- **Double-tap**: Quick fit to scene
- **Optimized**: High-performance rendering for mobile devices

### Category Table (Bottom 40%)
- **Element Categories**: Lists all IFC element types (Walls, Slabs, Columns, etc.)
- **Element Counts**: Shows number of elements per category
- **Search/Filter**: Real-time search to find specific categories
- **Sorted**: Categories sorted by count (descending)
- **Touch-friendly**: Easy to scroll and interact on mobile

### Mobile Optimizations
- Responsive split-screen layout
- Touch-optimized controls (44px minimum touch targets)
- Smooth scrolling with `-webkit-overflow-scrolling: touch`
- Landscape mode support (switches to side-by-side layout)
- Loading indicator while model loads
- Viewport meta tag for proper mobile rendering

## 🏗️ Model

The viewer loads the **School Building** model from That Open's demo resources:

- **Architecture**: `school_arq.frag` - Architectural elements
- **Structure**: `school_str.frag` - Structural elements

## 🛠️ Tech Stack

- **@thatopen/components** ^2.4.0 - BIM component library
- **@thatopen/components-front** ^2.4.0 - UI components
- **@thatopen/ui** ^2.4.0 - UI toolkit
- **three** ^0.175.0 - 3D rendering engine
- **web-ifc** 0.0.68 - IFC parsing
- **vite** ^5.0.0 - Build tool

## 📦 Installation

```bash
# Clone or navigate to the project
cd bim-mobile-viewer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 Development

```bash
# Run local development server
npm run dev

# The app will be available at http://localhost:3000
```

## 📤 Deployment

The app is configured for GitHub Pages deployment:

```bash
# Build the project
npm run build

# The dist/ folder will contain the deployable files
# Commit and push to trigger GitHub Pages deployment
```

**Live URL**: `https://theagentmarvin.github.io/my-visualizations/projects/bim-mobile-viewer/`

## 📁 Project Structure

```
bim-mobile-viewer/
├── index.html              # Main HTML entry
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── README.md               # This file
├── src/
│   ├── main.js             # Main application logic
│   └── styles.css          # Styles (mobile-optimized)
└── dist/                   # Build output
```

## 🎯 Usage

### On Mobile
1. Open the live demo URL on your mobile device
2. Wait for the model to load (loading spinner will disappear)
3. **Navigate the 3D view**:
   - One finger drag: Rotate camera
   - Two finger drag: Pan camera
   - Pinch: Zoom in/out
   - Double-tap: Fit camera to model
4. **Use the control buttons** in the bottom-right of the viewer
5. **Scroll the category table** to see all element types
6. **Search categories** using the search box at the top of the table

### On Desktop
- Left-click drag: Rotate
- Right-click drag: Pan
- Scroll: Zoom
- Same control buttons available

## 🧪 Browser Support

- ✅ Chrome (desktop & mobile)
- ✅ Safari (iOS & macOS)
- ✅ Firefox
- ✅ Edge

## 🐛 Known Issues

- Category extraction depends on model properties availability
- Very large models may take time to load on slower connections
- Some touch gestures may conflict with browser defaults on certain devices

## 🔮 Future Enhancements

- [ ] Click category to highlight/isolate elements in 3D
- [ ] Element selection on tap
- [ ] Property panel for selected elements
- [ ] Dark mode toggle
- [ ] Export category list as CSV
- [ ] Multiple model support with file picker

## 📚 References

- [That Open Documentation](https://docs.thatopen.com/)
- [That Open Components GitHub](https://github.com/ThatOpen/engine_components)
- [Three.js Documentation](https://threejs.org/docs/)
- [ItemsFinder Tutorial](https://docs.thatopen.com/Tutorials/Components/Core/ItemsFinder)

## 📝 License

MIT License - Feel free to use and modify for your own projects.

---

Built with ❤️ using [That Open Components](https://thatopen.com/)