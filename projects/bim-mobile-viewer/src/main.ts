import * as OBC from "@thatopen/components";
import * as THREE from "three";

// Global variables
let components;
let world;
let fragments;
let categoryData = [];
let loadedModels = [];

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
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  world.camera.controls.enableDamping = true;
  world.camera.controls.dampingFactor = 0.05;
  
  // Get fragments manager
  fragments = components.get(OBC.FragmentsManager);
  
  // Initialize fragments worker
  await fragments.init("https://thatopen.github.io/engine_fragment/resources/worker.mjs");
  
  // Handle window resize
  window.addEventListener("resize", onWindowResize);
  
  console.log("✅ Components and world initialized");
}

// Load fragment models using fragments.core.load()
async function loadModels() {
  console.log("📦 Loading models...");
  
  const loadingText = document.querySelector(".loading-text");
  
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
      
      // Load model using fragments.core.load with modelId
      const model = await fragments.core.load(arrayBuffer, { modelId: id });
      loadedModels.push(model);
      
      console.log(`✅ Loaded model: ${id}`);
    } catch (error) {
      console.error(`❌ Error loading model ${url}:`, error);
    }
  }
  
  // Update fragments after all loads
  await fragments.core.update(true);
  
  // Fit camera to scene
  fitCameraToScene();
  
  console.log("✅ All models loaded");
}

// Extract categories from loaded fragments
async function extractCategories() {
  console.log("🔍 Extracting categories...");
  
  try {
    // Get all fragment IDs
    const fragmentIds = fragments.core.list();
    console.log(`Found ${fragmentIds.length} fragments`);
    
    const categoryMap = new Map<string, number>();
    
    // Iterate through all fragments to collect category data
    for (const fragmentId of fragmentIds) {
      const fragment = fragments.core.get(fragmentId);
      if (fragment && fragment.data) {
        // Try to get category from fragment data
        const category = fragment.data.category || fragment.data.type || "Unknown";
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
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
  const tbody = document.getElementById("category-tbody");
  const summary = document.getElementById("category-summary");
  
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
  document.getElementById("btn-reset").onclick = fitCameraToScene;
  document.getElementById("btn-zoom-in").onclick = () => zoomCamera(0.8);
  document.getElementById("btn-zoom-out").onclick = () => zoomCamera(1.2);
  document.getElementById("btn-top").onclick = setTopView;
  document.getElementById("btn-front").onclick = setFrontView;
  document.getElementById("btn-iso").onclick = setIsoView;
  
  // Search functionality
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    filterTable(query);
  });
  
  // Double-tap on canvas to fit view
  const canvas = document.getElementById("viewer-canvas");
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
  const container = document.getElementById("viewer-container");
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  world.renderer.resize();
  world.camera.updateAspect();
}

// Fit camera to scene
function fitCameraToScene() {
  if (!world || !fragments) return;
  
  try {
    // Get all fragment meshes
    const fragmentIds = fragments.core.list();
    if (fragmentIds.length === 0) return;
    
    const box = new THREE.Box3();
    
    for (const fragmentId of fragmentIds) {
      const fragment = fragments.core.get(fragmentId);
      if (fragment && fragment.mesh) {
        box.expandByObject(fragment.mesh);
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
  world.camera.controls.update();
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
  loading.classList.add("hidden");
}

// Show error message
function showError(message: string) {
  const loadingText = document.querySelector(".loading-text");
  if (loadingText) {
    loadingText.textContent = message;
    loadingText.style.color = "#ef4444";
  }
}

// Start the application
init();
