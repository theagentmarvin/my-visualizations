import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import Stats from "stats.js";

// ============================================
// IFC Test 1 - BIM Viewer with Property Inspector
// ============================================

const container = document.getElementById("container")!;

// 2. Create components instance
const components = new OBC.Components();

// 3. Create world
const worlds = components.get(OBC.Worlds);
const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBC.SimpleRenderer
>();

// 4. Set up world
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.OrthoPerspectiveCamera(components);

components.init();
world.scene.setup();
world.scene.three.background = new THREE.Color("#1a1a2e");

// 5. Set camera position
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

// 6. Add a grid for reference
const grid = components.get(OBC.Grids);
grid.create(world);

// 7. Initialize FragmentsManager with worker URL
const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const fetchedUrl = await fetch(githubUrl);
const workerBlob = await fetchedUrl.blob();
const workerFile = new File([workerBlob], "worker.mjs", {
  type: "text/javascript",
});
const workerUrl = URL.createObjectURL(workerFile);

const fragments = components.get(OBC.FragmentsManager);
fragments.init(workerUrl);

// 8. Set up camera update for culling/LOD
world.camera.controls.addEventListener("update", () => fragments.core.update());

// 9. Handle model loading
fragments.list.onItemSet.add(({ value: model }) => {
  console.log(`[Model Loaded] ${model.modelId}`);
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragments.core.update(true);
  updatePropertyPanel();
});

// 10. Fix z-fighting on materials
fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
  if (!("isLodMaterial" in material && material.isLodMaterial)) {
    material.polygonOffset = true;
    material.polygonOffsetUnits = 1;
    material.polygonOffsetFactor = Math.random();
  }
});

// ============================================
// Property Inspector
// ============================================

let selectedElement: any = null;
let elementProperties: Record<string, any> = {};

// Highlighter for selection
const highlighter = components.get(OBC.Highlighter);
highlighter.setup({ world });

// Raycaster for picking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle click for selection
container.addEventListener("click", async (event) => {
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, world.camera.three);
  
  // Get all meshes from loaded models
  const meshes: THREE.Mesh[] = [];
  for (const [, model] of fragments.list) {
    model.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });
  }

  const intersects = raycaster.intersectObjects(meshes, true);
  
  if (intersects.length > 0) {
    const intersect = intersects[0];
    selectedElement = intersect.object;
    
    // Generate mock properties for the selected element
    elementProperties = generateMockProperties(selectedElement);
    
    // Highlight the selected element
    highlighter.clear();
    highlighter.highlightByID("selection", [intersect.instanceId || 0]);
    
    updatePropertyPanel();
  } else {
    selectedElement = null;
    elementProperties = {};
    highlighter.clear();
    updatePropertyPanel();
  }
});

// Generate mock properties based on element name
function generateMockProperties(object: THREE.Object3D): Record<string, any> {
  const name = object.name || "Unknown Element";
  const type = name.includes("Wall") ? "Wall" : 
               name.includes("Door") ? "Door" : 
               name.includes("Window") ? "Window" : 
               name.includes("Floor") ? "Floor" : 
               name.includes("Roof") ? "Roof" : "Building Element";
  
  return {
    "General": {
      "Name": name,
      "Type": type,
      "Global ID": `GUID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      "Description": `Sample ${type.toLowerCase()} element from BIM model`,
    },
    "Geometry": {
      "Volume": `${(Math.random() * 100 + 10).toFixed(2)} m³`,
      "Area": `${(Math.random() * 500 + 50).toFixed(2)} m²`,
      "Height": `${(Math.random() * 10 + 2).toFixed(2)} m`,
      "Width": `${(Math.random() * 5 + 1).toFixed(2)} m`,
    },
    "Materials": {
      "Material": type === "Wall" ? "Concrete" : type === "Window" ? "Glass" : "Steel",
      "Color": "#" + Math.floor(Math.random() * 16777215).toString(16),
      "Transparency": type === "Window" ? "0.7" : "0.0",
    },
    "Structural": {
      "Load Bearing": type === "Wall" || type === "Floor" ? "Yes" : "No",
      "Fire Rating": "2 Hours",
      "Structural Role": type === "Wall" ? "Exterior" : "Non-Structural",
    },
    "Custom": {
      "Level": `Level ${Math.floor(Math.random() * 5) + 1}`,
      "Phase": "New Construction",
      "Comments": "Sample data for property inspector demo",
    }
  };
}

// ============================================
// Load Fragments Function
// ============================================

const loadFragments = async () => {
  const fragPaths = [
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ];

  console.log("[IFC Test 1] Loading BIM models...");
  await Promise.all(
    fragPaths.map(async (path) => {
      const modelId = path.split("/").pop()?.split(".").shift();
      if (!modelId) return null;
      console.log(`[Loading] ${modelId}`);
      const file = await fetch(path);
      const buffer = await file.arrayBuffer();
      return fragments.core.load(buffer, { modelId });
    }),
  );
  console.log("[IFC Test 1] All models loaded!");
};

const deleteAllModels = () => {
  for (const [modelId] of fragments.list) {
    fragments.core.disposeModel(modelId);
  }
  selectedElement = null;
  elementProperties = {};
  highlighter.clear();
  updatePropertyPanel();
  console.log("[IFC Test 1] All models disposed");
};

// ============================================
// UI Setup
// ============================================

BUI.Manager.init();

// Property Panel Component
const [propertyPanel, updatePropertyPanel] = BUI.Component.create<BUI.Panel, {}>((_) => {
  const hasModels = fragments.list.size > 0;
  const hasSelection = selectedElement !== null;

  // Build property sections
  const propertySections = hasSelection 
    ? Object.entries(elementProperties).map(([category, props]) => {
        const propItems = Object.entries(props).map(([key, value]) => {
          return BUI.html`
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333;">
              <bim-label style="color: #888; font-size: 12px;">${key}</bim-label>
              <bim-label style="color: #fff; font-size: 12px; text-align: right;">${value}</bim-label>
            </div>
          `;
        });
        
        return BUI.html`
          <bim-panel-section label="${category}" collapsed>
            ${propItems}
          </bim-panel-section>
        `;
      })
    : [];

  return BUI.html`
    <bim-panel label="Property Inspector" style="position: fixed; top: 5px; right: 5px; width: 320px; max-height: 80vh; overflow-y: auto; z-index: 999;">
      <bim-panel-section label="Models">
        <bim-label>Loaded Models: ${fragments.list.size}</bim-label>
        ${!hasModels ? BUI.html`<bim-button label="Load Sample Models" @click=${loadFragments}></bim-button>` : ""}
        ${hasModels ? BUI.html`<bim-button label="Clear All Models" @click=${deleteAllModels}></bim-button>` : ""}
      </bim-panel-section>
      
      ${hasSelection ? BUI.html`
        <bim-panel-section label="Selected Element">
          <bim-label style="color: #4fc3f7; font-weight: bold;">${selectedElement?.name || "Unknown"}</bim-label>
        </bim-panel-section>
      ` : hasModels ? BUI.html`
        <bim-panel-section label="Selection">
          <bim-label style="color: #888; font-size: 12px;">Click on any element to view properties</bim-label>
        </bim-panel-section>
      ` : ""}
      
      ${propertySections}
    </bim-panel>
  `;
}, {});

document.body.append(propertyPanel);

// Controls Panel (Left side)
const [controlsPanel] = BUI.Component.create<BUI.Panel, {}>((_) => {
  return BUI.html`
    <bim-panel label="Controls" style="position: fixed; top: 5px; left: 5px; width: 200px; z-index: 999;">
      <bim-panel-section label="Camera">
        <bim-button label="Reset View" @click=${async () => {
          await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
        }}></bim-button>
        <bim-button label="Top View" @click=${async () => {
          await world.camera.controls.setLookAt(26, 100, 25, 26, 0, 25);
        }}></bim-button>
        <bim-button label="Front View" @click=${async () => {
          await world.camera.controls.setLookAt(26, 10, 150, 26, 0, 25);
        }}></bim-button>
      </bim-panel-section>
      
      <bim-panel-section label="Scene">
        <bim-color-input label="Background" color="#1a1a2e"
          @input="${({ target }: { target: any }) => {
            world.scene.config.backgroundColor = new THREE.Color(target.color);
          }}">
        </bim-color-input>
      </bim-panel-section>
      
      <bim-panel-section label="Info">
        <bim-label style="font-size: 11px; color: #888;">
          Click elements to inspect properties
        </bim-label>
      </bim-panel-section>
    </bim-panel>
  `;
}, {});

document.body.append(controlsPanel);

// Mobile menu button
const menuButton = BUI.Component.create<BUI.Button>(() => {
  return BUI.html`
    <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
      style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;"
      @click="${() => {
        propertyPanel.classList.toggle("options-menu-visible");
      }}">
    </bim-button>
  `;
});
document.body.append(menuButton);

// Performance stats
const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);
stats.dom.style.left = "auto";
stats.dom.style.right = "340px";
stats.dom.style.top = "5px";
stats.dom.style.zIndex = "999";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());

// ============================================
// Initialize
// ============================================

console.log("[IFC Test 1] BIM Viewer Initialized");
console.log("[IFC Test 1] Click 'Load Sample Models' to view BIM data");

// Auto-load models after a short delay
setTimeout(() => {
  if (fragments.list.size === 0) {
    loadFragments();
  }
}, 500);
