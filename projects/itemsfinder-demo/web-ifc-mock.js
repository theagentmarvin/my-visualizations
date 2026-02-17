// web-ifc-mock.js - Empty mock for web-ifc to bypass IFC loading
// This allows @thatopen/components to load without actually loading web-ifc
// when only using Fragments (no IFC file support needed)

export const IFCSKIPSPACE = 0;

export class IfcAPI {
  constructor() {
    console.log('[web-ifc-mock] IfcAPI instantiated (mock - no IFC support)');
  }
  
  async Init() {
    console.log('[web-ifc-mock] Init() called (mock - no-op)');
    return Promise.resolve();
  }
  
  async OpenModel() {
    console.log('[web-ifc-mock] OpenModel() called (mock - not supported)');
    throw new Error('IFC models are not supported in Fragments-only mode');
  }
  
  async CreateModel() {
    console.log('[web-ifc-mock] CreateModel() called (mock - not supported)');
    throw new Error('IFC model creation is not supported in Fragments-only mode');
  }
  
  async GetGeometry() {
    return null;
  }
  
  async GetLine() {
    return null;
  }
  
  async WriteLine() {
    return Promise.resolve();
  }
  
  async ExportFileAsIFC() {
    return new Uint8Array();
  }
  
  async Dispose() {
    return Promise.resolve();
  }
  
  GetModelSchema() {
    return 'IFC4';
  }
  
  IsModelOpen() {
    return false;
  }
  
  GetMaxExpressID() {
    return 0;
  }
  
  GetCoordinationMatrix() {
    return new Float64Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  }
  
  SetGeometryTransformation() {
    // no-op
  }
}

export default {
  IfcAPI,
  IFCSKIPSPACE
};
