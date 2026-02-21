# Fragment Viewer + Properties

A single-page web application that displays 3D fragment (BIM) models with an interactive properties table. The viewer automatically loads models on page open - no "Load" button required.

## Features

- **Auto-load**: Fragment models load automatically when the page opens
- **3D Viewer**: Top half of the viewport displays the 3D model
- **Properties Table**: Bottom half shows element properties when clicked
- **Debounced Selection**: 150ms debounce prevents selection floods
- **Responsive**: Works on desktop and mobile devices
- **Proper API Usage**: Uses @thatopen/components Raycasters and @thatopen/components-front Highlighter (not raw three.js raycast)

## Quick Start

```bash
# Navigate to project
cd projects/fragment-viewer-properties

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Testing

### Manual Testing

To verify pick/highlight functionality:

1. **Page Load Test**:
   - Open the application in your browser
   - Open browser DevTools (F12)
   - Check the Console tab
   - Verify you see: `[FragmentViewer] Initialized` and `[FragmentViewer] All models loaded!`

2. **Pick Selection Test**:
   - Wait for models to fully load (loading indicator disappears)
   - Click on any visible 3D element in the viewer
   - Expected behavior:
     - The element is highlighted in cyan (light blue)
     - The properties table updates with element data
     - Console shows: `[FragmentViewer] Selection: modelId=..., localId=...`
   - Click on empty space (away from any model)
   - Expected behavior:
     - Previous selection highlight is cleared
     - Properties table shows empty state

3. **Debounce Test**:
   - Rapidly click multiple times on different elements
   - Expected behavior: Only the last clicked element is selected (150ms debounce)

4. **Fallback Test** (optional):
   - Temporarily disable the Raycasters API in viewer.ts
   - Verify the fallback raycast still works (check console for fallback messages)

### Automated Smoke Test

Run the automated smoke test (requires browser environment):

```bash
# In one terminal, start the dev server
npm run dev

# In browser, navigate to:
http://localhost:3000?test=true

# Check browser console for test results
```

The smoke test verifies:
- ✅ Page loads without errors
- ✅ Fragment models are loaded successfully  
- ✅ Pick API returns valid results (or null for empty space)

### Build Verification

```bash
# Build for production
npm run build

# Verify dist/ folder is created and contains:
# - index.html
# - assets/ folder with compiled JS/CSS
```

## Changing Fragment URLs

Edit `src/config.ts` to use your own fragment models:

```typescript
export const CONFIG = {
  FRAGMENT_URLS: [
    // Replace with your own .frag files
    "https://your-domain.com/models/model1.frag",
    "https://your-domain.com/models/model2.frag",
  ],
  // ... other settings
};
```

### Where to get .frag files

- **Export from BIM software**: Use That Open Engine tools to convert IFC files
- **Sample models**: The default URLs use That Open Engine sample models
- **Local files**: Place .frag files in the `public/` folder and reference them with relative paths like `/model.frag`

## Project Structure

```
src/
├── config.ts        # Configuration (URLs, viewer settings)
├── main.ts          # Entry point, initializes viewer and UI
├── viewer.ts        # 3D viewer logic (OBC pick + highlighter API)
├── ui.ts            # Properties table UI management
└── test/
    └── smoke.ts     # Automated smoke tests

index.html           # HTML entry point
styles.css           # Application styles
package.json         # Dependencies
vite.config.ts       # Vite build configuration
```

### Key Implementation Details

**Selection/Pick Implementation** (`src/viewer.ts`):

The viewer uses the correct That Open Components APIs:

1. **Primary Method**: `@thatopen/components` Raycasters
   ```typescript
   const casters = components.get(OBC.Raycasters);
   const raycaster = casters.get(world);
   const result = await raycaster.castRay();
   ```

2. **Highlighting**: `@thatopen/components-front` Highlighter
   ```typescript
   const highlighter = components.get(OBCF.Highlighter);
   const modelIdMap = { [result.fragments.modelId]: new Set([result.localId]) };
   await highlighter.highlight("selection", modelIdMap);
   ```

3. **Defensive Fallback**: Filtered three.js raycast (emergency only)
   - Wrapped in try/catch
   - Only includes meshes with `geometry.attributes.position`
   - Logs warnings to console

**Reference**: See `projects/ifc-test-1/src/main.ts` for the canonical implementation pattern.

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Dependencies

- [Three.js](https://threejs.org/) - 3D rendering
- [@thatopen/components](https://github.com/ThatOpen/engine_components) - BIM/fragment loading, Raycasters
- [@thatopen/fragments](https://github.com/ThatOpen/engine_fragment) - Fragment management
- [@thatopen/components-front](https://github.com/ThatOpen/engine_components-front) - Highlighter
- [@thatopen/ui](https://github.com/ThatOpen/engine_ui) - UI components

## Live Demo

https://theagentmarvin.github.io/my-visualizations/projects/fragment-viewer-properties/

## License

MIT
