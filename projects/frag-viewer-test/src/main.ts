/**
 * Main entry point - Fragment Viewer Test
 * 
 * Minimal single-page viewer with toggleable properties panel.
 * Full window viewer, properties panel hidden by default.
 */

import { FragmentViewer, SelectionResult } from "./viewer.js";
import { CONFIG } from "./config.js";

interface PropertyRow {
  key: string;
  value: string | number | boolean;
  category: string;
}

class PropertiesPanel {
  private panel: HTMLElement;
  private tbody: HTMLElement;
  private emptyState: HTMLElement;
  private toggleBtn: HTMLElement;
  private isVisible = false;

  constructor() {
    const panel = document.getElementById("properties-panel");
    const tbody = document.getElementById("properties-tbody");
    const emptyState = document.getElementById("empty-state");
    const toggleBtn = document.getElementById("properties-toggle");

    if (!panel) throw new Error("Properties panel not found");
    if (!tbody) throw new Error("Properties tbody not found");
    if (!emptyState) throw new Error("Empty state not found");
    if (!toggleBtn) throw new Error("Properties toggle not found");

    this.panel = panel;
    this.tbody = tbody;
    this.emptyState = emptyState;
    this.toggleBtn = toggleBtn;

    this.toggleBtn.addEventListener("click", () => this.toggle());
    this.updateToggleButton();
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.panel.classList.toggle("visible", this.isVisible);
    this.updateToggleButton();
  }

  public show(): void {
    this.isVisible = true;
    this.panel.classList.add("visible");
    this.updateToggleButton();
  }

  public hide(): void {
    this.isVisible = false;
    this.panel.classList.remove("visible");
    this.updateToggleButton();
  }

  private updateToggleButton(): void {
    this.toggleBtn.textContent = this.isVisible ? "Hide Properties" : "Show Properties";
    this.toggleBtn.setAttribute("aria-expanded", String(this.isVisible));
  }

  public clear(): void {
    this.tbody.innerHTML = "";
    this.emptyState.style.display = "flex";
  }

  public populate(result: SelectionResult): void {
    const rows = this.extractProperties(result);
    this.renderProperties(rows);
    this.show();
  }

  private extractProperties(result: SelectionResult): PropertyRow[] {
    const rows: PropertyRow[] = [];
    const obj = result.object;

    // Basic info
    rows.push({ key: "Model ID", value: result.modelId, category: "General" });
    rows.push({ key: "Local ID", value: result.localId, category: "General" });
    if (result.instanceId !== undefined) {
      rows.push({ key: "Instance ID", value: result.instanceId, category: "General" });
    }

    // Object info
    rows.push({ key: "Name", value: obj.name || "Unnamed", category: "Object" });
    rows.push({ key: "Type", value: obj.type, category: "Object" });

    // Transform
    rows.push({ key: "Position X", value: obj.position.x.toFixed(3), category: "Transform" });
    rows.push({ key: "Position Y", value: obj.position.y.toFixed(3), category: "Transform" });
    rows.push({ key: "Position Z", value: obj.position.z.toFixed(3), category: "Transform" });

    return rows;
  }

  private renderProperties(rows: PropertyRow[]): void {
    this.tbody.innerHTML = "";

    // Group by category
    const grouped = new Map<string, PropertyRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.category) ?? [];
      list.push(row);
      grouped.set(row.category, list);
    }

    for (const [category, categoryRows] of grouped) {
      const header = document.createElement("tr");
      header.className = "category-header";
      header.innerHTML = `<td colspan="2">${this.escapeHtml(category)}</td>`;
      this.tbody.appendChild(header);

      for (const row of categoryRows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="prop-key">${this.escapeHtml(row.key)}</td>
          <td class="prop-value">${this.escapeHtml(String(row.value))}</td>
        `;
        this.tbody.appendChild(tr);
      }
    }

    this.emptyState.style.display = "none";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

async function init(): Promise<void> {
  console.log("[Fragment Viewer Test] Initializing...");

  const loadingIndicator = document.getElementById("loading-indicator");
  const errorDisplay = document.getElementById("error-display");

  try {
    // Initialize viewer
    const viewer = new FragmentViewer("viewer-container");
    await viewer.initialize();

    // Initialize properties panel (hidden by default)
    const propertiesPanel = new PropertiesPanel();
    propertiesPanel.clear();

    // Set up selection handler
    viewer.onElementSelected = (result: SelectionResult | null) => {
      if (result) {
        propertiesPanel.populate(result);
      } else {
        propertiesPanel.clear();
      }
    };

    // Load fragments
    await viewer.loadFragments(CONFIG.FRAGMENT_URLS);

    // Verify model count
    const modelCount = viewer.getLoadedModelCount();
    console.log(`[Fragment Viewer Test] Loaded ${modelCount} models`);

    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }

    // Expose for smoke test
    (window as unknown as { viewer: FragmentViewer }).viewer = viewer;

    console.log("[Fragment Viewer Test] Ready!");
  } catch (error) {
    console.error("[Fragment Viewer Test] Initialization failed:", error);
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
    if (errorDisplay) {
      errorDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
      errorDisplay.style.display = "block";
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
