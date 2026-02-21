/**
 * Viewer module - 3D fragment viewer using That Open Components
 * 
 * Aligned with canonical viewer implementation from:
 *   - my-visualizations/projects/bim-viewer/index.html (renderer, camera, scene setup)
 *   - my-visualizations/projects/bim-mobile-viewer/index.html (highlighter setup)
 * 
 * REFERENCE: This implementation matches the canonical bim-viewer project in:
 *   - World/scene initialization
 *   - Renderer configuration
 *   - Camera setup and initial position
 *   - Grid and environment
 *   - Fragment loading approach
 * 
 * SELECTION FIX PRESERVED: Uses OBC Raycasters + OBCF Highlighter
 * as the primary selection method (from ifc-test-1 project).
 */

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { CONFIG } from "./config.js";

export interface SelectionResult {
  /** The selected fragment object */
  object: THREE.Object3D;
  /** Local ID (express ID) of the selected element */
  localId: number;
  /** Model ID the selection belongs to */
  modelId: string;
  /** Instance ID for instanced geometry */
  instanceId?: number;
  /** Raw fragment model reference */
  fragments: FRAGS.FragmentsModel;
}

export interface ViewerAPI {
  components: OBC.Components;
  world: OBC.World<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  fragments: OBC.FragmentsManager;
  highlighter: OBCF.Highlighter;
  raycaster: OBC.Raycaster;
  container: HTMLElement;
  onElementSelected: (result: SelectionResult | null) => void;
}

export class FragmentViewer {
  public components!: OBC.Components;
  public world!: OBC.World<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  public fragments!: OBC.FragmentsManager;
  public highlighter!: OBCF.Highlighter;
  public raycaster!: OBC.Raycaster;
  public container: HTMLElement;
  
  // Fallback raycaster for defensive programming
  private fallbackRaycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private onElementSelectedCallback: ((result: SelectionResult | null) => void) | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) throw new Error(`Container #${containerId} not found`);
    
    this.container = container;
    this.fallbackRaycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create components instance - matches bim-viewer
    this.components = new OBC.Components();

    // Setup world - matches bim-viewer pattern
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBC.SimpleRenderer
    >();

    // Scene setup - matches bim-viewer exactly
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.scene.setup();
    // Canonical bim-viewer uses null (transparent) background
    this.world.scene.three.background = null;

    // Renderer setup - matches bim-viewer (renders to container)
    this.world.renderer = new OBC.SimpleRenderer(this.components, this.container);
    
    // Camera setup - matches bim-viewer (OrthoPerspectiveCamera)
    this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);

    // Initialize components - matches bim-viewer
    this.components.init();

    // Add grid - matches bim-viewer
    if (CONFIG.VIEWER.showGrid) {
      this.components.get(OBC.Grids).create(this.world);
    }

    // Get FragmentsManager - matches bim-viewer (no worker URL needed for basic loading)
    this.fragments = this.components.get(OBC.FragmentsManager);

    // Set up camera update for culling/LOD
    this.world.camera.controls.addEventListener("update", () => {
      this.fragments.core.update();
    });

    // Handle model loading - add to scene when loaded
    this.fragments.list.onItemSet.add(({ value: model }) => {
      console.log(`[Model Loaded] ${model.modelId}`);
      model.useCamera(this.world.camera.three);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
    });

    // Set up highlighter (from components-front) - selection fix preserved
    this.highlighter = this.components.get(OBCF.Highlighter);
    await this.highlighter.setup({ world: this.world });

    // Set up raycaster (from components) for proper fragment picking - selection fix preserved
    const casters = this.components.get(OBC.Raycasters);
    this.raycaster = casters.get(this.world);

    // Set up click handler for selection - selection fix preserved
    this.setupSelectionHandler();

    // Set initial camera position - matches bim-viewer exactly
    const [x, y, z, tx, ty, tz] = CONFIG.VIEWER.cameraPosition;
    await this.world.camera.controls.setLookAt(x, y, z, tx, ty, tz);

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized - aligned with bim-viewer canonical implementation");
  }

  private setupSelectionHandler(): void {
    this.container.addEventListener("click", (event) => {
      // Debounce selection (150ms)
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }

      this.selectionTimeout = setTimeout(() => {
        this.handleClick(event);
      }, CONFIG.SELECTION.debounceMs);
    });
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    // Calculate mouse position in Normalized Device Coordinates (NDC)
    // NDC: -1 to +1 for both axes, Y is inverted
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    let selectionResult: SelectionResult | null = null;

    try {
      // PRIMARY METHOD: Use engine's pick API (handles instanced geometry correctly)
      // This is the selection fix from ifc-test-1 project
      const raycastResult = await this.raycaster.castRay();
      
      if (raycastResult) {
        selectionResult = {
          object: raycastResult.object,
          localId: raycastResult.localId,
          modelId: raycastResult.fragments.modelId,
          instanceId: raycastResult.instanceId,
          fragments: raycastResult.fragments,
        };

        // Highlight using Highlighter API with model context - selection fix preserved
        const modelIdMap: OBC.ModelIdMap = {
          [raycastResult.fragments.modelId]: new Set([raycastResult.localId])
        };
        await this.highlighter.highlight("selection", modelIdMap);
      } else {
        // No hit - clear selection
        this.highlighter.clear("selection");
      }
    } catch (error) {
      console.warn("[FragmentViewer] Engine pick API failed, falling back to raycast:", error);
      
      // FALLBACK METHOD: Filtered three.js raycast (defensive)
      selectionResult = await this.fallbackRaycast();
      
      if (selectionResult) {
        try {
          const modelIdMap: OBC.ModelIdMap = {
            [selectionResult.modelId]: new Set([selectionResult.localId])
          };
          await this.highlighter.highlight("selection", modelIdMap);
        } catch (highlightError) {
          console.warn("[FragmentViewer] Fallback highlight failed:", highlightError);
        }
      } else {
        this.highlighter.clear("selection");
      }
    }

    // Notify callback
    if (this.onElementSelectedCallback) {
      this.onElementSelectedCallback(selectionResult);
    }
  }

  /**
   * Fallback raycast method using raw three.js
   * Only used when engine pick API is unavailable
   * Filters to only objects with geometry.attributes.position to avoid errors
   */
  private async fallbackRaycast(): Promise<SelectionResult | null> {
    try {
      this.fallbackRaycaster.setFromCamera(this.mouse, this.world.camera.three);

      // Get all meshes from loaded models - FILTER for valid geometry
      const meshes: THREE.Mesh[] = [];
      for (const [, model] of this.fragments.list) {
        model.object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Defensive: only include meshes with valid position attribute
            const geometry = child.geometry;
            if (geometry && 'attributes' in geometry && geometry.attributes.position) {
              meshes.push(child);
            }
          }
        });
      }

      if (meshes.length === 0) return null;

      const intersects = this.fallbackRaycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const selectedObject = intersect.object as THREE.Mesh;
        const instanceId = intersect.instanceId;

        // Try to find the parent model
        let modelId = "unknown";
        let fragments: FRAGS.FragmentsModel | undefined;
        
        for (const [id, model] of this.fragments.list) {
          let found = false;
          model.object.traverse((child) => {
            if (child === selectedObject || child === selectedObject.parent) {
              found = true;
            }
          });
          if (found) {
            modelId = id;
            fragments = model;
            break;
          }
        }

        // Generate a local ID from instance or object UUID
        const localId = instanceId ?? selectedObject.id;

        return {
          object: selectedObject,
          localId,
          modelId,
          instanceId,
          fragments: fragments ?? ({} as FRAGS.FragmentsModel),
        };
      }

      return null;
    } catch (error) {
      console.error("[FragmentViewer] Fallback raycast failed:", error);
      return null;
    }
  }

  public set onElementSelected(callback: (result: SelectionResult | null) => void) {
    this.onElementSelectedCallback = callback;
  }

  /**
   * Load fragment models - aligned with bim-viewer canonical implementation
   * Uses fragments.load() which is the standard approach in bim-viewer
   */
  public async loadFragments(urls: string[]): Promise<void> {
    console.log("[FragmentViewer] Loading fragment models...", urls);
    
    for (const path of urls) {
      const modelId = path.split("/").pop()?.split(".").shift();
      if (!modelId) continue;
      
      console.log(`[Loading] ${modelId} from ${path}`);
      const file = await fetch(path);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      // Use fragments.load() - matches bim-viewer canonical implementation
      const group = this.fragments.load(data, {
        name: modelId,
        coordinate: true,
      });
      
      // Add to scene - matches bim-viewer
      this.world.scene.three.add(group);
      console.log(`[Loaded] ${modelId}`, group);
    }
    
    // Fit camera to scene after loading - matches bim-viewer
    const meshes: THREE.Mesh[] = [];
    this.fragments.groups.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    });
    
    if (meshes.length > 0) {
      await this.world.camera.fit(meshes, 0.5);
    }
    
    console.log("[FragmentViewer] All models loaded!");
  }

  public getLoadedModelCount(): number {
    return this.fragments?.list.size ?? 0;
  }

  public dispose(): void {
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    this.components?.dispose();
  }
}
