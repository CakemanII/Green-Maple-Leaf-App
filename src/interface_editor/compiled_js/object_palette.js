/**
 * ObjectPalette - Handles dragging objects from palette to canvas
 */
export class ObjectPalette {
    constructor(canvas) {
        this.canvas = canvas;
        this.initializeDragHandlers();
    }
    initializeDragHandlers() {
        const paletteItems = document.querySelectorAll('.palette-item');
        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const dragEvent = e;
                const objectType = item.dataset.objectType;
                if (objectType && dragEvent.dataTransfer) {
                    dragEvent.dataTransfer.setData('objectType', objectType);
                    dragEvent.dataTransfer.effectAllowed = 'copy';
                }
            });
        });
    }
}
//# sourceMappingURL=object_palette.js.map