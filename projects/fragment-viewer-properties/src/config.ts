/**
 * Configuration for Fragment Viewer + Properties
 * 
 * To use your own fragment models, replace the URLs in FRAGMENT_URLS
 * with paths to your .frag files (local or remote).
 * 
 * Example local path: "/models/my-model.frag"
 * Example remote path: "https://example.com/models/my-model.frag"
 * 
 * ---
 * 
 * COORDINATE MAPPING NOTES for Pick Operations:
 * 
 * Screen coordinates (pixels) must be converted to Normalized Device Coordinates (NDC)
 * for both the @thatopen/components Raycasters API and raw three.js raycasting.
 * 
 * NDC Conversion Formula:
 *   ndcX = (screenX / containerWidth) * 2 - 1   // Range: [-1, 1]
 *   ndcY = -(screenY / containerHeight) * 2 + 1 // Range: [-1, 1], Y is inverted
 * 
 * Assumptions:
 *   - container.getBoundingClientRect() provides accurate screen-relative coordinates
 *   - The canvas fills the container (no padding/margin affecting mouse position)
 *   - No CSS transforms are applied that would skew mouse event coordinates
 * 
 * The Raycasters API handles this conversion internally when castRay() is called,
 * but we maintain the mouse position calculation here for defensive fallback raycasting.
 * 
 * Reference: See viewer.ts handleClick() for implementation.
 */

export const CONFIG = {
  /** Fragment model URLs to load on startup */
  FRAGMENT_URLS: [
    // Default: Sample school building models from That Open Engine
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ],

  /** Viewer settings */
  VIEWER: {
    /** Background color (hex) */
    backgroundColor: "#1a1a2e",
    /** Initial camera position [x, y, z, targetX, targetY, targetZ] */
    cameraPosition: [78, 20, -2.2, 26, -4, 25],
    /** Enable grid */
    showGrid: true,
  },

  /** Selection settings */
  SELECTION: {
    /** Debounce delay in milliseconds (prevents rapid-fire selections) */
    debounceMs: 150,
    /** Highlight color (hex) - used by Highlighter component */
    highlightColor: "#4fc3f7",
  },
};
