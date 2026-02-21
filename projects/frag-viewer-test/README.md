# Fragment Viewer Test

A minimal single-page fragment viewer with toggleable properties panel.

## Features

- **Full window viewer**: The 3D canvas takes up the entire window
- **Toggleable properties panel**: Hidden by default, shown when an element is selected or via the toggle button
- **TypeScript**: Strict null checks enabled
- **FragmentsAdapter pattern**: Uses `@thatopen/components` FragmentsManager + OBC Raycasters + Highlighter
- **ResizeObserver**: Handles container resize for responsive rendering

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

## Testing

### Automated Smoke Test

The smoke test verifies:
1. Both fragment models load successfully (`getLoadedModelCount() === 2`)
2. Clicking the viewer center triggers the selection callback without crashing

To run the smoke test manually:

```bash
# Start the dev server
npm run dev

# Open in browser with test flag
open http://localhost:3000?test

# Check console output for test results
```

Or programmatically:

```typescript
import { runSmokeTest } from './src/smoke-test.js';
const success = await runSmokeTest();
```

### Acceptance Criteria

1. **TypeScript compilation**: `tsc --noEmit` passes with strict mode
2. **Model loading**: Both `school_arq.frag` and `school_str.frag` load
3. **Selection**: Clicking an element triggers the selection callback

## Architecture

### Core Components

- **FragmentViewer** (`src/viewer.ts`): Main viewer class using ThatOpen Components
  - `FragmentsManager` for model loading
  - `Raycasters` for element picking
  - `Highlighter` for selection highlighting
  - `ResizeObserver` for responsive canvas

- **PropertiesPanel** (`src/main.ts`): UI component for displaying element properties
  - Toggleable visibility
  - Populated on element selection

### Design Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                    FragmentViewer                           │
├─────────────────────────────────────────────────────────────┤
│  Components → World → Scene/Renderer/Camera                 │
│  FragmentsManager → load() → FragmentsModel                 │
│  Raycasters → castRay() → SelectionResult                   │
│  Highlighter → highlight() → Visual feedback                │
│  ResizeObserver → handleResize() → Responsive               │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
frag-viewer-test/
├── index.html              # Main HTML entry
├── styles.css              # Styles with mobile support
├── package.json            # Dependencies & scripts
├── tsconfig.json           # Strict TypeScript config
├── vite.config.ts          # Vite build config
├── scripts/
│   └── check_pr.sh         # PR verification script
└── src/
    ├── main.ts             # Entry point + UI
    ├── viewer.ts           # FragmentViewer class
    ├── config.ts           # Configuration
    └── smoke-test.ts       # Automated smoke test
```

## Configuration

Edit `src/config.ts` to customize:

- `FRAGMENT_URLS`: Array of fragment model URLs to load
- `VIEWER.cameraPosition`: Initial camera position
- `SELECTION.highlightColor`: Selection highlight color

## PR Checks

Before submitting a PR, run:

```bash
./scripts/check_pr.sh
```

This verifies:
- TypeScript compilation (`tsc --noEmit`)
- Production build succeeds
