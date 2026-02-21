# Frag Viewer Test - Automated Audit Report

**Generated:** 2026-02-21  
**Project:** projects/frag-viewer-test  
**Canonical Reference:** projects/fragment-viewer-properties

---

## Summary

| Category | Status |
|----------|--------|
| TypeScript Compilation | ✅ PASS |
| Build | ✅ PASS |
| PR Checks | ✅ PASS |
| Strict Null Guards | ✅ PASS |
| ResizeObserver | ✅ PASS |
| Smoke Test | ✅ PASS |
| FragmentsAdapter Pattern | ✅ PASS |

---

## Detailed Audit

### 1. TypeScript Configuration ✅

**File:** `tsconfig.json`

- ✅ `strict: true` enabled
- ✅ `noEmit: true` for type checking
- ✅ `noUnusedLocals: true`
- ✅ `noUnusedParameters: true`
- ✅ `noUncheckedIndexedAccess: true` (additional strictness)

**Comparison to canonical:** Matches fragment-viewer-properties with additional `noUncheckedIndexedAccess` for extra safety.

### 2. Strict Null Guards ✅

**File:** `src/viewer.ts`

- ✅ Constructor validates container element exists (throws if not found)
- ✅ All class properties properly typed with definite assignment assertions (`!`)
- ✅ Null checks for `this.fragments?.list.size` in `getLoadedModelCount()`
- ✅ Optional chaining for `this.fragments?.core`
- ✅ ResizeObserver cleanup checks `if (this.resizeObserver)`
- ✅ Selection timeout cleanup checks `if (this.selectionTimeout)`

**Comparison to canonical:** Equal or stricter than fragment-viewer-properties.

### 3. ResizeObserver ✅

**File:** `src/viewer.ts`

```typescript
private setupResizeObserver(): void {
  this.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === this.container) {
        this.handleResize();
      }
    }
  });
  this.resizeObserver.observe(this.container);
}
```

- ✅ ResizeObserver created and observes container
- ✅ Disconnect called in `dispose()` method
- ✅ Handler triggers fragment core update

**Comparison to canonical:** fragment-viewer-properties does NOT have ResizeObserver - this is an improvement.

### 4. FragmentsAdapter + OBC Raycasters + Highlighter Pattern ✅

**File:** `src/viewer.ts`

- ✅ Uses `OBC.Components` for component management
- ✅ Uses `OBC.FragmentsManager` for fragment loading
- ✅ Uses `OBC.Raycasters` for element picking
- ✅ Uses `OBCF.Highlighter` for visual selection feedback
- ✅ Uses `fragments.highlight()` with proper `ModelIdMap`
- ✅ Uses `fragments.resetHighlight()` for clearing selection

**API Usage Comparison:**

| API | frag-viewer-test | fragment-viewer-properties |
|-----|------------------|---------------------------|
| fragments.load() | ✅ (with type assertion) | ✅ (with type assertion) |
| castRay() | ✅ | ✅ |
| highlight() | ✅ | ✅ |
| resetHighlight() | ✅ | ✅ |

**Note:** Both projects use `(this.fragments as any).load()` pattern due to incomplete type definitions in @thatopen/components.

### 5. Smoke Test ✅

**File:** `src/smoke-test.ts`

Acceptance criteria:
1. ✅ Loads both fragments and `getLoadedModelCount() === 2`
2. ✅ Clicking center triggers selection callback (no crash)

**Features:**
- ✅ Test container created off-screen
- ✅ Viewer initialization verified
- ✅ Model loading verified
- ✅ Selection callback registration tested
- ✅ Click simulation performed
- ✅ Cleanup performed (viewer.dispose(), container removed)
- ✅ Results reported to console
- ✅ Auto-runs when URL contains `?test`

**Comparison to canonical:** fragment-viewer-properties does NOT have a smoke test - this is an addition.

### 6. Project Structure ✅

```
frag-viewer-test/
├── index.html              ✅ Main HTML entry
├── styles.css              ✅ Styles with mobile support
├── package.json            ✅ Dependencies & scripts
├── tsconfig.json           ✅ Strict TypeScript config
├── vite.config.ts          ✅ Vite build config
├── .gitignore              ✅ Git ignore file
├── README.md               ✅ Documentation
├── scripts/
│   └── check_pr.sh         ✅ PR verification script
└── src/
    ├── main.ts             ✅ Entry point + UI
    ├── viewer.ts           ✅ FragmentViewer class
    ├── config.ts           ✅ Configuration
    └── smoke-test.ts       ✅ Automated smoke test
```

**Comparison to canonical:**
- Same structure as fragment-viewer-properties
- Added `scripts/check_pr.sh` (not in canonical)
- Added `src/smoke-test.ts` (not in canonical)

### 7. UI/UX Design ✅

**Layout:**
- ✅ Viewer takes full window (matches requirement)
- ✅ Properties panel hidden by default (matches requirement)
- ✅ Toggle button to show/hide properties (matches requirement)
- ✅ Properties panel appears when element selected
- ✅ Mobile responsive design

**Comparison to canonical:**
- fragment-viewer-properties uses 50/50 split layout
- frag-viewer-test uses full window + overlay panel (per requirements)

### 8. Build Scripts ✅

**File:** `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

- ✅ Uses Vite (as specified)
- ✅ Has typecheck script
- ✅ Has build script
- ✅ Has dev server script

**File:** `scripts/check_pr.sh`

- ✅ Runs typecheck
- ✅ Runs build
- ✅ Returns exit code 0 on success

### 9. Configuration ✅

**File:** `src/config.ts`

- ✅ Uses canonical fragment URLs:
  - `https://thatopen.github.io/engine_components/resources/frags/school_arq.frag`
  - `https://thatopen.github.io/engine_components/resources/frags/school_str.frag`
- ✅ Camera position matches canonical
- ✅ Selection settings configured

---

## Issues Found

### Minor: Type Assertions Required

**Location:** `src/viewer.ts`

Due to incomplete type definitions in `@thatopen/components`, several `as any` type assertions are required:

```typescript
// Line 45-46
(scene as any).setup();
(this.world.scene.three as any).background = null;

// Line 79, 87
(camera as any).controls.addEventListener(...)
model.useCamera((camera as any).three);

// Line 221, 228, 242
(this.fragments as any).load(...)
(this.fragments as any).groups
(this.world.camera as any).fit(...)
```

**Impact:** Low - runtime behavior is correct, types are just incomplete.

**Recommendation:** Monitor @thatopen/components for updated type definitions.

---

## Conclusion

✅ **AUDIT PASSED**

The frag-viewer-test project:
1. Meets all specified requirements
2. Follows the FragmentsAdapter + OBC Raycasters + Highlighter pattern
3. Uses strict null guards throughout
4. Includes ResizeObserver for responsive rendering
5. Includes automated smoke tests
6. Passes TypeScript strict mode compilation
7. Builds successfully

**Improvements over canonical (fragment-viewer-properties):**
- Added ResizeObserver for responsive canvas
- Added automated smoke test
- Added PR check script
- Stricter TypeScript configuration (`noUncheckedIndexedAccess`)

**Missing (intentional per requirements):**
- None - all requirements met

---

## Recommendations

1. **Monitor dependency updates** - @thatopen/components may improve type definitions
2. **Consider adding unit tests** - Vitest or Jest for more comprehensive testing
3. **Consider CI integration** - GitHub Actions to run check_pr.sh on PRs
