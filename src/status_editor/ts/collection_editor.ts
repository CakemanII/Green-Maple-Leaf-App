class CollectionEditor {
    private static instance: CollectionEditor;
    public static get INSTANCE(): CollectionEditor { return CollectionEditor.instance; }

    // Elements
    private collectionsContainer!: HTMLElement;
    
    // Drag state
    private draggedElement: HTMLElement | null = null;
    private dragType: 'flag' | 'status' | null = null;
    private placeholder: HTMLElement | null = null;
    
    constructor() {
        // Ensure singleton
        if (CollectionEditor.instance) {
            throw new Error("Use CollectionEditor.INSTANCE to access the singleton instance.");
        }
        CollectionEditor.instance = this;

        // Initialize element references
        this.collectionsContainer = document.querySelector('.collections-container') as HTMLElement;

        // Initialize drag and drop
        this.initializeDragAndDrop();
    }

    private initializeDragAndDrop(): void {
        // Use event delegation on the collections container
        this.collectionsContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    private handleMouseDown(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        
        // Check if clicking on a flag
        const flag = target.closest('.flag') as HTMLElement;
        if (flag) {
            this.startDragging(flag, 'flag', e);
            return;
        }
        
        // Check if clicking on a status (but not on flags inside it)
        const statusName = target.closest('.status-name') as HTMLElement;
        if (statusName) {
            const status = statusName.closest('.status') as HTMLElement;
            if (status) {
                this.startDragging(status, 'status', e);
                return;
            }
        }
    }

    private startDragging(element: HTMLElement, type: 'flag' | 'status', e: MouseEvent): void {
        this.draggedElement = element;
        this.dragType = type;
        
        // Create placeholder
        this.placeholder = element.cloneNode(true) as HTMLElement;
        this.placeholder.style.opacity = '0.3';
        this.placeholder.style.pointerEvents = 'none';
        
        // Style dragged element
        element.style.opacity = '0.5';
        element.style.cursor = 'grabbing';
        
        e.preventDefault();
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.draggedElement || !this.dragType) return;

        const target = e.target as HTMLElement;
        
        if (this.dragType === 'flag') {
            this.handleFlagDrag(target, e);
        } else if (this.dragType === 'status') {
            this.handleStatusDrag(target, e);
        }
    }

    private handleFlagDrag(target: HTMLElement, e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Find the closest flags container (can be in any status, any collection)
        const flagsContainer = target.closest('.flags-container') as HTMLElement;
        if (!flagsContainer) return;
        
        // Don't do anything if it's the same container and no reordering needed
        const currentContainer = this.draggedElement.parentElement;
        
        // Find the flag we're hovering over
        const hoveredFlag = target.closest('.flag') as HTMLElement;
        
        if (hoveredFlag && hoveredFlag !== this.draggedElement) {
            // Insert before or after based on horizontal position
            const rect = hoveredFlag.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            
            if (e.clientX < midpoint) {
                flagsContainer.insertBefore(this.draggedElement, hoveredFlag);
            } else {
                flagsContainer.insertBefore(this.draggedElement, hoveredFlag.nextSibling);
            }
        } else if (!hoveredFlag && flagsContainer !== currentContainer) {
            // Empty container or end of container
            flagsContainer.appendChild(this.draggedElement);
        }
    }

    private handleStatusDrag(target: HTMLElement, e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Find the closest statuses container (can be in any collection)
        const statusesContainer = target.closest('.statuses-container') as HTMLElement;
        if (!statusesContainer) return;
        
        // Don't do anything if it's the same container
        const currentContainer = this.draggedElement.parentElement;
        
        // Find the status we're hovering over
        const hoveredStatus = target.closest('.status') as HTMLElement;
        
        if (hoveredStatus && hoveredStatus !== this.draggedElement) {
            // Insert before or after based on vertical position
            const rect = hoveredStatus.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                statusesContainer.insertBefore(this.draggedElement, hoveredStatus);
            } else {
                statusesContainer.insertBefore(this.draggedElement, hoveredStatus.nextSibling);
            }
        } else if (!hoveredStatus && statusesContainer !== currentContainer) {
            // Empty container or hovering over empty space
            statusesContainer.appendChild(this.draggedElement);
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Reset styles
        this.draggedElement.style.opacity = '';
        this.draggedElement.style.cursor = '';
        
        // Clean up
        if (this.placeholder && this.placeholder.parentElement) {
            this.placeholder.parentElement.removeChild(this.placeholder);
        }
        
        this.draggedElement = null;
        this.dragType = null;
        this.placeholder = null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CollectionEditor();
});