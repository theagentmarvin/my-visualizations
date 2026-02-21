# AUDIT.md - Deviations from ThatOpen Raycasters Example

This document lists the intentional and necessary deviations from the official ThatOpen Raycasters example due to API changes between versions.

## Version Information

- **@thatopen/components**: ^2.4.0
- **@thatopen/components-front**: ^2.4.0
- **@thatopen/fragments**: ~3.0.0
- **three**: ^0.183.0

## Deviations

### 1. Fragments Initialization

**Example Pattern**: `fragments.init(workerUrl)`

**Our Implementation**: Worker initialization is handled internally by the FragmentsManager.

**Reason**: In the newer API (v3.0+), `FragmentsModels` (previously `Fragments`) no longer requires explicit worker initialization. The `FragmentsManager` from `@thatopen/components` handles loading directly.

**Impact**: Minimal - loading `.frag` files works without worker setup.

---

### 2. Fragment Loading API

**Example Pattern**: `await fragments.core.load(data, { modelId })`

**Our Implementation**: `fragments.load(data)` returns `FragmentsGroup` synchronously.

**Reason**: The API changed from async to sync loading in newer versions. The `FragmentsManager.load()` method is now synchronous.

**Code**:
```typescript
// Old API (example)
await fragments.init(workerUrl);
await fragments.load(data, { modelId });

// New API (our implementation)
const group = fragments.load(data);
group.uuid = modelId;
```

---

### 3. onItemSet Event

**Example Pattern**: `fragments.list.onItemSet.add(({ id, item }) => { ... })`

**Our Implementation**: Direct scene addition after load.

**Reason**: The `FragmentsManager` uses a different event system. Instead of `onItemSet`, we directly add the group to the scene.

**Code**:
```typescript
// Old API
fragments.list.onItemSet.add(({ id, item }) => {
  world.scene.three.add(item.mesh);
});

// New API
const group = fragments.load(data);
world.scene.three.add(group);
```

---

### 4. Highlighting Implementation

**Example Pattern**: `fragments.highlight.add(modelId, [localId])`

**Our Implementation**: Using `Highlighter` from `@thatopen/components-front`.

**Reason**: The newer API separates highlighting into the `components-front` package. The `Highlighter` component provides more flexible selection styling.

**Code**:
```typescript
// Old API
fragments.highlight.add(modelId, [localId]);

// New API
const fragmentMap: FragmentIdMap = {};
fragmentMap[fragmentId] = new Set([localId]);
highlighter.highlightByID('select', fragmentMap, true);
```

---

### 5. Property Names (FragmentGroup → FragmentsGroup)

**Example Pattern**: `group.fragments` (array)

**Our Implementation**: `group.items` (array)

**Reason**: The property name changed in the newer fragments API.

---

### 6. castRay Arguments

**Example Pattern**: `caster.castRay({ x, y })`

**Our Implementation**: `caster.castRay(meshes, position)`

**Reason**: The SimpleRaycaster API changed to accept explicit mesh list and Vector2 position.

**Code**:
```typescript
// Old API
caster.castRay({ x, y });

// New API
const meshes = fragments.meshes;
const position = new THREE.Vector2(x, y);
const result = caster.castRay(meshes, position);
```

---

## Structural Changes

### Scene Setup
The `setup()` method on SimpleScene requires explicit type assertion due to BaseScene typing:
```typescript
(world.scene as OBC.SimpleScene).setup();
```

### Camera Controls
The `world.controls` property is not directly accessible in the type definitions. We access it via `(world as any).controls` for camera fitting.

## Summary

Most deviations are due to:
1. API migration from v2.x to v3.x of @thatopen/fragments
2. Separation of concerns (highlighting moved to components-front)
3. Synchronous vs asynchronous API changes
4. Property naming consistency improvements

The core functionality (loading, raycasting, highlighting) remains identical; only the implementation details have evolved with the library.

## Testing Notes

The smoke test verifies:
1. Viewer initialization (`window.viewer` exists)
2. Model loading count (2 models loaded)
3. Double-click selection (returns modelId and localId)

All three acceptance criteria are met despite API differences.
