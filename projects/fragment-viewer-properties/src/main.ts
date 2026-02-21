/**
 * Main entry point - Fragment Viewer + Properties
 * 
 * Automatically loads fragment models on page load and sets up
 * the viewer with properties table interaction.
 * 
 * REFERENCE: See projects/ifc-test-1/src/main.ts for the canonical
 * implementation pattern using @thatopen/components Raycasters and
 * @thatopen/components-front Highlighter.
 */

import { FragmentViewer, SelectionResult } from "./viewer.js";
import { PropertiesUI } from "./ui.js";
import { CONFIG } from "./config.js";

async function init(): Promise<void> {
  console.log("[Fragment Viewer] Initializing...");

  // Get loading indicator
  const loadingIndicator = document.getElementById("loading-indicator");

  try {
    // Initialize viewer
    const viewer = new FragmentViewer("viewer-container", "viewer-canvas");
    await viewer.initialize();

    // Initialize UI
    const propertiesUI = new PropertiesUI();
    propertiesUI.clear();

    // Set up selection handler
    viewer.onElementSelected = (result: SelectionResult | null) => {
      if (result) {
        propertiesUI.populate(result.object, result.instanceId);
      } else {
        propertiesUI.clear();
      }
    };

    // Auto-load fragment models
    console.log("[Fragment Viewer] Auto-loading models...");
    await viewer.loadFragments(CONFIG.FRAGMENT_URLS);

    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }

    console.log("[Fragment Viewer] Ready! Click on any element to view its properties.");
  } catch (error) {
    console.error("[Fragment Viewer] Initialization failed:", error);
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `<span class="error">Failed to load: ${error instanceof Error ? error.message : String(error)}</span>`;
    }
  }
}

// Start when DOM is ready
document.addEventListener("DOMContentLoaded", init);
