/**
 * PropertiesPanel - Context-sensitive properties editor
 */
export class PropertiesPanel {
    constructor(container) {
        this.selectedObject = null;
        this.canvas = null;
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
    renderLineGraphProperties() {
        const obj = this.selectedObject;
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
    renderPanelProperties() {
        const obj = this.selectedObject;
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
        const bgColor = document.getElementById('prop-bg-color');
        bgColor === null || bgColor === void 0 ? void 0 : bgColor.addEventListener('input', () => {
            obj.style.backgroundColor = bgColor.value;
            this.canvas.updateSelectedObject();
        });
        const borderColor = document.getElementById('prop-border-color');
        borderColor === null || borderColor === void 0 ? void 0 : borderColor.addEventListener('input', () => {
            obj.style.borderColor = borderColor.value;
            this.canvas.updateSelectedObject();
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
        const obj = this.selectedObject;
        const bgColor = document.getElementById('prop-bg-color');
        bgColor === null || bgColor === void 0 ? void 0 : bgColor.addEventListener('input', () => {
            obj.graphStyle.backgroundColor = bgColor.value;
            this.canvas.updateSelectedObject();
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
            obj.graphStyle.timeWindow = parseInt(timeWindow.value);
            this.canvas.updateSelectedObject();
        });
        const unit = document.getElementById('prop-unit');
        unit === null || unit === void 0 ? void 0 : unit.addEventListener('input', () => {
            obj.graphStyle.unit = unit.value;
            this.canvas.updateSelectedObject();
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