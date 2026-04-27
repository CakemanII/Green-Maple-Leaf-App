/**
 * PropertiesPanel - Context-sensitive properties editor
 */

import type { InterfaceObject, BarGraphBarDef } from './types.js';
import { EditorCanvas } from './editor_canvas.js';
import { TelemetryLabelSelectorPrompt, ColorPickerPrompt } from '../../shared/compiled_js/prompts.js';

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

    public updateLivePosition(obj: InterfaceObject): void {
        const xEl = document.getElementById('prop-x') as HTMLInputElement | null;
        const yEl = document.getElementById('prop-y') as HTMLInputElement | null;
        const wEl = document.getElementById('prop-width') as HTMLInputElement | null;
        const hEl = document.getElementById('prop-height') as HTMLInputElement | null;
        if (xEl) xEl.value = obj.position.x.toFixed(1);
        if (yEl) yEl.value = obj.position.y.toFixed(1);
        if (wEl) wEl.value = obj.size.width.toFixed(1);
        if (hEl) hEl.value = obj.size.height.toFixed(1);
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
        } else if (this.selectedObject.type === 'BAR_GRAPH') {
            html += this.renderBarGraphProperties();
        } else if (this.selectedObject.type === 'MODEL_3D') {
            html += this.renderModel3DProperties();
        } else if (this.selectedObject.type === 'MINIMAP') {
            html += this.renderMinimapProperties();
        } else if (this.selectedObject.type === 'STATUS_DISPLAY') {
            html += this.renderStatusDisplayProperties();
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
                <div class="property-input property-readonly">${this.selectedObject.type}</div>
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
                <label class="property-label">Scale (%)</label>
                <input type="number" class="property-input" id="prop-scale" value="${(this.selectedObject.scale ?? 100).toFixed(0)}" step="5" min="25" max="300">
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
                <label class="property-label">Data Labels</label>
                <div class="prop-label-rows" id="prop-label-rows"></div>
                <button class="prop-add-label-btn" id="prop-add-label-btn">+ Add Label</button>
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <div class="prop-color-row" id="prop-bg-color-row">
                    <div class="prop-color-swatch-large" id="prop-bg-color-swatch" style="background-color:${obj.graphStyle.backgroundColor}"></div>
                    <span class="prop-color-hex" id="prop-bg-color-hex">${obj.graphStyle.backgroundColor}</span>
                </div>
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">Y Min</label>
                    <input type="number" class="property-input" id="prop-y-min" value="${obj.graphStyle.yMin}" step="1">
                </div>
                <div class="property-group">
                    <label class="property-label">Y Max</label>
                    <input type="number" class="property-input" id="prop-y-max" value="${obj.graphStyle.yMax}" step="1">
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Time Window (s)</label>
                <input type="number" class="property-input" id="prop-time-window" value="${obj.graphStyle.timeWindow}" min="1" max="300">
            </div>
            <div class="property-group">
                <label class="property-label">Unit</label>
                <input type="text" class="property-input" id="prop-unit" value="${obj.graphStyle.unit || ''}" placeholder="e.g., m/s, °C">
            </div>
            <div class="property-group">
                <label class="property-label">Show Info Panel</label>
                <input type="checkbox" id="prop-show-info" ${obj.graphStyle.showInfo !== false ? 'checked' : ''}>
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">X Overflow</label>
                    <select class="property-input" id="prop-x-overflow">
                        <option value="ShiftGraph" ${obj.graphStyle.xOverflowMode === 'ShiftGraph' ? 'selected' : ''}>Shift Graph</option>
                        <option value="ScaleAxis" ${obj.graphStyle.xOverflowMode === 'ScaleAxis' ? 'selected' : ''}>Scale Axis</option>
                        <option value="None" ${obj.graphStyle.xOverflowMode === 'None' ? 'selected' : ''}>None</option>
                    </select>
                </div>
                <div class="property-group">
                    <label class="property-label">Y Overflow</label>
                    <select class="property-input" id="prop-y-overflow">
                        <option value="ScaleAxis" ${obj.graphStyle.yOverflowMode === 'ScaleAxis' ? 'selected' : ''}>Scale Axis</option>
                        <option value="None" ${obj.graphStyle.yOverflowMode === 'None' ? 'selected' : ''}>None</option>
                    </select>
                </div>
            </div>
        `;
    }

    private readonly LABEL_COLORS = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#6ba3ff'
    ];

    private buildLabelRows(obj: any): void {
        const container = document.getElementById('prop-label-rows');
        if (!container) return;
        container.innerHTML = '';

        const keys: string[] = obj.monitorDataKeys ?? [];

        if (keys.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'prop-label-empty';
            empty.textContent = 'No labels added';
            container.appendChild(empty);
            return;
        }

        let draggedIndex: number | null = null;

        keys.forEach((key: string, index: number) => {
            // Ensure color is persisted: if not in lineColors, assign and store it
            if (!obj.graphStyle.lineColors) {
                obj.graphStyle.lineColors = {};
            }
            if (!obj.graphStyle.lineColors[key]) {
                obj.graphStyle.lineColors[key] = this.LABEL_COLORS[index % this.LABEL_COLORS.length];
            }
            const color: string = obj.graphStyle.lineColors[key];
            const displayName: string = obj.graphStyle.labelDisplayNames?.[key] ?? '';

            const row = document.createElement('div');
            row.className = 'prop-label-row';
            row.draggable = true;

            // — Header row: drag | swatch | key text | remove —
            const header = document.createElement('div');
            header.className = 'prop-label-row-header';

            const handle = document.createElement('span');
            handle.className = 'prop-label-drag-handle';
            handle.textContent = '⠿';
            handle.title = 'Drag to reorder';

            const swatch = document.createElement('div');
            swatch.className = 'prop-label-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = 'Click to change color';
            swatch.addEventListener('click', (e: MouseEvent) => {
                new ColorPickerPrompt(
                    obj.graphStyle.lineColors?.[key] || color,
                    e,
                    (newColor: string) => {
                        if (!obj.graphStyle.lineColors) obj.graphStyle.lineColors = {};
                        obj.graphStyle.lineColors[key] = newColor;
                        this.canvas!.updateSelectedObject();
                        this.buildLabelRows(obj);
                    },
                    (liveColor: string) => {
                        swatch.style.backgroundColor = liveColor;
                        if (!obj.graphStyle.lineColors) obj.graphStyle.lineColors = {};
                        obj.graphStyle.lineColors[key] = liveColor;
                        this.canvas!.updateSelectedObject();
                    },
                    () => {}
                );
            });

            const keyText = document.createElement('span');
            keyText.className = 'prop-label-key-text';
            keyText.textContent = key;
            keyText.title = key;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'prop-label-remove-btn';
            removeBtn.textContent = '×';
            removeBtn.title = 'Remove';
            removeBtn.addEventListener('click', () => {
                obj.monitorDataKeys = keys.filter((_: string, i: number) => i !== index);
                if (obj.graphStyle.lineColors) delete obj.graphStyle.lineColors[key];
                if (obj.graphStyle.labelDisplayNames) delete obj.graphStyle.labelDisplayNames[key];
                if (obj.graphStyle.labelUnits) delete obj.graphStyle.labelUnits[key];
                this.canvas!.updateSelectedObject();
                this.buildLabelRows(obj);
            });

            header.appendChild(handle);
            header.appendChild(swatch);
            header.appendChild(keyText);
            header.appendChild(removeBtn);

            // — Inputs row: display name | unit —
            const inputs = document.createElement('div');
            inputs.className = 'prop-label-row-inputs';

            const nameInput = document.createElement('input');
            nameInput.className = 'prop-label-input';
            nameInput.type = 'text';
            nameInput.value = displayName;
            nameInput.placeholder = key;
            nameInput.addEventListener('input', () => {
                if (!obj.graphStyle.labelDisplayNames) obj.graphStyle.labelDisplayNames = {};
                obj.graphStyle.labelDisplayNames[key] = nameInput.value;
                this.canvas!.updateSelectedObject();
            });

            inputs.appendChild(nameInput);

            row.appendChild(header);
            row.appendChild(inputs);
            container.appendChild(row);

            // — Drag-and-drop reordering —
            row.addEventListener('dragstart', (e: DragEvent) => {
                draggedIndex = index;
                row.classList.add('dragging');
                e.dataTransfer!.effectAllowed = 'move';
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                draggedIndex = null;
            });
            row.addEventListener('dragover', (e: DragEvent) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
                row.classList.add('drag-over');
            });
            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-over');
            });
            row.addEventListener('drop', (e: DragEvent) => {
                e.preventDefault();
                row.classList.remove('drag-over');
                if (draggedIndex === null || draggedIndex === index) return;
                const arr: string[] = obj.monitorDataKeys;
                const item = arr.splice(draggedIndex, 1)[0];
                const insertAt = draggedIndex < index ? index - 1 : index;
                arr.splice(insertAt, 0, item);
                this.canvas!.updateSelectedObject();
                this.buildLabelRows(obj);
            });
        });
    }

    private renderPanelProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <div class="prop-color-row" id="prop-bg-color-row">
                    <div class="prop-color-swatch-large" id="prop-bg-color-swatch" style="background-color:${obj.style.backgroundColor}"></div>
                    <span class="prop-color-hex" id="prop-bg-color-hex">${obj.style.backgroundColor}</span>
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Border Color</label>
                <div class="prop-color-row" id="prop-border-color-row">
                    <div class="prop-color-swatch-large" id="prop-border-color-swatch" style="background-color:${obj.style.borderColor}"></div>
                    <span class="prop-color-hex" id="prop-border-color-hex">${obj.style.borderColor}</span>
                </div>
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

        const scaleInput = document.getElementById('prop-scale') as HTMLInputElement;
        scaleInput?.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.scale = parseFloat(scaleInput.value);
                this.canvas!.updateSelectedObject();
            }
        });

        // Z-order buttons
        document.getElementById('prop-to-front')?.addEventListener('click', () => {
            if (this.selectedObject && this.canvas && this.canvas.currentScreen) {
                this.canvas.currentScreen.moveObjectToFront(this.selectedObject.uuid);
                this.canvas.updateSelectedObject();
            }
        });

        document.getElementById('prop-to-back')?.addEventListener('click', () => {
            if (this.selectedObject && this.canvas && this.canvas.currentScreen) {
                this.canvas.currentScreen.moveObjectToBack(this.selectedObject.uuid);
                this.canvas.updateSelectedObject();
            }
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
        } else if (this.selectedObject.type === 'BAR_GRAPH') {
            this.attachBarGraphEventListeners();
        } else if (this.selectedObject.type === 'MODEL_3D') {
            this.attachModel3DEventListeners();
        } else if (this.selectedObject.type === 'MINIMAP') {
            this.attachMinimapEventListeners();
        } else if (this.selectedObject.type === 'STATUS_DISPLAY') {
            this.attachStatusDisplayEventListeners();
        }
    }

    private attachPanelEventListeners(): void {
        const obj = this.selectedObject as any;

        const bgRow = document.getElementById('prop-bg-color-row');
        const bgSwatch = document.getElementById('prop-bg-color-swatch');
        const bgHex = document.getElementById('prop-bg-color-hex');
        bgRow?.addEventListener('click', (e: MouseEvent) => {
            new ColorPickerPrompt(
                obj.style.backgroundColor,
                e,
                (newColor: string) => {
                    obj.style.backgroundColor = newColor;
                    if (bgSwatch) bgSwatch.style.backgroundColor = newColor;
                    if (bgHex) bgHex.textContent = newColor;
                    this.canvas!.updateSelectedObject();
                },
                (liveColor: string) => {
                    obj.style.backgroundColor = liveColor;
                    if (bgSwatch) bgSwatch.style.backgroundColor = liveColor;
                    if (bgHex) bgHex.textContent = liveColor;
                    const el = this.canvas!.getObjectElement(obj.uuid);
                    if (el) el.style.backgroundColor = liveColor;
                },
                () => {}
            );
        });

        const borderRow = document.getElementById('prop-border-color-row');
        const borderSwatch = document.getElementById('prop-border-color-swatch');
        const borderHex = document.getElementById('prop-border-color-hex');
        borderRow?.addEventListener('click', (e: MouseEvent) => {
            new ColorPickerPrompt(
                obj.style.borderColor,
                e,
                (newColor: string) => {
                    obj.style.borderColor = newColor;
                    if (borderSwatch) borderSwatch.style.backgroundColor = newColor;
                    if (borderHex) borderHex.textContent = newColor;
                    this.canvas!.updateSelectedObject();
                },
                (liveColor: string) => {
                    obj.style.borderColor = liveColor;
                    if (borderSwatch) borderSwatch.style.backgroundColor = liveColor;
                    if (borderHex) borderHex.textContent = liveColor;
                    const el = this.canvas!.getObjectElement(obj.uuid);
                    if (el) el.style.borderColor = liveColor;
                },
                () => {}
            );
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

    // ===== BAR GRAPH =====

    private renderBarGraphProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Bars</label>
                <div id="prop-bar-rows"></div>
                <button class="prop-add-label-btn" id="prop-add-bar-btn">+ Add Bar</button>
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label class="property-label">Y Min</label>
                    <input type="number" class="property-input" id="prop-bar-y-min" value="${obj.graphStyle.yMin}" step="1">
                </div>
                <div class="property-group">
                    <label class="property-label">Y Max</label>
                    <input type="number" class="property-input" id="prop-bar-y-max" value="${obj.graphStyle.yMax}" step="1">
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Title</label>
                <input type="text" class="property-input" id="prop-bar-title" value="${obj.graphStyle.title || ''}" placeholder="Bar Graph">
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <div class="prop-color-row" id="prop-bar-bg-color-row">
                    <div class="prop-color-swatch-large" id="prop-bar-bg-swatch" style="background-color:${obj.graphStyle.backgroundColor}"></div>
                    <span class="prop-color-hex" id="prop-bar-bg-hex">${obj.graphStyle.backgroundColor}</span>
                </div>
            </div>
        `;
    }

    private buildBarRows(obj: any): void {
        const container = document.getElementById('prop-bar-rows');
        if (!container) return;
        container.innerHTML = '';
        const bars: BarGraphBarDef[] = obj.bars ?? [];
        if (bars.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'prop-label-empty';
            empty.textContent = 'No bars added';
            container.appendChild(empty);
            return;
        }
        bars.forEach((bar, index) => {
            const row = document.createElement('div');
            row.className = 'prop-label-row';

            const header = document.createElement('div');
            header.className = 'prop-label-row-header';

            const swatch = document.createElement('div');
            swatch.className = 'prop-label-color-swatch';
            swatch.style.backgroundColor = bar.color;
            swatch.title = 'Click to change color';
            swatch.addEventListener('click', (e: MouseEvent) => {
                new ColorPickerPrompt(bar.color, e,
                    (c: string) => { bar.color = c; this.canvas!.updateSelectedObject(); this.buildBarRows(obj); },
                    (c: string) => { bar.color = c; swatch.style.backgroundColor = c; },
                    () => {}
                );
            });

            const keyText = document.createElement('span');
            keyText.className = 'prop-label-key-text';
            keyText.textContent = bar.label || bar.monitorKey;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'prop-label-remove-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                obj.bars = bars.filter((_: BarGraphBarDef, i: number) => i !== index);
                this.canvas!.updateSelectedObject();
                this.buildBarRows(obj);
            });

            header.appendChild(swatch);
            header.appendChild(keyText);
            header.appendChild(removeBtn);

            const inputs = document.createElement('div');
            inputs.className = 'prop-label-row-inputs';

            const labelInput = document.createElement('input');
            labelInput.className = 'prop-label-input';
            labelInput.type = 'text';
            labelInput.value = bar.label;
            labelInput.placeholder = 'Label';
            labelInput.addEventListener('input', () => { bar.label = labelInput.value; this.canvas!.updateSelectedObject(); });

            inputs.appendChild(labelInput);
            row.appendChild(header);
            row.appendChild(inputs);
            container.appendChild(row);
        });
    }

    private attachBarGraphEventListeners(): void {
        const obj = this.selectedObject as any;
        this.buildBarRows(obj);

        document.getElementById('prop-add-bar-btn')?.addEventListener('click', (e: MouseEvent) => {
            new TelemetryLabelSelectorPrompt(e,
                (key: string) => {
                    if (!obj.bars) obj.bars = [];
                    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
                    obj.bars.push({ id: crypto.randomUUID(), label: key, monitorKey: key, color: colors[obj.bars.length % colors.length] });
                    this.canvas!.updateSelectedObject();
                    this.buildBarRows(obj);
                },
                () => {},
                true
            );
        });

        const yMin = document.getElementById('prop-bar-y-min') as HTMLInputElement;
        yMin?.addEventListener('input', () => { obj.graphStyle.yMin = parseFloat(yMin.value); this.canvas!.updateSelectedObject(); });

        const yMax = document.getElementById('prop-bar-y-max') as HTMLInputElement;
        yMax?.addEventListener('input', () => { obj.graphStyle.yMax = parseFloat(yMax.value); this.canvas!.updateSelectedObject(); });

        const title = document.getElementById('prop-bar-title') as HTMLInputElement;
        title?.addEventListener('input', () => { obj.graphStyle.title = title.value; this.canvas!.updateSelectedObject(); });

        const bgRow = document.getElementById('prop-bar-bg-color-row');
        const bgSwatch = document.getElementById('prop-bar-bg-swatch');
        const bgHex = document.getElementById('prop-bar-bg-hex');
        bgRow?.addEventListener('click', (e: MouseEvent) => {
            new ColorPickerPrompt(obj.graphStyle.backgroundColor, e,
                (c: string) => { obj.graphStyle.backgroundColor = c; if (bgSwatch) bgSwatch.style.backgroundColor = c; if (bgHex) bgHex.textContent = c; this.canvas!.updateSelectedObject(); },
                (c: string) => { obj.graphStyle.backgroundColor = c; if (bgSwatch) bgSwatch.style.backgroundColor = c; if (bgHex) bgHex.textContent = c; },
                () => {}
            );
        });
    }

    // ===== 3D MODEL =====

    private renderModel3DProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Roll Telemetry Key</label>
                <input type="text" class="property-input" id="prop-roll-key" value="${obj.rollKey || ''}" placeholder="e.g., ang_pos.x">
            </div>
            <div class="property-group">
                <label class="property-label">Pitch Telemetry Key</label>
                <input type="text" class="property-input" id="prop-pitch-key" value="${obj.pitchKey || ''}" placeholder="e.g., ang_pos.y">
            </div>
            <div class="property-group">
                <label class="property-label">Yaw Telemetry Key</label>
                <input type="text" class="property-input" id="prop-yaw-key" value="${obj.yawKey || ''}" placeholder="e.g., ang_pos.z">
            </div>
            <div class="property-group">
                <label class="property-label">Angle Unit</label>
                <select class="property-input" id="prop-angle-unit">
                    <option value="deg" ${obj.angleUnit === 'deg' ? 'selected' : ''}>Degrees</option>
                    <option value="rad" ${obj.angleUnit === 'rad' ? 'selected' : ''}>Radians</option>
                </select>
            </div>
            <div class="property-group">
                <label class="property-label">Model Color</label>
                <div class="prop-color-row" id="prop-model-color-row">
                    <div class="prop-color-swatch-large" id="prop-model-color-swatch" style="background-color:${obj.modelColor}"></div>
                    <span class="prop-color-hex" id="prop-model-color-hex">${obj.modelColor}</span>
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <div class="prop-color-row" id="prop-model-bg-color-row">
                    <div class="prop-color-swatch-large" id="prop-model-bg-swatch" style="background-color:${obj.backgroundColor}"></div>
                    <span class="prop-color-hex" id="prop-model-bg-hex">${obj.backgroundColor}</span>
                </div>
            </div>
        `;
    }

    private attachModel3DEventListeners(): void {
        const obj = this.selectedObject as any;

        const bind = (id: string, field: string) => {
            const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
            el?.addEventListener('input', () => { (obj as any)[field] = el.value; this.canvas!.updateSelectedObject(); });
            el?.addEventListener('change', () => { (obj as any)[field] = el.value; this.canvas!.updateSelectedObject(); });
        };
        bind('prop-roll-key', 'rollKey');
        bind('prop-pitch-key', 'pitchKey');
        bind('prop-yaw-key', 'yawKey');
        bind('prop-angle-unit', 'angleUnit');

        const colorBind = (rowId: string, swatchId: string, hexId: string, field: string) => {
            const row = document.getElementById(rowId);
            const swatch = document.getElementById(swatchId);
            const hex = document.getElementById(hexId);
            row?.addEventListener('click', (e: MouseEvent) => {
                new ColorPickerPrompt(obj[field], e,
                    (c: string) => { obj[field] = c; if (swatch) swatch.style.backgroundColor = c; if (hex) hex.textContent = c; this.canvas!.updateSelectedObject(); },
                    (c: string) => { obj[field] = c; if (swatch) swatch.style.backgroundColor = c; if (hex) hex.textContent = c; },
                    () => {}
                );
            });
        };
        colorBind('prop-model-color-row', 'prop-model-color-swatch', 'prop-model-color-hex', 'modelColor');
        colorBind('prop-model-bg-color-row', 'prop-model-bg-swatch', 'prop-model-bg-hex', 'backgroundColor');
    }

    // ===== MINIMAP =====

    private renderMinimapProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Latitude Key</label>
                <input type="text" class="property-input" id="prop-lat-key" value="${obj.latKey || ''}" placeholder="e.g., gps.lat">
            </div>
            <div class="property-group">
                <label class="property-label">Longitude Key</label>
                <input type="text" class="property-input" id="prop-lng-key" value="${obj.lngKey || ''}" placeholder="e.g., gps.lng">
            </div>
            <div class="property-group">
                <label class="property-label">Default Zoom</label>
                <input type="number" class="property-input" id="prop-default-zoom" value="${obj.defaultZoom ?? 15}" min="1" max="20" step="1">
            </div>
            <div class="property-group property-checkbox-group">
                <label class="property-label">Follow Rocket</label>
                <input type="checkbox" id="prop-follow-rocket" ${obj.followRocket ? 'checked' : ''}>
            </div>
            <div class="property-group property-checkbox-group">
                <label class="property-label">Show Geofences</label>
                <input type="checkbox" id="prop-show-geofences" ${obj.showGeofences ? 'checked' : ''}>
            </div>
        `;
    }

    private attachMinimapEventListeners(): void {
        const obj = this.selectedObject as any;

        const bindText = (id: string, field: string) => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            el?.addEventListener('input', () => { obj[field] = el.value; this.canvas!.updateSelectedObject(); });
        };
        bindText('prop-lat-key', 'latKey');
        bindText('prop-lng-key', 'lngKey');

        const zoom = document.getElementById('prop-default-zoom') as HTMLInputElement;
        zoom?.addEventListener('input', () => { obj.defaultZoom = parseInt(zoom.value); this.canvas!.updateSelectedObject(); });

        const followRocket = document.getElementById('prop-follow-rocket') as HTMLInputElement;
        followRocket?.addEventListener('change', () => { obj.followRocket = followRocket.checked; this.canvas!.updateSelectedObject(); });

        const showGeofences = document.getElementById('prop-show-geofences') as HTMLInputElement;
        showGeofences?.addEventListener('change', () => { obj.showGeofences = showGeofences.checked; this.canvas!.updateSelectedObject(); });
    }

    // ===== STATUS DISPLAY =====

    private renderStatusDisplayProperties(): string {
        const obj = this.selectedObject as any;
        return `
            <div class="property-group">
                <label class="property-label">Status Collection UUID</label>
                <input type="text" class="property-input" id="prop-status-collection-uuid" value="${obj.statusCollectionUUID || ''}" placeholder="Collection UUID">
            </div>
            <div class="property-group">
                <label class="property-label">Status UUID</label>
                <input type="text" class="property-input" id="prop-status-uuid" value="${obj.statusUUID || ''}" placeholder="Status UUID">
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <div class="prop-color-row" id="prop-sd-bg-color-row">
                    <div class="prop-color-swatch-large" id="prop-sd-bg-swatch" style="background-color:${obj.style.backgroundColor}"></div>
                    <span class="prop-color-hex" id="prop-sd-bg-hex">${obj.style.backgroundColor}</span>
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Border Color</label>
                <div class="prop-color-row" id="prop-sd-border-color-row">
                    <div class="prop-color-swatch-large" id="prop-sd-border-swatch" style="background-color:${obj.style.borderColor}"></div>
                    <span class="prop-color-hex" id="prop-sd-border-hex">${obj.style.borderColor}</span>
                </div>
            </div>
            <div class="property-group property-checkbox-group">
                <label class="property-label">Show Title</label>
                <input type="checkbox" id="prop-sd-show-title" ${obj.style.showTitle ? 'checked' : ''}>
            </div>
            <div class="property-group property-checkbox-group">
                <label class="property-label">Play Audio</label>
                <input type="checkbox" id="prop-sd-play-audio" ${obj.style.playAudio ? 'checked' : ''}>
            </div>
        `;
    }

    private attachStatusDisplayEventListeners(): void {
        const obj = this.selectedObject as any;

        const collectionUUID = document.getElementById('prop-status-collection-uuid') as HTMLInputElement;
        collectionUUID?.addEventListener('input', () => { obj.statusCollectionUUID = collectionUUID.value; this.canvas!.updateSelectedObject(); });

        const statusUUID = document.getElementById('prop-status-uuid') as HTMLInputElement;
        statusUUID?.addEventListener('input', () => { obj.statusUUID = statusUUID.value; this.canvas!.updateSelectedObject(); });

        const colorBind = (rowId: string, swatchId: string, hexId: string, field: string) => {
            const row = document.getElementById(rowId);
            const swatch = document.getElementById(swatchId);
            const hex = document.getElementById(hexId);
            row?.addEventListener('click', (e: MouseEvent) => {
                new ColorPickerPrompt(obj.style[field], e,
                    (c: string) => { obj.style[field] = c; if (swatch) swatch.style.backgroundColor = c; if (hex) hex.textContent = c; this.canvas!.updateSelectedObject(); },
                    (c: string) => { obj.style[field] = c; if (swatch) swatch.style.backgroundColor = c; if (hex) hex.textContent = c; },
                    () => {}
                );
            });
        };
        colorBind('prop-sd-bg-color-row', 'prop-sd-bg-swatch', 'prop-sd-bg-hex', 'backgroundColor');
        colorBind('prop-sd-border-color-row', 'prop-sd-border-swatch', 'prop-sd-border-hex', 'borderColor');

        const showTitle = document.getElementById('prop-sd-show-title') as HTMLInputElement;
        showTitle?.addEventListener('change', () => { obj.style.showTitle = showTitle.checked; this.canvas!.updateSelectedObject(); });

        const playAudio = document.getElementById('prop-sd-play-audio') as HTMLInputElement;
        playAudio?.addEventListener('change', () => { obj.style.playAudio = playAudio.checked; this.canvas!.updateSelectedObject(); });
    }

    private attachLineGraphEventListeners(): void {
        const obj = this.selectedObject as any;

        // Build the label rows immediately (DOM-based, not HTML string)
        this.buildLabelRows(obj);

        // Add Label button — opens the telemetry selector prompt
        document.getElementById('prop-add-label-btn')?.addEventListener('click', (e: MouseEvent) => {
            new TelemetryLabelSelectorPrompt(
                e,
                (key: string) => {
                    if (!obj.monitorDataKeys) obj.monitorDataKeys = [];
                    if (!obj.monitorDataKeys.includes(key)) {
                        obj.monitorDataKeys.push(key);
                        this.canvas!.updateSelectedObject();
                        this.buildLabelRows(obj);
                    }
                },
                () => {},
                true  // numericalOnly — labels must resolve to numeric data
            );
        });

        // Graph style properties
        const bgRow = document.getElementById('prop-bg-color-row');
        const bgSwatch = document.getElementById('prop-bg-color-swatch');
        const bgHex = document.getElementById('prop-bg-color-hex');
        bgRow?.addEventListener('click', (e: MouseEvent) => {
            new ColorPickerPrompt(
                obj.graphStyle.backgroundColor,
                e,
                (newColor: string) => {
                    obj.graphStyle.backgroundColor = newColor;
                    if (bgSwatch) bgSwatch.style.backgroundColor = newColor;
                    if (bgHex) bgHex.textContent = newColor;
                    this.canvas!.updateSelectedObject();
                },
                (liveColor: string) => {
                    obj.graphStyle.backgroundColor = liveColor;
                    if (bgSwatch) bgSwatch.style.backgroundColor = liveColor;
                    if (bgHex) bgHex.textContent = liveColor;
                    this.canvas!.setGraphBackgroundColor(obj.uuid, liveColor);
                },
                () => {}
            );
        });

        const yMin = document.getElementById('prop-y-min') as HTMLInputElement;
        yMin?.addEventListener('input', () => {
            obj.graphStyle.yMin = parseFloat(yMin.value);
            this.canvas!.updateSelectedObject();
        });

        const yMax = document.getElementById('prop-y-max') as HTMLInputElement;
        yMax?.addEventListener('input', () => {
            obj.graphStyle.yMax = parseFloat(yMax.value);
            this.canvas!.updateSelectedObject();
        });

        const timeWindow = document.getElementById('prop-time-window') as HTMLInputElement;
        timeWindow?.addEventListener('input', () => {
            let value = parseInt(timeWindow.value);
            if (value <= 0) {
                value = 1;
                timeWindow.value = '1';
            }
            obj.graphStyle.timeWindow = value;
            this.canvas!.updateSelectedObject();
        });

        timeWindow?.addEventListener('blur', () => {
            let value = parseInt(timeWindow.value);
            if (value <= 0) {
                value = 1;
                timeWindow.value = '1';
                obj.graphStyle.timeWindow = value;
                this.canvas!.updateSelectedObject();
            }
        });

        const unit = document.getElementById('prop-unit') as HTMLInputElement;
        unit?.addEventListener('input', () => {
            obj.graphStyle.unit = unit.value;
            this.canvas!.updateSelectedObject();
        });

        const showInfo = document.getElementById('prop-show-info') as HTMLInputElement;
        showInfo?.addEventListener('change', () => {
            obj.graphStyle.showInfo = showInfo.checked;
            this.canvas!.setGraphShowInfo(obj.uuid, showInfo.checked);
        });

        const xOverflow = document.getElementById('prop-x-overflow') as HTMLSelectElement;
        xOverflow?.addEventListener('change', () => {
            obj.graphStyle.xOverflowMode = xOverflow.value;
            this.canvas!.updateSelectedObject();
        });

        const yOverflow = document.getElementById('prop-y-overflow') as HTMLSelectElement;
        yOverflow?.addEventListener('change', () => {
            obj.graphStyle.yOverflowMode = yOverflow.value;
            this.canvas!.updateSelectedObject();
        });
    }
}
