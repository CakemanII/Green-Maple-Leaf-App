/// <reference types="leaflet" />
import * as L from 'leaflet';
import { Map } from "./map";

/**
 * Anchor Point Object for Interactable Map
 */
export class AnchorPoint {
    private static MAIN_VISUAL: L.Icon = L.icon({
        iconUrl: './icons/map_line_handle_icon.png',
        iconSize: [32, 32], // adjust as needed
        iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
    }); 

    private static CONTROL_HANDLE_VISUAL = L.icon({
        iconUrl: './icons/map_line_handle_icon.png',
        iconSize: [20, 20], // adjust as needed
        iconAnchor: [10, 10], // point of the icon which will correspond to marker's location
    });

    private static SELECTED_ANCHOR_CLASS = 'selected-anchor';
    private static SELECTED_HANDLE_CLASS = 'selected-handle';

    private anchorPosition: L.LatLng;
    private relativeIncomingHandlePosition: L.LatLng | null;
    private relativeOutgoingHandlePosition: L.LatLng | null;

    private mainVisual: L.Marker | null;
    private incomingHandleVisual: L.Marker | null;
    private outgoingHandleVisual: L.Marker | null;
    private incomingHandleGuideVisual: L.Polygon | null;
    private outgoingHandleGuideVisual: L.Polygon | null;

    private interactionHandlers: any;

    private isMainVisualSelected: boolean;
    private isIncomingHandleSelected: boolean;
    private isOutgoingHandleSelected: boolean;

    private isActivePivot: boolean;

    constructor(
        anchorPosition: L.LatLng, 
        relativeIncomingHandlePosition: L.LatLng, 
        relativeOutgoingHandlePosition: L.LatLng,
        interactionHandlers: any
    ) {
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
    }

    private createMainVisual() {
        // Create the main anchor point visual
        this.mainVisual = L.marker(this.anchorPosition, {
            icon: AnchorPoint.MAIN_VISUAL,
            draggable: AnchorPoint.shouldBeInteractable(this.interactionHandlers),
            riseOnHover: false
        }).addTo(Map.mapInstance);

        // Add drag events to update position
        AnchorPoint.basicDragEvents(this.mainVisual);
    }

    private createHandleVisual(isLeftHandle: boolean) {
        // Create the incoming and outgoing handle visuals

    }




    /**
     * Assigns basic drag events to a visual marker.
     * @param {L.Marker} anchorVisual - The visual marker to add drag events to.
     */
    private static basicDragEvents(anchorVisual: L.Marker)
    {
        anchorVisual.on('dragstart', () => { Map.mapInstance.dragging.disable(); });
        anchorVisual.on('click', (e) => { L.DomEvent.stopPropagation(e); });
        anchorVisual.on('dragend', () => { Map.mapInstance.dragging.enable(); });
        anchorVisual.on('contextmenu', (e) => { L.DomEvent.stopPropagation(e); });
    }

    /**
     * Returns a value based on whether the anchor point should be interactable.
     * @param interactionHandlers 
     * @returns 
     */
    private static shouldBeInteractable(interactionHandlers: any): boolean {
        // Check if there's an active tool via the interaction handlers
        // The handlers are passed from the editor, so we can check if editor has an active tool
        return interactionHandlers !== null && 
        interactionHandlers.onAnchorDrag !== null &&
        typeof interactionHandlers.onAnchorDrag === 'function';
    }
}