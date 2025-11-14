/// <reference types="leaflet" />


abstract class MapRegionEditorTool {
    constructor() {}
    
    // #region Override Functions
    /**
     * Called when an anchor point is actively being dragged.
     * @param {AnchorPoint} anchorPoint - The anchor point being dragged.
     */
    public onAnchorDrag(anchorPoint: AnchorPoint) {}

    /**
     * Called when an anchor point drag operation has ended.
     * @param {AnchorPoint} anchorPoint - The anchor point where dragging has ended.
     */
    public onAnchorDragEnd(anchorPoint: AnchorPoint) {}

    /**
     * Called when an anchor point is clicked.
     * @param {AnchorPoint} anchorPoint - The anchor point that was clicked.
     */
    public onAnchorClick(anchorPoint: AnchorPoint) {}

    /**
     * Called when an anchor point is right-clicked.
     * @param anchorPoint - The anchor point that was right clicked.
     * @param event - DOM event
     */
    public onAnchorRightClick(anchorPoint: AnchorPoint, event: any) {}

    /**
     * Called when a control handle is dragged.
     * @param {AnchorPoint} anchorPoint - The anchor point the handle belongs to.
     * @param {boolean} isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    public onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean) {}

    /**
     * Called when a control handle drag operation has ended.
     * @param anchorPoint - The anchor point the handle belongs to.
     * @param isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    public onHandleDragEnd(anchorPoint: AnchorPoint, isIncoming: boolean) {}

    /**
     * Called when a control handle is clicked.
     * @param anchorPoint - The anchor point the handle belongs to.
     * @param isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    public onHandleClick(anchorPoint: AnchorPoint, isIncoming: boolean) {}

    // #endregion
}

/**
 * Map Region Editor Translate tool (Move Tool)
 */
class MapRegionEditorTranslateTool extends MapRegionEditorTool {
    constructor() { super();}

    // #region Utility Functions
    /**
     * Moves all anchor points based on the movement of the centralized point.
     * @param {AnchorPoint} anchorPoint - The anchor point being dragged.
     * @param {L.Marker} anchorVisual - The visual marker of the anchor point.
     */
    private moveAllPointsWithCentralizedPoint(anchorPoint: AnchorPoint, anchorVisual: L.Marker)
    {
        // Check if a centralized point is set
        if (MapRegionAnchorManager.INSTANCE.CentralizedPoint === null) {
            console.warn("No centralized point set for movement.");
            return;
        }

        // Calculate the movement offset
        const offset = L.latLng(
            anchorVisual.getLatLng().lat - anchorPoint.GetAnchorPosition.lat,
            anchorVisual.getLatLng().lng - anchorPoint.GetAnchorPosition.lng
        );

        // Move all anchor points by the offset
        MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.forEach(anchor => {
            const newPos = L.latLng(
                anchor.GetAnchorPosition.lat + offset.lat,
                anchor.GetAnchorPosition.lng + offset.lng
            );
            anchor.setAnchorPosition(newPos);
        });

        // If the anchor point is the centralized point, handle the anchor itself too
        if (anchorPoint === MapRegionAnchorManager.INSTANCE.CentralizedPoint) {
            MapRegionAnchorManager.INSTANCE.CentralizedPoint.setAnchorPosition(anchorVisual.getLatLng());
        }
    }

    // #endregion


    // #region Main Functions
    public override onAnchorDrag(anchorPoint: AnchorPoint) {
        console.log("TranslateTool anchorMoved called");

        // Get the list of selected anchors
        const selectedAnchors = MapRegionAnchorManager.INSTANCE.SelectedAnchors;
        if (selectedAnchors.size < 1) {
            return; // No other anchors to move with
        }

        if (anchorPoint.GetMainVisual === null) { console.log("No visual found"); return; }
        const anchorVisual: L.Marker = anchorPoint.GetMainVisual!;

        // If the moved anchor is the centralized point or if the centralized point is selected, move all points
        if (anchorPoint === MapRegionAnchorManager.INSTANCE.CentralizedPoint || selectedAnchors.has(MapRegionAnchorManager.INSTANCE.CentralizedPoint!)) {
            this.moveAllPointsWithCentralizedPoint(anchorPoint, anchorVisual);
            return;
        }

        // If not moving the centralized point, move all selected anchors by the same delta.
        // Calculate the movement delta
        const delta = L.latLng(
            anchorVisual.getLatLng().lat - anchorPoint.GetAnchorPosition.lat,
            anchorVisual.getLatLng().lng - anchorPoint.GetAnchorPosition.lng
        );

        // Move all selected anchors by the same delta
        selectedAnchors.forEach((anchor) => {
            if (anchor !== anchorPoint) { // Skip the anchor that was just moved
                const anchorCurrentPos = anchor.GetAnchorPosition;
                const newAnchorPos = L.latLng(
                    anchorCurrentPos.lat + delta.lat,
                    anchorCurrentPos.lng + delta.lng
                );
                anchor.setAnchorPosition(newAnchorPos);
            }
        });

        // Set the point we just moved
        anchorPoint.setAnchorPosition(anchorVisual.getLatLng());
    }

    public override onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean) {
        // Move only the selected handles
        const selectedHandles = MapRegionAnchorManager.INSTANCE.SelectedHandles;
        if (selectedHandles.size < 1) {
            return; // No other handles to move with
        }

        if (isIncoming ? anchorPoint.GetIncomingHandleVisual : anchorPoint.GetOutgoingHandleVisual === null) { console.log("No visual found"); return; }
        const handleVisual: L.Marker = isIncoming ? anchorPoint.GetIncomingHandleVisual! : anchorPoint.GetOutgoingHandleVisual!;

        // Move all selected handles by the same delta.
        // Calculate the movement delta
        const delta = L.latLng(
            handleVisual.getLatLng().lat - (isIncoming ? anchorPoint.GetRelativeIncomingHandlePosition!.lat + anchorPoint.GetAnchorPosition.lat : anchorPoint.GetRelativeOutgoingHandlePosition!.lat + anchorPoint.GetAnchorPosition.lat),
            handleVisual.getLatLng().lng - (isIncoming ? anchorPoint.GetRelativeIncomingHandlePosition!.lng + anchorPoint.GetAnchorPosition.lng : anchorPoint.GetRelativeOutgoingHandlePosition!.lng + anchorPoint.GetAnchorPosition.lng)
        );

        // Move all selected handles by the same delta and mirror if needed
        const mirror = !MapRegionEditorKeyStates.INSTANCE.isCtrlPressedDown;
        selectedHandles.forEach(([anchor, handleIsIncoming]) => {
            // Get the current handle position 
            const relHandleCurrentPos = handleIsIncoming ? anchor.GetRelativeIncomingHandlePosition : anchor.GetRelativeOutgoingHandlePosition;
            if (!relHandleCurrentPos) { return; } // Ensure the handle exists

            // Determine if should mirror (Check if the other handle on the anchor is not selected) and mirror is enabled.
            let otherHandleSelected = false;
            for (const [entryAnchor, entryIsIncoming] of selectedHandles) {
                if (entryAnchor === anchor && entryIsIncoming !== handleIsIncoming) {
                    otherHandleSelected = true;
                    break;
                }
            }
            const shouldMirror = mirror && !otherHandleSelected;

            // Move the handle
            anchor.setHandlePosition(handleIsIncoming, L.latLng(
                relHandleCurrentPos.lat + anchor.GetAnchorPosition.lat + delta.lat,
                relHandleCurrentPos.lng + anchor.GetAnchorPosition.lng + delta.lng
            ), shouldMirror);
        });
    }

    // #endregion
}

/**
 * Map Region Editor Rotate tool (Rotate Tool)
 */
class MapRegionEditorRotateTool extends MapRegionEditorTool {
    
    private lastAnchorMoved: AnchorPoint | null; // The last anchor point that was moved (used to calculate distance from pivot)
    private pivotDistance: number; // The distance from the pivot to the last moved anchor point
    private originalAngle: number; // The original angle of the moved anchor relative to pivot

    private originalAnchorPositions: Map<AnchorPoint, {lat: number, lng: number}>; // Store original positions of all anchors for rotation
    private originalPivotPosition: L.LatLng | null; // Store the pivot's position at the start of rotation
    private isDragActive: boolean; // Track if we're currently in a drag operation
    private gridLineTargets: AnchorPoint[]; // Store the target anchors for grid lines

    constructor() {
        super(); // Initialize parent class
        
        this.lastAnchorMoved = null; 
        this.pivotDistance = 0; 
        this.originalAngle = 0; 
        this.originalAnchorPositions = new Map(); 
        this.originalPivotPosition = null; 
        this.isDragActive = false; 
        this.gridLineTargets = []; 
    }

    // #region Utility Functions
    /**
     * Set active pivot element on the pivot/scale point visual.
     * @param {AnchorPoint} anchorPoint 
     */
    private setPointActivePivot(anchorPoint: AnchorPoint)
    {
        // Set the anchor as active pivot and deactivate others
        MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.forEach(anchor => anchor.setActivePivot(false));
        MapRegionAnchorManager.INSTANCE.CentralizedPoint!.setActivePivot(false);
        anchorPoint.setActivePivot(true);
    }

    // #endregion


    // #region Main Functions
    public override onAnchorDrag(anchorPoint: AnchorPoint) {
        let pivotAnchorPoint: AnchorPoint | null = MapRegionAnchorManager.INSTANCE.getCurrentPivotAnchor();

        // If no pivot point is set, do nothing.
        if (!pivotAnchorPoint) {
            console.warn("No pivot point set for rotation, setting pivot to centralized point.");
            pivotAnchorPoint = MapRegionAnchorManager.INSTANCE.CentralizedPoint;
        }

        if (anchorPoint.GetMainVisual === null) { console.log("No visual found"); return; }
        const anchorVisual: L.Marker = anchorPoint.GetMainVisual!;

        // Check if the lastAnchorMoved is changed or if this is a new drag operation.
        if (this.lastAnchorMoved !== anchorPoint || !this.isDragActive) {
            // Set the lastAnchorMoved to the current anchorPoint.
            this.lastAnchorMoved = anchorPoint;
            this.isDragActive = true;

            let pivotAnchorPoint: AnchorPoint | null = MapRegionAnchorManager.INSTANCE.getCurrentPivotAnchor();

            // Save the pivot's original position at the start of rotation
            this.originalPivotPosition = new L.LatLng(
                pivotAnchorPoint!.GetAnchorPosition.lat,
                pivotAnchorPoint!.GetAnchorPosition.lng
            );

            // Determine which anchors to rotate based on selection
            const anchorsToRotate = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(MapRegionAnchorManager.INSTANCE.CentralizedPoint!) ? 
                MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints : Array.from(MapRegionAnchorManager.INSTANCE.SelectedAnchors);

            // Determine grid line targets: if centralized point is being rotated alone, only show line to it
            let gridLineTargets;
            if (anchorsToRotate.length === 1 && anchorsToRotate.indexOf(MapRegionAnchorManager.INSTANCE.CentralizedPoint!) !== -1) {
                // Only rotating centralized point - draw line just to centralized point
                gridLineTargets = [MapRegionAnchorManager.INSTANCE.CentralizedPoint!];
            } else {
                // Rotating multiple points or regular anchors - draw lines to all being rotated
                gridLineTargets = anchorsToRotate;
            }

            // Store grid line targets for updating during drag
            this.gridLineTargets = gridLineTargets;

            // Show ghost anchor at original pivot position with grid lines
            MapRegionAnchorManager.INSTANCE.showGhostAnchor(
                L.latLng(this.originalPivotPosition.lat, this.originalPivotPosition.lng), 
                'pivot',
                gridLineTargets
            );

            // Store original positions of anchors to rotate
            this.originalAnchorPositions.clear();
            anchorsToRotate.forEach(anchor => {
                this.originalAnchorPositions.set(anchor, {
                    lat: anchor.GetAnchorPosition.lat,
                    lng: anchor.GetAnchorPosition.lng
                });
            });

            // Store the original angle of the moved anchor relative to the fixed pivot position
            const originalVector = L.latLng(
                anchorPoint.GetAnchorPosition.lat - this.originalPivotPosition.lat,
                anchorPoint.GetAnchorPosition.lng - this.originalPivotPosition.lng
            );
            this.originalAngle = Math.atan2(originalVector.lat, originalVector.lng);
            // Store distance in degrees (lat/lng space) to avoid conversion errors
            this.pivotDistance = Math.sqrt(originalVector.lat * originalVector.lat + originalVector.lng * originalVector.lng);
        }

        // Calculate the new angle of the dragged anchor relative to the fixed pivot position
        const newVector = L.latLng(
            anchorVisual.getLatLng().lat - this.originalPivotPosition!.lat,
            anchorVisual.getLatLng().lng - this.originalPivotPosition!.lng
        );
        const newAngle = Math.atan2(newVector.lat, newVector.lng);

        // Calculate the total rotation angle from the original position
        const totalRotationAngle = newAngle - this.originalAngle;

        // Constrain the moved anchor to maintain its distance from the fixed pivot position (in lat/lng degrees)
        const constrainedPos = L.latLng(
            this.originalPivotPosition!.lat + this.pivotDistance * Math.sin(newAngle),
            this.originalPivotPosition!.lng + this.pivotDistance * Math.cos(newAngle)
        );
        anchorPoint.setAnchorPosition(constrainedPos);

        // Rotate all other anchors (selected or all, depending on centralized point selection) around the pivot from their original positions
        const anchorsToRotate = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(MapRegionAnchorManager.INSTANCE.CentralizedPoint!) ? 
            MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints : Array.from(MapRegionAnchorManager.INSTANCE.SelectedAnchors);

        anchorsToRotate.forEach(anchor => {
            if (anchor !== anchorPoint) { // Skip the anchor that was just moved
                const originalPos = this.originalAnchorPositions.get(anchor);
                if (!originalPos) return;

                // Get original position relative to the fixed pivot position
                const originalVector = L.latLng(
                    originalPos.lat - this.originalPivotPosition!.lat,
                    originalPos.lng - this.originalPivotPosition!.lng
                );
                const originalAngle = Math.atan2(originalVector.lat, originalVector.lng);
                const distance = Math.sqrt(originalVector.lat * originalVector.lat + originalVector.lng * originalVector.lng);

                // Apply total rotation to this anchor from its original position around the fixed pivot
                const rotatedAngle = originalAngle + totalRotationAngle;
                const newPos = L.latLng(
                    this.originalPivotPosition!.lat + distance * Math.sin(rotatedAngle),
                    this.originalPivotPosition!.lng + distance * Math.cos(rotatedAngle)
                );
                anchor.setAnchorPosition(newPos);
            }
        });

        // Update ghost anchor grid lines with new positions
        if (this.gridLineTargets && this.gridLineTargets.length > 0) {
            MapRegionAnchorManager.INSTANCE.updateGhostGridLines(this.gridLineTargets, 'pivot');
        }
    }

    public override onAnchorDragEnd(anchorPoint: AnchorPoint) {
        // Hide ghost anchor and grid lines when rotation ends
        MapRegionAnchorManager.INSTANCE.hideGhostAnchor();
        
        // Reset drag state
        this.isDragActive = false;
        this.lastAnchorMoved = null;
    }

    public override onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean) { 
        // Set the handle visual back to it's previous position.
        const previousRelHandlePos: L.LatLng = isIncoming ? anchorPoint.GetRelativeIncomingHandlePosition! : anchorPoint.GetRelativeOutgoingHandlePosition!;
        const previousAbsHandlePos = L.latLng(
            previousRelHandlePos.lat + anchorPoint.GetAnchorPosition.lat,
            previousRelHandlePos.lng + anchorPoint.GetAnchorPosition.lng
        );
        
        anchorPoint.GetMainVisual!.setLatLng(previousAbsHandlePos);
    }

    public override onAnchorRightClick(anchorPoint: AnchorPoint) 
    { 
        // Use centralized system to set pivot anchor status
        MapRegionAnchorManager.INSTANCE.setPivotAnchor(anchorPoint);
        
        // Reset the last anchor moved so next drag will be treated as a new rotation
        this.lastAnchorMoved = null;
    }

    // #endregion
}

/**
 * Map Region Editor Scale tool (Scale Tool)
 */
class MapRegionEditorScaleTool extends MapRegionEditorTool {
    private lastAnchorMoved: AnchorPoint | null; // The last anchor point that was moved (used to track when new drag starts)
    private originalAnchorPositions = new Map(); // Store original positions of all anchors for scaling
    private originalScaleAnchorPosition: L.LatLng | null; // Store the scale anchor's position at the start of scaling
    private originalDistance = 0; // Store the original distance from scale anchor to the dragged anchor
    private anchorsToScale: AnchorPoint[]; // Store which anchors should be scaled for this operation
    private originalCentralizedPosition: L.LatLng | null; // Store original centralized position for centralized scaling

    constructor() {
        super(); // Initialize parent class

        // Scaling State
        this.lastAnchorMoved = null; // The last anchor point that was moved (used to track when new drag starts)
        this.originalAnchorPositions = new Map(); // Store original positions of all anchors for scaling
        this.originalScaleAnchorPosition = null; // Store the scale anchor's position at the start of scaling
        this.originalDistance = 0; // Store the original distance from scale anchor to the dragged anchor
        this.anchorsToScale = []; // Store which anchors should be scaled for this operation
        this.originalCentralizedPosition = null; // Store original centralized position for centralized scaling
    }

    // #region Utility Functions
    /**
     * Scales all anchors relative to the scale point when centralized point is moved.
     * @param {AnchorPoint} anchorPoint - The centralized anchor point being dragged.
     * @param {L.Marker} anchorVisual - The visual marker of the centralized anchor point.
     */
    private scaleByCentralizedPoint(anchorPoint: AnchorPoint, anchorVisual: L.Marker) 
    {
        // Initialize scaling state if this is a new drag operation for centralized point
        if (this.lastAnchorMoved !== anchorPoint) {
            this.lastAnchorMoved = anchorPoint;
            
            // Store the original position of the centralized point
            this.originalCentralizedPosition = new L.LatLng(
                anchorPoint.GetAnchorPosition.lat,
                anchorPoint.GetAnchorPosition.lng
            );
            
            // Store original positions of all anchor points (excluding centralized point)
            this.originalAnchorPositions.clear();
            MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.forEach(anchor => {
                this.originalAnchorPositions.set(anchor, {
                    lat: anchor.GetAnchorPosition.lat,
                    lng: anchor.GetAnchorPosition.lng
                });
            });

            let scaleAnchorPoint: AnchorPoint | null = MapRegionAnchorManager.INSTANCE.getCurrentScaleAnchor();
            
            // Store the fixed scale anchor position (the pivot point for scaling)
            this.originalScaleAnchorPosition = new L.LatLng(
                scaleAnchorPoint!.GetAnchorPosition.lat,
                scaleAnchorPoint!.GetAnchorPosition.lng
            );
            
            console.log("Initialized centralized point scaling relative to scale point");
        }
        
        // Calculate original vector from scale point to original centralized position
        const originalCentralizedVector = L.latLng(
            this.originalCentralizedPosition!.lat - this.originalScaleAnchorPosition!.lat,
            this.originalCentralizedPosition!.lng - this.originalScaleAnchorPosition!.lng
        );
        
        // Calculate new vector from scale point to current centralized position
        const newCentralizedVector = L.latLng(
            anchorVisual.getLatLng().lat - this.originalScaleAnchorPosition!.lat,
            anchorVisual.getLatLng().lng - this.originalScaleAnchorPosition!.lng
        );
        
        // Calculate scale factors based on the ratio of new to original vectors
        const scaleFactorLat = originalCentralizedVector.lat !== 0 ? newCentralizedVector.lat / originalCentralizedVector.lat : 1;
        const scaleFactorLng = originalCentralizedVector.lng !== 0 ? newCentralizedVector.lng / originalCentralizedVector.lng : 1;
        
        // Move the centralized point to its new position
        anchorPoint.setAnchorPosition(anchorVisual.getLatLng());
        
        // Scale all other anchor points relative to the scale point using the same scale factors
        MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.forEach(anchor => {
            if (anchor !== anchorPoint) { // Skip the centralized point itself
                const originalPos = this.originalAnchorPositions.get(anchor);
                if (!originalPos) return;
                
                // Calculate vector from scale point to original anchor position
                const originalAnchorVector = L.latLng(
                    originalPos.lat - this.originalScaleAnchorPosition!.lat,
                    originalPos.lng - this.originalScaleAnchorPosition!.lng
                );
                
                // Scale the vector using the same scale factors as the centralized point
                const scaledAnchorVector = L.latLng(
                    originalAnchorVector.lat * scaleFactorLat,
                    originalAnchorVector.lng * scaleFactorLng
                );
                
                // Set new position relative to the scale point
                const newPos = L.latLng(
                    this.originalScaleAnchorPosition!.lat + scaledAnchorVector.lat,
                    this.originalScaleAnchorPosition!.lng + scaledAnchorVector.lng
                );
                anchor.setAnchorPosition(newPos);
            }
        });
    }

    // #endregion

    // #region Main Functions
    public override onAnchorDrag(anchorPoint: AnchorPoint) 
    {
        // Get the current scale anchor from the manager (it's set when the tool is activated or via right-click)
        let scaleAnchorPoint: AnchorPoint | null = MapRegionAnchorManager.INSTANCE.getCurrentScaleAnchor();
        
        // If no scale anchor point is set, set it to the centralized point as fallback
        if (!scaleAnchorPoint) {
            scaleAnchorPoint = MapRegionAnchorManager.INSTANCE.CentralizedPoint;
            MapRegionAnchorManager.INSTANCE.setScaleAnchor(scaleAnchorPoint!);
            console.log("Set scale reference point to centralized:", scaleAnchorPoint);
        }

        if (anchorPoint.GetMainVisual === null) { console.log("No visual found"); return; }
        const anchorVisual: L.Marker = anchorPoint.GetMainVisual!;

        // Prevent dragging the scale anchor itself (unless it's the centralized point being used for special scaling)
        if (anchorPoint === scaleAnchorPoint && anchorPoint !== MapRegionAnchorManager.INSTANCE.CentralizedPoint) {
            // Reset the scale anchor to its original position - it should not move
            anchorVisual.setLatLng(anchorPoint.GetAnchorPosition);
            console.log("Cannot drag the scale anchor point - it must remain fixed");
            return;
        }

        // Special handling when moving the centralized point - scale all other anchors relative to scale point
        if (anchorPoint === MapRegionAnchorManager.INSTANCE.CentralizedPoint) {
            console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
            this.scaleByCentralizedPoint(anchorPoint, anchorVisual);
            return;
        }

        // Helper function to check if selection has actually changed
        const hasSelectionChanged = () => {
            const currentSelection = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(MapRegionAnchorManager.INSTANCE.CentralizedPoint!) ? 
                MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints : Array.from(MapRegionAnchorManager.INSTANCE.SelectedAnchors);
            
            // Check if the arrays have different lengths
            if (this.anchorsToScale.length !== currentSelection.length) return true;
            
            // Check if they contain the same anchors
            return !this.anchorsToScale.every(anchor => currentSelection.indexOf(anchor) !== -1);
        };

        // Check if the lastAnchorMoved is changed or if we need to initialize for the first drag.
        if (this.lastAnchorMoved !== anchorPoint || this.anchorsToScale.length === 0 || hasSelectionChanged()) {
            // Set the lastAnchorMoved to the current anchorPoint.
            this.lastAnchorMoved = anchorPoint;

            // Save the scale anchor's original position at the start of scaling
            this.originalScaleAnchorPosition = new L.LatLng(
                scaleAnchorPoint!.GetAnchorPosition.lat,
                scaleAnchorPoint!.GetAnchorPosition.lng
            );

            // Determine which anchors to scale based on Ctrl key and selection
            if (MapRegionEditorKeyStates.INSTANCE.isZPressedDown) {
                // scale all anchor points
                this.anchorsToScale = MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.slice(); // Use slice() to create a copy
            } else {
                // Normal mode: Scale based on selection
                this.anchorsToScale = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(MapRegionAnchorManager.INSTANCE.CentralizedPoint!) ? 
                    MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.slice() : Array.from(MapRegionAnchorManager.INSTANCE.SelectedAnchors);
            }

            // Store original positions of anchors to scale
            this.originalAnchorPositions.clear();
            this.anchorsToScale.forEach(anchor => {
                this.originalAnchorPositions.set(anchor, {
                    lat: anchor.GetAnchorPosition.lat,
                    lng: anchor.GetAnchorPosition.lng
                });
            });

            // Store the original distance from scale anchor to the dragged anchor
            this.originalDistance = L.latLng(this.originalScaleAnchorPosition!.lat, this.originalScaleAnchorPosition!.lng).distanceTo(anchorPoint.GetAnchorPosition);
        }

        // Prevent division by zero
        if (this.originalDistance === 0) {
            console.warn("Original distance is zero, cannot scale.");
            // Prevent anchor movement
            anchorVisual.setLatLng(anchorPoint.GetAnchorPosition);
            return;
        }

        // Calculate the new position vector from scale anchor to the dragged anchor
        const newVector = L.latLng(
            anchorVisual.getLatLng().lat - this.originalScaleAnchorPosition!.lat,
            anchorVisual.getLatLng().lng - this.originalScaleAnchorPosition!.lng
        );

        // Calculate the original position vector from scale anchor to the dragged anchor
        const originalDraggedPos = this.originalAnchorPositions.get(anchorPoint);
        const originalVector = L.latLng(
            originalDraggedPos.lat - this.originalScaleAnchorPosition!.lat,
            originalDraggedPos.lng - this.originalScaleAnchorPosition!.lng
        );

        // Calculate scale factors for each axis (this allows for negative scaling when crossing origin)
        const scaleFactorLat = originalVector.lat !== 0 ? newVector.lat / originalVector.lat : 1;
        const scaleFactorLng = originalVector.lng !== 0 ? newVector.lng / originalVector.lng : 1;

        // Allow the dragged anchor to move freely without constraining it to scale
        anchorPoint.setAnchorPosition(anchorVisual.getLatLng());

        // Determine which anchors to scale based on current Ctrl key state (dynamic)
        let currentAnchorsToScale;
        if (MapRegionEditorKeyStates.INSTANCE.isZPressedDown) {
            // Ctrl held: Scale all anchor points
            currentAnchorsToScale = MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints;
        } else {
            // Normal mode: Use the originally determined selection
            currentAnchorsToScale = this.anchorsToScale;
        }

        // Ensure we have original positions for all anchors that might be scaled
        MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.forEach(anchor => {
            if (!this.originalAnchorPositions.has(anchor)) {
                // If we don't have the original position stored, store the current position.
                // This can happen when switching to Ctrl mode mid-drag.
                this.originalAnchorPositions.set(anchor, {
                    lat: anchor.GetAnchorPosition.lat,
                    lng: anchor.GetAnchorPosition.lng
                });
            }
        });

        // Scale the appropriate anchors
        currentAnchorsToScale.forEach(anchor => {
            if (anchor !== anchorPoint) { // Skip the anchor that was just moved
                const originalPos = this.originalAnchorPositions.get(anchor);
                if (!originalPos) return;

                // Calculate the vector from the fixed scale anchor position to the original anchor position
                const vector = L.latLng(
                    originalPos.lat - this.originalScaleAnchorPosition!.lat,
                    originalPos.lng - this.originalScaleAnchorPosition!.lng
                );
                
                // Scale the vector using separate scale factors for lat/lng (allows crossing origin)
                const scaledPos = L.latLng(
                    this.originalScaleAnchorPosition!.lat + vector.lat * scaleFactorLat,
                    this.originalScaleAnchorPosition!.lng + vector.lng * scaleFactorLng
                );
                anchor.setAnchorPosition(scaledPos);
            }
        });
    }

    // Prevent Direct Handle Manipulation
    public override onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean) { 
        // Set the handle visual back to it's previous position.
        const previousRelHandlePos = isIncoming ? anchorPoint.GetRelativeIncomingHandlePosition! : anchorPoint.GetRelativeOutgoingHandlePosition!;
        const previousAbsHandlePos = L.latLng(
            previousRelHandlePos.lat + anchorPoint.GetAnchorPosition.lat,
            previousRelHandlePos.lng + anchorPoint.GetAnchorPosition.lng
        );
        (isIncoming ? anchorPoint.GetIncomingHandleVisual! : anchorPoint.GetOutgoingHandleVisual!).setLatLng(previousAbsHandlePos);
    }

    public override onAnchorRightClick(anchorPoint: AnchorPoint, event: any) {
        // Use centralized system to set scale anchor status
        MapRegionAnchorManager.INSTANCE.setScaleAnchor(anchorPoint);
        
        // Reset the last anchor moved so next drag will be treated as a new scaling operation
        this.lastAnchorMoved = null;
    }

    // #endregion

}

/**
 * Map Region Editor Add Anchor tool (Add Anchor Tool)
 */
class MapRegionEditorAddAnchorTool extends MapRegionEditorTool {
    constructor() { super(); }

    // #region Utility Functions

    // #endregion

    // #region Main Functions
    public mapClicked(clickPosition: L.LatLng)
    {
        // Add a new anchor point at the clicked location and put in inbetween the two closest anchors.
        MapRegionAnchorManager.INSTANCE.createAnchorPoint(clickPosition, null, null, true, true, true);
    }

    // #endregion
}