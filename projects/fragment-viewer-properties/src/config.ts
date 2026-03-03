/**
 * Configuration for Fragment Viewer + Properties
 * 
 * Aligned with canonical viewer implementation from:
 *   - my-visualizations/projects/bim-viewer/index.html (canonical reference)
 * 
 * To use your own fragment models, replace the URLs in FRAGMENT_URLS
 * with paths to your .frag files (local or remote).
 */

export const CONFIG = {
  /** Fragment model URLs to load on startup */
  FRAGMENT_URLS: [
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ],

  /** Viewer settings - aligned with bim-viewer canonical implementation */
  VIEWER: {
    /** Background color (hex) - matches bim-viewer: transparent/null */
    backgroundColor: null as string | null,
    /** Initial camera position [x, y, z, targetX, targetY, targetZ] - matches bim-viewer */
    cameraPosition: [78, 20, -2.2, 26, -4, 25] as [number, number, number, number, number, number],
    /** Enable grid - matches bim-viewer */
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
