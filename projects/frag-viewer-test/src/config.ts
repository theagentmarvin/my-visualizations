/**
 * Configuration for Fragment Viewer Test
 * 
 * Uses canonical fragment model URLs from ThatOpen engine components.
 */

export const CONFIG = {
  /** Canonical fragment model URLs */
  FRAGMENT_URLS: [
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ] as const,

  /** Viewer settings */
  VIEWER: {
    /** Initial camera position [eyeX, eyeY, eyeZ, targetX, targetY, targetZ] */
    cameraPosition: [78, 20, -2.2, 26, -4, 25] as const,
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
