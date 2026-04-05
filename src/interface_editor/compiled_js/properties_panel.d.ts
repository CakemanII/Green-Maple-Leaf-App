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
    private render;
    private renderNoSelection;
    private renderCommonProperties;
    private renderLineGraphProperties;
    private renderPanelProperties;
    private attachEventListeners;
    private attachPanelEventListeners;
    private attachLineGraphEventListeners;
}
