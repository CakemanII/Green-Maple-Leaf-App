import { SimpleStatus, SimpleStatusCollection } from '../../shared/compiled_js/types.js';
export declare class CollectionEditorUI {
    private static instance;
    static get INSTANCE(): CollectionEditorUI;
    private collectionsContainer;
    private draggedElementPreviousElementParent;
    private draggedElementPreviousIndex;
    private draggedElement;
    private dragType;
    private placeholder;
    constructor();
    /**
     * Initialize a status collection in the DOM.
     */
    private initializeStatusCollection;
    /**
     * Initialize a status in the DOM.
     */
    private initializeStatusElement;
    /**
     * Sets the image inside a .flag-image container, showing a placeholder when no path is available.
     */
    private setFlagImage;
    /**
     * Returns true if the file at relativePath exists on the server.
     */
    private checkFileExists;
    private createFlagImagePlaceholder;
    /**
     * Initialize a flag in the DOM.
     */
    private initializeFlagElement;
    /**
     * Find and return a collection element by its UUID.
     */
    private getElementInContainerByUUID;
    /**
     * Remove all collections from DOM by UUID.
     */
    removeAllCollectionsFromDOM(): void;
    /**
     * Initialize the Load Collection button.
     */
    private initializeLoadCollectionButton;
    /**
     * Initialize the Add Collection button.
     */
    private initializeAddCollectionButton;
    /**
     * Initialize revert and save buttons.
     */
    private initializeRevertAndSaveButtons;
    /**
     * Handle revert button click.
     */
    private handleRevertButtonClick;
    /**
     * Handle save button click.
     */
    private handleSaveButtonClick;
    /**
     * Enable or disable the save button.
     */
    updateSaveRevertButtonStates(changesMade: boolean): void;
    /**
     * Create flag display.
     */
    createFlagDisplay(collectionUUID: string, statusUUID: string, flagUUID: string, isDefault?: boolean): void;
    /**
     * Update flag information display.
     */
    updateFlagDisplay(flagUUID: string): void;
    /**
     * Remove a flag from the DOM.
     */
    removeFlagFromDOM(flagUUID: string): void;
    /**
     * Remove a status from the DOM.
     */
    removeStatusFromDOM(statusUUID: string): void;
    /**
     * Add a new collection to the DOM.
     */
    addNewCollectionToDOM(uuid: string, name: string, description: string): void;
    /**
     * Add a new status into an existing collection in the DOM.
     */
    addStatusToCollection(collectionUUID: string, statusUUID: string, name: string, description: string, defaultFlagUUID: string): void;
    /**
     * Remove a collection from the DOM.
     */
    removeCollectionFromDOM(collectionUUID: string): void;
    /**
     * Display menu from flag cog button click.
     */
    private displayFlagCogMenu;
    /**
     * Ensures the add button (add-flag-btn or add-status-btn) is always the last child of its container.
     */
    private enforceAddButtonLast;
    /**
     * Initialize drag and drop functionality for flags and statuses.
     */
    private initializeDragAndDrop;
    /**
     * Handles mouse down events to initiate dragging.
     */
    private handleMouseDown;
    /**
     * Starts the dragging process for a given element.
     */
    private startDragging;
    /**
     * Handles mouse move events to update dragging position.
     */
    private handleMouseMove;
    /**
     * Handles flag dragging and reordering.
     */
    private handleFlagDrag;
    /**
     * Handles status dragging and reordering.
     */
    private handleStatusDrag;
    /**
     * Handles mouse up events to finalize dragging.
     */
    private handleMouseUp;
    /**
     * Initialize an entire collection from json.
     */
    translateJSONCollectionIntoDOM(visualStatusCollection: SimpleStatusCollection): void;
    /**
     * Translate the current DOM structure into visual data.
     */
    translateDOMToVisualData(): {
        visualCollections: SimpleStatusCollection[];
        visualStatuses: SimpleStatus[];
    };
    /**
     * Get Collection UUID, and Status UUID, from Flag UUID.
     */
    getCollectionAndStatusUUIDFromFlagUUID(flagUUID: string): {
        collectionUUID: string;
        statusUUID: string;
    } | null;
}
