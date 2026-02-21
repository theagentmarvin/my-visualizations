/**
 * Main entry point - Fragment Viewer + Properties
 * 
 * Aligned with canonical viewer implementation from:
 *   - my-visualizations/projects/bim-viewer/index.html
 *   - my-visualizations/projects/bim-mobile-viewer/index.html
 * 
 * Automatically loads fragment models on page load and sets up
 * the viewer with properties table interaction.
 */

import { FragmentViewer, SelectionResult } from "./viewer.js";
import { PropertiesUI } from "./ui.js";
import { CONFIG } from "./config.js";

async function init(): Promise<void> {
  console.log("[Fragment Viewer] Initializing...");

  // Get loading indicator
  const loadingIndicator = document.getElementById("loading-indicator");

  try {
    // Initialize viewer - aligned with bim-viewer canonical implementation
    // Note: We no longer need canvasId since we render directly to container (like bim-viewer)
    const viewer = new FragmentViewer("viewer-container");
    await viewer.initialize();

    // Initialize UI
    const propertiesUI = new PropertiesUI();
    propertiesUI.clear();

    // Set up selection handler
    viewer.onElementSelected = (result: SelectionResult | null) => {
      // Expose viewer & UI for runtime inspection (dev only)
      if (result) {
        propertiesUI.populate(result.object, result.instanceId, result.attributes);
      } else {
        propertiesUI.clear();
      }
    };

    // Auto-load fragment models - matches bim-viewer pattern
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
