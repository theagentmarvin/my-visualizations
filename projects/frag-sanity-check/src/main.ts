import { FragmentViewer } from './viewer';
import type { Selection } from './viewer';
import './smoke-test';

// Expose viewer globally for smoke tests
declare global {
  interface Window {
    viewer: FragmentViewer;
  }
}

// Use canonical sample .frag URLs and worker from ThatOpen examples
const MODEL_URLS = {
  schoolArq: 'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag',
  schoolStr: 'https://thatopen.github.io/engine_components/resources/frags/school_str.frag',
};

async function init() {
  const container = document.getElementById('viewer-container');
  if (!container) {
    throw new Error('Viewer container not found');
  }

  const viewer = new FragmentViewer(container);
  
  // Initialize with canonical worker used in ThatOpen examples
  const workerUrl = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';
  await viewer.init(workerUrl);
  
  // Load canonical sample models
  await Promise.all([
    viewer.loadModel(MODEL_URLS.schoolArq, 'school_arq'),
    viewer.loadModel(MODEL_URLS.schoolStr, 'school_str'),
  ]);
  
  // Setup selection callback
  const selectionInfo = document.getElementById('selection-info');
  viewer.onSelection((selection: Selection) => {
    if (selection.modelId && selection.localId !== null) {
      selectionInfo!.textContent = `Model: ${selection.modelId}, LocalId: ${selection.localId}`;
    } else {
      selectionInfo!.textContent = 'No selection';
    }
  });
  
  // Expose for smoke tests
  window.viewer = viewer;
  
  console.log('[FragSanityCheck] Viewer initialized with', viewer.getLoadedModelCount(), 'models');
}

// Handle test mode
if (window.location.search.includes('test')) {
  console.log('[FragSanityCheck] Running in test mode');
  (window as any).__TEST_MODE__ = true;
}

init().catch((error) => {
  console.error('[FragSanityCheck] Initialization failed:', error);
});
