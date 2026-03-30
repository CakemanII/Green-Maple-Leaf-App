/// <reference types="leaflet" />
import { InteractiveMap } from './map.js';
import { MapRegionAnchorManager } from './map_region_editor.js';
/**
 * Anchor Point Object for Interactable Map!
 */
export class AnchorPoint {
    /**
     * Anchor Point Constructor
     * @param {L.LatLng} anchorPosition - Position of the anchor point.
     * @param {L.LatLng} relativeIncomingHandlePosition - Local Position of the incoming control handle relative to the anchor.
     * @param {L.LatLng} relativeOutgoingHandlePosition - Local Position of the outgoing control handle relative to the anchor.
     * @param {any} interactionHandlers - Object containing interaction handler functions.
     */
    constructor(anchorPosition, relativeIncomingHandlePosition, relativeOutgoingHandlePosition, interactionHandlers) {
        // Set initial positions
        this.anchorPosition = anchorPosition;
        this.relativeIncomingHandlePosition = relativeIncomingHandlePosition;
        this.relativeOutgoingHandlePosition = relativeOutgoingHandlePosition;
        // Set interaction handlers
        this.interactionHandlers = interactionHandlers;
        // Set visuals to null initially
        this.mainVisual = null;
        this.incomingHandleVisual = null;
        this.outgoingHandleVisual = null;
        this.incomingHandleGuideVisual = null;
        this.outgoingHandleGuideVisual = null;
        // Set selection states to false initially
        this.isMainVisualSelected = false;
        this.isIncomingHandleSelected = false;
        this.isOutgoingHandleSelected = false;
        this.isActivePivot = false;
        // Create visuals
        this.createMainVisual();
        if (this.relativeIncomingHandlePosition) {
            this.createHandleVisual(true);
        } // Incoming handle
        if (this.relativeOutgoingHandlePosition) {
            this.createHandleVisual(false);
        } // Outgoing handle
    }
    // #region Visual Instantiation Methods
    /**
     * Creates the main anchor point visual and sets up its event handlers.
     */
    createMainVisual() {
        // Create the main anchor point visual
        this.mainVisual = L.marker(this.anchorPosition, {
            icon: AnchorPoint.MAIN_VISUAL,
            draggable: AnchorPoint.shouldBeInteractable(this.interactionHandlers),
            riseOnHover: false,
            pane: MapRegionAnchorManager.INSTANCE.AnchorMapPaneID,
        }).addTo(InteractiveMap.mapInstance);
        // Add drag events to update position
        AnchorPoint.basicDragEvents(this.mainVisual);
        // Add event handlers for specialized interactions
        this.mainVisual.on('dragstart', (e) => {
            if (this.interactionHandlers && this.interactionHandlers.onAnchorDragStart) {
                this.interactionHandlers.onAnchorDragStart(this, e);
            }
        });
        this.mainVisual.on('drag', (e) => {
            if (this.interactionHandlers && this.interactionHandlers.onAnchorDrag) {
                this.interactionHandlers.onAnchorDrag(this, e);
            }
        });
        this.mainVisual.on('click', (e) => {
            if (this.interactionHandlers && this.interactionHandlers.onAnchorClick) {
                this.interactionHandlers.onAnchorClick(this, e);
            }
        });
        this.mainVisual.on('contextmenu', (e) => {
            if (this.interactionHandlers && this.interactionHandlers.onAnchorRightClick) {
                this.interactionHandlers.onAnchorRightClick(this, e);
            }
        });
        this.mainVisual.on('dragend', (e) => {
            if (this.interactionHandlers && this.interactionHandlers.onAnchorDragEnd) {
                this.interactionHandlers.onAnchorDragEnd(this, e);
            }
        });
    }
    /**
     * Creates the main handle point visual and sets up its event handlers.
     * @param isIncomingHandle - True if the handle being created in the incoming handle.
     */
    createHandleVisual(isIncomingHandle) {
        // Check if the relative position is null
        if (isIncomingHandle ? this.relativeIncomingHandlePosition === null : this.relativeOutgoingHandlePosition === null) {
            console.warn("Position of handle is null, cannot create visual.");
            return;
        }
        // Check if anchor position is null
        if (this.anchorPosition === null) {
            console.error("Anchor position is null, cannot create handle visual.");
            return;
        }
        // Calculate the absolute position of the control handle.
        const absHandlePosition = AnchorPoint.relToAbs(this.anchorPosition, isIncomingHandle ? this.relativeIncomingHandlePosition : this.relativeOutgoingHandlePosition);
        const handleVisual = L.marker(absHandlePosition, {
            icon: AnchorPoint.CONTROL_HANDLE_VISUAL,
            draggable: true,
            pane: MapRegionAnchorManager.INSTANCE.HandleMapPaneID,
        }).addTo(InteractiveMap.mapInstance);
        // Assign basic drag events
        AnchorPoint.basicDragEvents(handleVisual);
        // Assign specialized drag event to update position
        handleVisual.on('drag', (e) => {
            // Update the handle's relative position based on where it was dragged
            const handleVisualToUpdate = isIncomingHandle ? this.incomingHandleVisual : this.outgoingHandleVisual;
            if (handleVisualToUpdate) {
                const newAbsolutePosition = handleVisualToUpdate.getLatLng();
                const newRelativePosition = AnchorPoint.absToRel(this.anchorPosition, newAbsolutePosition);
                if (isIncomingHandle) {
                    this.relativeIncomingHandlePosition = newRelativePosition;
                }
                else {
                    this.relativeOutgoingHandlePosition = newRelativePosition;
                }
                // Update the guide line to follow the handle
                this.updateControlHandleGuide(isIncomingHandle);
            }
            if (this.interactionHandlers.onHandleDrag) {
                this.interactionHandlers.onHandleDrag(this, isIncomingHandle, e);
            }
        });
        handleVisual.on('click', (e) => {
            if (this.interactionHandlers.onHandleClick) {
                this.interactionHandlers.onHandleClick(this, isIncomingHandle, e);
            }
        });
        handleVisual.on('dragend', (e) => {
            if (this.interactionHandlers.onHandleDragEnd) {
                this.interactionHandlers.onHandleDragEnd(this, isIncomingHandle, e);
            }
        });
        // Create guide line visual
        this.createHandleGuideVisual(isIncomingHandle);
        // Store the handle visual in the appropriate property
        if (isIncomingHandle) {
            this.incomingHandleVisual = handleVisual;
        }
        else {
            this.outgoingHandleVisual = handleVisual;
        }
    }
    /**
     * Create a guide line from the anchor to a control handle.
     * @param {*} isIncomingHandle - True if creating incoming handle guide, false for outgoing.
     */
    createHandleGuideVisual(isIncomingHandle) {
        // Check if the relative position is null
        const relativePosition = isIncomingHandle ? this.relativeIncomingHandlePosition : this.relativeOutgoingHandlePosition;
        if (relativePosition === null) {
            console.warn("Position of handle is null, cannot create guide visual.");
            return;
        }
        // Ensure anchor position is not null
        if (this.anchorPosition === null) {
            console.error("Anchor position is null, cannot create guide visual.");
            return;
        }
        // Calculate the absolute position of the control handle.
        const absoluteHandlePosition = AnchorPoint.relToAbs(this.anchorPosition, relativePosition);
        // Create guide line from anchor to incoming handle.
        const newGuideline = L.polyline([this.anchorPosition, absoluteHandlePosition], {
            color: isIncomingHandle ? '#00ff00' : '#ff6600',
            weight: 3,
            dashArray: '8, 4',
            opacity: 0.9,
            pane: MapRegionAnchorManager.INSTANCE.HandleGuideMapPaneID,
        }).addTo(InteractiveMap.mapInstance);
        // Assign to the correct field
        if (isIncomingHandle) {
            this.incomingHandleGuideVisual = newGuideline;
        }
        else {
            this.outgoingHandleGuideVisual = newGuideline;
        }
    }
    // #endregion
    // #region Remove Visuals Methods
    /**
     *
     */
    removeAllVisuals() {
        // Remove main visual
        if (this.mainVisual) {
            InteractiveMap.mapInstance.removeLayer(this.mainVisual);
            this.mainVisual = null;
        }
        // Remove incoming handle visual
        if (this.incomingHandleVisual)
            this.removeControlHandleVisual(true);
        // Remove outgoing handle visual
        if (this.outgoingHandleVisual)
            this.removeControlHandleVisual(false);
    }
    /**
     * Remove a Control Handle visual.
     * @param isIncomingHandle - True if removing incoming handle, false for outgoing.
     */
    removeControlHandleVisual(isIncomingHandle) {
        // Check if the handle exists
        if (isIncomingHandle ? !this.incomingHandleVisual : !this.outgoingHandleVisual) {
            console.warn("No handle to remove. Is incoming handle: " + isIncomingHandle);
            return;
        }
        // Remove existing control handle
        InteractiveMap.mapInstance.removeLayer(isIncomingHandle ? this.incomingHandleVisual : this.outgoingHandleVisual);
        // Remove the guide line as well
        this.removeControlHandleGuide(isIncomingHandle);
        // Clear the reference
        if (isIncomingHandle) {
            this.incomingHandleVisual = null;
        }
        else {
            this.outgoingHandleVisual = null;
        }
    }
    /**
     * Remove a control handle guide.
     * @param {boolean} isIncomingGuide - True if removing incoming handle guide, false for outgoing.
     */
    removeControlHandleGuide(isIncomingGuide) {
        // Check if the guide exists
        if (isIncomingGuide ? !this.incomingHandleGuideVisual : !this.outgoingHandleGuideVisual) {
            console.warn("No guide to remove. Is incoming handle: " + isIncomingGuide);
            return;
        }
        // Remove existing guide lines
        InteractiveMap.mapInstance.removeLayer(isIncomingGuide ? this.incomingHandleGuideVisual : this.outgoingHandleGuideVisual);
        // Clear the reference
        if (isIncomingGuide) {
            this.incomingHandleGuideVisual = null;
        }
        else {
            this.incomingHandleGuideVisual = null;
        }
    }
    /**
     * Removes all visual elements and data from the anchor (effectively destroying it).
     */
    destroySelf() {
        // Remove all visuals
        this.removeAllVisuals();
        // Clear interaction handlers
        this.interactionHandlers = null;
        // Clear data
        this.relativeIncomingHandlePosition = null;
        this.relativeOutgoingHandlePosition = null;
    }
    // #endregion
    // #region Update Anchor Methods
    updateAnchorVisual() {
        var _a, _b, _c, _d, _e, _f;
        // Check if the main anchor visual exists
        if (!this.mainVisual) {
            console.warn("No main anchor visual to update.");
            return;
        }
        // Ensure anchor position is not null
        if (!this.anchorPosition) {
            console.error("Anchor position is null, cannot update visual.");
            return;
        }
        // Update the position of the main anchor visual
        this.mainVisual.setLatLng(this.anchorPosition);
        // Update selection visual
        const hasActivePivot = (_a = this.mainVisual.getElement()) === null || _a === void 0 ? void 0 : _a.classList.contains(AnchorPoint.ACTIVE_PIVOT_CLASS);
        if (this.isActivePivot) {
            if (!hasActivePivot) {
                (_b = this.mainVisual.getElement()) === null || _b === void 0 ? void 0 : _b.classList.add(AnchorPoint.ACTIVE_PIVOT_CLASS);
            }
        }
        else {
            if (hasActivePivot) {
                (_c = this.mainVisual.getElement()) === null || _c === void 0 ? void 0 : _c.classList.remove(AnchorPoint.ACTIVE_PIVOT_CLASS);
            }
        }
        // Update selected visual
        const hasSelected = (_d = this.mainVisual.getElement()) === null || _d === void 0 ? void 0 : _d.classList.contains(AnchorPoint.SELECTED_ANCHOR_CLASS);
        if (this.isMainVisualSelected && !this.isActivePivot) {
            if (!hasSelected) {
                (_e = this.mainVisual.getElement()) === null || _e === void 0 ? void 0 : _e.classList.add(AnchorPoint.SELECTED_ANCHOR_CLASS);
            }
        }
        else {
            if (hasSelected) {
                (_f = this.mainVisual.getElement()) === null || _f === void 0 ? void 0 : _f.classList.remove(AnchorPoint.SELECTED_ANCHOR_CLASS);
            }
        }
    }
    /**
     * Updates a handle to stay relative to the anchor point.
     * @param {boolean} isIncomingHandle - True if updating incoming handle, false for outgoing.
     */
    updateHandle(isIncomingHandle) {
        var _a, _b, _c;
        // Ensure anchor position is not null
        if (!this.anchorPosition) {
            console.error("Anchor position is null, cannot update handle visual.");
            return;
        }
        // Get the handle visual & handle position
        const handleVisual = isIncomingHandle ? this.incomingHandleVisual : this.outgoingHandleVisual;
        const handlePosition = isIncomingHandle ? this.relativeIncomingHandlePosition : this.relativeOutgoingHandlePosition;
        // Check if the handle's position is valid and if the visual exists
        const isHandleValid = handlePosition != null;
        const handleVisualExists = handleVisual != null;
        // If the handle should exist but doesn't create it and VICE VERSA.
        if (isHandleValid && !handleVisualExists) {
            // Create the handle
            this.createHandleVisual(isIncomingHandle);
        }
        else if (!isHandleValid && handleVisualExists) {
            // Remove the handle
            this.removeControlHandleVisual(isIncomingHandle);
        }
        // Run the following if the handle visual exists
        if (!handleVisualExists) {
            return;
        }
        // Calculate the absolute position of the control handle.
        const absHandlePosition = AnchorPoint.relToAbs(this.anchorPosition, handlePosition);
        // Update the position of the handle visual (use the correct handle based on parameter)
        if (isIncomingHandle) {
            this.incomingHandleVisual.setLatLng(absHandlePosition);
        }
        else {
            this.outgoingHandleVisual.setLatLng(absHandlePosition);
        }
        // Update the control handle guides
        this.updateControlHandleGuide(isIncomingHandle);
        // Update the selected visual
        const handleHasSelectedClass = (_a = handleVisual.getElement()) === null || _a === void 0 ? void 0 : _a.classList.contains(AnchorPoint.SELECTED_HANDLE_CLASS);
        const handleSelected = isIncomingHandle ? this.isIncomingHandleSelected : this.isOutgoingHandleSelected;
        // Add or remove selected class based on selection state
        if (!handleHasSelectedClass && handleSelected) {
            // Add selected class
            (_b = handleVisual.getElement()) === null || _b === void 0 ? void 0 : _b.classList.add(AnchorPoint.SELECTED_HANDLE_CLASS);
        }
        else if (handleHasSelectedClass && !handleSelected) {
            // Remove selected class
            (_c = handleVisual.getElement()) === null || _c === void 0 ? void 0 : _c.classList.remove(AnchorPoint.SELECTED_HANDLE_CLASS);
        }
    }
    /**
     * Update control handle guides to be accurate.
     * @param {boolean} isIncomingHandle - True if updating incoming handle guide, false for outgoing.
     */
    updateControlHandleGuide(isIncomingHandle) {
        // Ensure anchor position is not null
        if (!this.anchorPosition) {
            console.error("Anchor position is null, cannot update guide visual.");
            return;
        }
        // Update the position of the guide line
        if (isIncomingHandle) {
            // Check if the incoming guide exists
            if (this.incomingHandleGuideVisual) {
                // Set new positions of the incoming handle guide
                const absoluteHandlePos = AnchorPoint.relToAbs(this.anchorPosition, this.relativeIncomingHandlePosition);
                this.incomingHandleGuideVisual.setLatLngs([this.anchorPosition, absoluteHandlePos]);
            }
            else {
                // Warn if no guide exists
                console.warn("No incoming handle guide to update.");
            }
        }
        else {
            // Check if the outgoing guide exists
            if (this.outgoingHandleGuideVisual) {
                // Set new positions of the outgoing handle guide
                const absoluteHandlePos = AnchorPoint.relToAbs(this.anchorPosition, this.relativeOutgoingHandlePosition);
                this.outgoingHandleGuideVisual.setLatLngs([this.anchorPosition, absoluteHandlePos]);
            }
            else {
                // Warn if no guide exists
                console.warn("No outgoing handle guide to update.");
            }
        }
    }
    /**
     * Updates the interactivity of this anchor point
     */
    updateInteractivity() {
        // Determine if the anchor point should be interactive
        const shouldBeInteractive = AnchorPoint.shouldBeInteractable(this.interactionHandlers);
        if (this.mainVisual && this.mainVisual.dragging) {
            this.mainVisual.dragging[shouldBeInteractive ? 'enable' : 'disable']();
        }
        if (this.incomingHandleVisual && this.incomingHandleVisual.dragging) {
            this.incomingHandleVisual.dragging[shouldBeInteractive ? 'enable' : 'disable']();
        }
        if (this.outgoingHandleVisual && this.outgoingHandleVisual.dragging) {
            this.outgoingHandleVisual.dragging[shouldBeInteractive ? 'enable' : 'disable']();
        }
    }
    // #endregion
    // #region Movement Methods
    /**
     * Set the position of the anchor point.
     * @param {L.latLng} newLatLng - New latlng position for the anchor.
     */
    setAnchorPosition(newLatLng) {
        // Check if the new position is valid
        if (!newLatLng) {
            console.warn("Invalid latlng position for anchor.");
            return;
        }
        // Set the variable
        this.anchorPosition = newLatLng;
        if (this.mainVisual) {
            // Move the anchor visual
            this.updateAnchorVisual();
            // Move the control handles as well
            this.updateHandle(true);
            this.updateHandle(false);
        }
    }
    /**
     * Set the position of a control handle.
     * @param {boolean} isIncomingHandle - True if setting the incoming handle, false for outgoing.
     * @param {L.LatLng} newLatLng - New absolute latlng position for the handle.
     * @param {boolean} mirror - If true, mirror the opposite handle (moving both of them).
     */
    setHandlePosition(isIncomingHandle, newLatLng, mirror = true) {
        // Check if the handle exists
        if (isIncomingHandle ? !this.relativeIncomingHandlePosition : !this.relativeOutgoingHandlePosition) {
            return;
        }
        // Set the pos to null if the handle is being deleted
        if (!newLatLng) {
            if (isIncomingHandle) {
                this.relativeIncomingHandlePosition = null;
            }
            else {
                this.relativeOutgoingHandlePosition = null;
            }
        }
        else {
            // Calculate the new relative position
            const newRelPos = L.latLng(newLatLng.lat - this.anchorPosition.lat, newLatLng.lng - this.anchorPosition.lng);
            const oldRelPos = isIncomingHandle ? this.relativeIncomingHandlePosition : this.relativeOutgoingHandlePosition;
            // Set the variable
            if (isIncomingHandle) {
                this.relativeIncomingHandlePosition = newRelPos;
            }
            else {
                this.relativeOutgoingHandlePosition = newRelPos;
            }
            // If mirroring is enabled, update the opposite handle as well
            if (mirror)
                this.mirrorHandleMovement(isIncomingHandle, oldRelPos, newRelPos);
        }
        // Update the handle visuals
        this.updateHandle(true);
        this.updateHandle(false);
    }
    /**
     * Will mirror the movement of one handle to the other.
     * @param {boolean} isActiveIncoming - True if the active handle is the incoming handle, false for outgoing.
     * @param {L.LatLng} oldRelPosition - Old relative position of the active handle.
     * @param {L.LatLng} newRelPosition - New relative position of the active handle.
     */
    mirrorHandleMovement(isActiveIncoming, oldRelPosition, newRelPosition) {
        // Check if mirroring is possible (both handles must exist)
        if (this.relativeIncomingHandlePosition === null || this.relativeOutgoingHandlePosition === null) {
            console.warn("Cannot mirror handle movement. At least one handle position is null.");
            return; // Atleast one No opposite handle to mirror
        }
        // Calculate the new relative position for the opposite handle
        const movementOffset = L.latLng(newRelPosition.lat - oldRelPosition.lat, newRelPosition.lng - oldRelPosition.lng);
        const oppositeHandlePos = isActiveIncoming ? this.relativeOutgoingHandlePosition : this.relativeIncomingHandlePosition;
        const newOppositeRelPos = L.latLng(oppositeHandlePos.lat - movementOffset.lat, oppositeHandlePos.lng - movementOffset.lng);
        // Update the opposite handle's position
        if (isActiveIncoming) {
            this.relativeOutgoingHandlePosition = newOppositeRelPos;
        }
        else {
            this.relativeIncomingHandlePosition = newOppositeRelPos;
        }
    }
    // #endregion
    // #region Static Methods
    /**
     * Converts a relative LatLng to an absolute LatLng based on the anchor position.
     * @param {L.LatLng} anchorPosition - The anchor's absolute position.
     * @param {L.LatLng} relativeLatLng - LatLng relative to the anchor position.
     */
    static relToAbs(anchorPosition, relativeLatLng) {
        return L.latLng(relativeLatLng.lat + anchorPosition.lat, relativeLatLng.lng + anchorPosition.lng);
    }
    /**
     * Convert absolute position to relative position (offset from anchor)
     */
    static absToRel(anchorPosition, absoluteLatLng) {
        return L.latLng(absoluteLatLng.lat - anchorPosition.lat, absoluteLatLng.lng - anchorPosition.lng);
    }
    /**
     * Assigns basic drag events to a visual marker.
     * @param {L.Marker} anchorVisual - The visual marker to add drag events to.
     */
    static basicDragEvents(anchorVisual) {
        anchorVisual.on('dragstart', () => { InteractiveMap.mapInstance.dragging.disable(); });
        anchorVisual.on('click', (e) => { L.DomEvent.stopPropagation(e); });
        anchorVisual.on('dragend', () => { InteractiveMap.mapInstance.dragging.enable(); });
        anchorVisual.on('contextmenu', (e) => { L.DomEvent.stopPropagation(e); });
    }
    /**
     * Returns a value based on whether the anchor point should be interactable.
     * @param interactionHandlers
     * @returns
     */
    static shouldBeInteractable(interactionHandlers) {
        // Check if there's an active tool via the interaction handlers
        // The handlers are passed from the editor, so we can check if editor has an active tool
        return interactionHandlers !== null &&
            interactionHandlers.onAnchorDrag !== null &&
            typeof interactionHandlers.onAnchorDrag === 'function';
    }
    // #endregion
    // #region Selection Methods
    /**
     * Set the selection state of the main visual.
     * @param isSelected - True if selected, false if not.
     */
    setMainSelected(isSelected) {
        this.isMainVisualSelected = isSelected;
        this.updateAnchorVisual();
    }
    /**
     * Set the selection state of a handle visual.
     * @param isSelected - True if selected, false if not.
     * @param isIncomingHandle - True if incoming handle, false for outgoing.
     */
    setHandleSelected(isSelected, isIncomingHandle) {
        // Set the variable
        if (isIncomingHandle) {
            this.isIncomingHandleSelected = isSelected;
        }
        else {
            this.isOutgoingHandleSelected = isSelected;
        }
        // Update the handle visual
        this.updateHandle(isIncomingHandle);
    }
    /**
     * Set whether this anchor is an active pivot point.
     * @param isActivePivot - True if active pivot, false if not.
     */
    setActivePivot(isActivePivot) {
        this.isActivePivot = isActivePivot;
        this.updateAnchorVisual();
    }
    // #endregion
    // #region Getters 
    get GetAnchorPosition() { return this.anchorPosition; }
    get GetRelativeIncomingHandlePosition() { return this.relativeIncomingHandlePosition; }
    get GetRelativeOutgoingHandlePosition() { return this.relativeOutgoingHandlePosition; }
    get GetMainVisual() { return this.mainVisual; }
    get GetIncomingHandleVisual() { return this.incomingHandleVisual; }
    get GetOutgoingHandleVisual() { return this.outgoingHandleVisual; }
}
AnchorPoint.MAIN_VISUAL = L.icon({
    iconUrl: 'assets/icons/map_line_handle_icon.png',
    iconSize: [32, 32], // adjust as needed
    iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
});
AnchorPoint.CONTROL_HANDLE_VISUAL = L.icon({
    iconUrl: 'assets/icons/map_line_handle_icon.png',
    iconSize: [20, 20], // adjust as needed
    iconAnchor: [10, 10], // point of the icon which will correspond to marker's location
});
AnchorPoint.SELECTED_ANCHOR_CLASS = 'selected-anchor';
AnchorPoint.SELECTED_HANDLE_CLASS = 'selected-handle';
AnchorPoint.ACTIVE_PIVOT_CLASS = 'pivot-rot-scale-anchor';
//# sourceMappingURL=anchor_point.js.map