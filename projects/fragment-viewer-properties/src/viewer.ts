/**
 * Viewer module - 3D fragment viewer using That Open Components
 * 
 * Adapted from property-inspector project in this repo.
 * Uses @thatopen/components for BIM/fragment loading and rendering.
 */

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { CONFIG } from "./config.js";

export interface ViewerAPI {
  components: OBC.Components;
  world: OBC.World<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  fragments: OBC.FragmentsManager;
  highlighter: OBCF.Highlighter;
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  onElementSelected: (element: THREE.Object3D | null, instanceId?: number) => void;
}

interface SelectionEvent {
  object: THREE.Object3D;
  instanceId?: number;
}

export class FragmentViewer {
  public components!: OBC.Components;
  public world!: OBC.World<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  public fragments!: OBC.FragmentsManager;
  public highlighter!: OBCF.Highlighter;
  public container: HTMLElement;
  public canvas: HTMLCanvasElement;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onElementSelectedCallback: ((element: THREE.Object3D | null, instanceId?: number) => void) | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor(containerId: string, canvasId: string) {
    const container = document.getElementById(containerId);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!container) throw new Error(`Container #${containerId} not found`);
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    
    this.container = container;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
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
    this.highlighter.setup({ world: this.world });

    // Set up click handler for selection
    this.setupSelectionHandler();

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized");
  }

  private setupSelectionHandler(): void {
    this.container.addEventListener("click", (event) => {
      // Debounce selection
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }

      this.selectionTimeout = setTimeout(() => {
        this.handleClick(event);
      }, CONFIG.SELECTION.debounceMs);
    });
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.world.camera.three);

    // Get all meshes from loaded models
    const meshes: THREE.Mesh[] = [];
    for (const [, model] of this.fragments.list) {
      model.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    }

    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const selectedObject = intersect.object;
      const instanceId = intersect.instanceId;

      // Highlight the selected element
      this.highlighter.clear();
      if (instanceId !== undefined) {
        this.highlighter.highlightByID("selection", [instanceId]);
      }

      // Notify callback
      if (this.onElementSelectedCallback) {
        this.onElementSelectedCallback(selectedObject, instanceId);
      }
    } else {
      // Clear selection
      this.highlighter.clear();
      if (this.onElementSelectedCallback) {
        this.onElementSelectedCallback(null);
      }
    }
  }

  public set onElementSelected(callback: (element: THREE.Object3D | null, instanceId?: number) => void) {
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
