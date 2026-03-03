BIM Viewer — Raycasting Selection Example

Summary
- Small example using ThatOpen components to load Fragment (.frag) models, pick elements with a raycaster, highlight selection, and show properties in a side panel.

What I changed (cleaned):
- Implemented raycasting selection via `Raycasters` and `Highlighter` components.
- Ensured selection color is applied safely to the Highlighter.
- Wired double-click selection to call the raycaster and highlight selected items.
- Updated the UI panel to display selection controls and item properties when an item is selected.
- Removed transient debug logging for a clean example.
- Made `index.html` reference `/src/main.ts` for easy development with Vite.

Run (development)

1. Install dependencies:

```bash
npm install
```

2. Start the Vite dev server:

```bash
npm run dev
```

3. Open the app:

- Visit: http://localhost:5174/
- Load fragments via the panel, then double-click elements to select them. The selection color control and properties panel will update.

Notes for agents
- The main logic lives in `src/main.ts`.
- Fragment loading helpers are in `src/core/fragments.ts`.
- World setup is in `src/core/world.ts`.
- UI is in `src/ui/panel.ts`.
- To enable additional debugging during development, temporarily add `console.debug` in `src/main.ts` near the dblclick handler.

If you want me to also generate a minimal committed example (clean branch, package scripts, or CI), tell me which format you prefer.
