// Minimal ItemsFinder-like demo
// Loads sample glTF fragments and provides search/highlight
// Use esm.sh to provide browser-ready ESM that rewrites internal `three` imports
import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

const container = document.getElementById('viewer-container');
const logsContent = document.getElementById('logs-content');
const logCount = document.getElementById('log-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const resultsPanel = document.getElementById('results-panel');
const loadSampleBtn = document.getElementById('load-sample-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const fileInput = document.getElementById('ifc-file-input');

function log(message, level='info'){
  const now = new Date();
  const ts = now.toLocaleTimeString();
  const div = document.createElement('div');
  div.className = `log-entry ${level}`;
  div.innerHTML = `<span class="timestamp">${ts}</span> <span class="message">${message}</span>`;
  logsContent.prepend(div);
  const count = logsContent.children.length;
  logCount.textContent = `${count} entries`;
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20232a);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(3,3,6);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,1,0);
controls.update();

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,7);
scene.add(light);
const amb = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(amb);

window.addEventListener('resize', onWindowResize);
function onWindowResize(){
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 600;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}
onWindowResize();

// fragment management
const fragments = [];
const loader = new GLTFLoader();

async function loadFragment(url, name){
  log(`Loading fragment ${name || url}`);
  try{
    const gltf = await loader.loadAsync(url);
    const group = new THREE.Group();
    group.name = name || url.split('/').pop();
    let count = 0;
    gltf.scene.traverse(node=>{
      if(node.isMesh){
        node.userData.fragment = group.name;
        node.name = node.name || `${group.name}-mesh-${count++}`;
      }
    });
    group.add(gltf.scene);
    scene.add(group);
    fragments.push(group);
    log(`Loaded fragment ${group.name}`);
    refreshResultsList();
    fitViewToScene();
  }catch(err){
    console.error(err);
    log(`Failed to load ${name}: ${err.message}`, 'error');
  }
}

function refreshResultsList(){
  const items = [];
  scene.traverse(node=>{
    if(node.isMesh){
      items.push({name: node.name, object: node});
    }
  });
  resultsPanel.innerHTML = '';
  items.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'result-item';
    el.textContent = it.name;
    el.onclick = ()=>{focusObject(it.object)};
    resultsPanel.appendChild(el);
  });
}

function focusObject(obj){
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(size, size*0.6, size));
  controls.update();
  highlightObject(obj);
}

let lastHighlighted = null;
function highlightObject(obj){
  if(lastHighlighted) lastHighlighted.material.emissive && (lastHighlighted.material.emissive.setHex(lastHighlighted.userData._emissive||0x000000));
  if(obj.material && obj.material.emissive){
    obj.userData._emissive = obj.material.emissive.getHex();
    obj.material.emissive.setHex(0xff0000);
    lastHighlighted = obj;
  }
}

function clearHighlight(){
  if(lastHighlighted) lastHighlighted.material.emissive && (lastHighlighted.material.emissive.setHex(lastHighlighted.userData._emissive||0x000000));
  lastHighlighted = null;
}

function fitViewToScene(){
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());
  camera.position.copy(center).add(new THREE.Vector3(size, size*0.6, size));
  controls.target.copy(center);
  controls.update();
}

function searchAndHighlight(query){
  clearHighlight();
  const q = query.trim().toLowerCase();
  if(!q) return;
  const matches = [];
  scene.traverse(node=>{
    if(node.isMesh && node.name.toLowerCase().includes(q)) matches.push(node);
  });
  resultsPanel.innerHTML = '';
  if(matches.length===0){ resultsPanel.textContent = 'No matches'; log(`Search '${query}' - no matches`); return; }
  matches.forEach(m=>{
    const el = document.createElement('div');
    el.className = 'result-item';
    el.textContent = `${m.name} (fragment: ${m.userData.fragment||'unknown'})`;
    el.onclick = ()=>{focusObject(m)};
    resultsPanel.appendChild(el);
  });
  log(`Search '${query}' returned ${matches.length} matches`);
}

// Sample fragments (small glb from Khronos samples)
const samples = [
  {url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb', name: 'BoomBox'},
  {url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb', name: 'DamagedHelmet'}
];

// ThatOpen fragments integration (best-effort). Falls back to glTF samples on failure.
async function initThatOpenFragments(){
  log('Attempting to initialize ThatOpen fragments...');
  try{
    // Fetch worker and create object URL
    const workerResp = await fetch('https://thatopen.github.io/engine_fragment/resources/worker.mjs');
    if(!workerResp.ok) throw new Error('worker.mjs fetch failed');
    const workerBlob = await workerResp.blob();
    const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(workerFile);

    // Try several candidate module entrypoints for engine components
    const candidates = [
      'https://thatopen.github.io/engine_components/resources/index.mjs',
      'https://thatopen.github.io/engine_components/resources/components.mjs',
      'https://thatopen.github.io/engine_components/assets/index-BET5fVdQ.js',
      'https://raw.githubusercontent.com/ThatOpen/engine_components/gh-pages/examples/ItemsFinder/assets/index.js'
    ];

    let componentsModule = null;
    for(const url of candidates){
      try{
        log(`Trying to import components from ${url}`);
        componentsModule = await import(/* @vite-ignore */ url);
        if(componentsModule) { log(`Imported components from ${url}`); break; }
      }catch(e){
        console.warn('Import failed for', url, e && e.message);
      }
    }

    if(!componentsModule){
      throw new Error('Could not import ThatOpen components module');
    }

    // Acquire components and initialize fragments manager per tutorial snippet
    const { components, OBC, world } = componentsModule;
    if(!components) throw new Error('components not exposed by module');

    const fragments = components.get(OBC.FragmentsManager);
    fragments.init(workerUrl);

    // wire camera updates to fragments (best-effort if world exists)
    if(world && world.camera && world.camera.controls){
      world.camera.controls.addEventListener('update', () => fragments.core.update());
      world.onCameraChanged && world.onCameraChanged.add((camera) => {
        for (const [, model] of fragments.list) {
          model.useCamera(camera.three);
        }
        fragments.core.update(true);
      });
    }

    const fragPaths = [
      'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag',
      'https://thatopen.github.io/engine_components/resources/frags/school_str.frag',
    ];

    await Promise.all(
      fragPaths.map(async (path) => {
        const modelId = path.split('/').pop()?.split('.').shift();
        if (!modelId) return null;
        log(`Fetching fragment ${path}`);
        const file = await fetch(path);
        const buffer = await file.arrayBuffer();
        const model = await fragments.core.load(buffer, { modelId });
        // Expose model in scene if available
        try{
          if(model && model.object){
            scene.add(model.object);
            log(`Added fragment model ${modelId} to scene`);
          }
        }catch(err){
          console.warn('Could not add fragment model to scene', err && err.message);
        }
        return model;
      }),
    );

    // Hook material polygon offset to avoid z-fighting
    try{
      fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
        if (!('isLodMaterial' in material && material.isLodMaterial)) {
          material.polygonOffset = true;
          material.polygonOffsetUnits = 1;
          material.polygonOffsetFactor = Math.random();
        }
      });
    }catch(e){/* ignore */}

    log('ThatOpen fragments initialized');
    return true;
  }catch(err){
    console.error(err);
    log('ThatOpen fragments initialization failed — falling back to glTF samples', 'error');
    return false;
  }
}

// If a `fragments` manager already exists on the page (e.g. loaded via ThatOpen demo),
// use it directly with the fragPaths snippet from the tutorial. Otherwise run the
// init flow that tries to import the components bundle.
async function tryLoadFragPathsWithExistingFragments(){
  if(typeof window.fragments!=='undefined' && window.fragments.core && typeof window.fragments.core.load==='function'){
    log('Using existing global fragments manager');
    const fragPaths = [
      'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag',
      'https://thatopen.github.io/engine_components/resources/frags/school_str.frag',
    ];
    try{
      await Promise.all(
        fragPaths.map(async (path) => {
          const modelId = path.split('/').pop()?.split('.').shift();
          if (!modelId) return null;
          log(`Fetching fragment ${path}`);
          const file = await fetch(path);
          const buffer = await file.arrayBuffer();
          const m = await window.fragments.core.load(buffer, { modelId });
          if(m && m.object) scene.add(m.object);
          return m;
        }),
      );
      log('Loaded fragments via global fragments manager');
      return true;
    }catch(err){
      console.error(err);
      log('Loading via global fragments failed', 'error');
      return false;
    }
  }
  return false;
}

loadSampleBtn.addEventListener('click', async ()=>{
  searchInput.disabled = false; searchBtn.disabled = false; clearSearchBtn.disabled = false;
  const usedGlobal = await tryLoadFragPathsWithExistingFragments();
  if(usedGlobal) return;
  const ok = await initThatOpenFragments();
  if(!ok){
    for(const s of samples) await loadFragment(s.url, s.name);
  }
});

clearLogsBtn.addEventListener('click', ()=>{logsContent.innerHTML='';logCount.textContent='0 entries';});

fileInput.addEventListener('change', (ev)=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  loadFragment(url, file.name);
});

searchBtn.addEventListener('click', ()=>{searchAndHighlight(searchInput.value)});
clearSearchBtn.addEventListener('click', ()=>{searchInput.value='';clearHighlight();refreshResultsList();});

// Animation
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

log('Viewer ready');
refreshResultsList();
