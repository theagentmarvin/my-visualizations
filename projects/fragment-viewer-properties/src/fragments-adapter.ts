import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as FRAGS from '@thatopen/fragments';

export interface LoadResult {
  model?: any; // FragmentsModel or Group
  group?: THREE.Group;
  modelId?: string;
}

export class FragmentsAdapter {
  private components: OBC.Components;
  public fragments: OBC.FragmentsManager | any;
  private workerUrl?: string;

  constructor(components: OBC.Components) {
    this.components = components;
    this.fragments = this.components.get(OBC.FragmentsManager);
  }

  /** Initialize fragments manager with worker URL (awaitable) */
  public async init(workerUrl: string): Promise<void> {
    this.workerUrl = workerUrl;
    await this.fragments.init(workerUrl);
    // ensure core exists
    const start = Date.now();
    while (!((this.fragments as any)?.core)) {
      if (Date.now() - start > 10000) throw new Error('FragmentsManager init timeout');
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  /** Load a fragment buffer (Uint8Array) - returns normalized result */
  public async load(buffer: Uint8Array, opts: { modelId?: string; name?: string } = {}): Promise<LoadResult> {
    // try modern API
    try {
      if (typeof (this.fragments as any).load === 'function') {
        const groupOrPromise = (this.fragments as any).load(buffer, opts);
        if (groupOrPromise && typeof groupOrPromise.then === 'function') {
          const resolved = await groupOrPromise;
          return { group: resolved as THREE.Group, modelId: opts.modelId };
        } else {
          return { group: groupOrPromise as THREE.Group, modelId: opts.modelId };
        }
      }
    } catch (e) {
      // fall through to core.load
      // console.warn('[FragmentsAdapter] fragments.load failed', e);
    }

    // fallback to core.load
    if (this.fragments && (this.fragments as any).core && typeof (this.fragments as any).core.load === 'function') {
      const model = await (this.fragments as any).core.load(buffer, { modelId: opts.modelId });
      return { model, modelId: opts.modelId };
    }

    throw new Error('No compatible fragments load API available');
  }

  /** Highlight using fragments.highlight when available */
  public async highlight(options: any, modelIdMap: any): Promise<void> {
    if (this.fragments && typeof this.fragments.highlight === 'function') {
      await this.fragments.highlight(options, modelIdMap);
      await this.fragments.core.update(true);
      return;
    }

    // fallback: no-op (or try components-front highlighter)
    return;
  }

  public async resetHighlight(): Promise<void> {
    if (this.fragments && typeof this.fragments.resetHighlight === 'function') {
      await this.fragments.resetHighlight();
      await this.fragments.core.update(true);
    }
  }

  /** Get item attributes for a model and array of ids */
  public async getItemsData(modelId: string, ids: Array<number | string>): Promise<any[]> {
    if (!modelId) return [];
    try {
      const model = this.fragments.list.get(modelId);
      if (model && typeof model.getItemsData === 'function') {
        return await model.getItemsData(ids);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  /** Collect meshes across adapter-managed fragments */
  public collectMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    if (this.fragments && (this.fragments as any).groups && typeof (this.fragments as any).groups.forEach === 'function') {
      (this.fragments as any).groups.forEach((group: any) => {
        group.traverse((child: any) => {
          if (child instanceof THREE.Mesh) meshes.push(child);
        });
      });
    } else if (this.fragments && this.fragments.list) {
      for (const [, model] of this.fragments.list) {
        const obj = (model as any).object ?? (model as any).group ?? model;
        if (obj && obj.traverse) {
          obj.traverse((child: any) => {
            if (child instanceof THREE.Mesh) meshes.push(child);
          });
        }
      }
    }
    return meshes;
  }
}
