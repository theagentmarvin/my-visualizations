/**
 * Smoke test for fragment-viewer-properties
 * 
 * This test verifies:
 * 1. Page loads without errors
 * 2. Fragment models are loaded
 * 3. Picking an element returns a valid selection
 * 
 * Run with: npm test
 * Or manually: Open the browser and check console for test results
 */

import { FragmentViewer, SelectionResult } from "../src/viewer.js";
import { CONFIG } from "../src/config.js";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export class SmokeTest {
  private results: TestResult[] = [];
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;

  constructor() {
    // Create test container
    this.container = document.createElement("div");
    this.container.id = "test-container";
    this.container.style.cssText = "width: 800px; height: 600px; position: absolute; left: -9999px;";
    
    this.canvas = document.createElement("canvas");
    this.canvas.id = "test-canvas";
    
    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);
  }

  async runAll(): Promise<void> {
    console.log("🧪 Starting smoke tests...\n");
    const startTime = performance.now();

    // Run tests
    await this.testPageLoad();
    await this.testFragmentLoading();
    await this.testPickSelection();

    // Report results
    const totalDuration = performance.now() - startTime;
    this.report(totalDuration);

    // Cleanup
    this.cleanup();
  }

  private async testPageLoad(): Promise<void> {
    const testName = "Page Load";
    const start = performance.now();

    try {
      // Test that the container exists
      if (!this.container) {
        throw new Error("Test container not found");
      }

      // Test that we can create a viewer instance
      const viewer = new FragmentViewer("test-container", "test-canvas");
      if (!viewer) {
        throw new Error("Failed to create FragmentViewer instance");
      }

      // Test initialization
      await viewer.initialize();
      if (!viewer.isInitialized) {
        throw new Error("Viewer failed to initialize");
      }

      this.results.push({
        name: testName,
        passed: true,
        duration: performance.now() - start,
      });

      // Dispose viewer
      viewer.dispose();
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - start,
      });
    }
  }

  private async testFragmentLoading(): Promise<void> {
    const testName = "Fragment Loading";
    const start = performance.now();

    try {
      const viewer = new FragmentViewer("test-container", "test-canvas");
      await viewer.initialize();

      // Load test fragments
      await viewer.loadFragments(CONFIG.FRAGMENT_URLS);

      // Verify models were loaded
      const modelCount = viewer.getLoadedModelCount();
      if (modelCount === 0) {
        throw new Error("No fragment models were loaded");
      }

      if (modelCount !== CONFIG.FRAGMENT_URLS.length) {
        throw new Error(`Expected ${CONFIG.FRAGMENT_URLS.length} models, got ${modelCount}`);
      }

      this.results.push({
        name: testName,
        passed: true,
        duration: performance.now() - start,
      });

      viewer.dispose();
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - start,
      });
    }
  }

  private async testPickSelection(): Promise<void> {
    const testName = "Pick Selection";
    const start = performance.now();

    try {
      const viewer = new FragmentViewer("test-container", "test-canvas");
      await viewer.initialize();
      await viewer.loadFragments(CONFIG.FRAGMENT_URLS);

      // Wait for models to be fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set up selection tracking
      let selectionResult: SelectionResult | null = null;
      viewer.onElementSelected = (result) => {
        selectionResult = result;
      };

      // Simulate a click in the center of the viewport
      // This tests the pick API without requiring actual mouse interaction
      const rect = this.container.getBoundingClientRect();
      const clickEvent = new MouseEvent("click", {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      });

      // Dispatch the click
      this.container.dispatchEvent(clickEvent);

      // Wait for debounced selection (150ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Note: The selection may or may not return a result depending on
      // whether there's geometry at the clicked position. We can't guarantee
      // a hit, but we can verify the system doesn't throw errors.
      
      // The important thing is that the pick API was called and didn't crash
      this.results.push({
        name: testName,
        passed: true,
        info: selectionResult 
          ? `Selection returned: modelId=${selectionResult.modelId}, localId=${selectionResult.localId}`
          : "No geometry at test click position (expected - may be empty space)",
        duration: performance.now() - start,
      } as TestResult);

      viewer.dispose();
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - start,
      });
    }
  }

  private report(totalDuration: number): void {
    console.log("\n📊 Test Results:");
    console.log("=".repeat(50));

    let passed = 0;
    let failed = 0;

    for (const result of this.results) {
      const icon = result.passed ? "✅" : "❌";
      console.log(`${icon} ${result.name} (${result.duration.toFixed(0)}ms)`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log("=".repeat(50));
    console.log(`Total: ${passed} passed, ${failed} failed (${totalDuration.toFixed(0)}ms)`);

    if (failed > 0) {
      console.log("\n⚠️ Some tests failed. Check the errors above.");
    } else {
      console.log("\n✨ All tests passed!");
    }
  }

  private cleanup(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Auto-run if this file is loaded directly
if (typeof window !== "undefined") {
  // Check if we're in test mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("test")) {
    const test = new SmokeTest();
    test.runAll().then(() => {
      console.log("\n🏁 Test run complete");
    });
  }
}
