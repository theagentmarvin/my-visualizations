/**
 * Fragment Viewer - Core viewer implementation
 * 
 * Uses FragmentsAdapter + OBC Raycasters + Highlighter pattern.
 * Based on canonical implementation from fragment-viewer-properties.
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

export class FragmentViewer {
  public components!: OBC.Components;
  public world!: OBC.World;
  public fragments!: OBC.FragmentsManager;
  public highlighter!: OBCF.Highlighter;
  public raycaster!: OBC.SimpleRaycaster;
  public container: HTMLElement;

  private onElementSelectedCallback: ((result: SelectionResult | null) => void) | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;
  private resizeObserver: ResizeObserver | null = null;
  private highlightColor: THREE.Color;
  private mouse = new THREE.Vector2();

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;
    this.highlightColor = new THREE.Color(CONFIG.SELECTION.highlightColor);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Create components instance
    this.components = new OBC.Components();

    // Setup world
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create();

    // Scene setup
    const scene = new OBC.SimpleScene(this.components);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scene as any).setup();
    this.world.scene = scene;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.world.scene.three as any).background = null;

    // Renderer setup - renders to container
    this.world.renderer = new OBC.SimpleRenderer(this.components, this.container);

    // Camera setup - store in local var first to avoid null check issues
    const camera = new OBC.OrthoPerspectiveCamera(this.components);
    this.world.camera = camera;

    // Initialize components
    this.components.init();

    // Add grid
    if (CONFIG.VIEWER.showGrid) {
      this.components.get(OBC.Grids).create(this.world);
    }

    // Get FragmentsManager
    this.fragments = this.components.get(OBC.FragmentsManager);

    // Set up camera update for culling/LOD - use local camera var
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (camera as any).controls.addEventListener("update", () => {
      this.fragments.core.update();
    });

    // Handle model loading - use local camera var
    this.fragments.list.onItemSet.add(({ value: model }) => {
      console.log(`[Model Loaded] ${model.modelId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model.useCamera((camera as any).three);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
    });

    // Set up highlighter
    this.highlighter = this.components.get(OBCF.Highlighter);
    await this.highlighter.setup({ world: this.world });

    // Set up raycaster
    const casters = this.components.get(OBC.Raycasters);
    this.raycaster = casters.get(this.world);

    // Set up click handler
    this.setupSelectionHandler();

    // Set up ResizeObserver
    this.setupResizeObserver();

    // Set initial camera position
    const [x, y, z, tx, ty, tz] = CONFIG.VIEWER.cameraPosition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (camera as any).controls.setLookAt(x, y, z, tx, ty, tz);

    this.isInitialized = true;
    console.log("[FragmentViewer] Initialized");
  }

  private setupResizeObserver(): void {
    // Use ResizeObserver to handle container resize
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.container) {
          this.handleResize();
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    // Resize is handled by OBC.SimpleRenderer internally
    // but we ensure fragments are updated
    if (this.fragments?.core) {
      this.fragments.core.update(true);
    }
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

  private async handleClick(event: MouseEvent): Promise<void> {
    // Calculate mouse position in Normalized Device Coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    let selectionResult: SelectionResult | null = null;

    try {
      // Use OBC Raycasters per official example
      const raycastResult = await this.raycaster.castRay() as {
        object: THREE.Object3D;
        localId: number;
        fragments: FRAGS.FragmentsModel;
        instanceId?: number;
      } | null;

      if (raycastResult) {
        selectionResult = {
          object: raycastResult.object,
          localId: raycastResult.localId,
          modelId: raycastResult.fragments.modelId,
          instanceId: raycastResult.instanceId,
          fragments: raycastResult.fragments,
        };

        // Use fragments.highlight per official ThatOpen example
        const modelIdMap: OBC.ModelIdMap = {
          [raycastResult.fragments.modelId]: new Set([raycastResult.localId])
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
      } else {
        await this.clearSelection();
      }
    } catch (error) {
      console.warn("[FragmentViewer] Selection failed:", error);
      await this.clearSelection();
    }

    // Notify callback
    if (this.onElementSelectedCallback) {
      this.onElementSelectedCallback(selectionResult);
    }
  }

  private async clearSelection(): Promise<void> {
    try {
      await this.fragments.resetHighlight();
      await this.fragments.core.update(true);
    } catch (error) {
      console.warn("[FragmentViewer] Clear selection failed:", error);
      this.highlighter.clear("selection");
    }
  }

  public set onElementSelected(callback: (result: SelectionResult | null) => void) {
    this.onElementSelectedCallback = callback;
  }

  /**
   * Load fragment models using FragmentsAdapter pattern
   * Uses fragments.load() which is the standard approach
   */
  public async loadFragments(urls: readonly string[]): Promise<void> {
    console.log("[FragmentViewer] Loading fragment models...", urls);

    for (const path of urls) {
      const filename = path.split("/").pop();
      const modelId = filename?.split(".").shift();
      if (!modelId) {
        console.warn(`[FragmentViewer] Could not extract model ID from ${path}`);
        continue;
      }

      console.log(`[Loading] ${modelId} from ${path}`);
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Use fragments.load() - standard FragmentsAdapter pattern
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = (this.fragments as any).load(data, {
        name: modelId,
        coordinate: true,
      });

      this.world.scene.three.add(group);
      console.log(`[Loaded] ${modelId}`);
    }

    // Fit camera to scene
    const meshes: THREE.Mesh[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (this.fragments as any).groups as Map<string, THREE.Group>;
    if (groups) {
      groups.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      });
    }

    if (meshes.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.world.camera as any).fit(meshes, 0.5);
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.components?.dispose();
  }
}
