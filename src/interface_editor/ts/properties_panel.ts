/**
 * PropertiesPanel - Context-sensitive properties editor
 */

import type { InterfaceObject } from './types.js';
import { EditorCanvas } from './editor_canvas.js';

export class PropertiesPanel {
    private container: HTMLDivElement;
    private selectedObject: InterfaceObject | null = null;
    private canvas: EditorCanvas | null = null;

    constructor(container: HTMLDivElement) {
        this.container = container;
    }

    public setSelectedObject(obj: InterfaceObject | null, canvas: EditorCanvas): void {
        this.selectedObject = obj;
        this.canvas = canvas;
        this.render();
    }

    public clearSelection(): void {
        this.selectedObject = null;
        this.render();
    }

    private render(): void {
        if (!this.selectedObject) {
            this.renderNoSelection();
            return;
        }

        let html = '<div class="property-form">';
        
        // Common properties
        html += this.renderCommonProperties();

        // Type-specific properties
        if (this.selectedObject.type === 'LINE_GRAPH') {
            html += this.renderLineGraphProperties();
        } else if (this.selectedObject.type === 'PANEL') {
            html += this.renderPanelProperties();
        }

        html += '</div>';
        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    private renderNoSelection(): void {
        this.container.innerHTML = `
            <div class="no-selection-state">
                <p class="hint-text">Select an object to edit its properties, or drag an object from the palette above to add to the screen.</p>
            </div>
        `;
    }

    private renderCommonProperties(): string {
        if (!this.selectedObject) return '';

        return `
            <div class="property-group">
                <label class="property-label">Name</label>
                <input type="text" class="property-input" id="prop-name" value="${this.selectedObject.name}" placeholder="Object name">
            </div>
            <div class="property-group">
                <label class="property-label">Type</label>
                <input type="text" class="property-input" value="${this.selectedObject.type}" readonly>
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">X (%)</label>
                    <input type="number" class="property-input" id="prop-x" value="${this.selectedObject.position.x.toFixed(1)}" step="1" min="0" max="100">
                </div>
                <div class="property-group">
                    <label class="property-label">Y (%)</label>
                    <input type="number" class="property-input" id="prop-y" value="${this.selectedObject.position.y.toFixed(1)}" step="1" min="0" max="100">
                </div>
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">Width (%)</label>
                    <input type="number" class="property-input" id="prop-width" value="${this.selectedObject.size.width.toFixed(1)}" step="1" min="1" max="100">
                </div>
                <div class="property-group">
                    <label class="property-label">Height (%)</label>
                    <input type="number" class="property-input" id="prop-height" value="${this.selectedObject.size.height.toFixed(1)}" step="1" min="1" max="100">
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Z-Order</label>
                <div class="property-row">
                    <button class="property-button" id="prop-to-front">To Front</button>
                    <button class="property-button" id="prop-to-back">To Back</button>
                </div>
            </div>
            <div class="property-group">
                <button class="property-button danger" id="prop-delete">Delete Object</button>
            </div>
        `;
    }

    private renderLineGraphProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Monitor Data Keys</label>
                <div style="padding: 8px; background: #242424; border: 1px solid #333; border-radius: 4px; font-size: 0.85rem; color: #888;">
                    ${obj.monitorDataKeys.length} labels selected<br>
                    <small>(Telemetry label selector coming soon)</small>
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <input type="color" class="property-input" id="prop-bg-color" value="${obj.graphStyle.backgroundColor}">
            </div>
        `;
    }

    private renderPanelProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <input type="color" class="property-input" id="prop-bg-color" value="${obj.style.backgroundColor}">
            </div>
            <div class="property-group">
                <label class="property-label">Border Color</label>
                <input type="color" class="property-input" id="prop-border-color" value="${obj.style.borderColor}">
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">Border Width</label>
                    <input type="number" class="property-input" id="prop-border-width" value="${obj.style.borderWidth}" min="0" max="10">
                </div>
                <div class="property-group">
                    <label class="property-label">Opacity (%)</label>
                    <input type="number" class="property-input" id="prop-opacity" value="${obj.style.opacity}" min="0" max="100">
                </div>
            </div>
        `;
    }

    private attachEventListeners(): void {
        if (!this.selectedObject || !this.canvas) return;

        // Common properties
        const nameInput = document.getElementById('prop-name') as HTMLInputElement;
        nameInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.name = nameInput.value;
                this.canvas!.updateSelectedObject();
            }
        });

        const xInput = document.getElementById('prop-x') as HTMLInputElement;
        xInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.position.x = parseFloat(xInput.value);
                this.canvas!.updateSelectedObject();
            }
        });

        const yInput = document.getElementById('prop-y') as HTMLInputElement;
        yInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.position.y = parseFloat(yInput.value);
                this.canvas!.updateSelectedObject();
            }
        });

        const widthInput = document.getElementById('prop-width') as HTMLInputElement;
        widthInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.size.width = parseFloat(widthInput.value);
                this.canvas!.updateSelectedObject();
            }
        });

        const heightInput = document.getElementById('prop-height') as HTMLInputElement;
        heightInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.size.height = parseFloat(heightInput.value);
                this.canvas!.updateSelectedObject();
            }
        });

        // Z-order buttons
        document.getElementById('prop-to-front')?.addEventListener('click', () => {
            // TODO: Implement z-order change
            console.log('To front');
        });

        document.getElementById('prop-to-back')?.addEventListener('click', () => {
            // TODO: Implement z-order change
            console.log('To back');
        });

        // Delete button
        document.getElementById('prop-delete')?.addEventListener('click', () => {
            // Trigger delete via canvas
            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            document.dispatchEvent(event);
        });

        // Type-specific properties
        if (this.selectedObject.type === 'PANEL') {
            this.attachPanelEventListeners();
        } else if (this.selectedObject.type === 'LINE_GRAPH') {
            this.attachLineGraphEventListeners();
        }
    }

    private attachPanelEventListeners(): void {
        const obj = this.selectedObject as any;
        
        const bgColor = document.getElementById('prop-bg-color') as HTMLInputElement;
        bgColor?.addEventListener('input', () => {
            obj.style.backgroundColor = bgColor.value;
            this.canvas!.updateSelectedObject();
        });

        const borderColor = document.getElementById('prop-border-color') as HTMLInputElement;
        borderColor?.addEventListener('input', () => {
            obj.style.borderColor = borderColor.value;
            this.canvas!.updateSelectedObject();
        });

        const borderWidth = document.getElementById('prop-border-width') as HTMLInputElement;
        borderWidth?.addEventListener('input', () => {
            obj.style.borderWidth = parseInt(borderWidth.value);
            this.canvas!.updateSelectedObject();
        });

        const opacity = document.getElementById('prop-opacity') as HTMLInputElement;
        opacity?.addEventListener('input', () => {
            obj.style.opacity = parseInt(opacity.value);
            this.canvas!.updateSelectedObject();
        });
    }

    private attachLineGraphEventListeners(): void {
        const obj = this.selectedObject as any;
        
        const bgColor = document.getElementById('prop-bg-color') as HTMLInputElement;
        bgColor?.addEventListener('input', () => {
            obj.graphStyle.backgroundColor = bgColor.value;
            this.canvas!.updateSelectedObject();
        });
    }
}
