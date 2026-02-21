/**
 * Configuration for Fragment Viewer + Properties
 * 
 * To use your own fragment models, replace the URLs in FRAGMENT_URLS
 * with paths to your .frag files (local or remote).
 * 
 * Example local path: "/models/my-model.frag"
 * Example remote path: "https://example.com/models/my-model.frag"
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
    /** Debounce delay in milliseconds */
    debounceMs: 150,
    /** Highlight color (hex) */
    highlightColor: "#4fc3f7",
  },
};
