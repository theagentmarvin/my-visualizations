# Fragment Sanity Check

A minimal fragment viewer implementation strictly following the ThatOpen Raycasters example. This project demonstrates loading and interacting with `.frag` models using ThatOpen Components.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Default: http://localhost:5173
# With smoke tests: http://localhost:5173?test
```

## Running Tests

### Type Check
```bash
npm run typecheck
```

### Smoke Test
1. Start the dev server: `npm run dev`
2. Open browser with test flag: `http://localhost:5173?test`
3. Check console for test results
4. Test results are also displayed in the UI

## Project Structure

```
src/
  ├── viewer.ts       # FragmentViewer class - main viewer implementation
  ├── main.ts         # Entry point - initializes viewer with sample models
  └── smoke-test.ts   # Automated smoke tests

styles/
  └── main.css        # Basic styling

index.html            # HTML entry point
package.json          # Dependencies and scripts
tsconfig.json         # TypeScript configuration
vite.config.ts        # Vite configuration
```

## Features

- Loads canonical sample `.frag` models (school_arq.frag, school_str.frag)
- Double-click to select model elements
- Visual highlighting of selected elements
- Raycasting-based selection
- Exposes `window.viewer` for debugging and testing

## API Usage

The implementation follows the ThatOpen Raycasters example:

1. **Initialize Components**: `new OBC.Components()`
2. **Create World**: Using `SimpleScene`, `SimpleCamera`, `SimpleRenderer`
3. **Load Fragments**: Using `FragmentsManager.load()` with fetched data
4. **Raycasting**: `components.get(OBC.Raycasters).get(world).castRay()`
5. **Highlighting**: Using `Highlighter` from `@thatopen/components-front`

## Sample Models

This project uses the canonical sample models from ThatOpen:
- `school_arq.frag` - Architectural model
- `school_str.frag` - Structural model

URL: `https://thatopen.github.io/engine_resources/sample-models/`

## License

MIT
