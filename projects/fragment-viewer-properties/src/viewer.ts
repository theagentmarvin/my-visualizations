/**
 * Viewer module - 3D fragment viewer using That Open Components
 * 
 * Adapted from property-inspector project in this repo.
 * Uses @thatopen/components for BIM/fragment loading and rendering.
 * 
 * REFERENCE: For correct pick/highlight usage, see:
 *   - projects/ifc-test-1/src/main.ts (primary reference)
 *   - That Open Components docs: https://docs.thatopen.com/api/@thatopen/components/classes/Raycasters
 * 
 * IMPORTANT: Always use @thatopen/components Raycasters + @thatopen/components-front Highlighter
 * for selection in fragment projects. Do NOT use raw three.js raycast against fragment scene.
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
  canvas: HTMLCanvasElement;
  onElementSelected: (result: SelectionResult | null) => void;
}

export class FragmentViewer {
  public components!: OBC.Components;
  public world!: OBC.World<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  public fragments!: OBC.FragmentsManager;
  public highlighter!: OBCF.Highlighter;
  public raycaster!: OBC.Raycaster;
  public container: HTMLElement;
  public canvas: HTMLCanvasElement;
  
  // Fallback raycaster for defensive programming
  private fallbackRaycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private onElementSelectedCallback: ((result: SelectionResult | null) => void) | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor(containerId: string, canvasId: string) {
    const container = document.getElementById(containerId);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!container) throw new Error(`Container #${containerId} not found`);
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    
    this.container = container;
    this.canvas = canvas;
    this.fallbackRaycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create components instance
    this.components = new OBC.Components();

    // Create world
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBC.SimpleRenderer
    >();

    // Set up world
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.renderer = new OBC.SimpleRenderer(this.components, this.container);
    this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);

    this.components.init();
    this.world.scene.setup();
    this.world.scene.three.background = new THREE.Color(CONFIG.VIEWER.backgroundColor);

    // Set camera position
    const [x, y, z, tx, ty, tz] = CONFIG.VIEWER.cameraPosition;
    await this.world.camera.controls.setLookAt(x, y, z, tx, ty, tz);

    // Add grid for reference
    if (CONFIG.VIEWER.showGrid) {
      const grid = this.components.get(OBC.Grids);
      grid.create(this.world);
    }

    // Initialize FragmentsManager with worker URL
    const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
    const fetchedUrl = await fetch(githubUrl);
    const workerBlob = await fetchedUrl.blob();
    const workerFile = new File([workerBlob], "worker.mjs", {
      type: "text/javascript",
    });
    const workerUrl = URL.createObjectURL(workerFile);

    this.fragments = this.components.get(OBC.FragmentsManager);
    this.fragments.init(workerUrl);

    // Set up camera update for culling/LOD
    this.world.camera.controls.addEventListener("update", () => {
      this.fragments.core.update();
    });

    // Handle model loading
    this.fragments.list.onItemSet.add(({ value: model }) => {
      console.log(`[Model Loaded] ${model.modelId}`);
      model.useCamera(this.world.camera.three);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
    });

    // Fix z-fighting on materials
    this.fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
      if (!("isLodMaterial" in material && material.isLodMaterial)) {
        material.polygonOffset = true;
        material.polygonOffsetUnits = 1;
        material.polygonOffsetFactor = Math.random();
      }
    });

    // Set up highlighter (from components-front)
    this.highlighter = this.components.get(OBCF.Highlighter);
    await this.highlighter.setup({ world: this.world });

    // Set up raycaster (from components) for proper fragment picking
    const casters = this.components.get(OBC.Raycasters);
    this.raycaster = casters.get(this.world);

    // Set up click handler for selection
    this.setupSelectionHandler();

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized");
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
      const raycastResult = await this.raycaster.castRay();
      
      if (raycastResult) {
        selectionResult = {
          object: raycastResult.object,
          localId: raycastResult.localId,
          modelId: raycastResult.fragments.modelId,
          instanceId: raycastResult.instanceId,
          fragments: raycastResult.fragments,
        };

        // Highlight using Highlighter API with model context
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

  public async loadFragments(urls: string[]): Promise<void> {
    console.log("[FragmentViewer] Loading fragment models...", urls);
    
    await Promise.all(
      urls.map(async (path) => {
        const modelId = path.split("/").pop()?.split(".").shift();
        if (!modelId) return null;
        console.log(`[Loading] ${modelId} from ${path}`);
        const file = await fetch(path);
        const buffer = await file.arrayBuffer();
        return this.fragments.core.load(buffer, { modelId });
      })
    );
    
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
