// Browser-based smoke test for Frag Sanity Check
// Run this in the console or as a script after the viewer is initialized

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

async function runSmokeTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Check viewer exists
  try {
    if (typeof (window as any).viewer === 'undefined') {
      results.push({
        name: 'viewer-exists',
        passed: false,
        error: 'window.viewer is not defined'
      });
      return results;
    }
    results.push({ name: 'viewer-exists', passed: true });
  } catch (e) {
    results.push({
      name: 'viewer-exists',
      passed: false,
      error: String(e)
    });
    return results;
  }

  const viewer = (window as any).viewer;

  // Test 2: Check getLoadedModelCount returns 2
  try {
    const count = viewer.getLoadedModelCount();
    if (count !== 2) {
      results.push({
        name: 'loaded-model-count',
        passed: false,
        error: `Expected 2 models, got ${count}`,
        data: { count }
      });
    } else {
      results.push({
        name: 'loaded-model-count',
        passed: true,
        data: { count }
      });
    }
  } catch (e) {
    results.push({
      name: 'loaded-model-count',
      passed: false,
      error: String(e)
    });
  }

  // Test 3: Simulate double-click and check selection
  try {
    const container = document.getElementById('viewer-container');
    if (!container) {
      results.push({
        name: 'dblclick-selection',
        passed: false,
        error: 'viewer-container not found'
      });
    } else {
      // Create and dispatch double-click event at center
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dblClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
        view: window
      });
      
      container.dispatchEvent(dblClickEvent);
      
      // Wait a moment for selection to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const selection = viewer.getSelection();
      
      if (selection.modelId && selection.localId !== null) {
        results.push({
          name: 'dblclick-selection',
          passed: true,
          data: selection
        });
      } else {
        results.push({
          name: 'dblclick-selection',
          passed: false,
          error: `Selection incomplete: modelId=${selection.modelId}, localId=${selection.localId}`,
          data: selection
        });
      }
    }
  } catch (e) {
    results.push({
      name: 'dblclick-selection',
      passed: false,
      error: String(e)
    });
  }

  return results;
}

// Auto-run in test mode
if (window.location.search.includes('test')) {
  window.addEventListener('load', async () => {
    // Wait for viewer initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const results = await runSmokeTests();
    const allPassed = results.every(r => r.passed);
    
    console.log('[FragSanityCheck] Smoke test results:', results);
    
    // Display results on page
    const info = document.getElementById('info');
    if (info) {
      const testResults = document.createElement('div');
      testResults.id = 'test-results';
      testResults.style.marginTop = '12px';
      testResults.style.padding = '8px 12px';
      testResults.style.background = allPassed ? '#2e7d32' : '#c62828';
      testResults.style.borderRadius = '4px';
      testResults.style.fontFamily = 'monospace';
      testResults.style.fontSize = '0.85rem';
      
      testResults.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${allPassed ? '✓ ALL TESTS PASSED' : '✗ TESTS FAILED'}
        </div>
        ${results.map(r => `
          <div style="color: ${r.passed ? '#a5d6a7' : '#ffab91'};">
            ${r.passed ? '✓' : '✗'} ${r.name}: ${r.passed ? 'PASS' : (r.error || 'FAIL')}
          </div>
        `).join('')}
      `;
      
      info.appendChild(testResults);
    }
    
    // Set global result for external test runners
    (window as any).__TEST_RESULTS__ = results;
    (window as any).__TEST_PASSED__ = allPassed;
  });
}

export { runSmokeTests };
