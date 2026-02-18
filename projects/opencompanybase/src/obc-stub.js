class _Emitter {
  constructor() { this._cbs = new Set(); }
  add(cb) { this._cbs.add(cb); }
  addEventListener(cb) { this.add(cb); }
  remove(cb) { this._cbs.delete(cb); }
  addListener(cb) { this.add(cb); }
  dispatch(...args) { for (const cb of Array.from(this._cbs)) cb(...args); }
  addOnce(cb){ const fn=(...a)=>{cb(...a); this.remove(fn)}; this.add(fn);} 
}

class SimpleScene {
  constructor(components){ this.three = { background: null, add: ()=>{} }; }
  setup(){}
}

class SimpleRenderer {
  constructor(components, container){ this.onBeforeUpdate = new _Emitter(); this.onAfterUpdate = new _Emitter(); }
}

class OrthoPerspectiveCamera {
  constructor(components){ this.controls = { setLookAt: async ()=>{}, addEventListener: ()=>{} }; this.three = {}; }
}

class WorldsManager {
  create(){
    const world = {
      scene: null,
      renderer: null,
      camera: null,
      onCameraChanged: new _Emitter()
    };
    return world;
  }
}

class FragmentsCore {
  constructor(){
    this.models = { materials: { list: new _Emitter() } };
    this.modelsList = new Map();
    this.models = { materials: { list: new _Emitter() } };
    this.models = this.models; // noop
  }
  update(){}
  async load(buffer, opts){ const model = { object: {}, useCamera: ()=>{} }; return model; }
}

class _FragmentsManager {
  constructor(){ this.core = new FragmentsCore(); this.list = new Map(); this.list.onItemSet = new _Emitter(); }
  init(){}
}

class FinderQuery {
  constructor(name){ this.name = name; }
  async test(){ return {}; }
}

class _ItemsFinder {
  constructor(){ this.list = new Map(); }
  create(name, data){ this.list.set(name, new FinderQuery(name)); }
}

class _Hider {
  async isolate(map){}
  async set(v){}
}

class _Components {
  constructor(){
    this._map = new Map();
    this._map.set('Worlds', new WorldsManager());
    this._map.set('FragmentsManager', new _FragmentsManager());
    this._map.set('ItemsFinder', new _ItemsFinder());
    this._map.set('Hider', new _Hider());
  }
  get(key){ const name = typeof key === 'string' ? key : (key && key.name) || key; return this._map.get(name) || this._map.get(key) || null; }
  init(){}
}

export const Worlds = 'Worlds';
export const FragmentsManager = 'FragmentsManager';
export const ItemsFinder = 'ItemsFinder';
export const Hider = 'Hider';
export const SimpleScene = SimpleScene;
export const SimpleRenderer = SimpleRenderer;
export const OrthoPerspectiveCamera = OrthoPerspectiveCamera;
export const Components = _Components;

export default {
  Components,
  Worlds,
  FragmentsManager,
  ItemsFinder,
  Hider,
  SimpleScene,
  SimpleRenderer,
  OrthoPerspectiveCamera
  };
