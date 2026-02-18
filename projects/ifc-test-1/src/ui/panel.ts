/**
 * panel.ts — BUI Side Panel with Raycasting Selection UI
 *
 * Creates the floating control panel using @thatopen/ui (Web Components / Lit).
 * Now includes raycasting selection controls:
 *   - Color picker for selection highlight
 *   - Clear selection button
 *   - Item properties display
 *
 * AGENT NOTE:
 * - Always call BUI.Manager.init() BEFORE calling createPanel()
 * - The panel re-renders by calling updatePanel() — call this whenever model
 *   state changes (models loaded, models removed, selection changes)
 * - Use getters for selectionColor and selectedAttributes to enable reactivity
 */

import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import {
  loadFragmentFromUrl,
  disposeModel,
  disposeAllModels,
  downloadAllModels,
} from "../core/fragments";

// Demo .frag files from the That Open Company CDN.
const DEMO_MODEL_URLS = [
  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
];

/**
 * Configuration options for the panel including raycasting selection state.
 * Use getters for selectionColor and selectedAttributes to enable reactivity.
 */
export interface PanelConfig {
  /** Current selection highlight color - use getter for reactivity */
  selectionColor: THREE.Color;
  /** Currently selected element's attributes - use getter for reactivity */
  selectedAttributes: FRAGS.ItemData | undefined;
  /** Callback to clear all selections */
  onClearSelection: () => Promise<void>;
  /** Callback when selection color changes */
  onColorChange: (color: THREE.Color) => void;
}

/**
 * Creates the main side panel and returns the panel element plus a
 * function to trigger a re-render.
 *
 * @param fragments - FragmentsManager instance from setupFragments()
 * @param config - Panel configuration including selection state
 * @returns [panelElement, updateFn]
 */
export function createPanel(
  fragments: OBC.FragmentsManager,
  config: PanelConfig,
): [HTMLElement, () => void] {
  const [panel, updatePanel] = BUI.Component.create<BUI.PanelSection, {}>(
    (_) => {
      // ── Check model states ─────────────────────────────────────────────────
      const showLoadBtn = fragments.list.size === 0;
      const hasArchModel = [...fragments.list.keys()].some((key) =>
        /arq/.test(key),
      );
      const hasModels = fragments.list.size > 0;

      // Get current values from config (which may be reactive getters)
      const currentColor = config.selectionColor;
      const currentAttrs = config.selectedAttributes;

      // ── Load button ────────────────────────────────────────────────────────
      const loadBtn = BUI.html`
        <bim-button
          label="Load fragments"
          ?hidden=${!showLoadBtn}
          @click=${async ({ target }: { target: BUI.Button }) => {
            target.loading = true;
            await Promise.all(
              DEMO_MODEL_URLS.map(async (url) => {
                const modelId = url.split("/").pop()?.split(".").shift();
                if (modelId) await loadFragmentFromUrl(fragments, url, modelId);
              }),
            );
            target.loading = false;
          }}
        ></bim-button>
      `;

      // ── Dispose arch model button ──────────────────────────────────────────
      const disposeArchBtn = BUI.html`
        <bim-button
          label="Dispose Arch Model"
          ?hidden=${!hasArchModel}
          @click=${() => {
            const modelId = [...fragments.list.keys()].find((key) =>
              /arq/.test(key),
            );
            if (modelId) disposeModel(fragments, modelId);
          }}
        ></bim-button>
      `;

      // ── Dispose all button ─────────────────────────────────────────────────
      const disposeAllBtn = BUI.html`
        <bim-button
          label="Dispose All Models"
          ?hidden=${!hasModels}
          @click=${() => disposeAllModels(fragments)}
        ></bim-button>
      `;

      // ── Export button ──────────────────────────────────────────────────────
      const exportBtn = BUI.html`
        <bim-button
          label="Export fragments"
          ?hidden=${!hasModels}
          @click=${() => downloadAllModels(fragments)}
        ></bim-button>
      `;

      // ── Build properties content ───────────────────────────────────────────
      let propertiesContent;
      if (currentAttrs) {
        const propertyRows: Array<{key: string, value: string}> = [];

        for (const [key, value] of Object.entries(currentAttrs)) {
          let displayValue = "N/A";
          if (value && typeof value === "object" && "value" in value) {
            displayValue = String(value.value);
          } else if (value !== undefined && value !== null) {
            displayValue = String(value);
          }

          if (!key.startsWith("_") && key !== "LocalId") {
            propertyRows.push({ key, value: displayValue });
          }
        }

        if (propertyRows.length > 0) {
          propertiesContent = BUI.html`
            <div style="max-height: 300px; overflow-y: auto;">
              ${propertyRows.map(({ key, value }) => BUI.html`
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333;">
                  <bim-label style="font-weight: 600; color: #888;">${key}</bim-label>
                  <bim-label style="text-align: right; max-width: 60%; word-break: break-word;">${value}</bim-label>
                </div>
              `)}
            </div>
          `;
        } else {
          propertiesContent = BUI.html`<bim-label style="color: #888;">No properties available</bim-label>`;
        }
      } else {
        propertiesContent = BUI.html`
          <bim-label style="color: #888; font-style: italic;">
            Double-click an element to see its properties
          </bim-label>
        `;
      }

      // ── Panel template ─────────────────────────────────────────────────────
      return BUI.html`
        <bim-panel active label="BIM Viewer" class="options-menu">

          <bim-panel-section label="Models">
            ${loadBtn}
            ${disposeArchBtn}
            ${disposeAllBtn}
            ${exportBtn}
          </bim-panel-section>

          <bim-panel-section label="Selection Controls" ?hidden=${!hasModels}>
            <bim-label>Double Click on element to select/highlight</bim-label>
            <bim-color-input
              label="Highlight Color"
              color="#${currentColor.getHexString()}"
              @input=${({ target }: { target: BUI.ColorInput }) => {
                const newColor = new THREE.Color(target.color);
                config.onColorChange(newColor);
              }}>
            </bim-color-input>
            <bim-button
              label="Clear Selection"
              @click=${async ({ target }: { target: BUI.Button }) => {
                target.loading = true;
                await config.onClearSelection();
                target.loading = false;
              }}>
            </bim-button>
          </bim-panel-section>

          <bim-panel-section label="Item Properties" ?hidden=${!hasModels}>
            ${propertiesContent}
          </bim-panel-section>

        </bim-panel>
      `;
    },
    {},
  );

  return [panel, updatePanel];
}

/**
 * Creates the small floating toggle button shown on mobile.
 * Clicking it shows/hides the main panel.
 *
 * @param panel - The main panel element returned by createPanel()
 * @returns The toggle button element
 */
export function createMobileToggle(panel: HTMLElement): HTMLElement {
  return BUI.Component.create<BUI.PanelSection>(() => {
    return BUI.html`
      <bim-button
        class="phone-menu-toggler"
        icon="solar:settings-bold"
        @click=${() => {
          panel.classList.toggle("options-menu-visible");
        }}
      ></bim-button>
    `;
  });
}
