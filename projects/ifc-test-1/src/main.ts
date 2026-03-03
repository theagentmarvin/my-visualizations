/**
 * main.ts — Application Entry Point with Raycasting Selection
 *
 * Features:
 *   1. 3D World   → src/core/world.ts
 *   2. Fragments  → src/core/fragments.ts
 *   3. UI Panel   → src/ui/panel.ts
 *   4. Raycasting → Click to select/highlight elements, show properties
 *
 * FIXED: Now uses @thatopen/components-front Highlighter component
 * instead of non-existent fragments.highlight() method
 */

import Stats from "stats.js";
import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";

import { setupWorld, addGrid } from "./core/world";
import { fetchWorkerUrl, setupFragments } from "./core/fragments";
import { createPanel, createMobileToggle } from "./ui/panel";

// ─── 1. Bootstrap ─────────────────────────────────────────────────────────────

const components = new OBC.Components();
const container = document.getElementById("container")!;

// ─── 2. Create the 3D World ───────────────────────────────────────────────────

const world = await setupWorld(components, container);
components.init();

// ─── 3. Add Scene Helpers ─────────────────────────────────────────────────────

addGrid(components, world);

// ─── 4. Initialize FragmentsManager ──────────────────────────────────────────

const workerUrl = await fetchWorkerUrl();
const fragments = setupFragments(components, world, workerUrl);

// ─── 5. Initialize Raycaster + Highlighter ───────────────────────────────────

const casters = components.get(OBC.Raycasters);
const caster = casters.get(world);

// NEW: Use the proper Highlighter component
const highlighter = components.get(OBCF.Highlighter);
await highlighter.setup({ world });

// ─── 6. Selection State ───────────────────────────────────────────────────────

// Use a reactive state object so panel always gets current values
const selectionState = {
  selectedAttributes: undefined as FRAGS.ItemData | undefined,
  selectionColor: new THREE.Color("purple"),
};

let updatePanel: () => void;

// Apply initial selection color to the highlighter (if available)
if (highlighter.styles && highlighter.styles.select) {
  highlighter.styles.select.color = selectionState.selectionColor;
}

// ─── 7. Raycasting Event Handler ─────────────────────────────────────────────

container.addEventListener("dblclick", async () => {
  const result = await caster.castRay();
  if (!result) return;

  // Highlight using the Highlighter component
  const modelIdMap = { [result.fragments.modelId]: new Set([result.localId]) };
  highlighter.highlight("select", modelIdMap);
});

// ─── 8. Selection Handler with Highlighter Events ────────────────────────────

highlighter.events.select.onHighlight.add(async (fragmentIdMap) => {
  // fragmentIdMap structure: { [modelId]: Set<expressId> }
  for (const [modelId, expressIds] of Object.entries(fragmentIdMap)) {
    const model = fragments.list.get(modelId);
    if (model) {
      const [data] = await model.getItemsData([...expressIds]);
      selectionState.selectedAttributes = data;
      updatePanel();
    }
  }
});

highlighter.events.select.onClear.add(() => {
  selectionState.selectedAttributes = undefined;
  updatePanel();
});

// ─── 9. Build the UI ──────────────────────────────────────────────────────────

BUI.Manager.init();

const [panel, updatePanelFn] = createPanel(fragments, {
  get selectionColor() { return selectionState.selectionColor; },
  get selectedAttributes() { return selectionState.selectedAttributes; },
  onClearSelection: async () => {
    highlighter.clear("select"); // Use highlighter.clear() instead
    selectionState.selectedAttributes = undefined;
    updatePanelFn();
  },
  onColorChange: (color: THREE.Color) => {
    selectionState.selectionColor.set(color);
    // Update highlighter color
    highlighter.styles.select.color = color;
  },
});

updatePanel = updatePanelFn;

const mobileToggle = createMobileToggle(panel);

// Update panel when model list changes
fragments.list.onItemSet.add(() => updatePanel());
fragments.list.onItemDeleted.add(() => updatePanel());

document.body.append(panel, mobileToggle);

// ─── 10. Performance Monitor ───────────────────────────────────────────────────

const stats = new Stats();
stats.showPanel(2);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
document.body.append(stats.dom);

world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());
