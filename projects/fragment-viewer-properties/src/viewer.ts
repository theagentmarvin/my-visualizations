/**
 * Viewer module - 3D fragment viewer using That Open Components
 * 
 * REFERENCE: Raycasters implementation based on ThatOpen official example:
 *   - https://raw.githubusercontent.com/ThatOpen/engine_components/main/packages/core/src/core/Raycasters/example.ts
 * 
 * Aligned with canonical viewer implementation from:
 *   - my-visualizations/projects/bim-viewer/index.html (renderer, camera, scene setup)
 *   - my-visualizations/projects/bim-mobile-viewer/index.html (highlighter setup)
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
  world: OBC.World;
  fragments: OBC.FragmentsManager;
  highlighter: OBCF.Highlighter;
  raycaster: OBC.SimpleRaycaster;
  container: HTMLElement;
  onElementSelected: (result: SelectionResult | null) => void;
}

export class FragmentViewer {
  public components!: OBC.Components;
  public world!: OBC.World;
  public fragments!: OBC.FragmentsManager;
  public highlighter!: OBCF.Highlighter;
  public raycaster!: OBC.SimpleRaycaster;
  public container: HTMLElement;
  
  // Fallback raycaster for defensive programming
  private fallbackRaycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private highlightColor: THREE.Color;
  
  private onElementSelectedCallback: ((result: SelectionResult | null) => void) | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) throw new Error(`Container #${containerId} not found`);
    
    this.container = container;
    this.fallbackRaycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.highlightColor = new THREE.Color(CONFIG.SELECTION.highlightColor);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create components instance - matches bim-viewer
    this.components = new OBC.Components();

    // Setup world - matches bim-viewer pattern
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create();

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

    // Get FragmentsManager - matches bim-viewer
    this.fragments = this.components.get(OBC.FragmentsManager);

    // Initialize FragmentsManager worker (required before loading/fragments operations)
    // Mirrors ThatOpen example: fetch worker.mjs and pass URL to fragments.init().
    // We await here to ensure fragments.core is available before any listeners access it.
    try {
      const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", {
        type: "text/javascript",
      });
      const workerUrl = URL.createObjectURL(workerFile);
      await this.fragments.init(workerUrl);
    } catch (err) {
      console.warn('[FragmentViewer] Failed to initialize fragments worker:', err);
      // rethrow so initialization stops and error shows in UI
      throw err;
    }

    // Remove z-fighting on materials (same fix used in canonical viewers)
    this.fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
      if (!("isLodMaterial" in material && material.isLodMaterial)) {
        material.polygonOffset = true;
        material.polygonOffsetUnits = 1;
        material.polygonOffsetFactor = Math.random();
      }
    });


    // Initialize FragmentsManager worker (required before loading/fragments operations)
    // Mirrors ThatOpen example: fetch worker.mjs and pass URL to fragments.init()
    try {
      const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", {
        type: "text/javascript",
      });
      const workerUrl = URL.createObjectURL(workerFile);
      this.fragments.init(workerUrl);
    } catch (err) {
      console.warn('[FragmentViewer] Failed to initialize fragments worker:', err);
    }

    // Remove z-fighting on materials (same fix used in canonical viewers)
    this.fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
      if (!("isLodMaterial" in material && material.isLodMaterial)) {
        material.polygonOffset = true;
        material.polygonOffsetUnits = 1;
        material.polygonOffsetFactor = Math.random();
      }
    });


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

    // Set up highlighter (from components-front) - for non-fragment highlighting if needed
    this.highlighter = this.components.get(OBCF.Highlighter);
    await this.highlighter.setup({ world: this.world });

    // Set up raycaster (from components) for proper fragment picking
    // REFERENCE: https://raw.githubusercontent.com/ThatOpen/engine_components/main/packages/core/src/core/Raycasters/example.ts
    const casters = this.components.get(OBC.Raycasters);
    this.raycaster = casters.get(this.world);

    // Set up click handler for selection
    this.setupSelectionHandler();

    // Set initial camera position - matches bim-viewer exactly
    const [x, y, z, tx, ty, tz] = CONFIG.VIEWER.cameraPosition;
    await this.world.camera.controls.setLookAt(x, y, z, tx, ty, tz);

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized - using OBC Raycasters (example.ts pattern)");
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
      // PRIMARY METHOD: Use OBC Raycasters per official example
      // REFERENCE: https://raw.githubusercontent.com/ThatOpen/engine_components/main/packages/core/src/core/Raycasters/example.ts
      const raycastResult = (await this.raycaster.castRay()) as any;
      
      if (raycastResult) {
        selectionResult = {
          object: raycastResult.object,
          localId: raycastResult.localId,
          modelId: raycastResult.fragments.modelId,
          instanceId: raycastResult.instanceId,
          fragments: raycastResult.fragments,
        };

        // The modelIdMap is how selections are represented in the engine.
        // The keys are modelIds, while the values are sets of localIds (items within the model)
        const modelIdMap: OBC.ModelIdMap = {
          [raycastResult.fragments.modelId]: new Set([raycastResult.localId])
        };

        // Use fragments.highlight per official ThatOpen example
        // REFERENCE: https://raw.githubusercontent.com/ThatOpen/engine_components/main/packages/core/src/core/Raycasters/example.ts
        await this.fragments.highlight(
          {
            color: this.highlightColor,
            renderedFaces: FRAGS.RenderedFaces.ONE,
            opacity: 1,
            transparent: false,
          },
          modelIdMap,
        );

        await this.fragments.core.update(true);
      } else {
        // No hit - clear selection
        await this.clearSelection();
      }
    } catch (error) {
      console.warn("[FragmentViewer] castRay() failed, using fallback:", error);
      
      // FALLBACK METHOD: Filtered three.js raycast (defensive)
      selectionResult = await this.fallbackRaycast();
      
      if (selectionResult) {
        try {
          const modelIdMap: OBC.ModelIdMap = {
            [selectionResult.modelId]: new Set([selectionResult.localId])
          };
          
          await this.fragments.highlight(
            {
              color: this.highlightColor,
              renderedFaces: FRAGS.RenderedFaces.ONE,
              opacity: 1,
              transparent: false,
            },
            modelIdMap,
          );
          
          await this.fragments.core.update(true);
        } catch (highlightError) {
          console.warn("[FragmentViewer] Fallback highlight failed:", highlightError);
          this.highlighter.clear("selection");
        }
      } else {
        await this.clearSelection();
      }
    }

    // Notify callback with stable selection result
    if (this.onElementSelectedCallback) {
      this.onElementSelectedCallback(selectionResult);
    }
  }

  /**
   * Clear the current selection
   * Uses fragments.resetHighlight() per official ThatOpen example
   * REFERENCE: https://raw.githubusercontent.com/ThatOpen/engine_components/main/packages/core/src/core/Raycasters/example.ts
   */
  private async clearSelection(): Promise<void> {
    try {
      await this.fragments.resetHighlight();
      await this.fragments.core.update(true);
    } catch (error) {
      console.warn("[FragmentViewer] fragments.resetHighlight() failed, falling back to highlighter.clear():", error);
      this.highlighter.clear("selection");
    }
  }

  /**
   * Fallback raycast method using raw three.js
   * Only used when castRay() is unavailable or throws
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
