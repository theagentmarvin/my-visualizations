/**
 * Viewer module - 3D fragment viewer using That Open Components
 *
 * Refactored to use FragmentsAdapter for compatibility and clarity.
 */

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { CONFIG } from "./config.js";
import { FragmentsAdapter } from "./fragments-adapter.js";

export interface SelectionResult {
  object: THREE.Object3D;
  localId: number;
  modelId: string;
  instanceId?: number;
  fragments: FRAGS.FragmentsModel;
  attributes?: any;
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

  // Adapter for normalized fragments API
  private adapter!: FragmentsAdapter;

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

    // Create components instance
    this.components = new OBC.Components();

    // Setup world
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create();

    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.scene.setup();
    this.world.scene.three.background = null;

    this.world.renderer = new OBC.SimpleRenderer(this.components, this.container);
    this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);

    this.components.init();

    if (CONFIG.VIEWER.showGrid) {
      this.components.get(OBC.Grids).create(this.world);
    }

    // Adapter for fragments
    this.adapter = new FragmentsAdapter(this.components);

    // Initialize fragments manager worker (await)
    const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
    const fetchedUrl = await fetch(githubUrl);
    const workerBlob = await fetchedUrl.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    const workerUrl = URL.createObjectURL(workerFile);

    await this.adapter.init(workerUrl);
    // keep fragments reference for legacy usage
    this.fragments = this.adapter.fragments;

    // Remove z-fighting on materials (already handled by adapter/core, keep as safety)
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

    // Handle model loading - add to scene when loaded (listener kept for core-load compatibility)
    this.fragments.list.onItemSet.add(({ value: model }) => {
      model.useCamera(this.world.camera.three);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
    });

    // Highlighter
    this.highlighter = this.components.get(OBCF.Highlighter);
    await this.highlighter.setup({ world: this.world });

    // Raycaster from components
    const casters = this.components.get(OBC.Raycasters);
    this.raycaster = casters.get(this.world);

    // Selection handler
    this.setupSelectionHandler();

    const [x, y, z, tx, ty, tz] = CONFIG.VIEWER.cameraPosition;
    await this.world.camera.controls.setLookAt(x, y, z, tx, ty, tz);

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized - using FragmentsAdapter and OBC Raycasters");
  }

  private setupSelectionHandler(): void {
    this.container.addEventListener("click", (event) => {
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }
      this.selectionTimeout = setTimeout(() => {
        this.handleClick(event);
      }, CONFIG.SELECTION.debounceMs);
    });
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    let selectionResult: SelectionResult | null = null;

    try {
      const raycastResult = (await this.raycaster.castRay()) as any;

      if (raycastResult) {
        selectionResult = {
          object: raycastResult.object,
          localId: raycastResult.localId,
          modelId: raycastResult.fragments.modelId,
          instanceId: raycastResult.instanceId,
          fragments: raycastResult.fragments,
        };

        const modelIdMap: OBC.ModelIdMap = {
          [raycastResult.fragments.modelId]: new Set([raycastResult.localId])
        };

        // fetch attributes via adapter
        let itemAttributes: any = undefined;
        try {
          const ids = [...modelIdMap[raycastResult.fragments.modelId]];
          if (ids.length > 0) {
            const res = await this.adapter.getItemsData(raycastResult.fragments.modelId, ids);
            if (res && res.length > 0) itemAttributes = res[0];
          }
        } catch (e) {
          console.warn('[FragmentViewer] getItemsData failed', e);
        }

        selectionResult.attributes = itemAttributes;

        // Debug (kept intentionally): selection details
        console.log('[FragmentViewer] selection', selectionResult.modelId, selectionResult.localId, selectionResult.attributes);

        // highlight using adapter
        await this.adapter.highlight({
          color: this.highlightColor,
          renderedFaces: FRAGS.RenderedFaces.ONE,
          opacity: 1,
          transparent: false,
        }, modelIdMap);

      } else {
        await this.clearSelection();
      }
    } catch (error) {
      console.warn("[FragmentViewer] castRay() failed, using fallback:", error);

      selectionResult = await this.fallbackRaycast();

      if (selectionResult) {
        try {
          const modelIdMap: OBC.ModelIdMap = {
            [selectionResult.modelId]: new Set([selectionResult.localId])
          };
          await this.adapter.highlight({
            color: this.highlightColor,
            renderedFaces: FRAGS.RenderedFaces.ONE,
            opacity: 1,
            transparent: false,
          }, modelIdMap);
        } catch (highlightError) {
          console.warn("[FragmentViewer] Fallback highlight failed:", highlightError);
          this.highlighter.clear("selection");
        }
      } else {
        await this.clearSelection();
      }
    }

    if (this.onElementSelectedCallback) {
      this.onElementSelectedCallback(selectionResult);
    }
  }

  private async clearSelection(): Promise<void> {
    try {
      await this.adapter.resetHighlight();
    } catch (error) {
      console.warn("[FragmentViewer] resetHighlight failed, falling back:", error);
      this.highlighter.clear("selection");
    }
  }

  public async loadFragments(urls: string[]): Promise<void> {
    console.log("[FragmentViewer] Loading fragment models...", urls);

    for (const path of urls) {
      const modelId = path.split("/").pop()?.split(".").shift();
      if (!modelId) continue;
      console.log(`[Loading] ${modelId} from ${path}`);
      const file = await fetch(path);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      try {
        const res = await this.adapter.load(data, { modelId });
        if (res.group) {
          this.world.scene.three.add(res.group);
          console.log(`[Loaded] ${modelId} (group)`);
        } else if (res.model) {
          res.model.useCamera(this.world.camera.three);
          this.world.scene.three.add(res.model.object);
          console.log(`[Loaded] ${modelId} (core.load)`);
        }
      } catch (e) {
        console.error('[FragmentViewer] Failed to load fragment', modelId, e);
      }
    }

    // Fit camera to scene using adapter
    const meshes = this.adapter.collectMeshes();
    if (meshes.length > 0) {
      await this.world.camera.fit(meshes, 0.5);
    }

    console.log("[FragmentViewer] All models loaded!");
  }

  public getLoadedModelCount(): number {
    return this.fragments?.list.size ?? 0;
  }



  // Expose a simple setter so external code (main.ts) can register a callback
  public set onElementSelected(callback: (result: SelectionResult | null) => void) {
    this.onElementSelectedCallback = callback;
  }

  public dispose(): void {
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    this.components?.dispose();
  }
}
