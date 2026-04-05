/**
 * EditorCanvas - Manages the 1920x1080 canvas rendering and interaction
 */

import type { InterfaceObject, LineGraphObject, PanelObject } from './types.js';
import { EditorScreen } from './editor_screen.js';
import { LineGraphRepresentation, LineGraphXOverflowMode, LineGraphYOverflowMode } from '../../live_data/compiled_js/graph_representations.js';

type EventCallback = (...args: any[]) => void;

export class EditorCanvas {
    private canvasElement: HTMLDivElement;
    public currentScreen: EditorScreen | null = null;
    private selectedObject: InterfaceObject | null = null;
    private objectElements: Map<string, HTMLDivElement> = new Map();
    private graphInstances: Map<string, LineGraphRepresentation> = new Map();
    private eventListeners: Map<string, EventCallback[]> = new Map();

    private dragState: {
        mode: 'move' | 'resize' | null;
        objectUuid: string;
        startX: number;
        startY: number;
        startPosition?: { x: number; y: number };
        startSize?: { width: number; height: number };
        resizeHandle?: string;
    } | null = null;

    constructor(canvasElement: HTMLDivElement) {
        this.canvasElement = canvasElement;
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        this.canvasElement.addEventListener('click', (e) => this.handleCanvasClick(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());

        // Drop handling
        this.canvasElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        });

        this.canvasElement.addEventListener('drop', (e) => this.handleDrop(e));

        // Delete key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedObject) {
                this.deleteSelectedObject();
            }
        });
    }

    public loadScreen(screen: EditorScreen): void {
        this.currentScreen = screen;
        this.selectedObject = null;
        this.renderScreen();
    }

    private renderScreen(): void {
        // Clear canvas and old graph instances
        this.canvasElement.innerHTML = '';
        this.graphInstances.clear();
        this.objectElements.clear();

        if (!this.currentScreen) return;

        // Render all objects
        this.currentScreen.objects.forEach(obj => {
            this.renderObject(obj);
        });
    }

    private renderObject(obj: InterfaceObject): void {
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
        } else if (obj.type === 'PANEL') {
            this.renderPanel(element, obj);
        }
    }

    private updateObjectElement(element: HTMLDivElement, obj: InterfaceObject): void {
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

    private renderLineGraph(element: HTMLDivElement, obj: LineGraphObject): void {
        element.style.backgroundColor = obj.graphStyle.backgroundColor;
        
        // Clear previous content
        element.innerHTML = '';
        
        // Create container for the graph
        const graphContainer = document.createElement('div');
        graphContainer.id = `graph-${obj.uuid}`;
        graphContainer.style.width = '100%';
        graphContainer.style.height = '100%';
        graphContainer.style.position = 'relative';
        element.appendChild(graphContainer);

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
        const lineCollections: { [key: string]: { color: string; width: number; opacity: number } } = {};
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
        obj.monitorDataKeys.forEach((key, index) => {
            lineCollections[key] = {
                color: obj.graphStyle.lineColors?.[key] || colors[index % colors.length],
                width: 2,
                opacity: 1
            };
        });

        // Create graph instance
        try {
            const graph = new LineGraphRepresentation(
                obj.name || 'Graph',
                obj.graphStyle.unit || '',
                obj.graphStyle.yMin,
                obj.graphStyle.yMax,
                obj.graphStyle.timeWindow,
                lineCollections,
                graphContainer.id
            );

            // Set overflow modes - convert string to enum
            const xMode = obj.graphStyle.xOverflowMode === 'ShiftGraph' ? LineGraphXOverflowMode.ShiftGraph :
                          obj.graphStyle.xOverflowMode === 'ScaleAxis' ? LineGraphXOverflowMode.ScaleAxis :
                          LineGraphXOverflowMode.None;
            const yMode = obj.graphStyle.yOverflowMode === 'ScaleAxis' ? LineGraphYOverflowMode.ScaleAxis :
                          LineGraphYOverflowMode.None;
            
            graph.setOverflowX(xMode);
            graph.setOverflowY(yMode);

            // Generate sample data for preview
            this.generateSampleData(graph, obj.monitorDataKeys);

            this.graphInstances.set(obj.uuid, graph);
        } catch (error) {
            console.error('Failed to create graph:', error);
            graphContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff6b6b; font-size: 12px;">Failed to create graph</div>`;
        }
    }

    private generateSampleData(graph: LineGraphRepresentation, keys: string[]): void {
        // Generate 30 seconds of sample data
        const now = Date.now() / 1000;
        const startTime = now - 30;
        
        for (let t = 0; t <= 30; t += 0.5) {
            const timestamp = startTime + t;
            keys.forEach((key, index) => {
                // Create different wave patterns for each key
                const frequency = 0.5 + index * 0.3;
                const amplitude = 20 + index * 10;
                const offset = 50 + index * 15;
                const value = Math.sin(t * frequency) * amplitude + offset;
                
                // addDataPoint(x: number, y: number, collectionKey: string)
                graph.addDataPoint(timestamp, value, key);
            });
        }
    }

    private renderPanel(element: HTMLDivElement, obj: PanelObject): void {
        element.style.backgroundColor = obj.style.backgroundColor;
        element.style.borderWidth = `${obj.style.borderWidth}px`;
        element.style.borderColor = obj.style.borderColor;
        element.style.borderStyle = obj.style.borderStyle;
        element.style.opacity = (obj.style.opacity / 100).toString();
        element.innerHTML = '<div style="text-align: center; line-height: 1.5;">Panel</div>';
    }

    private addResizeHandles(element: HTMLDivElement): void {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(handle => {
            const handleEl = document.createElement('div');
            handleEl.className = `resize-handle ${handle}`;
            handleEl.dataset.handle = handle;
            handleEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(element.dataset.uuid!, handle, e);
            });
            element.appendChild(handleEl);
        });
    }

    private handleCanvasClick(e: MouseEvent): void {
        if (e.target === this.canvasElement) {
            this.selectObject(null);
        }
    }

    private handleObjectMouseDown(e: MouseEvent, obj: InterfaceObject): void {
        if ((e.target as HTMLElement).classList.contains('resize-handle')) {
            return; // Handled by resize handle
        }

        e.stopPropagation();
        this.selectObject(obj);
        this.startMove(obj, e);
    }

    private startMove(obj: InterfaceObject, e: MouseEvent): void {
        this.dragState = {
            mode: 'move',
            objectUuid: obj.uuid,
            startX: e.clientX,
            startY: e.clientY,
            startPosition: { ...obj.position }
        };
    }

    private startResize(uuid: string, handle: string, e: MouseEvent): void {
        const obj = this.currentScreen?.getObject(uuid);
        if (!obj) return;

        this.dragState = {
            mode: 'resize',
            objectUuid: uuid,
            startX: e.clientX,
            startY: e.clientY,
            startPosition: { ...obj.position },
            startSize: { ...obj.size },
            resizeHandle: handle
        };
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.dragState || !this.currentScreen) return;

        const obj = this.currentScreen.getObject(this.dragState.objectUuid);
        if (!obj) return;

        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;

        if (this.dragState.mode === 'move') {
            const deltaPercentX = (deltaX / 1920) * 100;
            const deltaPercentY = (deltaY / 1080) * 100;

            obj.position.x = this.snap(this.dragState.startPosition!.x + deltaPercentX);
            obj.position.y = this.snap(this.dragState.startPosition!.y + deltaPercentY);

            obj.position.x = Math.max(0, Math.min(100, obj.position.x));
            obj.position.y = Math.max(0, Math.min(100, obj.position.y));
        } else if (this.dragState.mode === 'resize') {
            this.handleResize(obj, deltaX, deltaY);
        }

        const element = this.objectElements.get(obj.uuid);
        if (element) {
            this.updateObjectElement(element, obj);
        }

        this.emit('objectChanged');
    }

    private handleResize(obj: InterfaceObject, deltaX: number, deltaY: number): void {
        const handle = this.dragState!.resizeHandle!;
        const deltaPercentX = (deltaX / 1920) * 100;
        const deltaPercentY = (deltaY / 1080) * 100;

        const start = this.dragState!.startPosition!;
        const startSize = this.dragState!.startSize!;

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

    private handleMouseUp(): void {
        this.dragState = null;
    }

    private snap(value: number): number {
        return Math.round(value); // 1% grid
    }

    public selectObject(obj: InterfaceObject | null): void {
        // Remove previous selection
        if (this.selectedObject) {
            const prevElement = this.objectElements.get(this.selectedObject.uuid);
            prevElement?.classList.remove('selected');
        }

        this.selectedObject = obj;

        // Add new selection
        if (obj) {
            const element = this.objectElements.get(obj.uuid);
            element?.classList.add('selected');
        }

        this.emit('selectionChanged', obj);
    }

    public handleDrop(e: DragEvent): void {
        e.preventDefault();
        const objectType = e.dataTransfer?.getData('objectType');
        if (!objectType || !this.currentScreen) return;

        const rect = this.canvasElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / 1920) * 100;
        const y = ((e.clientY - rect.top) / 1080) * 100;

        this.createObject(objectType as any, { x: this.snap(x), y: this.snap(y) });
    }

    private createObject(type: 'LINE_GRAPH' | 'PANEL', position: { x: number; y: number }): void {
        if (!this.currentScreen) return;

        const uuid = crypto.randomUUID();
        const baseObj = {
            uuid,
            name: '',
            position,
            size: { width: 20, height: 20 },
            zIndex: this.currentScreen.objects.length
        };

        let obj: InterfaceObject;
        if (type === 'LINE_GRAPH') {
            obj = {
                ...baseObj,
                type: 'LINE_GRAPH',
                monitorDataKeys: [],
                graphStyle: {
                    backgroundColor: '#1a1a1a',
                    lineColors: {},
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
                    legendPosition: 'topRight' as const,
                    xOverflowMode: 'ShiftGraph' as const,
                    yOverflowMode: 'ScaleAxis' as const
                }
            };
        } else {
            obj = {
                ...baseObj,
                type: 'PANEL',
                style: {
                    backgroundColor: '#242424',
                    borderWidth: 1,
                    borderColor: '#333333',
                    borderStyle: 'solid' as const,
                    opacity: 100
                }
            };
        }

        this.currentScreen.addObject(obj);
        this.renderObject(obj);
        this.selectObject(obj);
        this.emit('objectChanged');
    }

    private deleteSelectedObject(): void {
        if (!this.selectedObject || !this.currentScreen) return;

        if (confirm(`Delete ${this.selectedObject.name || 'this object'}?`)) {
            const uuid = this.selectedObject.uuid;
            this.currentScreen.removeObject(uuid);
            const element = this.objectElements.get(uuid);
            element?.remove();
            this.objectElements.delete(uuid);
            this.selectObject(null);
            this.emit('objectChanged');
        }
    }

    public updateSelectedObject(): void {
        if (!this.selectedObject) return;
        const element = this.objectElements.get(this.selectedObject.uuid);
        if (element) {
            this.updateObjectElement(element, this.selectedObject);
            
            // Update content
            if (this.selectedObject.type === 'LINE_GRAPH') {
                this.renderLineGraph(element, this.selectedObject);
            } else if (this.selectedObject.type === 'PANEL') {
                this.renderPanel(element, this.selectedObject);
            }
        }
        this.emit('objectChanged');
    }

    public getSelectedObject(): InterfaceObject | null {
        return this.selectedObject;
    }

    public on(event: string, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    private emit(event: string, ...args: any[]): void {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }
}
