/**
 * PropertiesPanel - Context-sensitive properties editor
 */
import type { InterfaceObject } from './types.js';
import { EditorCanvas } from './editor_canvas.js';
export declare class PropertiesPanel {
    private container;
    private selectedObject;
    private canvas;
    constructor(container: HTMLDivElement);
    setSelectedObject(obj: InterfaceObject | null, canvas: EditorCanvas): void;
    clearSelection(): void;
    updateLivePosition(obj: InterfaceObject): void;
    private render;
    private renderNoSelection;
    private renderCommonProperties;
    private renderLineGraphProperties;
    private readonly LABEL_COLORS;
    private buildLabelRows;
    private renderPanelProperties;
    private attachEventListeners;
    private attachPanelEventListeners;
    private renderBarGraphProperties;
    private buildBarRows;
    private attachBarGraphEventListeners;
    private renderModel3DProperties;
    private attachModel3DEventListeners;
    private renderMinimapProperties;
    private attachMinimapEventListeners;
    private renderStatusDisplayProperties;
    private attachStatusDisplayEventListeners;
    private attachLineGraphEventListeners;
}
