/**
 * EditorCanvas - Manages the 1920x1080 canvas rendering and interaction
 */
import { LineGraphRepresentation, LineGraphXOverflowMode, LineGraphYOverflowMode } from '../../live_data/compiled_js/graph_representations.js';
import { ConfirmationPrompt } from '../../shared/compiled_js/prompts.js';
export class EditorCanvas {
    constructor(canvasElement) {
        this.currentScreen = null;
        this.selectedObject = null;
        this.objectElements = new Map();
        this.graphInstances = new Map();
        this.eventListeners = new Map();
        this.canvasScale = 1; // Track the current canvas scale factor
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
    updateCanvasScale() {
        const rect = this.canvasElement.getBoundingClientRect();
        this.canvasScale = rect.width / 1920; // Calculate current scale factor
    }
    loadScreen(screen) {
        this.currentScreen = screen;
        this.selectedObject = null;
        this.renderScreen();
    }
    renderScreen() {
        // Clear canvas and old graph instances
        this.canvasElement.innerHTML = '';
        this.graphInstances.clear();
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
        element.draggable = false;
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
        var _a;
        element.style.backgroundColor = 'transparent';
        // Only clear the content layer — preserve resize handles
        let content = element.querySelector('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '';
        // Create container for the graph
        const graphContainer = document.createElement('div');
        graphContainer.id = `graph-${obj.uuid}`;
        graphContainer.style.width = '100%';
        graphContainer.style.height = '100%';
        graphContainer.style.position = 'relative';
        graphContainer.style.overflow = 'hidden';
        graphContainer.style.backgroundColor = obj.graphStyle.backgroundColor;
        content.appendChild(graphContainer);
        // Clean up old graph instance
        if (this.graphInstances.has(obj.uuid)) {
            this.graphInstances.delete(obj.uuid);
        }
        // Only create graph if there are monitor data keys
        if (obj.monitorDataKeys.length === 0) {
            graphContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 14px;">No telemetry labels selected</div>`;
            return;
        }
        // Create line collections with default colors
        const lineCollections = {};
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
        obj.monitorDataKeys.forEach((key, index) => {
            var _a;
            lineCollections[key] = {
                color: ((_a = obj.graphStyle.lineColors) === null || _a === void 0 ? void 0 : _a[key]) || colors[index % colors.length],
                width: 2,
                opacity: 1
            };
        });
        // Create graph instance
        try {
            const graph = new LineGraphRepresentation(obj.name || 'Graph', obj.graphStyle.unit || '', obj.graphStyle.yMin, obj.graphStyle.yMax, obj.graphStyle.timeWindow, lineCollections, graphContainer.id);
            // Set overflow modes - convert string to enum
            const xMode = obj.graphStyle.xOverflowMode === 'ShiftGraph' ? LineGraphXOverflowMode.ShiftGraph :
                obj.graphStyle.xOverflowMode === 'ScaleAxis' ? LineGraphXOverflowMode.ScaleAxis :
                    LineGraphXOverflowMode.None;
            const yMode = obj.graphStyle.yOverflowMode === 'ScaleAxis' ? LineGraphYOverflowMode.ScaleAxis :
                LineGraphYOverflowMode.None;
            graph.setOverflowX(xMode);
            graph.setOverflowY(yMode);
            graph.setBackgroundColor(obj.graphStyle.backgroundColor);
            graph.setShowInfo((_a = obj.graphStyle.showInfo) !== null && _a !== void 0 ? _a : true);
            graph.setFillHeight();
            // Generate sample data for preview
            this.generateSampleData(graph, obj.monitorDataKeys, obj.graphStyle.timeWindow);
            this.graphInstances.set(obj.uuid, graph);
        }
        catch (error) {
            console.error('Failed to create graph:', error);
            graphContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff6b6b; font-size: 12px;">Failed to create graph</div>`;
        }
    }
    generateSampleData(graph, keys, timeWindow = 30) {
        for (let t = 0; t <= timeWindow; t += timeWindow / 60) {
            keys.forEach((key, index) => {
                const frequency = 0.5 + index * 0.3;
                const amplitude = 20 + index * 10;
                const offset = 50 + index * 15;
                const value = Math.sin(t * frequency) * amplitude + offset;
                graph.addDataPoint(t, value, key);
            });
        }
    }
    renderPanel(element, obj) {
        element.style.backgroundColor = obj.style.backgroundColor;
        element.style.borderWidth = `${obj.style.borderWidth}px`;
        element.style.borderColor = obj.style.borderColor;
        element.style.borderStyle = obj.style.borderStyle;
        element.style.opacity = (obj.style.opacity / 100).toString();
        // Only clear the content layer — preserve resize handles
        let content = element.querySelector('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '<div style="color:#555;font-size:14px;">Panel</div>';
    }
    addResizeHandles(element) {
        const corners = ['nw', 'ne', 'se', 'sw'];
        corners.forEach(handle => {
            const handleEl = document.createElement('div');
            handleEl.className = `resize-handle ${handle}`;
            handleEl.dataset.handle = handle;
            handleEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
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
        e.preventDefault();
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
        this.canvasElement.classList.add('dragging');
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
        this.canvasElement.classList.add('dragging');
    }
    handleMouseMove(e) {
        if (!this.dragState || !this.currentScreen)
            return;
        const obj = this.currentScreen.getObject(this.dragState.objectUuid);
        if (!obj)
            return;
        this.updateCanvasScale(); // Update scale factor
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        if (this.dragState.mode === 'move') {
            const deltaPercentX = (deltaX / (1920 * this.canvasScale)) * 100;
            const deltaPercentY = (deltaY / (1080 * this.canvasScale)) * 100;
            obj.position.x = this.snap(this.dragState.startPosition.x + deltaPercentX);
            obj.position.y = this.snap(this.dragState.startPosition.y + deltaPercentY);
            // Constrain position considering object size to prevent going outside bounds
            obj.position.x = Math.max(0, Math.min(100 - obj.size.width, obj.position.x));
            obj.position.y = Math.max(0, Math.min(100 - obj.size.height, obj.position.y));
        }
        else if (this.dragState.mode === 'resize') {
            this.handleResize(obj, deltaX, deltaY);
        }
        const element = this.objectElements.get(obj.uuid);
        if (element) {
            this.updateObjectElement(element, obj);
        }
        this.emit('objectChanged');
        this.emit('positionChanged', obj);
    }
    handleResize(obj, deltaX, deltaY) {
        const handle = this.dragState.resizeHandle;
        const deltaPercentX = (deltaX / (1920 * this.canvasScale)) * 100;
        const deltaPercentY = (deltaY / (1080 * this.canvasScale)) * 100;
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
        // Constrain size to minimum 1% and maximum available space
        obj.size.width = Math.max(1, Math.min(100 - obj.position.x, obj.size.width));
        obj.size.height = Math.max(1, Math.min(100 - obj.position.y, obj.size.height));
        // Constrain position to bounds, accounting for object size
        obj.position.x = Math.max(0, Math.min(100 - obj.size.width, obj.position.x));
        obj.position.y = Math.max(0, Math.min(100 - obj.size.height, obj.position.y));
    }
    handleMouseUp() {
        this.dragState = null;
        this.canvasElement.classList.remove('dragging');
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
        this.updateCanvasScale(); // Update scale factor
        const rect = this.canvasElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / (1920 * this.canvasScale)) * 100;
        const y = ((e.clientY - rect.top) / (1080 * this.canvasScale)) * 100;
        // Constrain drop position to ensure object fits within bounds
        const constrainedX = Math.max(0, Math.min(80, this.snap(x))); // 80% max to fit 20% width
        const constrainedY = Math.max(0, Math.min(80, this.snap(y))); // 80% max to fit 20% height
        this.createObject(objectType, { x: constrainedX, y: constrainedY });
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
                    labelDisplayNames: {},
                    labelUnits: {},
                    axisLabels: true,
                    grid: true,
                    yMin: 0,
                    yMax: 100,
                    timeWindow: 30,
                    unit: '',
                    xAxisRange: { min: 0, max: 20 },
                    yAxisRange: { min: 0, max: 20 },
                    xAxisLabel: 'Time (s)',
                    yAxisLabel: 'Value',
                    units: '',
                    legendPosition: 'topRight',
                    xOverflowMode: 'ShiftGraph',
                    yOverflowMode: 'ScaleAxis',
                    showInfo: true
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
        const uuid = this.selectedObject.uuid;
        const name = this.selectedObject.name || 'this object';
        new ConfirmationPrompt('Delete Object', `Delete <strong>${name}</strong>?`, 'Delete', 'Cancel', () => {
            this.currentScreen.removeObject(uuid);
            const element = this.objectElements.get(uuid);
            element === null || element === void 0 ? void 0 : element.remove();
            this.objectElements.delete(uuid);
            this.selectObject(null);
            this.emit('objectChanged');
        });
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
    getObjectElement(uuid) {
        return this.objectElements.get(uuid);
    }
    setGraphBackgroundColor(uuid, color) {
        const graph = this.graphInstances.get(uuid);
        if (graph)
            graph.setBackgroundColor(color);
    }
    setGraphShowInfo(uuid, visible) {
        const graph = this.graphInstances.get(uuid);
        if (graph)
            graph.setShowInfo(visible);
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