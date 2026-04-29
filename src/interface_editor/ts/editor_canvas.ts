/**
 * EditorCanvas - Manages the 1920x1080 canvas rendering and interaction
 */

import type { InterfaceObject, LineGraphObject, PanelObject, BarGraphObject, Model3DObject, MinimapObject, StatusDisplayObject } from './types.js';
import { DEFAULT_BAR_GRAPH_STYLE, DEFAULT_STATUS_DISPLAY_STYLE } from './types.js';
import { EditorScreen } from './editor_screen.js';
import { LineGraphRepresentation, LineGraphXOverflowMode, LineGraphYOverflowMode } from '../../live_data/compiled_js/graph_representations.js';
import { ConfirmationPrompt } from '../../shared/compiled_js/prompts.js';

type EventCallback = (...args: any[]) => void;

export class EditorCanvas {
    private canvasElement: HTMLDivElement;
    public currentScreen: EditorScreen | null = null;
    private selectedObject: InterfaceObject | null = null;
    private objectElements: Map<string, HTMLDivElement> = new Map();
    private graphInstances: Map<string, LineGraphRepresentation> = new Map();
    private eventListeners: Map<string, EventCallback[]> = new Map();
    private canvasScale: number = 1; // Track the current canvas scale factor

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

    private updateCanvasScale(): void {
        const rect = this.canvasElement.getBoundingClientRect();
        this.canvasScale = rect.width / 1920; // Calculate current scale factor
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
        const typeClass = obj.type.toLowerCase().replace(/_/g, '-');
        element.className = `canvas-object ${typeClass}`;
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
        } else if (obj.type === 'PANEL') {
            this.renderPanel(element, obj);
        } else if (obj.type === 'BAR_GRAPH') {
            this.renderBarGraph(element, obj);
        } else if (obj.type === 'MODEL_3D') {
            this.renderModel3D(element, obj);
        } else if (obj.type === 'MINIMAP') {
            this.renderMinimap(element, obj);
        } else if (obj.type === 'STATUS_DISPLAY') {
            this.renderStatusDisplay(element, obj);
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

        // Scale is applied to .scale-wrapper inside .object-content, not the element itself
        const scale = (obj.scale ?? 100) / 100;
        const scaleWrapper = element.querySelector<HTMLDivElement>('.scale-wrapper');
        if (scaleWrapper) {
            scaleWrapper.style.transform = `scale(${scale})`;
        }
    }

    private renderLineGraph(element: HTMLDivElement, obj: LineGraphObject): void {
        element.style.backgroundColor = 'transparent';

        // Only clear the content layer — preserve resize handles
        let content = element.querySelector<HTMLDivElement>('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '';

        // Scale wrapper — clips at content boundary, only content inside scales
        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'scale-wrapper';
        const scale = (obj.scale ?? 100) / 100;
        scaleWrapper.style.cssText = `width:100%;height:100%;transform-origin:top left;transform:scale(${scale});`;
        content.appendChild(scaleWrapper);

        // Create container for the graph
        const graphContainer = document.createElement('div');
        graphContainer.id = `graph-${obj.uuid}`;
        graphContainer.style.width = '100%';
        graphContainer.style.height = '100%';
        graphContainer.style.position = 'relative';
        graphContainer.style.overflow = 'hidden';
        graphContainer.style.backgroundColor = obj.graphStyle.backgroundColor;
        scaleWrapper.appendChild(graphContainer);

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
                graphContainer.id,
                obj.graphStyle.labelDisplayNames || {}
            );

            // Set overflow modes - convert string to enum
            const xMode = obj.graphStyle.xOverflowMode === 'ShiftGraph' ? LineGraphXOverflowMode.ShiftGraph :
                          obj.graphStyle.xOverflowMode === 'ScaleAxis' ? LineGraphXOverflowMode.ScaleAxis :
                          LineGraphXOverflowMode.None;
            const yMode = obj.graphStyle.yOverflowMode === 'ScaleAxis' ? LineGraphYOverflowMode.ScaleAxis :
                          LineGraphYOverflowMode.None;
            
            graph.setOverflowX(xMode);
            graph.setOverflowY(yMode);
            graph.setBackgroundColor(obj.graphStyle.backgroundColor);
            graph.setShowInfo(obj.graphStyle.showInfo ?? true);
            graph.setFillHeight();

            // Generate sample data for preview
            this.generateSampleData(graph, obj.monitorDataKeys, obj.graphStyle.timeWindow);

            this.graphInstances.set(obj.uuid, graph);
        } catch (error) {
            console.error('Failed to create graph:', error);
            graphContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff6b6b; font-size: 12px;">Failed to create graph</div>`;
        }
    }

    private generateSampleData(graph: LineGraphRepresentation, keys: string[], timeWindow: number = 30): void {
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

    private renderPanel(element: HTMLDivElement, obj: PanelObject): void {
        element.style.backgroundColor = obj.style.backgroundColor;
        element.style.borderWidth = `${obj.style.borderWidth}px`;
        element.style.borderColor = obj.style.borderColor;
        element.style.borderStyle = obj.style.borderStyle;
        element.style.opacity = (obj.style.opacity / 100).toString();

        // Only clear the content layer — preserve resize handles
        let content = element.querySelector<HTMLDivElement>('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '';

        // Scale wrapper — clips at content boundary
        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'scale-wrapper';
        const scale = (obj.scale ?? 100) / 100;
        scaleWrapper.style.cssText = `width:100%;height:100%;transform-origin:top left;transform:scale(${scale});display:flex;align-items:center;justify-content:center;`;
        scaleWrapper.innerHTML = '<div style="color:#555;font-size:14px;">Panel</div>';
        content.appendChild(scaleWrapper);
    }

    private renderPlaceholder(element: HTMLDivElement, obj: BarGraphObject | Model3DObject | MinimapObject | StatusDisplayObject, label: string, bgColor: string): void {
        element.style.backgroundColor = 'transparent';
        let content = element.querySelector<HTMLDivElement>('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '';
        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'scale-wrapper';
        const scale = (obj.scale ?? 100) / 100;
        scaleWrapper.style.cssText = `width:100%;height:100%;transform-origin:top left;transform:scale(${scale});display:flex;align-items:center;justify-content:center;background-color:${bgColor};border:1px solid #333;`;
        scaleWrapper.innerHTML = `<div style="color:#aaa;font-size:13px;text-align:center;">${label}</div>`;
        content.appendChild(scaleWrapper);
    }

    private renderBarGraph(element: HTMLDivElement, obj: BarGraphObject): void {
        element.style.backgroundColor = 'transparent';
        let content = element.querySelector<HTMLDivElement>('.object-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'object-content';
            content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            element.insertBefore(content, element.firstChild);
        }
        content.innerHTML = '';

        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'scale-wrapper';
        const scale = (obj.scale ?? 100) / 100;
        scaleWrapper.style.cssText = `width:100%;height:100%;transform-origin:top left;transform:scale(${scale});display:flex;flex-direction:column;background-color:${obj.graphStyle.backgroundColor};border:1px solid #333;`;

        if (obj.bars.length === 0) {
            scaleWrapper.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#666;font-size:13px;">No bars configured</div>';
            content.appendChild(scaleWrapper);
            return;
        }

        // Title
        const title = document.createElement('div');
        title.style.cssText = 'color:#aaa;font-size:11px;text-align:center;padding:4px 4px 2px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        title.textContent = obj.graphStyle.title || 'Bar Graph';
        scaleWrapper.appendChild(title);

        // Bar area
        const barArea = document.createElement('div');
        barArea.style.cssText = 'flex:1;display:flex;align-items:flex-end;gap:4px;padding:4px 8px 20px;overflow:hidden;';

        const yRange = (obj.graphStyle.yMax - obj.graphStyle.yMin) || 1;
        const sampleValues = [0.75, 0.45, 0.85, 0.30, 0.60, 0.55, 0.40, 0.90];

        obj.bars.forEach((bar, i) => {
            const barWrap = document.createElement('div');
            barWrap.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;min-width:0;';

            const fillPct = sampleValues[i % sampleValues.length] * 100;

            const barEl = document.createElement('div');
            barEl.style.cssText = `width:100%;height:${fillPct}%;background-color:${bar.color};border-radius:2px 2px 0 0;min-height:2px;`;

            const labelEl = document.createElement('div');
            labelEl.style.cssText = 'color:#888;font-size:9px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;margin-top:2px;';
            labelEl.textContent = bar.label || bar.monitorKey;

            barWrap.appendChild(barEl);
            barWrap.appendChild(labelEl);
            barArea.appendChild(barWrap);
        });

        // Y-axis labels
        const yAxis = document.createElement('div');
        yAxis.style.cssText = 'position:absolute;left:2px;top:18px;bottom:20px;display:flex;flex-direction:column;justify-content:space-between;';
        const yMax = document.createElement('span');
        yMax.style.cssText = 'color:#555;font-size:8px;';
        yMax.textContent = String(obj.graphStyle.yMax);
        const yMin = document.createElement('span');
        yMin.style.cssText = 'color:#555;font-size:8px;';
        yMin.textContent = String(obj.graphStyle.yMin);
        yAxis.appendChild(yMax);
        yAxis.appendChild(yMin);

        scaleWrapper.style.position = 'relative';
        scaleWrapper.appendChild(barArea);
        scaleWrapper.appendChild(yAxis);
        content.appendChild(scaleWrapper);
    }

    private renderModel3D(element: HTMLDivElement, obj: Model3DObject): void {
        this.renderPlaceholder(element, obj, `3D Model<br><small>${obj.rollKey || 'No keys set'}</small>`, obj.backgroundColor);
    }

    private renderMinimap(element: HTMLDivElement, obj: MinimapObject): void {
        const hasKeys = obj.latKey && obj.lngKey;
        this.renderPlaceholder(element, obj, `Minimap<br><small>${hasKeys ? `${obj.latKey} / ${obj.lngKey}` : 'No keys set'}</small>`, '#1a1a1a');
    }

    private renderStatusDisplay(element: HTMLDivElement, obj: StatusDisplayObject): void {
        const hasStatus = obj.statusUUID.length > 0;
        this.renderPlaceholder(element, obj, `Status Display<br><small>${hasStatus ? obj.statusUUID.slice(0, 8) + '...' : 'No status selected'}</small>`, obj.style.backgroundColor);
    }

    private addResizeHandles(element: HTMLDivElement): void {
        const corners = ['nw', 'ne', 'se', 'sw'];
        corners.forEach(handle => {
            const handleEl = document.createElement('div');
            handleEl.className = `resize-handle ${handle}`;
            handleEl.dataset.handle = handle;
            handleEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
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

        e.preventDefault();
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
        this.canvasElement.classList.add('dragging');
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
        this.canvasElement.classList.add('dragging');
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.dragState || !this.currentScreen) return;

        const obj = this.currentScreen.getObject(this.dragState.objectUuid);
        if (!obj) return;

        this.updateCanvasScale(); // Update scale factor
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;

        if (this.dragState.mode === 'move') {
            const deltaPercentX = (deltaX / (1920 * this.canvasScale)) * 100;
            const deltaPercentY = (deltaY / (1080 * this.canvasScale)) * 100;

            obj.position.x = this.snap(this.dragState.startPosition!.x + deltaPercentX);
            obj.position.y = this.snap(this.dragState.startPosition!.y + deltaPercentY);

            // Constrain position considering object size to prevent going outside bounds
            obj.position.x = Math.max(0, Math.min(100 - obj.size.width, obj.position.x));
            obj.position.y = Math.max(0, Math.min(100 - obj.size.height, obj.position.y));
        } else if (this.dragState.mode === 'resize') {
            this.handleResize(obj, deltaX, deltaY);
        }

        const element = this.objectElements.get(obj.uuid);
        if (element) {
            this.updateObjectElement(element, obj);
        }

        this.emit('objectChanged');
        this.emit('positionChanged', obj);
    }

    private handleResize(obj: InterfaceObject, deltaX: number, deltaY: number): void {
        const handle = this.dragState!.resizeHandle!;
        const deltaPercentX = (deltaX / (1920 * this.canvasScale)) * 100;
        const deltaPercentY = (deltaY / (1080 * this.canvasScale)) * 100;

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

        // Constrain size to minimum 1% and maximum available space
        obj.size.width = Math.max(1, Math.min(100 - obj.position.x, obj.size.width));
        obj.size.height = Math.max(1, Math.min(100 - obj.position.y, obj.size.height));
        
        // Constrain position to bounds, accounting for object size
        obj.position.x = Math.max(0, Math.min(100 - obj.size.width, obj.position.x));
        obj.position.y = Math.max(0, Math.min(100 - obj.size.height, obj.position.y));
    }

    private handleMouseUp(): void {
        this.dragState = null;
        this.canvasElement.classList.remove('dragging');
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

        this.updateCanvasScale(); // Update scale factor
        const rect = this.canvasElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / (1920 * this.canvasScale)) * 100;
        const y = ((e.clientY - rect.top) / (1080 * this.canvasScale)) * 100;

        // Constrain drop position to ensure object fits within bounds
        const constrainedX = Math.max(0, Math.min(80, this.snap(x))); // 80% max to fit 20% width
        const constrainedY = Math.max(0, Math.min(80, this.snap(y))); // 80% max to fit 20% height

        this.createObject(objectType as any, { x: constrainedX, y: constrainedY });
    }

    private createObject(type: 'LINE_GRAPH' | 'PANEL' | 'BAR_GRAPH' | 'MODEL_3D' | 'MINIMAP' | 'STATUS_DISPLAY', position: { x: number; y: number }): void {
        if (!this.currentScreen) return;

        const uuid = crypto.randomUUID();
        const baseObj = {
            uuid,
            name: '',
            position,
            size: { width: 20, height: 20 },
            scale: 100,
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
                    legendPosition: 'topRight' as const,
                    xOverflowMode: 'ShiftGraph' as const,
                    yOverflowMode: 'ScaleAxis' as const,
                    showInfo: true
                }
            };
        } else if (type === 'BAR_GRAPH') {
            obj = {
                ...baseObj,
                type: 'BAR_GRAPH',
                bars: [],
                graphStyle: { ...DEFAULT_BAR_GRAPH_STYLE }
            };
        } else if (type === 'MODEL_3D') {
            obj = {
                ...baseObj,
                type: 'MODEL_3D',
                rollKey: '',
                pitchKey: '',
                yawKey: '',
                angleUnit: 'deg' as const,
                modelColor: '#7fb8ff',
                backgroundColor: '#1a1a1a'
            };
        } else if (type === 'MINIMAP') {
            obj = {
                ...baseObj,
                type: 'MINIMAP',
                defaultZoom: 15,
                showGeofences: true,
                followRocket: true,
                latKey: '',
                lngKey: ''
            };
        } else if (type === 'STATUS_DISPLAY') {
            obj = {
                ...baseObj,
                type: 'STATUS_DISPLAY',
                statusCollectionUUID: '',
                statusUUID: '',
                style: { ...DEFAULT_STATUS_DISPLAY_STYLE }
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

        const uuid = this.selectedObject.uuid;
        const name = this.selectedObject.name || 'this object';
        new ConfirmationPrompt(
            'Delete Object',
            `Delete <strong>${name}</strong>?`,
            'Delete', 'Cancel',
            () => {
                this.currentScreen!.removeObject(uuid);
                const element = this.objectElements.get(uuid);
                element?.remove();
                this.objectElements.delete(uuid);
                this.selectObject(null);
                this.emit('objectChanged');
            }
        );
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
            } else if (this.selectedObject.type === 'BAR_GRAPH') {
                this.renderBarGraph(element, this.selectedObject);
            } else if (this.selectedObject.type === 'MODEL_3D') {
                this.renderModel3D(element, this.selectedObject);
            } else if (this.selectedObject.type === 'MINIMAP') {
                this.renderMinimap(element, this.selectedObject);
            } else if (this.selectedObject.type === 'STATUS_DISPLAY') {
                this.renderStatusDisplay(element, this.selectedObject);
            }
        }
        this.emit('objectChanged');
    }

    public getSelectedObject(): InterfaceObject | null {
        return this.selectedObject;
    }

    public getObjectElement(uuid: string): HTMLDivElement | undefined {
        return this.objectElements.get(uuid);
    }

    public setGraphBackgroundColor(uuid: string, color: string): void {
        const graph = this.graphInstances.get(uuid);
        if (graph) graph.setBackgroundColor(color);
    }

    public setGraphShowInfo(uuid: string, visible: boolean): void {
        const graph = this.graphInstances.get(uuid);
        if (graph) graph.setShowInfo(visible);
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
