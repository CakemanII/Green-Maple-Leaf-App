/**
 * ObjectPalette - Handles dragging objects from palette to canvas
 */

import { EditorCanvas } from './editor_canvas.js';

export class ObjectPalette {
    private canvas: EditorCanvas;

    constructor(canvas: EditorCanvas) {
        this.canvas = canvas;
        this.initializeDragHandlers();
    }

    private initializeDragHandlers(): void {
        const paletteItems = document.querySelectorAll('.palette-item');
        
        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const dragEvent = e as DragEvent;
                const objectType = (item as HTMLElement).dataset.objectType;
                if (objectType && dragEvent.dataTransfer) {
                    dragEvent.dataTransfer.setData('objectType', objectType);
                    dragEvent.dataTransfer.effectAllowed = 'copy';
                }
            });
        });
    }
}
