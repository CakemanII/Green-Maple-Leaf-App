export declare class FlagEditorUI {
    private static instance;
    static get INSTANCE(): FlagEditorUI;
    private flagCreationPromptElement;
    private flagCreationCloseBtnElement;
    private flagCreationCancelBtnElement;
    private flagDeleteBtnElement;
    private flagTitleElement;
    private flagDescriptionElement;
    private flagImageInputElement;
    private flagAudioInputElement;
    private flagAudioPreviewBtnElement;
    private audioRepeatToggleElement;
    private confirmFlagBtnElement;
    private flagPreviewElement;
    private flagConditionsContainerTitleElement;
    private flagConditionsContainerElement;
    private confirmationDialogElement;
    private confirmationTitleElement;
    private confirmationMessageElement;
    private confirmationYesBtnElement;
    private confirmationNoBtnElement;
    private confirmationCallback;
    private currentFlag;
    private currentFlagStatusUUID;
    private currentFlagCollectionUUID;
    private isNewFlag;
    private originalFlagSnapshot;
    private isDefaultFlag;
    private currentImageUUID;
    private currentImageDisplayName;
    private currentAudioUUID;
    private currentAudioDisplayName;
    private currentAudioRepeat;
    private activeAudioPreviewElement;
    private draggedElement;
    private dragType;
    private draggedElementPreviousParent;
    private draggedElementPreviousIndex;
    private mainConditionalGroup;
    private currentColorSelectorPrompt;
    private telemetry_options_dictionary;
    constructor();
    /**
     * Setup event listeners for add condition buttons using event delegation
     */
    private setupConditionButtonEvents;
    /**
     * Add a telemetry condition row to the specified condition body
     */
    private addTelemetryCondition;
    /**
     * Add a status condition row to the specified condition body.
     * Selects cascade: collection → statuses → flags.
     * condition-select[0] = collection, [1] = status, [2] = flag
     */
    private addStatusCondition;
    /**
     * Add a comment condition (documentation only, no evaluation logic)
     */
    private addCommentCondition;
    /**
     * Add a new conditional group to the conditions container
     */
    private addConditionalGroup;
    /**
     * Update the style of a conditional group based on its color indicator
     */
    private updateConditionalGroupStyle;
    /**
     * Convert an RGB/RGBA color string (e.g. "rgb(245, 166, 35)") to a hex string (e.g. "#f5a623").
     * Returns '#ffffff' if parsing fails.
     */
    private rgbToHex;
    /**
     * Returns true if the file at relativePath exists on the server.
     */
    private checkFileExists;
    /**
     * Checks stored image/audio paths against the server and updates button labels
     * to "Missing File" if the file no longer exists.
     */
    private refreshFileDisplays;
    private stopAudioPreview;
    private updateAudioPreviewButtonState;
    /**
     * Clear all input fields in the flag creation prompt.
     */
    private resetPrompt;
    private updateFlagImagePreview;
    private openNewColorSelector;
    /**
     * Closes the flag creation prompt.
     */
    closeFlagCreationPrompt(): void;
    /**
     * Opens the flag creation prompt.
     */
    private openFlagCreationPrompt;
    /**
     * Create new flag
     */
    createNewFlag(collectionUUID: string, statusUUID: string, isDefaultFlag: boolean): Promise<void>;
    /**
     * Edit existing flag
     */
    editExistingFlag(flagUUID: string, isDefaultFlag: boolean): Promise<void>;
    private translateHTMLInputToFlagJSON;
    /**
     * Parses a conditional group element and returns its JSON representation.
     */
    private parseConditionGroupElement;
    /**
     * Parses all condition rows in a conditional group element and returns an array of ConditionalGroups.
     */
    private parseConditionsRowsInGroup;
    /**
     * Parses all embeded conditional groups in a conditional group element and returns an array of ConditionalGroups.
     */
    private parseEmbededGroupsInGroup;
    /**
     * Get index from parent element
     */
    private getElementIndexInParent;
    private populateHTMLWithFlagJSON;
    /**
     * Populates a conditional group element based on the provided JSON representation.
     */
    private populateConditionGroupElement;
    /**
     * Populates a telemetry condition row element based on the provided JSON representation.
     */
    private populateTelemetryConditionElement;
    /**
     * Populates a status condition row element based on the provided JSON representation.
     */
    private populateStatusConditionElement;
    /**
     * Populates a comment condition row element based on the provided JSON representation.
     */
    private populateCommentConditionElement;
    /**
     * Enables or disables the confirm button with a visual dull state.
     */
    private setConfirmButtonEnabled;
    /**
     * Checks whether the confirm button should be enabled and updates it.
     * Disabled when: any condition row has unfilled selects, or nothing has changed.
     */
    private validateAndUpdateConfirmButton;
    /**
     * Called when saving flag being created/edited
     */
    private confirmChangesToFlag;
    /**
     * Update the save button state to either display "Create Flag" or "Save Changes"
     * Also show/hide the delete button based on whether it's a new flag
     */
    private updateSaveButtonState;
    /**
     * Handle confirmation dialog response
     */
    private handleConfirmationResponse;
    /**
     * Delete the current flag from local changes
     */
    private deleteFlag;
    /**
     * Initialize drag and drop functionality for condition rows and groups.
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
     * Ensures the button-row is always the last child of a condition body.
     */
    private enforceButtonRowLast;
    /**
     * Handles dragging for both condition rows and groups.
     */
    private handleDragging;
    /**
     * Handles mouse up events to finalize dragging.
     */
    private handleMouseUp;
    private getTelemetryOptionsDictionary;
}
