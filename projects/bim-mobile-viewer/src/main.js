import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Global variables
let world, components, fragments;
let camera, renderer, controls, scene;
let categoryData = [];
let fragmentModels = [];

// Model URLs
const MODEL_URLS = [
  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag"
];

// Initialize the application
async function init() {
  try {
    console.log("🚀 Initializing BIM Mobile Viewer...");
    
    // Setup Three.js scene
    setupScene();
    
    // Setup That Open Components
    await setupComponents();
    
    // Load models
    await loadModels();
    
    // Extract categories from fragments
    await extractCategories();
    
    // Populate table
    populateCategoryTable();
    
    // Setup UI interactions
    setupUI();
    
    // Start render loop
    animate();
    
    // Hide loading screen
    hideLoading();
    
    console.log("✅ BIM Mobile Viewer initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing viewer:", error);
    showError("Failed to initialize viewer. Please refresh the page.");
  }
}

// Setup Three.js scene
function setupScene() {
  const canvas = document.getElementById("viewer-canvas");
  const container = document.getElementById("viewer-container");
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  
  // Create camera
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(20, 20, 20);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Create controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  
  // Add lights
  setupLights();
  
  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

// Setup lighting
function setupLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  scene.add(dirLight);
  
  // Fill light
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-30, 20, -30);
  scene.add(fillLight);
}

// Setup That Open Components
async function setupComponents() {
  components = new OBC.Components();
  
  // Get fragments manager
  fragments = components.get(OBC.FragmentsManager);
  
  console.log("✅ Components initialized");
}

// Load fragment models
async function loadModels() {
  console.log("📦 Loading models...");
  
  const loadingText = document.querySelector(".loading-text");
  
  for (let i = 0; i < MODEL_URLS.length; i++) {
    const url = MODEL_URLS[i];
    loadingText.textContent = `Loading model ${i + 1} of ${MODEL_URLS.length}...`;
    
    try {
      // Fetch the fragment file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Load into fragments
      const group = await fragments.load(arrayBuffer);
      fragmentModels.push(group);
      
      // Add to scene
      scene.add(group);
      
      console.log(`✅ Loaded model: ${url}`);
    } catch (error) {
      console.error(`❌ Error loading model ${url}:`, error);
    }
  }
  
  // Fit camera to scene
  fitCameraToScene();
  
  console.log("✅ All models loaded");
}

// Fit camera to scene
function fitCameraToScene() {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
  
  camera.position.set(
    center.x + cameraZ * 0.8,
    center.y + cameraZ * 0.6,
    center.z + cameraZ * 0.8
  );
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}

// Extract categories from fragment models
async function extractCategories() {
  console.log("🔍 Extracting categories...");
  
  const categoryMap = new Map();
  
  for (const group of fragmentModels) {
    try {
      // Get all fragment items from the group
      for (const fragment of group.items) {
        // Get all item IDs in this fragment
        const itemIds = Array.from(fragment.ids);
        
        for (const itemId of itemIds) {
          // Try to get category/type from the item data
          // The fragment data contains item information
          const itemData = group.data.get(itemId);
          
          if (itemData && itemData.length > 1) {
            // ItemData format: [[fragmentIds...], [floorId, typeId]]
            const typeId = itemData[1][1];
            const category = getCategoryName(typeId);
            
            if (category) {
              categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing model:", error);
    }
  }
  
  // Convert to array and sort by count
  categoryData = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  
  // If no categories found, add a placeholder
  if (categoryData.length === 0) {
    categoryData = [
      { category: "BuildingElements", count: fragmentModels.length > 0 ? "Multiple" : 0 }
    ];
  }
  
  console.log(`✅ Found ${categoryData.length} categories`);
}

// Get category name from type ID
function getCategoryName(typeId) {
  // Common IFC type mappings
  const typeMap = {
    42: "IFCWALL",
    43: "IFCWALLSTANDARDCASE",
    60: "IFCSLAB",
    61: "IFCSLABSTANDARDCASE",
    62: "IFCSLABELEMENTEDCASE",
    26: "IFCCOLUMN",
    27: "IFCCOLUMNSTANDARDCASE",
    14: "IFCBEAM",
    15: "IFCBEAMSTANDARDCASE",
    76: "IFCWINDOW",
    74: "IFCDOOR",
    75: "IFCDOORSTANDARDCASE",
    107: "IFCROOF",
    99: "IFCSTAIR",
    100: "IFCSTAIRFLIGHT",
    381: "IFCFURNITURE",
    442: "IFCSYSTEMFURNITUREELEMENT",
    200: "IFCDISTRIBUTIONELEMENT",
    206: "IFCFLOWTERMINAL",
    202: "IFCFLOWCONTROLLER",
    204: "IFCFLOWFITTING"
  };
  
  return typeMap[typeId] || `Type_${typeId}`;
}

// Populate category table
function populateCategoryTable() {
  const tbody = document.getElementById("category-tbody");
  const summary = document.getElementById("category-summary");
  
  tbody.innerHTML = "";
  
  if (categoryData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" style="text-align: center; color: #6b7280; padding: 24px;">
          No categories found
        </td>
      </tr>
    `;
    summary.textContent = "No elements found in model";
    return;
  }
  
  let totalElements = 0;
  
  categoryData.forEach(({ category, count }, index) => {
    const numericCount = typeof count === 'number' ? count : 0;
    if (typeof count === 'number') {
      totalElements += count;
    }
    
    const row = document.createElement("tr");
    row.dataset.category = category;
    row.innerHTML = `
      <td>${category.replace(/^IFC/, "")}</td>
      <td>${count.toLocaleString()}</td>
    `;
    
    // Click to filter
    row.addEventListener("click", () => {
      // Remove previous selection
      tbody.querySelectorAll("tr").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      
      // Filter by category (optional enhancement)
      console.log(`Selected category: ${category}`);
    });
    
    tbody.appendChild(row);
  });
  
  summary.textContent = `${categoryData.length} categories | ${totalElements.toLocaleString()} total elements`;
}

// Setup UI interactions
function setupUI() {
  // Navigation buttons
  document.getElementById("btn-reset").addEventListener("click", () => {
    fitCameraToScene();
  });
  
  document.getElementById("btn-zoom-in").addEventListener("click", () => {
    const distance = camera.position.distanceTo(controls.target);
    camera.position.lerp(controls.target, 0.2);
    controls.update();
  });
  
  document.getElementById("btn-zoom-out").addEventListener("click", () => {
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.add(direction.multiplyScalar(5));
    controls.update();
  });
  
  document.getElementById("btn-top").addEventListener("click", () => {
    const center = controls.target.clone();
    const distance = camera.position.distanceTo(center);
    camera.position.set(center.x, center.y + distance, center.z);
    camera.lookAt(center);
    controls.update();
  });
  
  document.getElementById("btn-front").addEventListener("click", () => {
    const center = controls.target.clone();
    const distance = camera.position.distanceTo(center);
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);
    controls.update();
  });
  
  document.getElementById("btn-iso").addEventListener("click", () => {
    const center = controls.target.clone();
    const distance = camera.position.distanceTo(center);
    camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );
    camera.lookAt(center);
    controls.update();
  });
  
  // Search input
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#category-tbody tr");
    
    rows.forEach(row => {
      const category = row.dataset.category?.toLowerCase() || "";
      if (category.includes(query)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
  
  // Handle touch events for better mobile experience
  const canvas = document.getElementById("viewer-canvas");
  
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      canvas.style.cursor = "grabbing";
    }
  }, { passive: true });
  
  canvas.addEventListener("touchend", () => {
    canvas.style.cursor = "grab";
  }, { passive: true });
  
  // Double-tap to fit
  let lastTap = 0;
  canvas.addEventListener("touchend", (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      fitCameraToScene();
      e.preventDefault();
    }
    lastTap = currentTime;
  });
}

// Handle window resize
function onWindowResize() {
  const container = document.getElementById("viewer-container");
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Hide loading screen
function hideLoading() {
  const loading = document.getElementById("loading");
  loading.classList.add("hidden");
  
  // Remove from DOM after transition
  setTimeout(() => {
    loading.style.display = "none";
  }, 300);
}

// Show error message
function showError(message) {
  const loading = document.getElementById("loading");
  loading.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <p style="color: #ef4444; font-size: 16px; margin-bottom: 12px;">⚠️ ${message}</p>
      <button onclick="location.reload()" style="
        padding: 10px 20px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Reload Page</button>
    </div>
  `;
}

// Start the application
init();