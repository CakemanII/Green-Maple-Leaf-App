/**
 * EditorCanvas - Manages the 1920x1080 canvas rendering and interaction
 */
import type { InterfaceObject } from './types.js';
import { EditorScreen } from './editor_screen.js';
type EventCallback = (...args: any[]) => void;
export declare class EditorCanvas {
    private canvasElement;
    currentScreen: EditorScreen | null;
    private selectedObject;
    private objectElements;
    private graphInstances;
    private eventListeners;
    private canvasScale;
    private dragState;
    constructor(canvasElement: HTMLDivElement);
    private initializeEventListeners;
    private updateCanvasScale;
    loadScreen(screen: EditorScreen): void;
    private renderScreen;
    private renderObject;
    private updateObjectElement;
    private renderLineGraph;
    private generateSampleData;
    private renderPanel;
    private renderPlaceholder;
    private renderBarGraph;
    private renderModel3D;
    private renderMinimap;
    private renderStatusDisplay;
    private addResizeHandles;
    private handleCanvasClick;
    private handleObjectMouseDown;
    private startMove;
    private startResize;
    private handleMouseMove;
    private handleResize;
    private handleMouseUp;
    private snap;
    selectObject(obj: InterfaceObject | null): void;
    handleDrop(e: DragEvent): void;
    private createObject;
    private deleteSelectedObject;
    updateSelectedObject(): void;
    getSelectedObject(): InterfaceObject | null;
    getObjectElement(uuid: string): HTMLDivElement | undefined;
    setGraphBackgroundColor(uuid: string, color: string): void;
    setGraphShowInfo(uuid: string, visible: boolean): void;
    on(event: string, callback: EventCallback): void;
    private emit;
}
export {};
