/**
 * PropertiesPanel - Context-sensitive properties editor
 */
import { TelemetryLabelSelectorPrompt, ColorPickerPrompt } from '../../shared/compiled_js/prompts.js';
export class PropertiesPanel {
    constructor(container) {
        this.selectedObject = null;
        this.canvas = null;
        this.LABEL_COLORS = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#6ba3ff'
        ];
        this.container = container;
    }
    setSelectedObject(obj, canvas) {
        this.selectedObject = obj;
        this.canvas = canvas;
        this.render();
    }
    clearSelection() {
        this.selectedObject = null;
        this.render();
    }
    updateLivePosition(obj) {
        const xEl = document.getElementById('prop-x');
        const yEl = document.getElementById('prop-y');
        const wEl = document.getElementById('prop-width');
        const hEl = document.getElementById('prop-height');
        if (xEl)
            xEl.value = obj.position.x.toFixed(1);
        if (yEl)
            yEl.value = obj.position.y.toFixed(1);
        if (wEl)
            wEl.value = obj.size.width.toFixed(1);
        if (hEl)
            hEl.value = obj.size.height.toFixed(1);
    }
    render() {
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
        }
        else if (this.selectedObject.type === 'PANEL') {
            html += this.renderPanelProperties();
        }
        html += '</div>';
        this.container.innerHTML = html;
        this.attachEventListeners();
    }
    renderNoSelection() {
        this.container.innerHTML = `
            <div class="no-selection-state">
                <p class="hint-text">Select an object to edit its properties, or drag an object from the palette above to add to the screen.</p>
            </div>
        `;
    }
    renderCommonProperties() {
        if (!this.selectedObject)
            return '';
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
    renderLineGraphProperties() {
        const obj = this.selectedObject;
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
    buildLabelRows(obj) {
        var _a;
        const container = document.getElementById('prop-label-rows');
        if (!container)
            return;
        container.innerHTML = '';
        const keys = (_a = obj.monitorDataKeys) !== null && _a !== void 0 ? _a : [];
        if (keys.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'prop-label-empty';
            empty.textContent = 'No labels added';
            container.appendChild(empty);
            return;
        }
        let draggedIndex = null;
        keys.forEach((key, index) => {
            var _a, _b, _c, _d;
            // Ensure color is persisted: if not in lineColors, assign and store it
            if (!obj.graphStyle.lineColors) {
                obj.graphStyle.lineColors = {};
            }
            if (!obj.graphStyle.lineColors[key]) {
                obj.graphStyle.lineColors[key] = this.LABEL_COLORS[index % this.LABEL_COLORS.length];
            }
            const color = obj.graphStyle.lineColors[key];
            const displayName = (_b = (_a = obj.graphStyle.labelDisplayNames) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : '';
            const unit = (_d = (_c = obj.graphStyle.labelUnits) === null || _c === void 0 ? void 0 : _c[key]) !== null && _d !== void 0 ? _d : '';
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
            swatch.addEventListener('click', (e) => {
                var _a;
                new ColorPickerPrompt(((_a = obj.graphStyle.lineColors) === null || _a === void 0 ? void 0 : _a[key]) || color, e, (newColor) => {
                    if (!obj.graphStyle.lineColors)
                        obj.graphStyle.lineColors = {};
                    obj.graphStyle.lineColors[key] = newColor;
                    this.canvas.updateSelectedObject();
                    this.buildLabelRows(obj);
                }, (liveColor) => {
                    swatch.style.backgroundColor = liveColor;
                    if (!obj.graphStyle.lineColors)
                        obj.graphStyle.lineColors = {};
                    obj.graphStyle.lineColors[key] = liveColor;
                    this.canvas.updateSelectedObject();
                }, () => { });
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
                obj.monitorDataKeys = keys.filter((_, i) => i !== index);
                if (obj.graphStyle.lineColors)
                    delete obj.graphStyle.lineColors[key];
                if (obj.graphStyle.labelDisplayNames)
                    delete obj.graphStyle.labelDisplayNames[key];
                if (obj.graphStyle.labelUnits)
                    delete obj.graphStyle.labelUnits[key];
                this.canvas.updateSelectedObject();
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
            nameInput.placeholder = 'Label name…';
            nameInput.addEventListener('input', () => {
                if (!obj.graphStyle.labelDisplayNames)
                    obj.graphStyle.labelDisplayNames = {};
                obj.graphStyle.labelDisplayNames[key] = nameInput.value;
                this.canvas.updateSelectedObject();
            });
            const unitInput = document.createElement('input');
            unitInput.className = 'prop-label-input prop-label-unit-input';
            unitInput.type = 'text';
            unitInput.value = unit;
            unitInput.placeholder = 'Unit…';
            unitInput.addEventListener('input', () => {
                if (!obj.graphStyle.labelUnits)
                    obj.graphStyle.labelUnits = {};
                obj.graphStyle.labelUnits[key] = unitInput.value;
                this.canvas.updateSelectedObject();
            });
            inputs.appendChild(nameInput);
            inputs.appendChild(unitInput);
            row.appendChild(header);
            row.appendChild(inputs);
            container.appendChild(row);
            // — Drag-and-drop reordering —
            row.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                draggedIndex = null;
            });
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                row.classList.add('drag-over');
            });
            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-over');
            });
            row.addEventListener('drop', (e) => {
                e.preventDefault();
                row.classList.remove('drag-over');
                if (draggedIndex === null || draggedIndex === index)
                    return;
                const arr = obj.monitorDataKeys;
                const item = arr.splice(draggedIndex, 1)[0];
                const insertAt = draggedIndex < index ? index - 1 : index;
                arr.splice(insertAt, 0, item);
                this.canvas.updateSelectedObject();
                this.buildLabelRows(obj);
            });
        });
    }
    renderPanelProperties() {
        const obj = this.selectedObject;
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
    attachEventListeners() {
        var _a, _b, _c;
        if (!this.selectedObject || !this.canvas)
            return;
        // Common properties
        const nameInput = document.getElementById('prop-name');
        nameInput === null || nameInput === void 0 ? void 0 : nameInput.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.name = nameInput.value;
                this.canvas.updateSelectedObject();
            }
        });
        const xInput = document.getElementById('prop-x');
        xInput === null || xInput === void 0 ? void 0 : xInput.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.position.x = parseFloat(xInput.value);
                this.canvas.updateSelectedObject();
            }
        });
        const yInput = document.getElementById('prop-y');
        yInput === null || yInput === void 0 ? void 0 : yInput.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.position.y = parseFloat(yInput.value);
                this.canvas.updateSelectedObject();
            }
        });
        const widthInput = document.getElementById('prop-width');
        widthInput === null || widthInput === void 0 ? void 0 : widthInput.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.size.width = parseFloat(widthInput.value);
                this.canvas.updateSelectedObject();
            }
        });
        const heightInput = document.getElementById('prop-height');
        heightInput === null || heightInput === void 0 ? void 0 : heightInput.addEventListener('input', () => {
            if (this.selectedObject) {
                this.selectedObject.size.height = parseFloat(heightInput.value);
                this.canvas.updateSelectedObject();
            }
        });
        // Z-order buttons
        (_a = document.getElementById('prop-to-front')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            if (this.selectedObject && this.canvas && this.canvas.currentScreen) {
                this.canvas.currentScreen.moveObjectToFront(this.selectedObject.uuid);
                this.canvas.updateSelectedObject();
            }
        });
        (_b = document.getElementById('prop-to-back')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            if (this.selectedObject && this.canvas && this.canvas.currentScreen) {
                this.canvas.currentScreen.moveObjectToBack(this.selectedObject.uuid);
                this.canvas.updateSelectedObject();
            }
        });
        // Delete button
        (_c = document.getElementById('prop-delete')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            // Trigger delete via canvas
            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            document.dispatchEvent(event);
        });
        // Type-specific properties
        if (this.selectedObject.type === 'PANEL') {
            this.attachPanelEventListeners();
        }
        else if (this.selectedObject.type === 'LINE_GRAPH') {
            this.attachLineGraphEventListeners();
        }
    }
    attachPanelEventListeners() {
        const obj = this.selectedObject;
        const bgRow = document.getElementById('prop-bg-color-row');
        const bgSwatch = document.getElementById('prop-bg-color-swatch');
        const bgHex = document.getElementById('prop-bg-color-hex');
        bgRow === null || bgRow === void 0 ? void 0 : bgRow.addEventListener('click', (e) => {
            new ColorPickerPrompt(obj.style.backgroundColor, e, (newColor) => {
                obj.style.backgroundColor = newColor;
                if (bgSwatch)
                    bgSwatch.style.backgroundColor = newColor;
                if (bgHex)
                    bgHex.textContent = newColor;
                this.canvas.updateSelectedObject();
            }, (liveColor) => {
                obj.style.backgroundColor = liveColor;
                if (bgSwatch)
                    bgSwatch.style.backgroundColor = liveColor;
                if (bgHex)
                    bgHex.textContent = liveColor;
                const el = this.canvas.getObjectElement(obj.uuid);
                if (el)
                    el.style.backgroundColor = liveColor;
            }, () => { });
        });
        const borderRow = document.getElementById('prop-border-color-row');
        const borderSwatch = document.getElementById('prop-border-color-swatch');
        const borderHex = document.getElementById('prop-border-color-hex');
        borderRow === null || borderRow === void 0 ? void 0 : borderRow.addEventListener('click', (e) => {
            new ColorPickerPrompt(obj.style.borderColor, e, (newColor) => {
                obj.style.borderColor = newColor;
                if (borderSwatch)
                    borderSwatch.style.backgroundColor = newColor;
                if (borderHex)
                    borderHex.textContent = newColor;
                this.canvas.updateSelectedObject();
            }, (liveColor) => {
                obj.style.borderColor = liveColor;
                if (borderSwatch)
                    borderSwatch.style.backgroundColor = liveColor;
                if (borderHex)
                    borderHex.textContent = liveColor;
                const el = this.canvas.getObjectElement(obj.uuid);
                if (el)
                    el.style.borderColor = liveColor;
            }, () => { });
        });
        const borderWidth = document.getElementById('prop-border-width');
        borderWidth === null || borderWidth === void 0 ? void 0 : borderWidth.addEventListener('input', () => {
            obj.style.borderWidth = parseInt(borderWidth.value);
            this.canvas.updateSelectedObject();
        });
        const opacity = document.getElementById('prop-opacity');
        opacity === null || opacity === void 0 ? void 0 : opacity.addEventListener('input', () => {
            obj.style.opacity = parseInt(opacity.value);
            this.canvas.updateSelectedObject();
        });
    }
    attachLineGraphEventListeners() {
        var _a;
        const obj = this.selectedObject;
        // Build the label rows immediately (DOM-based, not HTML string)
        this.buildLabelRows(obj);
        // Add Label button — opens the telemetry selector prompt
        (_a = document.getElementById('prop-add-label-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
            new TelemetryLabelSelectorPrompt(e, (key) => {
                if (!obj.monitorDataKeys)
                    obj.monitorDataKeys = [];
                if (!obj.monitorDataKeys.includes(key)) {
                    obj.monitorDataKeys.push(key);
                    this.canvas.updateSelectedObject();
                    this.buildLabelRows(obj);
                }
            }, () => { });
        });
        // Graph style properties
        const bgRow = document.getElementById('prop-bg-color-row');
        const bgSwatch = document.getElementById('prop-bg-color-swatch');
        const bgHex = document.getElementById('prop-bg-color-hex');
        bgRow === null || bgRow === void 0 ? void 0 : bgRow.addEventListener('click', (e) => {
            new ColorPickerPrompt(obj.graphStyle.backgroundColor, e, (newColor) => {
                obj.graphStyle.backgroundColor = newColor;
                if (bgSwatch)
                    bgSwatch.style.backgroundColor = newColor;
                if (bgHex)
                    bgHex.textContent = newColor;
                this.canvas.updateSelectedObject();
            }, (liveColor) => {
                obj.graphStyle.backgroundColor = liveColor;
                if (bgSwatch)
                    bgSwatch.style.backgroundColor = liveColor;
                if (bgHex)
                    bgHex.textContent = liveColor;
                this.canvas.setGraphBackgroundColor(obj.uuid, liveColor);
            }, () => { });
        });
        const yMin = document.getElementById('prop-y-min');
        yMin === null || yMin === void 0 ? void 0 : yMin.addEventListener('input', () => {
            obj.graphStyle.yMin = parseFloat(yMin.value);
            this.canvas.updateSelectedObject();
        });
        const yMax = document.getElementById('prop-y-max');
        yMax === null || yMax === void 0 ? void 0 : yMax.addEventListener('input', () => {
            obj.graphStyle.yMax = parseFloat(yMax.value);
            this.canvas.updateSelectedObject();
        });
        const timeWindow = document.getElementById('prop-time-window');
        timeWindow === null || timeWindow === void 0 ? void 0 : timeWindow.addEventListener('input', () => {
            let value = parseInt(timeWindow.value);
            if (value <= 0) {
                value = 1;
                timeWindow.value = '1';
            }
            obj.graphStyle.timeWindow = value;
            this.canvas.updateSelectedObject();
        });
        timeWindow === null || timeWindow === void 0 ? void 0 : timeWindow.addEventListener('blur', () => {
            let value = parseInt(timeWindow.value);
            if (value <= 0) {
                value = 1;
                timeWindow.value = '1';
                obj.graphStyle.timeWindow = value;
                this.canvas.updateSelectedObject();
            }
        });
        const unit = document.getElementById('prop-unit');
        unit === null || unit === void 0 ? void 0 : unit.addEventListener('input', () => {
            obj.graphStyle.unit = unit.value;
            this.canvas.updateSelectedObject();
        });
        const showInfo = document.getElementById('prop-show-info');
        showInfo === null || showInfo === void 0 ? void 0 : showInfo.addEventListener('change', () => {
            obj.graphStyle.showInfo = showInfo.checked;
            this.canvas.setGraphShowInfo(obj.uuid, showInfo.checked);
        });
        const xOverflow = document.getElementById('prop-x-overflow');
        xOverflow === null || xOverflow === void 0 ? void 0 : xOverflow.addEventListener('change', () => {
            obj.graphStyle.xOverflowMode = xOverflow.value;
            this.canvas.updateSelectedObject();
        });
        const yOverflow = document.getElementById('prop-y-overflow');
        yOverflow === null || yOverflow === void 0 ? void 0 : yOverflow.addEventListener('change', () => {
            obj.graphStyle.yOverflowMode = yOverflow.value;
            this.canvas.updateSelectedObject();
        });
    }
}
//# sourceMappingURL=properties_panel.js.map