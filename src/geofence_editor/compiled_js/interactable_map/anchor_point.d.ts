/**
 * Anchor Point Object for Interactable Map!
 */
export declare class AnchorPoint {
    private static MAIN_VISUAL;
    private static CONTROL_HANDLE_VISUAL;
    private static SELECTED_ANCHOR_CLASS;
    private static SELECTED_HANDLE_CLASS;
    private static ACTIVE_PIVOT_CLASS;
    private anchorPosition;
    private relativeIncomingHandlePosition;
    private relativeOutgoingHandlePosition;
    private mainVisual;
    private incomingHandleVisual;
    private outgoingHandleVisual;
    private incomingHandleGuideVisual;
    private outgoingHandleGuideVisual;
    private interactionHandlers;
    private isMainVisualSelected;
    private isIncomingHandleSelected;
    private isOutgoingHandleSelected;
    private isActivePivot;
    /**
     * Anchor Point Constructor
     * @param {L.LatLng} anchorPosition - Position of the anchor point.
     * @param {L.LatLng} relativeIncomingHandlePosition - Local Position of the incoming control handle relative to the anchor.
     * @param {L.LatLng} relativeOutgoingHandlePosition - Local Position of the outgoing control handle relative to the anchor.
     * @param {any} interactionHandlers - Object containing interaction handler functions.
     */
    constructor(anchorPosition: L.LatLng, relativeIncomingHandlePosition: L.LatLng | null, relativeOutgoingHandlePosition: L.LatLng | null, interactionHandlers: any);
    /**
     * Creates the main anchor point visual and sets up its event handlers.
     */
    private createMainVisual;
    /**
     * Creates the main handle point visual and sets up its event handlers.
     * @param isIncomingHandle - True if the handle being created in the incoming handle.
     */
    private createHandleVisual;
    /**
     * Create a guide line from the anchor to a control handle.
     * @param {*} isIncomingHandle - True if creating incoming handle guide, false for outgoing.
     */
    private createHandleGuideVisual;
    /**
     *
     */
    private removeAllVisuals;
    /**
     * Remove a Control Handle visual.
     * @param isIncomingHandle - True if removing incoming handle, false for outgoing.
     */
    private removeControlHandleVisual;
    /**
     * Remove a control handle guide.
     * @param {boolean} isIncomingGuide - True if removing incoming handle guide, false for outgoing.
     */
    private removeControlHandleGuide;
    /**
     * Removes all visual elements and data from the anchor (effectively destroying it).
     */
    destroySelf(): void;
    private updateAnchorVisual;
    /**
     * Updates a handle to stay relative to the anchor point.
     * @param {boolean} isIncomingHandle - True if updating incoming handle, false for outgoing.
     */
    private updateHandle;
    /**
     * Update control handle guides to be accurate.
     * @param {boolean} isIncomingHandle - True if updating incoming handle guide, false for outgoing.
     */
    private updateControlHandleGuide;
    /**
     * Updates the interactivity of this anchor point
     */
    updateInteractivity(): void;
    /**
     * Set the position of the anchor point.
     * @param {L.latLng} newLatLng - New latlng position for the anchor.
     */
    setAnchorPosition(newLatLng: L.LatLng): void;
    /**
     * Set the position of a control handle.
     * @param {boolean} isIncomingHandle - True if setting the incoming handle, false for outgoing.
     * @param {L.LatLng} newLatLng - New absolute latlng position for the handle.
     * @param {boolean} mirror - If true, mirror the opposite handle (moving both of them).
     */
    setHandlePosition(isIncomingHandle: boolean, newLatLng: L.LatLng, mirror?: boolean): void;
    /**
     * Will mirror the movement of one handle to the other.
     * @param {boolean} isActiveIncoming - True if the active handle is the incoming handle, false for outgoing.
     * @param {L.LatLng} oldRelPosition - Old relative position of the active handle.
     * @param {L.LatLng} newRelPosition - New relative position of the active handle.
     */
    private mirrorHandleMovement;
    /**
     * Converts a relative LatLng to an absolute LatLng based on the anchor position.
     * @param {L.LatLng} anchorPosition - The anchor's absolute position.
     * @param {L.LatLng} relativeLatLng - LatLng relative to the anchor position.
     */
    private static relToAbs;
    /**
     * Convert absolute position to relative position (offset from anchor)
     */
    private static absToRel;
    /**
     * Assigns basic drag events to a visual marker.
     * @param {L.Marker} anchorVisual - The visual marker to add drag events to.
     */
    private static basicDragEvents;
    /**
     * Returns a value based on whether the anchor point should be interactable.
     * @param interactionHandlers
     * @returns
     */
    private static shouldBeInteractable;
    /**
     * Set the selection state of the main visual.
     * @param isSelected - True if selected, false if not.
     */
    setMainSelected(isSelected: boolean): void;
    /**
     * Set the selection state of a handle visual.
     * @param isSelected - True if selected, false if not.
     * @param isIncomingHandle - True if incoming handle, false for outgoing.
     */
    setHandleSelected(isSelected: boolean, isIncomingHandle: boolean): void;
    /**
     * Set whether this anchor is an active pivot point.
     * @param isActivePivot - True if active pivot, false if not.
     */
    setActivePivot(isActivePivot: boolean): void;
    get GetAnchorPosition(): L.LatLng;
    get GetRelativeIncomingHandlePosition(): L.LatLng | null;
    get GetRelativeOutgoingHandlePosition(): L.LatLng | null;
    get GetMainVisual(): L.Marker | null;
    get GetIncomingHandleVisual(): L.Marker | null;
    get GetOutgoingHandleVisual(): L.Marker | null;
}
