/**
 * ObjectPalette - Handles dragging objects from palette to canvas
 */
import { EditorCanvas } from './editor_canvas.js';
export declare class ObjectPalette {
    private canvas;
    constructor(canvas: EditorCanvas);
    private initializeDragHandlers;
}
