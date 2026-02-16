import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import CameraControls from "camera-controls";

// Global variables with proper types
let components: OBC.Components;
let world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
let fragments: OBC.FragmentsManager;
let categoryData: { category: string; count: number }[] = [];
let loadedModels: FRAGS.FragmentsGroup[] = [];

// Model URLs
const MODEL_URLS = [
  {
    url: "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    id: "school_arq"
  },
  {
    url: "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
    id: "school_str"
  }
];

// Initialize the application
async function init() {
  try {
    console.log("🚀 Initializing BIM Mobile Viewer with That Open Components...");
    
    // Setup That Open Components with proper world
    await setupComponents();
    
    // Load fragment models
    await loadModels();
    
    // Extract categories from fragments
    await extractCategories();
    
    // Populate table
    populateCategoryTable();
    
    // Setup UI interactions
    setupUI();
    
    // Hide loading screen
    hideLoading();
    
    console.log("✅ BIM Mobile Viewer initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing viewer:", error);
    showError("Failed to initialize viewer. Please refresh the page.");
  }
}

// Setup That Open Components with worlds.create()
async function setupComponents() {
  // Create components instance
  components = new OBC.Components();
  
  // Get the worlds component
  const worlds = components.get(OBC.Worlds);
  
  // Create world with SimpleScene, OrthoPerspectiveCamera, SimpleRenderer
  world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBC.SimpleRenderer
  >();
  
  // Setup scene
  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = new THREE.Color(0xf5f5f5);
  
  // Setup renderer
  const canvas = document.getElementById("viewer-canvas") as HTMLCanvasElement;
  world.renderer = new OBC.SimpleRenderer(components, canvas);
  
  // Setup camera
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  
  // Initialize components
  components.init();
  
  // Setup controls for touch interaction
  world.camera.controls.touches = {
    one: CameraControls.ACTION.TOUCH_ROTATE,
    two: CameraControls.ACTION.TOUCH_DOLLY_ROTATE,
    three: CameraControls.ACTION.NONE
  };
  world.camera.controls.smoothTime = 0.05;
  
  // Get fragments manager
  fragments = components.get(OBC.FragmentsManager);

  // Handle fragment groups when loaded
  fragments.groups.onItemSet.add(({ value: group }) => {
    world.scene.three.add(group);
  });

  // Set initial camera position
  await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

  // Handle window resize
  window.addEventListener("resize", onWindowResize);

  console.log("✅ Components and world initialized");
}

// Load fragment models using fragments.load()
async function loadModels() {
  console.log("📦 Loading models...");
  
  const loadingText = document.querySelector(".loading-text") as HTMLElement;
  
  for (let i = 0; i < MODEL_URLS.length; i++) {
    const { url, id } = MODEL_URLS[i];
    loadingText.textContent = `Loading model ${i + 1} of ${MODEL_URLS.length}...`;
    
    try {
      // Fetch the fragment file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load model using fragments.load (returns FragmentsGroup)
      const group = fragments.load(uint8Array, { 
        coordinate: true,
        name: id 
      });
      loadedModels.push(group);
      
      console.log(`✅ Loaded model: ${id}`);
    } catch (error) {
      console.error(`❌ Error loading model ${url}:`, error);
    }
  }
  
  // Fit camera to scene after all loads
  fitCameraToScene();
  
  console.log("✅ All models loaded");
}

// Extract categories from loaded fragments
async function extractCategories() {
  console.log("🔍 Extracting categories...");
  
  try {
    const categoryMap = new Map<string, number>();
    
    // Iterate through all loaded groups
    for (const group of loadedModels) {
      // Get items (fragments) from the group
      for (const fragment of group.items) {
        // Try to get category from fragment data
        // Fragments don't have a direct 'data' property with category
        // We count by fragment ID instead
        const category = fragment.id?.split("-")[0] || "Unknown";
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    }
    
    // If we have groups but no fragment categories, use model names
    if (categoryMap.size === 0 && loadedModels.length > 0) {
      for (const group of loadedModels) {
        const name = group.ifcMetadata?.name || "Unknown Model";
        categoryMap.set(name, group.items.length || 1);
      }
    }
    
    // Convert to array and sort by count
    categoryData = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // If no categories found, add placeholder
    if (categoryData.length === 0) {
      categoryData = [
        { category: "Architecture Model", count: 1 },
        { category: "Structure Model", count: 1 }
      ];
    }
    
    console.log(`✅ Extracted ${categoryData.length} categories`);
  } catch (error) {
    console.error("Error extracting categories:", error);
    // Fallback
    categoryData = [
      { category: "Models Loaded", count: loadedModels.length }
    ];
  }
}

// Populate category table
function populateCategoryTable() {
  const tbody = document.getElementById("category-tbody") as HTMLTableSectionElement;
  const summary = document.getElementById("category-summary") as HTMLElement;
  
  tbody.innerHTML = "";
  
  categoryData.forEach(({ category, count }) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${category}</td>
      <td>${count}</td>
    `;
    tbody.appendChild(row);
  });
  
  const totalElements = categoryData.reduce((sum, item) => sum + item.count, 0);
  summary.textContent = `${categoryData.length} categories • ${totalElements} elements`;
}

// Setup UI interactions
function setupUI() {
  // Navigation buttons
  const btnReset = document.getElementById("btn-reset");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnTop = document.getElementById("btn-top");
  const btnFront = document.getElementById("btn-front");
  const btnIso = document.getElementById("btn-iso");
  
  if (btnReset) btnReset.onclick = fitCameraToScene;
  if (btnZoomIn) btnZoomIn.onclick = () => zoomCamera(0.8);
  if (btnZoomOut) btnZoomOut.onclick = () => zoomCamera(1.2);
  if (btnTop) btnTop.onclick = setTopView;
  if (btnFront) btnFront.onclick = setFrontView;
  if (btnIso) btnIso.onclick = setIsoView;
  
  // Search functionality
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      filterTable(query);
    });
  }
  
  // Double-tap on canvas to fit view
  const canvas = document.getElementById("viewer-canvas");
  if (canvas) {
    let lastTap = 0;
    canvas.addEventListener("touchend", (e) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        fitCameraToScene();
        e.preventDefault();
      }
      lastTap = currentTime;
    });
  }
}

// Filter table based on search query
function filterTable(query: string) {
  const rows = document.querySelectorAll("#category-tbody tr");
  rows.forEach(row => {
    const category = row.querySelector("td")?.textContent?.toLowerCase() || "";
    (row as HTMLElement).style.display = category.includes(query) ? "" : "none";
  });
}

// Window resize handler
function onWindowResize() {
  if (world?.renderer) {
    world.renderer.resize();
  }
  if (world?.camera) {
    world.camera.updateAspect();
  }
}

// Fit camera to scene
function fitCameraToScene() {
  if (!world || loadedModels.length === 0) return;
  
  try {
    const box = new THREE.Box3();
    
    // Expand box by all loaded groups
    for (const group of loadedModels) {
      if (group.boundingBox) {
        box.union(group.boundingBox);
      }
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Position camera
    const distance = maxDim * 1.5;
    world.camera.controls.setLookAt(
      center.x + distance, center.y + distance, center.z + distance,
      center.x, center.y, center.z,
      true // smooth animation
    );
    
    console.log("📷 Camera fitted to scene");
  } catch (error) {
    console.error("Error fitting camera:", error);
  }
}

// Zoom camera by factor
function zoomCamera(factor: number) {
  const direction = new THREE.Vector3();
  world.camera.three.getWorldDirection(direction);
  world.camera.three.position.addScaledVector(direction, -world.camera.three.position.length() * (factor - 1));
}

// Set top view
function setTopView() {
  const target = new THREE.Vector3(0, 0, 0);
  world.camera.controls.setLookAt(0, 50, 0, target.x, target.y, target.z, true);
}

// Set front view
function setFrontView() {
  const target = new THREE.Vector3(0, 0, 0);
  world.camera.controls.setLookAt(0, 0, 50, target.x, target.y, target.z, true);
}

// Set isometric view
function setIsoView() {
  const target = new THREE.Vector3(0, 0, 0);
  world.camera.controls.setLookAt(30, 30, 30, target.x, target.y, target.z, true);
}

// Hide loading screen
function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.add("hidden");
  }
}

// Show error message
function showError(message: string) {
  const loadingText = document.querySelector(".loading-text") as HTMLElement;
  if (loadingText) {
    loadingText.textContent = message;
    loadingText.style.color = "#ef4444";
  }
}

// Start the application
init();
