/**
 * UI module - Properties table management
 * Handles displaying element properties in the bottom panel table
 */

import * as THREE from "three";

export interface PropertyRow {
  key: string;
  value: string | number | boolean;
  category?: string;
}

export interface ElementProperties {
  id: string;
  type: string;
  name: string;
  [key: string]: string | number | boolean;
}

export class PropertiesUI {
  private tbody: HTMLElement;
  private emptyState: HTMLElement;
  private selectionInfo: HTMLElement;
  private table: HTMLElement;

  constructor() {
    this.tbody = document.getElementById("properties-tbody")!;
    this.emptyState = document.getElementById("empty-state")!;
    this.selectionInfo = document.getElementById("selection-info")!;
    this.table = document.getElementById("properties-table")!;

    if (!this.tbody) throw new Error("Properties tbody not found");
    if (!this.emptyState) throw new Error("Empty state element not found");
    if (!this.selectionInfo) throw new Error("Selection info element not found");
    if (!this.table) throw new Error("Properties table not found");
  }

  /**
   * Clear the properties table and show empty state
   */
  public clear(): void {
    this.tbody.innerHTML = "";
    this.table.style.display = "none";
    this.emptyState.style.display = "flex";
    this.selectionInfo.textContent = "Click an element to view properties";
    this.selectionInfo.classList.remove("has-selection");
  }

  /**
   * Populate the properties table with element data
   */
  public populate(element: THREE.Object3D, instanceId?: number, attributes?: any): void {
    const properties = this.extractProperties(element, instanceId, attributes);
    this.renderProperties(properties);
  }

  /**
   * Extract properties from a Three.js object
   */
  private extractProperties(object: THREE.Object3D, instanceId?: number, attributes?: any): PropertyRow[] {
    const rows: PropertyRow[] = [];

    // Basic properties
    rows.push({ key: "Name", value: (attributes && attributes.Name && attributes.Name.value) ? attributes.Name.value : (object.name || "Unnamed"), category: "General" });
    rows.push({ key: "Type", value: object.type, category: "General" });
    rows.push({ key: "UUID", value: object.uuid, category: "General" });
    
    if (instanceId !== undefined) {
      rows.push({ key: "Instance ID", value: instanceId, category: "General" });
    }

    // Transform properties
    rows.push({ key: "Position X", value: object.position.x.toFixed(3), category: "Transform" });
    rows.push({ key: "Position Y", value: object.position.y.toFixed(3), category: "Transform" });
    rows.push({ key: "Position Z", value: object.position.z.toFixed(3), category: "Transform" });
    
    rows.push({ key: "Rotation X", value: object.rotation.x.toFixed(3), category: "Transform" });
    rows.push({ key: "Rotation Y", value: object.rotation.y.toFixed(3), category: "Transform" });
    rows.push({ key: "Rotation Z", value: object.rotation.z.toFixed(3), category: "Transform" });

    // Mesh-specific properties
    if (object instanceof THREE.Mesh) {
      const mesh = object as THREE.Mesh;
      
      if (mesh.geometry) {
        rows.push({ key: "Geometry Type", value: mesh.geometry.type, category: "Geometry" });
        
        if (mesh.geometry.index) {
          rows.push({ key: "Triangle Count", value: Math.floor(mesh.geometry.index.count / 3), category: "Geometry" });
        }
        
        if ('attributes' in mesh.geometry) {
          const posAttr = mesh.geometry.attributes.position;
          if (posAttr) {
            rows.push({ key: "Vertex Count", value: posAttr.count, category: "Geometry" });
          }
        }
      }

      if (mesh.material) {
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        rows.push({ key: "Material Type", value: material.type, category: "Material" });
        
        if (material.name) {
          rows.push({ key: "Material Name", value: material.name, category: "Material" });
        }
        
        if ('color' in material && material.color) {
          rows.push({ key: "Material Color", value: `#${material.color.getHexString().toUpperCase()}`, category: "Material" });
        }
        
        if ('opacity' in material) {
          rows.push({ key: "Opacity", value: material.opacity, category: "Material" });
        }
        
        if ('transparent' in material) {
          rows.push({ key: "Transparent", value: material.transparent ? "Yes" : "No", category: "Material" });
        }
        
        if ('wireframe' in material) {
          rows.push({ key: "Wireframe", value: material.wireframe ? "Yes" : "No", category: "Material" });
        }
      }

      // Visibility
      rows.push({ key: "Visible", value: mesh.visible ? "Yes" : "No", category: "Visibility" });
      rows.push({ key: "Cast Shadow", value: mesh.castShadow ? "Yes" : "No", category: "Visibility" });
      rows.push({ key: "Receive Shadow", value: mesh.receiveShadow ? "Yes" : "No", category: "Visibility" });
    }

    // User data (custom properties)
    if (object.userData && Object.keys(object.userData).length > 0) {
      for (const [key, value] of Object.entries(object.userData)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          rows.push({ key, value, category: "Custom" });
        } else if (value !== null && typeof value === "object") {
          rows.push({ key, value: JSON.stringify(value), category: "Custom" });
        }
      }
    }

    // Item attributes from fragments model (if provided)
    if (attributes && typeof attributes === 'object') {
      for (const [k,v] of Object.entries(attributes)) {
        try {
          const val = (v && typeof v === 'object' && 'value' in v) ? v.value : v;
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            rows.push({ key: k, value: val, category: 'Attributes' });
          } else if (val !== null && typeof val === 'object') {
            rows.push({ key: k, value: JSON.stringify(val), category: 'Attributes' });
          }
        } catch (e) { }
      }
    }

    // Parent info
    if (object.parent) {
      rows.push({ key: "Parent Name", value: object.parent.name || "Unnamed", category: "Hierarchy" });
      rows.push({ key: "Parent Type", value: object.parent.type, category: "Hierarchy" });
    }

    // Children count
    rows.push({ key: "Children Count", value: object.children.length, category: "Hierarchy" });

    return rows;
  }

  /**
   * Render properties to the table
   */
  private renderProperties(rows: PropertyRow[]): void {
    // Group by category
    const grouped = this.groupByCategory(rows);
    
    this.tbody.innerHTML = "";

    for (const [category, categoryRows] of Object.entries(grouped)) {
      // Add category header
      const categoryHeader = document.createElement("tr");
      categoryHeader.className = "category-header";
      categoryHeader.innerHTML = `<td colspan="2">${category}</td>`;
      this.tbody.appendChild(categoryHeader);

      // Add rows for this category
      for (const row of categoryRows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="property-key" title="${this.escapeHtml(row.key)}">${this.escapeHtml(row.key)}</td>
          <td class="property-value" title="${this.escapeHtml(String(row.value))}">${this.escapeHtml(String(row.value))}</td>
        `;
        this.tbody.appendChild(tr);
      }
    }

    // Show table, hide empty state
    this.table.style.display = "table";
    this.emptyState.style.display = "none";
    
    // Update selection info
    const generalName = rows.find(r => r.key === "Name");
    this.selectionInfo.textContent = generalName ? `Selected: ${generalName.value}` : "Element selected";
    this.selectionInfo.classList.add("has-selection");
  }

  /**
   * Group property rows by category
   */
  private groupByCategory(rows: PropertyRow[]): Record<string, PropertyRow[]> {
    const grouped: Record<string, PropertyRow[]> = {};
    
    for (const row of rows) {
      const category = row.category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(row);
    }

    return grouped;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
