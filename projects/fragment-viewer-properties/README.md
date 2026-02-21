# Fragment Viewer + Properties

A single-page web application that displays 3D fragment (BIM) models with an interactive properties table. The viewer automatically loads models on page open - no "Load" button required.

## Features

- **Auto-load**: Fragment models load automatically when the page opens
- **3D Viewer**: Top half of the viewport displays the 3D model
- **Properties Table**: Bottom half shows element properties when clicked
- **Debounced Selection**: 150ms debounce prevents selection floods
- **Responsive**: Works on desktop and mobile devices

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
├── config.ts      # Configuration (URLs, viewer settings)
├── main.ts        # Entry point, initializes viewer and UI
├── viewer.ts      # 3D viewer logic (Three.js + That Open Components)
└── ui.ts          # Properties table UI management

index.html         # HTML entry point
styles.css         # Application styles
package.json       # Dependencies
vite.config.ts     # Vite build configuration
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Dependencies

- [Three.js](https://threejs.org/) - 3D rendering
- [@thatopen/components](https://github.com/ThatOpen/engine_components) - BIM/fragment loading
- [@thatopen/fragments](https://github.com/ThatOpen/engine_fragment) - Fragment management
- [@thatopen/ui](https://github.com/ThatOpen/engine_ui) - UI components

## Live Demo

https://theagentmarvin.github.io/my-visualizations/projects/fragment-viewer-properties/

## License

MIT
