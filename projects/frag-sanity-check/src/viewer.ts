import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/fragments';
import * as OBCF from '@thatopen/components-front';

export interface Selection {
  modelId: string | null;
  localId: number | null;
}

export class FragmentViewer {
  components: OBC.Components;
  world: OBC.World;
  fragments: OBC.FragmentsManager;
  raycaster: OBC.Raycasters;
  highlighter: OBCF.Highlighter;
  container: HTMLElement;
  selection: Selection = { modelId: null, localId: null };
  private loadedModels: Set<string> = new Set();
  private onSelectionCallback?: (selection: Selection) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.components = new OBC.Components();
    
    // Create world with simple scene, camera, renderer
    this.world = this.components.get(OBC.Worlds).create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();
    
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.renderer = new OBC.SimpleRenderer(this.components, this.container);
    this.world.camera = new OBC.SimpleCamera(this.components);
    
    // Setup scene
    (this.world.scene as OBC.SimpleScene).setup();
    
    // Set background
    const scene = this.world.scene.three as THREE.Scene;
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Initialize fragments manager
    this.fragments = this.components.get(OBC.FragmentsManager);
    
    // Initialize raycaster
    this.raycaster = this.components.get(OBC.Raycasters);
    
    // Initialize highlighter
    this.highlighter = this.components.get(OBCF.Highlighter);
    
    // Setup double-click handler
    this.setupInteraction();
    
    // Start render loop
    this.components.init();
  }

  async init(_workerUrl?: string) {
    // In the latest API, worker is handled internally or not needed for loading .frag files
    // The FragmentsManager doesn't need explicit init with worker URL for basic loading
    // Setup highlighter after world is ready
    this.highlighter.setup({ world: this.world });
    this.highlighter.add('select', new THREE.Color(0x4fc3f7));
  }

  async loadModel(url: string, modelId: string): Promise<void> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    const group = this.fragments.load(data);
    group.uuid = modelId;
    
    this.loadedModels.add(modelId);
    
    // Add to scene
    this.world.scene.three.add(group);
    
    // Fit camera to first loaded model
    if (this.loadedModels.size === 1) {
      this.fitCameraToModel(group);
    }
  }

  private fitCameraToModel(group: OBF.FragmentsGroup) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const camera = this.world.camera.three;
    const distance = maxDim * 1.5;
    
    camera.position.set(
      center.x + distance,
      center.y + distance,
      center.z + distance
    );
    camera.lookAt(center);
    
    // Update controls if available
    const controls = (this.world as any).controls;
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }

  private setupInteraction() {
    this.container.addEventListener('dblclick', (event) => {
      this.handleDoubleClick(event);
    });
  }

  private handleDoubleClick(event: MouseEvent) {
    const rect = this.container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const caster = this.raycaster.get(this.world);
    
    // Get all meshes from fragments
    const meshes = this.fragments.meshes;
    const position = new THREE.Vector2(x, y);
    
    const result = caster.castRay(meshes, position);
    
    if (result && result.object) {
      // Find which fragment group this mesh belongs to
      const fragmentMesh = result.object as OBF.FragmentMesh;
      
      if (fragmentMesh && result.instanceId !== undefined) {
        // Find the fragment group that contains this mesh
        let foundModelId: string | null = null;
        
        for (const [id, group] of this.fragments.groups) {
          for (const fragment of group.items) {
            if (fragment.mesh === fragmentMesh) {
              foundModelId = id;
              break;
            }
          }
          if (foundModelId) break;
        }
        
        if (foundModelId) {
          const localId = result.instanceId;
          
          this.selection = { modelId: foundModelId, localId };
          
          // Highlight using fragmentIdMap format
          const fragmentMap: OBF.FragmentIdMap = {};
          const fragmentId = fragmentMesh.uuid;
          fragmentMap[fragmentId] = new Set([localId]);
          
          this.highlighter.highlightByID('select', fragmentMap, true);
          
          if (this.onSelectionCallback) {
            this.onSelectionCallback(this.selection);
          }
        }
      }
    } else {
      // Clear selection if clicked on empty space
      this.selection = { modelId: null, localId: null };
      this.highlighter.clear('select');
      
      if (this.onSelectionCallback) {
        this.onSelectionCallback(this.selection);
      }
    }
  }

  getLoadedModelCount(): number {
    return this.loadedModels.size;
  }

  onSelection(callback: (selection: Selection) => void) {
    this.onSelectionCallback = callback;
  }

  getSelection(): Selection {
    return this.selection;
  }

  dispose() {
    this.fragments.dispose();
    this.components.dispose();
  }
}

// patch: commit to force new version - 2026-02-21T14:47:27Z