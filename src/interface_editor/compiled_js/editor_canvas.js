/**
 * EditorCanvas - Manages the 1920x1080 canvas rendering and interaction
 */
export class EditorCanvas {
    constructor(canvasElement) {
        this.currentScreen = null;
        this.selectedObject = null;
        this.objectElements = new Map();
        this.eventListeners = new Map();
        this.dragState = null;
        this.canvasElement = canvasElement;
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        this.canvasElement.addEventListener('click', (e) => this.handleCanvasClick(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        // Drop handling
        this.canvasElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        this.canvasElement.addEventListener('drop', (e) => this.handleDrop(e));
        // Delete key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedObject) {
                this.deleteSelectedObject();
            }
        });
    }
    loadScreen(screen) {
        this.currentScreen = screen;
        this.selectedObject = null;
        this.renderScreen();
    }
    renderScreen() {
        // Clear canvas
        this.canvasElement.innerHTML = '';
        this.objectElements.clear();
        if (!this.currentScreen)
            return;
        // Render all objects
        this.currentScreen.objects.forEach(obj => {
            this.renderObject(obj);
        });
    }
    renderObject(obj) {
        const element = document.createElement('div');
        element.className = `canvas-object ${obj.type === 'LINE_GRAPH' ? 'line-graph' : 'panel'}`;
        element.dataset.uuid = obj.uuid;
        // Set position and size (convert percentage to pixels)
        this.updateObjectElement(element, obj);
        // Add resize handles
        this.addResizeHandles(element);
        // Object click handler
        element.addEventListener('mousedown', (e) => this.handleObjectMouseDown(e, obj));
        this.canvasElement.appendChild(element);
        this.objectElements.set(obj.uuid, element);
        // Render object content
        if (obj.type === 'LINE_GRAPH') {
            this.renderLineGraph(element, obj);
        }
        else if (obj.type === 'PANEL') {
            this.renderPanel(element, obj);
        }
    }
    updateObjectElement(element, obj) {
        const canvasWidth = 1920;
        const canvasHeight = 1080;
        const left = (obj.position.x / 100) * canvasWidth;
        const top = (obj.position.y / 100) * canvasHeight;
        const width = (obj.size.width / 100) * canvasWidth;
        const height = (obj.size.height / 100) * canvasHeight;
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        element.style.zIndex = obj.zIndex.toString();
    }
    renderLineGraph(element, obj) {
        element.style.backgroundColor = obj.graphStyle.backgroundColor;
        element.innerHTML = `<div style="padding: 8px; font-size: 12px; color: #888;">Line Graph: ${obj.monitorDataKeys.length} labels</div>`;
        // TODO: Integrate actual LineGraphRepresentation with sample data
    }
    renderPanel(element, obj) {
        element.style.backgroundColor = obj.style.backgroundColor;
        element.style.borderWidth = `${obj.style.borderWidth}px`;
        element.style.borderColor = obj.style.borderColor;
        element.style.borderStyle = obj.style.borderStyle;
        element.style.opacity = (obj.style.opacity / 100).toString();
        element.innerHTML = '<div style="text-align: center; line-height: 1.5;">Panel</div>';
    }
    addResizeHandles(element) {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(handle => {
            const handleEl = document.createElement('div');
            handleEl.className = `resize-handle ${handle}`;
            handleEl.dataset.handle = handle;
            handleEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(element.dataset.uuid, handle, e);
            });
            element.appendChild(handleEl);
        });
    }
    handleCanvasClick(e) {
        if (e.target === this.canvasElement) {
            this.selectObject(null);
        }
    }
    handleObjectMouseDown(e, obj) {
        if (e.target.classList.contains('resize-handle')) {
            return; // Handled by resize handle
        }
        e.stopPropagation();
        this.selectObject(obj);
        this.startMove(obj, e);
    }
    startMove(obj, e) {
        this.dragState = {
            mode: 'move',
            objectUuid: obj.uuid,
            startX: e.clientX,
            startY: e.clientY,
            startPosition: Object.assign({}, obj.position)
        };
    }
    startResize(uuid, handle, e) {
        var _a;
        const obj = (_a = this.currentScreen) === null || _a === void 0 ? void 0 : _a.getObject(uuid);
        if (!obj)
            return;
        this.dragState = {
            mode: 'resize',
            objectUuid: uuid,
            startX: e.clientX,
            startY: e.clientY,
            startPosition: Object.assign({}, obj.position),
            startSize: Object.assign({}, obj.size),
            resizeHandle: handle
        };
    }
    handleMouseMove(e) {
        if (!this.dragState || !this.currentScreen)
            return;
        const obj = this.currentScreen.getObject(this.dragState.objectUuid);
        if (!obj)
            return;
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        if (this.dragState.mode === 'move') {
            const deltaPercentX = (deltaX / 1920) * 100;
            const deltaPercentY = (deltaY / 1080) * 100;
            obj.position.x = this.snap(this.dragState.startPosition.x + deltaPercentX);
            obj.position.y = this.snap(this.dragState.startPosition.y + deltaPercentY);
            obj.position.x = Math.max(0, Math.min(100, obj.position.x));
            obj.position.y = Math.max(0, Math.min(100, obj.position.y));
        }
        else if (this.dragState.mode === 'resize') {
            this.handleResize(obj, deltaX, deltaY);
        }
        const element = this.objectElements.get(obj.uuid);
        if (element) {
            this.updateObjectElement(element, obj);
        }
        this.emit('objectChanged');
    }
    handleResize(obj, deltaX, deltaY) {
        const handle = this.dragState.resizeHandle;
        const deltaPercentX = (deltaX / 1920) * 100;
        const deltaPercentY = (deltaY / 1080) * 100;
        const start = this.dragState.startPosition;
        const startSize = this.dragState.startSize;
        if (handle.includes('e')) {
            obj.size.width = this.snap(startSize.width + deltaPercentX);
        }
        if (handle.includes('w')) {
            obj.size.width = this.snap(startSize.width - deltaPercentX);
            obj.position.x = this.snap(start.x + deltaPercentX);
        }
        if (handle.includes('s')) {
            obj.size.height = this.snap(startSize.height + deltaPercentY);
        }
        if (handle.includes('n')) {
            obj.size.height = this.snap(startSize.height - deltaPercentY);
            obj.position.y = this.snap(start.y + deltaPercentY);
        }
        obj.size.width = Math.max(1, Math.min(100, obj.size.width));
        obj.size.height = Math.max(1, Math.min(100, obj.size.height));
        obj.position.x = Math.max(0, Math.min(100, obj.position.x));
        obj.position.y = Math.max(0, Math.min(100, obj.position.y));
    }
    handleMouseUp() {
        this.dragState = null;
    }
    snap(value) {
        return Math.round(value); // 1% grid
    }
    selectObject(obj) {
        // Remove previous selection
        if (this.selectedObject) {
            const prevElement = this.objectElements.get(this.selectedObject.uuid);
            prevElement === null || prevElement === void 0 ? void 0 : prevElement.classList.remove('selected');
        }
        this.selectedObject = obj;
        // Add new selection
        if (obj) {
            const element = this.objectElements.get(obj.uuid);
            element === null || element === void 0 ? void 0 : element.classList.add('selected');
        }
        this.emit('selectionChanged', obj);
    }
    handleDrop(e) {
        var _a;
        e.preventDefault();
        const objectType = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('objectType');
        if (!objectType || !this.currentScreen)
            return;
        const rect = this.canvasElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / 1920) * 100;
        const y = ((e.clientY - rect.top) / 1080) * 100;
        this.createObject(objectType, { x: this.snap(x), y: this.snap(y) });
    }
    createObject(type, position) {
        if (!this.currentScreen)
            return;
        const uuid = crypto.randomUUID();
        const baseObj = {
            uuid,
            name: '',
            position,
            size: { width: 20, height: 20 },
            zIndex: this.currentScreen.objects.length
        };
        let obj;
        if (type === 'LINE_GRAPH') {
            obj = Object.assign(Object.assign({}, baseObj), { type: 'LINE_GRAPH', monitorDataKeys: [], graphStyle: {
                    backgroundColor: '#1a1a1a',
                    lineColors: {},
                    axisLabels: true,
                    grid: true,
                    xAxisRange: { min: 0, max: 20 },
                    yAxisRange: { min: 0, max: 20 },
                    xAxisLabel: 'Time (s)',
                    yAxisLabel: 'Value',
                    units: '',
                    legendPosition: 'topRight',
                    xOverflowMode: 'ShiftGraph',
                    yOverflowMode: 'ScaleAxis'
                } });
        }
        else {
            obj = Object.assign(Object.assign({}, baseObj), { type: 'PANEL', style: {
                    backgroundColor: '#242424',
                    borderWidth: 1,
                    borderColor: '#333333',
                    borderStyle: 'solid',
                    opacity: 100
                } });
        }
        this.currentScreen.addObject(obj);
        this.renderObject(obj);
        this.selectObject(obj);
        this.emit('objectChanged');
    }
    deleteSelectedObject() {
        if (!this.selectedObject || !this.currentScreen)
            return;
        if (confirm(`Delete ${this.selectedObject.name || 'this object'}?`)) {
            const uuid = this.selectedObject.uuid;
            this.currentScreen.removeObject(uuid);
            const element = this.objectElements.get(uuid);
            element === null || element === void 0 ? void 0 : element.remove();
            this.objectElements.delete(uuid);
            this.selectObject(null);
            this.emit('objectChanged');
        }
    }
    updateSelectedObject() {
        if (!this.selectedObject)
            return;
        const element = this.objectElements.get(this.selectedObject.uuid);
        if (element) {
            this.updateObjectElement(element, this.selectedObject);
            // Update content
            if (this.selectedObject.type === 'LINE_GRAPH') {
                this.renderLineGraph(element, this.selectedObject);
            }
            else if (this.selectedObject.type === 'PANEL') {
                this.renderPanel(element, this.selectedObject);
            }
        }
        this.emit('objectChanged');
    }
    getSelectedObject() {
        return this.selectedObject;
    }
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    emit(event, ...args) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }
}
//# sourceMappingURL=editor_canvas.js.map