/**
 * main.ts — Application Entry Point with Raycasting Selection
 *
 * Features:
 *   1. 3D World   → src/core/world.ts
 *   2. Fragments  → src/core/fragments.ts
 *   3. UI Panel   → src/ui/panel.ts
 *   4. Raycasting → Click to select/highlight elements, show properties
 *
 * AGENT NOTE: Raycasting implementation follows ThatOpen example:
 * https://github.com/ThatOpen/engine_components/blob/main/packages/core/src/core/Raycasters/example.ts
 */

import Stats from "stats.js";
import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
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

// ─── 5. Initialize Raycaster for Selection ───────────────────────────────────

const casters = components.get(OBC.Raycasters);
const caster = casters.get(world);

// ─── 6. Selection State ───────────────────────────────────────────────────────

let onSelectCallback = (_modelIdMap: OBC.ModelIdMap) => {};
let onItemSelected = () => {};
// Use a reactive state object so panel always gets current values
const selectionState = {
  selectedAttributes: undefined as FRAGS.ItemData | undefined,
  selectionColor: new THREE.Color("purple"),
};

// ─── 7. Raycasting Event Handler ─────────────────────────────────────────────

container.addEventListener("dblclick", async () => {
  const result = (await caster.castRay()) as any;
  if (!result) return;
  
  // The modelIdMap is how selections are represented in the engine.
  // Keys are modelIds, values are sets of localIds (items within the model)
  const modelIdMap = { [result.fragments.modelId]: new Set([result.localId]) };
  onSelectCallback(modelIdMap);
});

// ─── 8. Selection Handler with Highlighting ──────────────────────────────────

onSelectCallback = async (modelIdMap) => {
  const modelId = Object.keys(modelIdMap)[0];
  if (modelId && fragments.list.get(modelId)) {
    const model = fragments.list.get(modelId)!;
    const [data] = await model.getItemsData([...modelIdMap[modelId]]);
    // Update the reactive state object
    selectionState.selectedAttributes = data;
  }

  await fragments.highlight(
    {
      color: selectionState.selectionColor,
      renderedFaces: FRAGS.RenderedFaces.ONE,
      opacity: 1,
      transparent: false,
    },
    modelIdMap,
  );

  await fragments.core.update(true);
  onItemSelected();
};

// ─── 9. Build the UI ──────────────────────────────────────────────────────────

BUI.Manager.init();

const [panel, updatePanel] = createPanel(fragments, {
  get selectionColor() { return selectionState.selectionColor; },
  get selectedAttributes() { return selectionState.selectedAttributes; },
  onClearSelection: async () => {
    await fragments.resetHighlight();
    await fragments.core.update(true);
    selectionState.selectedAttributes = undefined;
    updatePanel();
  },
  onColorChange: (color: THREE.Color) => {
    selectionState.selectionColor.set(color);
  },
});

const mobileToggle = createMobileToggle(panel);

// Update panel when model list changes
fragments.list.onItemSet.add(() => updatePanel());
fragments.list.onItemDeleted.add(() => updatePanel());

// Update panel when item is selected
onItemSelected = () => updatePanel();

document.body.append(panel, mobileToggle);

// ─── 10. Performance Monitor ───────────────────────────────────────────────────

const stats = new Stats();
stats.showPanel(2);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
document.body.append(stats.dom);

world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());
