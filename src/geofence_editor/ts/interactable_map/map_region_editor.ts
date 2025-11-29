/// <reference types="leaflet" />
declare const PreferencesReference: any;
// Now you can use PreferencesReference directly in this file

class Visuals {
    // Custom Icons for Map Markers
    public static readonly ANCHOR_CONTROL_HANDLE_ICON = L.icon({
        iconUrl: './assets/icons/map_line_handle_icon.png',
        iconSize: [20, 20], // adjust as needed
        iconAnchor: [10, 10], // point of the icon which will correspond to marker's location
    });

    public static readonly ANCHOR_ICON = L.icon({
        iconUrl: './assets/icons/map_line_handle_icon.png',
        iconSize: [32, 32], // adjust as needed
        iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
    });

    public static readonly ROCKET_ICON = L.icon({
        iconUrl: './assets/icons/map_line_handle_icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

/**
 * Main class for the map region editor.
 */
class MapRegionEditor
{
    private static instance: MapRegionEditor;
    public static get INSTANCE(): MapRegionEditor { return MapRegionEditor.instance; }

    private activePrimaryTool: MapRegionEditorTool | null = null;
    public get ActivePrimaryTool(): MapRegionEditorTool | null { return this.activePrimaryTool; }

    private activeAddAnchorTool: MapRegionEditorAddAnchorTool | null = null;
    public get IsAddAnchorToolActive(): boolean { return this.activeAddAnchorTool !== null; }

    private justFinishedDragging: boolean = false;
    public get JustFinishedDragging(): boolean { return this.justFinishedDragging; }

    constructor()
    {
        // Ensure singleton instance
        if (MapRegionEditor.instance)
        {
            console.error("MapRegionEditor instance already exists!");
        }
        MapRegionEditor.instance = this;

        // Initialize key state tracking
        new MapRegionEditorKeyStates();
        
        // Initialize Management Classes
        new MapRegionAnchorManager();
        new MapRegionRegionManager();
        new MapRegionDataManager();

        // Initialize UI
        new MapEditorUI();

        // Setup the tool state
        this.setActivePrimaryTool(ToolType.Move);

        // Start with creation UI mode
        this.showCreationUI();
    }

    // #region Event Callbacks for Sub-managers
    /**
     * Called when an anchor drag starts
     */
    onAnchorDragStart(anchorPoint: AnchorPoint) {
        const ctrlPressed = MapRegionEditorKeyStates.INSTANCE.isCtrlPressedDown;
        const isCurrentlySelected = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(anchorPoint);

        if (!ctrlPressed) {
            // No ctrl held: Clear all selections and select only this anchor
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.forEach(anchor => {
                anchor.setMainSelected(false);
            });
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.clear();

            // Select the dragged anchor
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.add(anchorPoint);
            anchorPoint.setMainSelected(true);
        } else {
            // Ctrl is held
            if (!isCurrentlySelected) {
                // Anchor is not selected: Add it to selection
                MapRegionAnchorManager.INSTANCE.SelectedAnchors.add(anchorPoint);
                anchorPoint.setMainSelected(true);
            }
            // If already selected with ctrl held, keep it selected
        }
    }

    /**
     * Called when an anchor is being dragged
     */
    onAnchorDrag(anchorPoint: AnchorPoint) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool!.onAnchorDrag(anchorPoint);
        }
        MapRegionRegionManager.INSTANCE.updateActiveRegionFrontend();
    }

    /**
     * Called when an anchor drag operation ends
     */
    onAnchorDragEnd(anchorPoint: AnchorPoint) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool.onAnchorDragEnd(anchorPoint);
        }
        MapRegionRegionManager.INSTANCE.updateActiveRegionFrontend();
        
        // Set flag to prevent click event from firing immediately after drag
        this.justFinishedDragging = true;
        setTimeout(() => {
            this.justFinishedDragging = false;
        }, 100);
    }

    /**
     * Called when a control handle is being dragged
     */
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool!.onHandleDrag(anchorPoint, isIncoming);
        }

        MapRegionRegionManager.INSTANCE.updateActiveRegionFrontend();
    }

    /**
     * Called when a control handle drag ends
     */
    onHandleDragEnd(anchorPoint: AnchorPoint, isIncoming: boolean) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool.onHandleDragEnd(anchorPoint, isIncoming);
        }
        MapRegionRegionManager.INSTANCE.updateActiveRegionFrontend();
        
        // Set flag to prevent click event from firing immediately after drag
        this.justFinishedDragging = true;
        setTimeout(() => {
            this.justFinishedDragging = false;
        }, 100);
    }

    /**
     * Called when an anchor is clicked
     */
    onAnchorClick(anchorPoint: AnchorPoint) {
        const ctrlPressed = MapRegionEditorKeyStates.INSTANCE.isCtrlPressedDown;
        const isCurrentlySelected = MapRegionAnchorManager.INSTANCE.SelectedAnchors.has(anchorPoint);

        if (!ctrlPressed) {
            // No ctrl held: Clear all selections and select only this anchor
            // First, deselect all previously selected anchors
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.forEach(anchor => {
                anchor.setMainSelected(false);
            });
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.clear();

            // Select the clicked anchor
            MapRegionAnchorManager.INSTANCE.SelectedAnchors.add(anchorPoint);
            anchorPoint.setMainSelected(true);
        } else {
            // Ctrl is held - toggle selection
            if (isCurrentlySelected) {
                // Anchor is already selected: Deselect it
                MapRegionAnchorManager.INSTANCE.SelectedAnchors.delete(anchorPoint);
                anchorPoint.setMainSelected(false);
            } else {
                // Anchor is not selected: Add it to selection
                MapRegionAnchorManager.INSTANCE.SelectedAnchors.add(anchorPoint);
                anchorPoint.setMainSelected(true);
            }
        }

        // Trigger the tool
        if (this.activePrimaryTool) {
            this.activePrimaryTool.onAnchorClick(anchorPoint);
        }
    }

    /**
     * Called when a control handle is clicked
     */
    onHandleClick(anchorPoint: AnchorPoint, isIncoming: boolean) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool.onHandleClick(anchorPoint, isIncoming);
        }
    }

    /**
     * Called when an anchor is right-clicked
     */
    onAnchorRightClick(anchorPoint: AnchorPoint, event: any) {
        if (this.activePrimaryTool) {
            this.activePrimaryTool.onAnchorRightClick(anchorPoint, event);
        }
    }
    // #endregion

    /**
     * Switches UI to creation mode - hides tools, shows create buttons
     */
    private showCreationUI() {
        const toolsPanel: Element | null = document.querySelector('.tools-panel');
        const createPanel: Element | null = document.querySelector('.create-panel');
        
        if (toolsPanel) {
            (toolsPanel as HTMLElement).style.display = 'none';
        }
        
        if (createPanel) {
            (createPanel as HTMLElement).style.display = 'block';
        }
        
        console.log('Switched to creation UI mode');
    }

    // #region Tools
    /**
     * Sets the active primary tool based on the provided tool given.
     */
    public setActivePrimaryTool(editorToolType: ToolType)
    {
        // Clear all pivot and scale anchor statuses when switching tools
        MapRegionAnchorManager.INSTANCE.clearAllAnchorStatuses();

        // Delete the current tool
        this.activePrimaryTool = null;

        // Create the new tool based on the name
        switch (editorToolType)
        {
            case ToolType.Scale:
                this.activePrimaryTool = new MapRegionEditorScaleTool();
                // Set centralized point as default scale anchor with visual indicator
                if (MapRegionAnchorManager.INSTANCE.CentralizedPoint) {
                    MapRegionAnchorManager.INSTANCE.setScaleAnchor(MapRegionAnchorManager.INSTANCE.CentralizedPoint);
                }
                break;
            case ToolType.Rotate:
                this.activePrimaryTool = new MapRegionEditorRotateTool();
                // Set centralized point as default pivot anchor with visual indicator
                if (MapRegionAnchorManager.INSTANCE.CentralizedPoint) {
                    MapRegionAnchorManager.INSTANCE.setPivotAnchor(MapRegionAnchorManager.INSTANCE.CentralizedPoint);
                }
                break;
            case ToolType.Move:
                this.activePrimaryTool = new MapRegionEditorTranslateTool();
                // No special centralized point status needed for move tool
                break;
            default:
                console.warn("Unknown tool name: " + editorToolType);
                break;
        }
        
        // Update anchor interactivity when tool changes
        MapRegionAnchorManager.INSTANCE.updateAllAnchorInteractivity();
        
        // Update the UI to reflect the active tool
        MapEditorUI.INSTANCE.updateActiveToolDisplay();
        
    }

    /**
     * Sets the active add anchor tool based on the provided flag.
     */
    public setActiveAddAnchorTool(isActive: boolean)
    {
        if (isActive) {
            this.activeAddAnchorTool = new MapRegionEditorAddAnchorTool();
        }
        else
        {
            this.activeAddAnchorTool?.removeTool();
            this.activeAddAnchorTool = null;
        }

        // Update the UI to reflect the add anchor tool state
        MapEditorUI.INSTANCE.updateActiveToolDisplay();
    }

    // #endregion
}

/**
 * Class to manage anchor points within the map region editor.
 */
class MapRegionAnchorManager
{
    private static instance: MapRegionAnchorManager;
    public static get INSTANCE(): MapRegionAnchorManager { return MapRegionAnchorManager.instance; }

    // Anchor point management
    private centralizedPoint: AnchorPoint | null; // Centralized anchor point for region manipulation
    public get CentralizedPoint(): AnchorPoint | null { return this.centralizedPoint; }
    private activeAnchorPoints: AnchorPoint[]; // All active anchor points for the region
    public get ActiveAnchorPoints(): AnchorPoint[] { return this.activeAnchorPoints; }

    // Pivot and Scale Anchor Management
    private currentPivotAnchor: AnchorPoint | null; // Current pivot anchor for rotation
    private currentScaleAnchor: AnchorPoint | null; // Current scale anchor for resizing
    private anchorStatusMap: Map<AnchorPoint, Set<string>>; // Map to track the status of each anchor point

    // Ghost anchor for showing original pivot/scale during interactions
    private ghostVisual: L.Marker | null; // Ghost anchor for visual feedback during interactions
    private ghostVisualActive: boolean; // Flag to indicate if ghost anchor is active
    private ghostGridLines: L.Polyline[]; // Grid lines associated with the ghost anchor

    // Selection Tracking
    private selectedAnchors: Set<AnchorPoint>; // Set of currently selected anchor points
    public get SelectedAnchors(): Set<AnchorPoint> { return this.selectedAnchors; }
    private selectedHandles: Set<[AnchorPoint, boolean]>  // Set of currently selected anchor handles
    public get SelectedHandles(): Set<[AnchorPoint, boolean]> { return this.selectedHandles; }
    private isDragging: boolean; // Flag to indicate if an anchor is being dragged

    // Anchor pane management
    private handleGuideMapPane: any; // Pane for handle guide visuals
    private static readonly handleGuideMapPaneID: any = 'region-handle-guide-pane';
    public get HandleGuideMapPaneID(): any { return MapRegionAnchorManager.handleGuideMapPaneID; }

    private anchorMapPane: any; // Pane for anchor markers
    private static readonly anchorMapPaneID: any = 'region-anchor-pane';
    public get AnchorMapPaneID(): any { return MapRegionAnchorManager.anchorMapPaneID; }

    private handleMapPane: any; // Pane for handle markers
    private static readonly handleMapPaneID: any = 'region-handle-pane';
    public get HandleMapPaneID(): any { return MapRegionAnchorManager.handleMapPaneID; }

    constructor()
    {
        // Ensure singleton instance
        if (MapRegionAnchorManager.instance)
        {
            console.error("MapRegionAnchorManager instance already exists!");
        }
        MapRegionAnchorManager.instance = this;

        // Initialize anchor point management
        this.centralizedPoint = null;
        this.activeAnchorPoints = [];

        this.currentPivotAnchor = null;
        this.currentScaleAnchor = null;
        this.anchorStatusMap = new Map<AnchorPoint, Set<string>>();

        this.ghostVisual = null;
        this.ghostVisualActive = false;
        this.ghostGridLines = [];

        this.selectedAnchors = new Set<AnchorPoint>();
        this.selectedHandles = new Set<[AnchorPoint, boolean]>();
        this.isDragging = false;

        // Initialize anchor and handle panes
        this.initializePanes();
    }

    /**
     * Initialize anchor and handle panes
     */
    private initializePanes() : void {
        // Initialize anchor pane
        this.anchorMapPane = InteractiveMap.mapInstance.createPane(MapRegionAnchorManager.anchorMapPaneID);
        this.anchorMapPane.style.zIndex = MAP_LAYER_INDICES['REGION_ANCHORS'] as number;

        // Initialize handle pane
        this.handleMapPane = InteractiveMap.mapInstance.createPane(MapRegionAnchorManager.handleMapPaneID);
        this.handleMapPane.style.zIndex = MAP_LAYER_INDICES['REGION_HANDLES'] as number;

        // Initialize handle guide pane
        this.handleGuideMapPane = InteractiveMap.mapInstance.createPane(MapRegionAnchorManager.handleGuideMapPaneID);
        this.handleGuideMapPane.style.zIndex = MAP_LAYER_INDICES['REGION_HANDLE_GUIDES'] as number;
    }

    // #region Pivot and Scale Anchor Management
    /**
     * Sets an anchor as the pivot point and updates visual status.
     * @param {AnchorPoint} anchorPoint - The anchor to set as pivot.
     */
    public setPivotAnchor(anchorPoint: AnchorPoint | null) : void {
        // Clear previous pivot status
        if (this.currentPivotAnchor) {
            this.clearAnchorStatus(this.currentPivotAnchor, 'pivot');
        }
        
        // Set new pivot
        this.currentPivotAnchor = anchorPoint;
        if (anchorPoint) {
            this.setAnchorStatus(anchorPoint, 'pivot');
            console.log('Set pivot anchor:', anchorPoint);
        }
    }

    /**
     * Sets an anchor as the scale point and updates visual status.
     * @param {AnchorPoint} anchorPoint - The anchor to set as scale point.
     */
    public setScaleAnchor(anchorPoint: AnchorPoint) : void {
        // Clear previous scale status
        if (this.currentScaleAnchor) {
            this.clearAnchorStatus(this.currentScaleAnchor, 'scale');
        }
        
        // Set new scale anchor
        this.currentScaleAnchor = anchorPoint;
        if (anchorPoint) {
            this.setAnchorStatus(anchorPoint, 'scale');
            console.log('Set scale anchor:', anchorPoint);
        }
    }

    /**
     * Sets visual status on an anchor point.
     * @param {AnchorPoint} anchorPoint - The anchor to set status on.
     * @param {String} status - The status to set ('pivot', 'scale').
     */
    public setAnchorStatus(anchorPoint: AnchorPoint, status: string): void {
        if (!this.anchorStatusMap.has(anchorPoint)) {
            this.anchorStatusMap.set(anchorPoint, new Set());
        }
        
        this.anchorStatusMap.get(anchorPoint)!.add(status);
        this.updateAnchorVisualStatus(anchorPoint);
        
        console.log(`Set ${status} status on anchor:`, anchorPoint);
    }

    /**
     * Clears a specific status from an anchor point.
     * @param {AnchorPoint} anchorPoint - The anchor to clear status from.
     * @param {String} status - The status to clear ('pivot', 'scale').
     */
    clearAnchorStatus(anchorPoint: AnchorPoint, status: string) : void {
        if (this.anchorStatusMap.has(anchorPoint)) {
            this.anchorStatusMap.get(anchorPoint)!.delete(status);
            
            // Remove the anchor from map if no statuses remain
            if (this.anchorStatusMap.get(anchorPoint)!.size === 0) {
                this.anchorStatusMap.delete(anchorPoint);
            }
            
            this.updateAnchorVisualStatus(anchorPoint, true);
            console.log(`Cleared ${status} status from anchor:`, anchorPoint);
        }
    }

    /**
     * Clears all anchor statuses and updates visuals.
     */
    clearAllAnchorStatuses() : void {
        const anchorsToUpdate = Array.from(this.anchorStatusMap.keys());
        
        // Clear current pivot and scale references
        this.currentPivotAnchor = null;
        this.currentScaleAnchor = null;
        
        // Clear the status map
        this.anchorStatusMap.clear();
        
        // Update visuals for all previously affected anchors
        anchorsToUpdate.forEach(anchor => {
            this.updateAnchorVisualStatus(anchor, true);
        });
    }

    /**
     * Updates the visual status of an anchor point based on its current statuses.
     * @param {AnchorPoint} anchorPoint - The anchor to update.
     * @param {boolean} clearAll - Whether to clear all classes before applying new ones.
     */
    updateAnchorVisualStatus(anchorPoint: AnchorPoint, clearAll: boolean = false) : void {
        const statusSet = this.anchorStatusMap.get(anchorPoint);
        const mainVisual = anchorPoint.GetMainVisual;
        
        if (!mainVisual) return;
        
        const element = mainVisual.getElement();
        if (!element) return;
        
        if (clearAll) {
            // Remove all status classes
            element.classList.remove('pivot-anchor', 'scale-anchor');
        }
        
        if (statusSet) {
            // Add classes based on current statuses
            if (statusSet.has('pivot')) {
                element.classList.add('pivot-anchor');
            }
            if (statusSet.has('scale')) {
                element.classList.add('scale-anchor');
            }
        }
    }
    // #endregion
    
    // #region Getters
    public getCurrentPivotAnchor(): AnchorPoint | null { return this.currentPivotAnchor; }
    public getCurrentScaleAnchor(): AnchorPoint | null { return this.currentScaleAnchor; }
    // #endregion

    // #region Ghost Anchor Management
    /**
     * Shows a ghost anchor at the specified position to indicate original pivot/scale point.
     * @param {L.LatLng} position - The position to show the ghost anchor.
     * @param {String} type - The type of ghost anchor ('pivot' or 'scale').
     * @param {Array} targetAnchors - Optional array of anchor points to draw grid lines to.
     */
    showGhostAnchor(position: L.LatLng, type: string = 'pivot', targetAnchors: AnchorPoint[] | null = null) : void {
        // Remove existing ghost anchor if any
        this.hideGhostAnchor();
        
        // Create ghost anchor marker
        this.ghostVisual = L.marker(position, {
            icon: Visuals.ANCHOR_ICON,
            interactive: false, // Make it non-interactive
            keyboard: false,
            riseOnHover: false,
            zIndexOffset: -1000 // Place behind other markers
        }).addTo(InteractiveMap.mapInstance);
        
        // Add ghost styling based on type
        const element = this.ghostVisual.getElement();
        if (element) {
            element.classList.add('ghost-anchor');
            if (type === 'pivot') {
                element.classList.add('ghost-pivot-anchor');
            } else if (type === 'scale') {
                element.classList.add('ghost-scale-anchor');
            }
        }
        
        // Create grid lines to target anchors if provided
        this.ghostGridLines = [];
        if (targetAnchors && targetAnchors.length > 0) {
            targetAnchors.forEach(anchor => {
                const line = L.polyline([position, anchor.GetAnchorPosition!], {
                    color: type === 'pivot' ? '#9d4edd' : '#06ffa5',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '8, 4',
                    interactive: false
                }).addTo(InteractiveMap.mapInstance);
                
                this.ghostGridLines.push(line);
            });
        }
        
        this.ghostVisualActive = true;
        console.log(`Ghost ${type} anchor shown at:`, position, 'with', targetAnchors ? targetAnchors.length : 0, 'grid lines');
    }

    /**
     * Hides the ghost anchor if it's currently shown.
     */
    hideGhostAnchor() : void {
        if (this.ghostVisual) {
            InteractiveMap.mapInstance.removeLayer(this.ghostVisual);
            this.ghostVisual = null;
        }
        
        // Remove grid lines
        if (this.ghostGridLines) {
            this.ghostGridLines.forEach(line => {
                if (InteractiveMap.mapInstance.hasLayer(line)) {
                    InteractiveMap.mapInstance.removeLayer(line);
                }
            });
            this.ghostGridLines = [];
        }
        
        if (this.ghostVisualActive) {
            this.ghostVisualActive = false;
            console.log('Ghost anchor and grid lines hidden');
        }
    }

    /**
     * Updates the grid lines from ghost anchor to target anchors with their current positions.
     * @param {Array} targetAnchors - Array of anchor points to draw lines to.
     * @param {String} type - The type of ghost anchor ('pivot' or 'scale').
     */
    updateGhostGridLines(targetAnchors: AnchorPoint[], type: string = 'pivot') : void {
        if (!this.ghostVisual || !this.ghostVisualActive || !targetAnchors) {
            return;
        }

        // Remove existing grid lines
        if (this.ghostGridLines) {
            this.ghostGridLines.forEach(line => {
                if (InteractiveMap.mapInstance.hasLayer(line)) {
                    InteractiveMap.mapInstance.removeLayer(line);
                }
            });
            this.ghostGridLines = [];
        }

        // Create new grid lines with current positions
        const ghostPosition = this.ghostVisual.getLatLng();
        targetAnchors.forEach(anchor => {
            const line = L.polyline([ghostPosition, anchor.GetAnchorPosition!], {
                color: type === 'pivot' ? '#9d4edd' : '#06ffa5',
                weight: 3,
                opacity: 0.8,
                dashArray: '8, 4',
                interactive: false
            }).addTo(InteractiveMap.mapInstance);
            
            this.ghostGridLines.push(line);
        });
    }

    /**
     * Checks if ghost anchor is currently active.
     * @returns {boolean} True if ghost anchor is active.
     */
    isGhostAnchorActive(): boolean { return this.ghostVisualActive; }

    // #endregion

    // #region Anchor Points Getters
    /**
     * Finds the two closest anchor points to a given position and returns their index and distances.
     * @param {L.LatLng} latlng - The position to find closest anchors to.
     * @returns {Object} Object containing information about the two closest anchors.
     */
    findTwoClosestAnchors(latlng: L.LatLng) : { firstIndex: number, secondIndex: number, firstDistance: number, secondDistance: number } {
        if (this.activeAnchorPoints.length < 2) {
            return { firstIndex: 0, secondIndex: 0, firstDistance: Infinity, secondDistance: Infinity };
        }

        let firstClosestIndex = 0;
        let secondClosestIndex = 1;
        let firstClosestDistance = latlng.distanceTo(this.activeAnchorPoints[0].GetAnchorPosition!);
        let secondClosestDistance = latlng.distanceTo(this.activeAnchorPoints[1].GetAnchorPosition!);

        // Ensure first is closer than second
        if (secondClosestDistance < firstClosestDistance) {
            [firstClosestIndex, secondClosestIndex] = [secondClosestIndex, firstClosestIndex];
            [firstClosestDistance, secondClosestDistance] = [secondClosestDistance, firstClosestDistance];
        }

        // Check the rest of the anchors
        for (let i = 2; i < this.activeAnchorPoints.length; i++) {
            const distance = latlng.distanceTo(this.activeAnchorPoints[i].GetAnchorPosition!);
            
            if (distance < firstClosestDistance) {
                // New first closest
                secondClosestIndex = firstClosestIndex;
                secondClosestDistance = firstClosestDistance;
                firstClosestIndex = i;
                firstClosestDistance = distance;
            } else if (distance < secondClosestDistance) {
                // New second closest
                secondClosestIndex = i;
                secondClosestDistance = distance;
            }
        }

        return {
            firstIndex: firstClosestIndex,
            secondIndex: secondClosestIndex,
            firstDistance: firstClosestDistance,
            secondDistance: secondClosestDistance
        };
    }

    /**
     * Finds the closest path segment to a given position in a closed path.
     * @param {L.LatLng} latlng - The position to find the closest segment to.
     * @returns {Object} Object containing the indices of the segment's start and end anchors.
     */
    findClosestSegment(latlng: L.LatLng): { startIndex: number, endIndex: number, distance: number } {
        if (this.activeAnchorPoints.length < 2) {
            return { startIndex: 0, endIndex: 0, distance: Infinity };
        }

        let closestStartIndex = 0;
        let closestEndIndex = 1;
        let closestDistance = Infinity;

        // Iterate through all segments in the closed path
        for (let i = 0; i < this.activeAnchorPoints.length; i++) {
            const nextIndex = (i + 1) % this.activeAnchorPoints.length;
            
            const start = this.activeAnchorPoints[i].GetAnchorPosition;
            const end = this.activeAnchorPoints[nextIndex].GetAnchorPosition;

            // Calculate distance from point to line segment
            const distance = this.pointToSegmentDistance(latlng, start, end);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestStartIndex = i;
                closestEndIndex = nextIndex;
            }
        }

        return {
            startIndex: closestStartIndex,
            endIndex: closestEndIndex,
            distance: closestDistance
        };
    }

    /**
     * Calculates the distance from a point to a line segment.
     * @param {L.LatLng} point - The point.
     * @param {L.LatLng} segmentStart - Start of the line segment.
     * @param {L.LatLng} segmentEnd - End of the line segment.
     * @returns {number} Distance from point to segment.
     */
    private pointToSegmentDistance(point: L.LatLng, segmentStart: L.LatLng, segmentEnd: L.LatLng): number {
        const x = point.lng;
        const y = point.lat;
        const x1 = segmentStart.lng;
        const y1 = segmentStart.lat;
        const x2 = segmentEnd.lng;
        const y2 = segmentEnd.lat;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Creates a new anchor point and optionally adds it to the anchor points array.
     * @param {L.LatLng} latlng - The position of the new anchor point.
     * @param {L.LatLng} relIncomingHandlePos - Relative incoming handle position.
     * @param {L.LatLng} relOutgoingHandlePos - Relative outgoing handle position.
     * @param {boolean} updateRegion - Whether to update the region after creating the anchor.
     * @param {boolean} pushToAnchorPoints - Whether to add this anchor to the anchor points array.
     * @param {boolean} insertBetweenClosests - Whether to insert between the two closest anchors.
     * @returns {AnchorPoint} The created anchor point.
     */
    createAnchorPoint(latlng: L.LatLng, relIncomingHandlePos: L.LatLng | null, relOutgoingHandlePos: L.LatLng | null, updateRegion: boolean = true, pushToAnchorPoints: boolean = true, insertBetweenClosests: boolean = false) {
        // Create the new anchor point
        const newAnchor = new AnchorPoint(
            latlng,
            relIncomingHandlePos,
            relOutgoingHandlePos,
            {
                onAnchorDragStart: (a: AnchorPoint) => { MapRegionEditor.INSTANCE.onAnchorDragStart(a); },
                onAnchorDrag: (a: AnchorPoint) => { MapRegionEditor.INSTANCE.onAnchorDrag(a); },
                onAnchorDragEnd: (a: AnchorPoint) => { MapRegionEditor.INSTANCE.onAnchorDragEnd(a); },
                onHandleDrag: (a: AnchorPoint, b: boolean) => { MapRegionEditor.INSTANCE.onHandleDrag(a, b); },
                onAnchorClick: (a: AnchorPoint) => { MapRegionEditor.INSTANCE.onAnchorClick(a); },
                onHandleClick: (a: AnchorPoint, b: boolean) => { MapRegionEditor.INSTANCE.onHandleClick(a, b); },
                onAnchorRightClick: (a: AnchorPoint, e: any) => { MapRegionEditor.INSTANCE.onAnchorRightClick(a, e); }
            }
        );

        if (pushToAnchorPoints) {
            if (insertBetweenClosests && this.activeAnchorPoints.length >= 2) {
                // Find the closest segment and insert between its anchors
                console.log("Inserting anchor in closest segment");
                const segmentInfo = this.findClosestSegment(latlng);
                
                // Insert after the start anchor of the segment
                // If endIndex is 0 (wrapping), insert at the end of the array
                let insertIndex: number;
                if (segmentInfo.endIndex === 0) {
                    // Wrapping case: segment from last anchor to first anchor
                    insertIndex = this.activeAnchorPoints.length;
                } else {
                    // Normal case: insert after the start anchor
                    insertIndex = segmentInfo.endIndex;
                }
                
                this.activeAnchorPoints.splice(insertIndex, 0, newAnchor);
                console.log(`Inserted anchor at index ${insertIndex} in segment ${segmentInfo.startIndex}->${segmentInfo.endIndex}`);
            } else {
                // Simply push to the end
                this.activeAnchorPoints.push(newAnchor);
            }
        }

        if (updateRegion) {
            MapRegionRegionManager.INSTANCE.updateActiveRegionFrontend();
        }

        return newAnchor;
    }

    /**
     * Clears all anchor points from the manager and removes them from the map.
     */
    clearAnchors() {
        // Remove all anchor visuals from the map
        this.activeAnchorPoints.forEach(anchor => {
            if (anchor) {
                anchor.destroySelf();
            }
        });

        // Clear the anchors array
        this.activeAnchorPoints = [];

        // Clear centralized point
        if (this.centralizedPoint && this.centralizedPoint.destroySelf()) {
            this.centralizedPoint.destroySelf();
        }
        this.centralizedPoint = null;

        // Clear all anchor statuses
        this.clearAllAnchorStatuses();

        // Clear selected anchors and handles
        this.selectedAnchors.clear();
        this.selectedHandles.clear();

        // Reset dragging state
        this.isDragging = false;
    }

    /**
     * Updates the interactivity of all anchor points based on current tool state
     */
    updateAllAnchorInteractivity() {
        this.activeAnchorPoints.forEach(anchor => {
            if (anchor.updateInteractivity) {
                anchor.updateInteractivity();
            }
        });
        
        if (this.centralizedPoint && this.centralizedPoint.updateInteractivity) {
            this.centralizedPoint.updateInteractivity();
        }
    }

    /**
     * Calculates and sets the centralized point based on current anchor points.
     */
    public calculateCentralizedPoint() {
        if (this.activeAnchorPoints.length === 0) {
            this.centralizedPoint = null;
            return;
        }

        // Calculate center point from all anchors
        let totalLat = 0;
        let totalLng = 0;
        
        this.activeAnchorPoints.forEach(anchor => {
            if (anchor)
            {
                totalLat += anchor.GetAnchorPosition!.lat;
                totalLng += anchor.GetAnchorPosition!.lng;
            }
        });

        const centerLat = totalLat / this.activeAnchorPoints.length;
        const centerLng = totalLng / this.activeAnchorPoints.length;
        const centerLatLng = L.latLng(centerLat, centerLng);

        // Create centralized point anchor
        if (!this.centralizedPoint)
        {
            this.centralizedPoint = this.createAnchorPoint(
                centerLatLng,
                null,
                null,
                false, // Don't update region
                false, // Don't add to anchor points array
                false  // Don't insert between closest anchors
            );
        }
        else
        {
            this.centralizedPoint.setAnchorPosition(centerLatLng);
        }
    }
    // #endregion

    /**
     * Update anchor point positions in the active region.
     */
    updateActiveRegionAnchors(newFrontendAnchorData: FrontendAnchorData) {
        MapRegionRegionManager.INSTANCE.ActiveEditingRegion?.setFrontendAnchorPositions(newFrontendAnchorData);
    }
}

/**
 * Class to manage regions within the map region editor.
 */
class MapRegionRegionManager 
{
    private static instance: MapRegionRegionManager;
    public static get INSTANCE(): MapRegionRegionManager { return MapRegionRegionManager.instance; }

    private activeEditingRegion: MapRegion | null; // Currently active region being edited
    public get ActiveEditingRegion(): MapRegion | null { return this.activeEditingRegion; }
    private regions: MapRegion[]; // All regions managed by the editor

    private editorRegionCreator: MapRegionCreatorEditorHandler | null = null;

    constructor()
    {
        // Ensure singleton instance
        if (MapRegionRegionManager.instance)
        {
            console.error("MapRegionRegionManager instance already exists!");
        }
        MapRegionRegionManager.instance = this;

        // Initialization primary fields
        this.activeEditingRegion = null;
        this.regions = [];
    }

    // #region Region Loading Functions
    /**
     * Loads different types of regions and appends them to _regions array.
     * @param {RegionData | string} regionInput - Data defining the region to load or UUID to get regiondata from DataManager
     * @param {boolean} pushToRegionsArray - Whether to add the loaded region to the regions array
     */
    public loadRegion(regionInput: RegionData | string, pushToRegionsArray: boolean = true) : MapRegion | null {
        // Get region data
        const isUUIDInput = (typeof regionInput === 'string');
        let regionData: RegionData;
        if (isUUIDInput) {
            // Input is a UUID - get region data from DataManager
            console.log(`Loading region data for UUID: ${regionInput}`);
            const fetchedData = MapRegionDataManager.INSTANCE.getRegionDataByUUID(regionInput);
            if (!fetchedData) {
                console.error(`No region data found for UUID: ${regionInput}`);
                return null;
            }
            regionData = fetchedData;
        } else {
            // Input is region data
            regionData = regionInput;
            console.warn("Currently loading region from direct data input. Ensure This region IS ONLY Visual, since it cannot be editing.");
        }

        let newRegion: MapRegion;

        // Create region based on type
        switch (regionData.RegionType) {
            // Rectangle
            case RegionType.Rectangle:
                newRegion = new MapRectangleRegion(isUUIDInput ? (regionInput as string) : regionData);
                break;
            
            // Circle
            case RegionType.Circle:
                newRegion = new MapCircleRegion(isUUIDInput ? (regionInput as string) : regionData);
                break;
            
            // Custom Freeform
            case RegionType.Freeform:
                newRegion = new MapFreeformRegion(isUUIDInput ? (regionInput as string) : regionData); // Use base rectangle class for custom shapes
                break;
        }

        // Add region to the regions array
        if (pushToRegionsArray)
            this.regions.push(newRegion);

        // Update the editor UI
        MapEditorUILayerManager.INSTANCE.updateMapLayersListAndIndicies();
        
        return newRegion;
    }

    /**
     * Loads multiple regions from an array of region configurations.
     */
    public loadGeoeditFileContents(geoeditFileData: GeoeditFileData) {
        // Stop editing any active region
        if (this.activeEditingRegion) {
            MapRegionRegionManager.INSTANCE.stopEditingRegion();
        }

        // Stop attempting to add any active regioin
        if (this.editorRegionCreator) {
            this.editorRegionCreator.cancelRegionCreation();
            this.editorRegionCreator = null;
        }

        // Clear existing regions
        this.deleteAllRegions();

        // Add all data regions
        geoeditFileData.regions.forEach(regionData => {
            MapRegionDataManager.INSTANCE.appendRegionData(regionData);
            const uuid: string = regionData.UUID!;
            this.loadRegion(uuid, true);
        });
    }

    /**
     * Gets all loaded regions.
     * @returns {Array} Array of all loaded regions
     */
    getAllRegions() {
        return this.regions;
    }
    
    /**
     * Get a region by its regionData UUID.
     */
    public getRegionByUUID(uuid: string): MapRegion | null {
        for (const region of this.regions) {
            if (region.RegionData.UUID === uuid) {
                return region;
            }
        }
        return null;
    }

    /**
     * Removes a region from the _regions array.
     * @param {number} index - Index of the region to remove
     * @returns {boolean} True if region was removed successfully
     */
    removeRegion(index: number) {
        if (index >= 0 && index < this.regions.length) {
            const removedRegion = this.regions.splice(index, 1)[0];
            //console.log('Removed region:', removedRegion);
            return true;
        }
        console.error(`Invalid region index: ${index}`);
        return false;
    }

    /**
     * Clears all regions from the _regions array.
     */
    public deleteAllRegions() {
        while (this.regions.length > 0) {
            this.deleteRegion(this.regions[0].GetSetUUID);
        }
    }
    // #endregion

    public updateActiveRegionFrontend()
    {
        // Update the region's frontend shape point data from current anchor points
        if (MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints && MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.length > 0) {
            this.activeEditingRegion!.setFrontendAnchorPositions(
                MapRegionAnchorManager.INSTANCE.ActiveAnchorPoints.map(
                    anchor => ({
                        anchorPos: anchor.GetAnchorPosition,
                        relIncomingHandlePos: anchor.GetRelativeIncomingHandlePosition,
                        relOutgoingHandlePos: anchor.GetRelativeOutgoingHandlePosition
                    })
                )
            );
            
            // Update the region visual
            this.activeEditingRegion!.update();

            // Update the centralized point
            MapRegionAnchorManager.INSTANCE.calculateCentralizedPoint();
        }
    }

    public updateAllRegions()
    {
        // Compile all regions with & without index.
        const regionsWithIndex: Array<{ region: MapRegion, layerIndex: number }> = [];
        const regionsWithoutIndex: MapRegion[] = [];

        this.regions.forEach((region, _) => {
            // Check if it has regionData.
            if (region.RegionData) {
                // Update incases where regionData has changed externally.
                region.attemptGetLatestRegionData();
                const regionData: RegionData = region.RegionData;
                // Add to list if it has a valid index.
                if (regionData.LayerIndex !== undefined && regionData.LayerIndex !== null)
                    regionsWithIndex.push({ region: region, layerIndex: region.RegionData.LayerIndex! });
                else
                    regionsWithoutIndex.push(region);
            }
            else
            {
                console.warn('Region has no associated region data:', region);
            }
        });

        // Sort regions with index by their LayerIndex
        regionsWithIndex.sort((a, b) => a.layerIndex - b.layerIndex);

        // Combine the sorted regions with index and those without index
        const sortedRegions: MapRegion[] = regionsWithIndex.map(item => item.region).concat(regionsWithoutIndex);
        
        // Invert the order so that higher index regions are drawn on top
        sortedRegions.reverse();

        // Update each region in the correct order
        for (const region of sortedRegions) {
            region.update();
        }

        console.log('Updated all regions in correct layer order.');
    }

    public setActiveEditingRegion(UUID: string)
    {
        const region = this.getRegionByUUID(UUID);
        if (!region || region === this.activeEditingRegion) {
            return; // No change
        }

        // Clear current active region's anchor points
        MapRegionAnchorManager.INSTANCE.clearAnchors();

        const previousRegion = this.activeEditingRegion;

        // Set the active editing region
        this.activeEditingRegion = region;

        // Update the previous region
        if (previousRegion)
            previousRegion.update(); // Save any changes to previous region

        // Load the active region's anchor points into the anchor manager
        this.loadRegionAnchorsIntoEditor(region!);

        // Update the add anchor button state
        MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
    }

    /**
     * Attempts to set the active editing region by UUID, ensuring no other region is being edited.
     */
    public attemptStartEditingRegion(UUID: string): void
    {
        if (this.activeEditingRegion)
        {
            console.warn('Cannot change active editing region while another region is being edited. Stop editing first.');
            return;
        }

        const region = this.getRegionByUUID(UUID);
        if (!region) {
            console.error(`No region found with UUID: ${UUID}`);
            return;
        }

        this.setActiveEditingRegion(UUID);
    }

    public toggleRegionVisibility(UUID: string)
    {
        const regionData = MapRegionDataManager.INSTANCE.getRegionDataByUUID(UUID);
        if (!regionData) {
            throw new Error(`No region found with UUID: ${UUID}`);
        }

        regionData.General.IsVisible = !regionData.General.IsVisible;
        MapRegionDataManager.INSTANCE.setRegionDataWithUUID(UUID, regionData, true);
        console.log(`Toggled visibility for region UUID: ${UUID} to ${regionData.General.IsVisible}`);
        
        // Update the UI to reflect the visibility change
        MapEditorUILayerManager.INSTANCE.updateMapLayersListAndIndicies();
    }

    public deleteRegion(UUID: string)
    {
        // Find the region first
        const regionIndex = this.regions.findIndex(r => r.GetSetUUID === UUID);
        if (regionIndex === -1) {
            console.warn(`Region with UUID ${UUID} not found for deletion.`);
            return;
        }

        // Stop editing if this region is currently being edited
        // Clear the active editing region reference WITHOUT calling stopEditingRegion() to avoid update() calls
        const wasBeingEdited = (this.activeEditingRegion && this.activeEditingRegion.GetSetUUID === UUID);
        if (wasBeingEdited) {
            // Clear anchors
            MapRegionAnchorManager.INSTANCE.clearAnchors();
            // Clear the active editing region reference
            this.activeEditingRegion = null;
        }

        // Remove the region's visual elements from the map
        this.regions[regionIndex].removeRegion();
        
        // Remove from the regions array
        this.regions.splice(regionIndex, 1);

        // Remove the region data from the data manager
        MapRegionDataManager.INSTANCE.removeRegionDataByUUID(UUID);

        // Update the UI
        MapEditorUILayerManager.INSTANCE.updateMapLayersListAndIndicies();
        if (wasBeingEdited)
            MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
    }

    // #region Region Management Functions
    /**
     * Loads a region into the editor for editing.
     * @param {MapRegion} region - The region to load into the editor
     * @returns {boolean} True if the region was successfully loaded for editing
     */
    public loadRegionAnchorsIntoEditor(region: MapRegion) {
        if (!region) {
            console.error('Cannot load null/undefined region into editor');
            return false;
        }

        // Set this region as the active editing region
        this.activeEditingRegion = region;

        // Clear existing anchor points in the editor
        MapRegionAnchorManager.INSTANCE.clearAnchors();

        // Load the region's frontend shape point data into the editor's anchor points
        if (region.FrontendShapePointData && region.FrontendShapePointData.length > 0) {
            region.FrontendShapePointData.forEach(pointData => {
                MapRegionAnchorManager.INSTANCE.createAnchorPoint(
                    pointData.anchorPos,
                    pointData.relIncomingHandlePos,
                    pointData.relOutgoingHandlePos,
                    false, // Don't update region yet
                    true,  // Add to anchor points array
                    false  // Don't insert between closest anchors
                );
            });

            // Calculate and set the centralized point
            MapRegionAnchorManager.INSTANCE.calculateCentralizedPoint();
            
            // Update anchor interactivity now that we have a tool
            MapRegionAnchorManager.INSTANCE.updateAllAnchorInteractivity();

            // Update the region to reflect any changes
            if (this.activeEditingRegion) {
                this.activeEditingRegion.update();
            }

            //console.log('Loaded region into editor for editing:', region);
            return true;
        } else {
            console.warn('Region has no frontend shape point data to load');
            return false;
        }
    }

    /**
     * Stops editing the current region and clears the editor.
     * @returns {boolean} True if editing was successfully stopped
     */
    public stopEditingRegion() {
        if (this.activeEditingRegion) {
            // Save any changes before stopping
            // this.saveRegionFromEditor();
            
            const previousRegion = this.activeEditingRegion;

            // Clear the active editing region
            this.activeEditingRegion = null;

            // Update the previous region
            if (previousRegion)
                previousRegion.update(); // Save any changes to previous region

            // Clear the editor's anchor points
            MapRegionAnchorManager.INSTANCE.clearAnchors();
            
            // Switch back to creation UI mode
            // MapRegionEditor.INSTANCE.showCreationUI();

            //console.log('Stopped editing region');
            return true;
        }
        return false;
    }
    // #endregion

    // #region Create Region From Editor
    public createRegionFromEditorTriggered(regionType: RegionType) 
    {
        if (this.IsEditingRegion) { // disabled for now
            console.warn('Cannot start creating a new region while editing an existing region. Stop editing first.');
            return;
        }

        if (this.IsCreatingRegionFromEditor)
        {
            if (this.GetCreatingRegionType === regionType) {
                // Cancel current creation
                console.log('Cancelling current region creation of type:', regionType);
                this.editorRegionCreator!.cancelRegionCreation();
            }
            else
            {
                console.warn('Already creating a region of type:', this.GetCreatingRegionType, '. Finish or cancel it before starting a new one of type:', regionType);
            }
        }
        else
        {
            this.startCreatingRegionFromEditor(regionType);
        }
    }

    private startCreatingRegionFromEditor(regionType: RegionType)
    {
        if (this.IsCreatingRegionFromEditor) {
            console.warn('Already creating a region. Finish or cancel the current creation first.');
            return;
        }
        this.editorRegionCreator = new MapRegionCreatorEditorHandler(regionType);
        console.log('Started creating new region of type:', regionType);
    }

    /**
     * Finalizes the creation of a new region from the editor.
     * @param {MapRegionCreatorEditorHandler} mapRegionCreatorEditorHandler - The region creator handler (for security)
     */
    public finishedCreatingRegionFromEditor(mapRegionCreatorEditorHandler: MapRegionCreatorEditorHandler)
    {
        if (this.editorRegionCreator !== mapRegionCreatorEditorHandler) {
            console.error('Mismatched region creator handler. Cannot finalize creation.');
            return;
        }
        // Remove the region creator handler
        this.editorRegionCreator = null;
    }

    // #endregion

    // #region State Getters
    public get IsCreatingRegionFromEditor(): boolean { return this.editorRegionCreator !== null; }
    public get GetCreatingRegionType(): RegionType | null { return this.editorRegionCreator ? this.editorRegionCreator['regionType'] : null; }
    public get IsEditingRegion(): boolean { return this.activeEditingRegion !== null; }

    // #endregion
}

/**
 * Class for managing conversions from region to region data and etc.
 */
class MapRegionDataManager
{
    private static instance: MapRegionDataManager;
    public static get INSTANCE(): MapRegionDataManager { return MapRegionDataManager.instance; }

    public regionDatas: RegionData[]; // All region data managed by the editor

    constructor()
    {
        // Ensure singleton instance
        if (MapRegionDataManager.instance)
        {
            console.error("MapRegionDataManager instance already exists!");
        }
        MapRegionDataManager.instance = this;

        // Initialization primary fields
        this.regionDatas = [];
    }

    /**
     * Append a region's data to the regionDatas array.
     */
    public appendRegionData(regionData: RegionData)
    {
        this.regionDatas.push(regionData);
    }

    /**
     * Update region data in the regionDatas array by UUID.
     * @param UUID - UUID of the region to update
     * @param newRegionData - New region data to set
     */
    public setRegionDataWithUUID(UUID: string, newRegionData: RegionData, updateVisualRegion: boolean = true, updateEditorPanel: boolean = true): void
    {
        // Attempt to find the region data by UUID
        const index = this.regionDatas.findIndex(rd => rd.UUID === UUID);
        if (index !== -1)
        {
            // Update the region data at the found index
            this.regionDatas[index] = newRegionData;
        }
        else
        {
            // Not found, append instead
            console.log(`Region data with UUID: ${UUID} not found. Appending instead`);
            this.appendRegionData(newRegionData);
        }

        // Optionally update the visual region as well
        if (updateVisualRegion)
        {
            MapRegionRegionManager.INSTANCE.getRegionByUUID(UUID)!.update();
            if (updateEditorPanel && MapRegionRegionManager.INSTANCE.ActiveEditingRegion?.RegionData.UUID === UUID)
            {
                MapEditorUIRegionInfoManager.INSTANCE.updateRegionInfoPanel(MapRegionRegionManager.INSTANCE.ActiveEditingRegion!.RegionData);
                MapEditorUILayerManager.INSTANCE.updateMapLayersListAndIndicies();
            }
        }
    }

    public getRegionDataByUUID(UUID: string): RegionData | null
    {
        if (UUID === "") {
            console.warn("Empty UUID provided to getRegionDataByUUID");
            return null;
        }
        const regionData = this.regionDatas.find(rd => rd.UUID === UUID);
        return regionData || null;
    }

    public getAllRegionDatas(): RegionData[]
    {
        return this.regionDatas;
    }

    /**
     * Remove region data from the regionDatas array by UUID, gone forever.
     * @param UUID - UUID of the region data to remove
     */
    public removeRegionDataByUUID(UUID: string): void
    {
        const index = this.regionDatas.findIndex(rd => rd.UUID === UUID);
        if (index !== -1)
        {
            this.regionDatas.splice(index, 1);
            console.log(`Removed region data with UUID: ${UUID}`);
        }
        else
        {
            console.warn(`No region data found with UUID: ${UUID} to remove`);
        }
    }
}

/**
 * Class to handle creating regions from the map region editor.
 * Instanitated when user starts creating a new region.
 * Removed when region creation is complete or cancelled.
 */
class MapRegionCreatorEditorHandler
{
    private regionType: RegionType; // Type of region being created
    public get RegionType(): RegionType { return this.regionType; }

    private placedDataPoints: L.LatLng[]; // Points already placed by the user

    private temporaryRegionDataPoints: FrontendAnchorData; // Points defining the region shape (includes the ghost point)
    private temporaryRegion: MapRegion | null; // Temporary region being created

    private mouseGhostAnchorVisual: L.Marker | null; // Ghost anchor for visual feedback during region creation
    private placedGhostAnchorVisuals: L.Marker[]; // Ghost anchors for placed points

    private regionStyle: { [key: string]: any } = {};

    private creationComplete: boolean = false;

    constructor(regionType: RegionType)
    {
        this.regionType = regionType;

        this.placedDataPoints = [];

        this.temporaryRegionDataPoints = [];
        this.placedGhostAnchorVisuals = [];
        this.mouseGhostAnchorVisual = null;
        this.temporaryRegion = null;

        this.mouseGhostAnchorVisual = null;

        // Define default region style
        this.getRegionStylePreferences();

        // Create Mouse Anchor Visual
        this.createMouseGhostAnchor();

        // Initialize mouse click listener to add points
        this.initializeMouseListeners();

        // Initialize escape key listener to cancel creation
        this.initializeEscapeKeyListener();

        // Update the region creation button UI in the Editor
        MapEditorUI.INSTANCE.setCreateRegionButtonSelection(regionType, true);
    }

    /**
     * Get the region style preferences
     */
    private async getRegionStylePreferences()
    {
        this.regionStyle = {
            defaultVisibility: await PreferencesReference.Instance.getPreference("default_region_creation_visibility") === "Visible",
            defaultRestricted: await PreferencesReference.Instance.getPreference("default_region_creation_restriction") === "Restricted",
            defaultFillColor: await PreferencesReference.Instance.getPreference("default_region_creation_color"),
            defaultStrokeColor: await PreferencesReference.Instance.getPreference("default_region_creation_border_color"),
            defaultFillOpacity: await PreferencesReference.Instance.getPreference("default_region_creation_opacity"),
            defaultStrokeOpacity: await PreferencesReference.Instance.getPreference("default_region_creation_border_opacity")
        }
    }

    /**
     * Initialize mouse click add anchor point listener.
     */
    private initializeMouseListeners()
    {
        // Add click listener to add points to region
        InteractiveMap.mapInstance.on('click', (e: L.LeafletMouseEvent) => {
            if (this.creationComplete) return; // Ignore when creation is complete
            this.addPointToPlaced(e.latlng);
        });

        // Add mouse move listener to update position and shape
        InteractiveMap.mapInstance.on('mousemove', (e: L.LeafletMouseEvent) => {
            if (this.creationComplete) return; // Ignore when creation is complete
            if (this.mouseGhostAnchorVisual) {
                // Update ghost anchor position & in the region data points
                this.mouseGhostAnchorVisual.setLatLng(e.latlng);
                this.updateRegionShapePoints(e.latlng);

                // Update temporary region 
                this.updateRegionShapeVisual();
            }
        });
    }

    /**
     * Initialize escape key listener to cancel region creation.
     */
    private initializeEscapeKeyListener()
    {
        // Add keydown listener for escape key to cancel creation
        MapRegionEditorKeyStates.INSTANCE.escapePressedDownListeners.push(() => {
            if (this.creationComplete) return; // Ignore when creation is complete
            // Cleanup and cancel region creation
            this.cancelRegionCreation();
        });
    }

    /**
     * Create a ghost anchor point at a position
     */
    private createGhostAnchor(latlng: L.LatLng) : L.Marker
    {
        // Create ghost anchor marker
        const ghostAnchorVisual: L.Marker = L.marker(latlng, {
            icon: Visuals.ANCHOR_ICON,
            interactive: false, // Make it non-interactive
            keyboard: false,
            riseOnHover: false,
            zIndexOffset: -1000 // Place behind other markers
        }).addTo(InteractiveMap.mapInstance);
        
        // Add ghost styling based on type
        const element = ghostAnchorVisual.getElement();
        if (element) {
            element.classList.add('ghost-anchor');
            element.classList.add('ghost-creation-anchor');
        }

        return ghostAnchorVisual;
    }

    /**
     * Creates a ghost anchor that will follow the mouse cursor during region creation.
     */
    private createMouseGhostAnchor()
    {
        if (this.mouseGhostAnchorVisual)
        {
            console.warn("Mouse ghost anchor already exists!");
            return; // Already exists
        }

        // Create ghost anchor marker
        this.mouseGhostAnchorVisual = this.createGhostAnchor(L.latLng(0, 0));
    }
    
    /**
     * Removes the mouse ghost anchor from the map.
     */
    private cleanup()
    {
        // Remove mouse ghost anchor
        if (this.mouseGhostAnchorVisual)
        {
            InteractiveMap.mapInstance.removeLayer(this.mouseGhostAnchorVisual);
            this.mouseGhostAnchorVisual = null;
        }

        // Remove placed ghost anchors
        this.placedGhostAnchorVisuals.forEach(ghost => {
            InteractiveMap.mapInstance.removeLayer(ghost);
        });
        this.placedGhostAnchorVisuals = [];

        // Remove the temporary region
        if (this.temporaryRegion)
        {
            this.temporaryRegion.removeRegion();
            this.temporaryRegion = null;
        }
    }

    /**
     * When mouse clicks, adds a new point to the region being created.
     */
    private addPointToPlaced(latlng: L.LatLng)
    {
        // Add the point to placed data points
        this.placedDataPoints.push(latlng);

        // Create a ghost anchor for the placed point
        const placedGhost = this.createGhostAnchor(latlng);
        this.placedGhostAnchorVisuals.push(placedGhost);

        // Update shape points
        this.updateRegionShapePoints(latlng);

        // Check if completion is complete
        if (this.isCreationComplete()) {
            // Finalize the region creation
            this.finalizeRegionCreation();
        }
    }

    /**
     * Updates the region shape points for the temporary region based on mouse position.
     * @param mouseLatlng The current mouse position
     */
    private updateRegionShapePoints(mouseLatlng: L.LatLng)
    {
        if (this.placedDataPoints.length === 0) {
            return; // No points to update shape from
        }

        switch (this.regionType) {
            case RegionType.Rectangle:
                // Get the first point and the current mouse position to define the rectangle
                const firstPoint: L.LatLng = this.placedDataPoints[0];
                const horizontalPoint: L.LatLng = mouseLatlng;

                const rectanglePoints: L.LatLng[] = [
                    firstPoint,
                    L.latLng(firstPoint.lat, horizontalPoint.lng),
                    horizontalPoint,
                    L.latLng(horizontalPoint.lat, firstPoint.lng)
                ];

                this.temporaryRegionDataPoints = rectanglePoints.map(point => ({
                    anchorPos: point,
                    relIncomingHandlePos: null,
                    relOutgoingHandlePos: null
                }));
                break;

            case RegionType.Circle:
                // Get the center point and the current mouse position to define the circle
                const centerPoint: L.LatLng = this.placedDataPoints[0];
                const radiusPoint: L.LatLng = mouseLatlng;
                
                this.temporaryRegionDataPoints = [
                    {
                        anchorPos: centerPoint,
                        relIncomingHandlePos: null,
                        relOutgoingHandlePos: null
                    },
                    {
                        anchorPos: radiusPoint,
                        relIncomingHandlePos: null,
                        relOutgoingHandlePos: null
                    }
                ];
                break;

            case RegionType.Freeform:
                this.temporaryRegionDataPoints = this.placedDataPoints.map(point => ({
                    anchorPos: point,
                    relIncomingHandlePos: null,
                    relOutgoingHandlePos: null
                }));
                break;
            default:
                console.error(`Unknown region type: ${this.regionType}`);
                return;
        }
    }

    /**
     * Update the shape visual when mouse moves.
     */
    private updateRegionShapeVisual()
    {
        // Check if we have enough points to create a shape
        if (this.temporaryRegionDataPoints.length < 1) {
            return;
        }

        // Create new region data object
        const tempRegionData: RegionData = {
            General: {
                Name: "",
                IsVisible: true,
                IsRestricted: this.regionStyle.defaultRestricted,
            },

            Style: {
                FillColor: this.regionStyle.defaultFillColor,
                FillOpacity: this.regionStyle.defaultFillOpacity,
                StrokeColor: this.regionStyle.defaultStrokeColor,
                StrokeOpacity: this.regionStyle.defaultStrokeOpacity,
            },

            RegionType: this.regionType,
            FrontEndData: this.temporaryRegionDataPoints
        }

        // Create or update temporary region
        if (!this.temporaryRegion) {
            this.temporaryRegion = MapRegionRegionManager.INSTANCE.loadRegion(tempRegionData, false);
        } else {
            this.temporaryRegion.setFrontendAnchorPositions(this.temporaryRegionDataPoints);
            this.temporaryRegion.update();
        }
    }

    /**
     * Returns true if the region creation has finished 
     */
    public isCreationComplete(): boolean
    {
        switch (this.regionType) {
            case RegionType.Rectangle:
                return this.placedDataPoints.length >= 2;
            case RegionType.Circle:
                return this.placedDataPoints.length >= 2;
            case RegionType.Freeform:
                return this.placedDataPoints.length >= 1;
            default:
                console.error(`Unknown region type: ${this.regionType}`);
                return false;
        }
    }

    /**
     * Generate a name based on region type and current length of regions.
     */
    private generateRegionName(): string
    {
        const existingRegions = MapRegionDataManager.INSTANCE.getAllRegionDatas();
        const countOfType = existingRegions.length;
        return `${RegionType[this.regionType]} Region ${countOfType + 1}`;
    }

    /**
     * Finalizes the region creation and adds it to the region manager.
     */
    private async finalizeRegionCreation()
    {
        if (!this.isCreationComplete()) {
            console.warn("Cannot finalize region creation. Not enough points placed.");
            return;
        }

        // Mark creation as complete
        this.creationComplete = true;

        // Cleanup temporary visuals and data
        this.cleanup();

        // Create region data object for final region
        const regionData: RegionData = {
            General: {
                Name: this.generateRegionName(),
                IsVisible: this.regionStyle.defaultVisibility,
                IsRestricted: this.regionStyle.defaultRestricted,
            },

            Style: {
                FillColor: this.regionStyle.defaultFillColor,
                FillOpacity: this.regionStyle.defaultFillOpacity,
                StrokeColor: this.regionStyle.defaultStrokeColor,
                StrokeOpacity: this.regionStyle.defaultStrokeOpacity,
            },

            UUID: Utils.createUUIDv4(),
            LayerIndex: MapRegionDataManager.INSTANCE.getAllRegionDatas().length,

            RegionType: this.regionType,
            FrontEndData: this.temporaryRegionDataPoints
        }

        // Load the new region into the region manager using loadRegion
        MapRegionDataManager.INSTANCE.appendRegionData(regionData);
        MapRegionRegionManager.INSTANCE.loadRegion(regionData.UUID!);

        MapRegionRegionManager.INSTANCE.setActiveEditingRegion(
            regionData.UUID!
        );

        // Update the editor UI
        MapEditorUI.INSTANCE.setCreateRegionButtonSelection(this.regionType, false);

        // Call back to region manager to indicate creation is complete
        MapRegionRegionManager.INSTANCE.finishedCreatingRegionFromEditor(this);
    }

    /**
     * Cancel the region creation process.
     */
    public cancelRegionCreation()
    {
        console.log("Escape triggered");
        this.creationComplete = true;
        // Cleanup temporary visuals and data
        this.cleanup();
        // Update the editor UI
        MapEditorUI.INSTANCE.setCreateRegionButtonSelection(this.regionType, false);
        // Call back to region manager to indicate creation is cancelled
        MapRegionRegionManager.INSTANCE.finishedCreatingRegionFromEditor(this);
    }
}

/**
 * Class to track the state of modifier keys (Ctrl, Shift, Alt, Delete).
 */
class MapRegionEditorKeyStates
{
    private static instance: MapRegionEditorKeyStates;
    public static get INSTANCE(): MapRegionEditorKeyStates { return MapRegionEditorKeyStates.instance; }

    private ctrlPressed: boolean;
    public get isCtrlPressedDown() { return this.ctrlPressed; }
    private escapePressed: boolean;
    public get isEscapePressedDown() { return this.escapePressed; }
    private shiftPressed: boolean;
    public get isShiftPressedDown() { return this.shiftPressed; }
    private altPressed: boolean;
    public get isAltPressedDown() { return this.altPressed; }
    private deletePressed: boolean;
    public get isDeletePressedDown() { return this.deletePressed; }
    private zPressed: boolean;
    public get isZPressedDown() { return this.zPressed; }

    public ctrlPressedDownListeners: Array<() => void> = [];
    public escapePressedDownListeners: Array<() => void> = [];
    public shiftPressedDownListeners: Array<() => void> = [];
    public altPressedDownListeners: Array<() => void> = [];
    public deletePressedDownListeners: Array<() => void> = [];
    public zPressedDownListeners: Array<() => void> = [];

    constructor()
    {
        // Ensure singleton instance
        if (MapRegionEditorKeyStates.instance)
        {
            console.error("MapRegionEditorKeyStates instance already exists!");
        }
        MapRegionEditorKeyStates.instance = this;

        // Key state tracking initialization
        this.ctrlPressed = false;
        this.escapePressed = false;
        this.shiftPressed = false;
        this.altPressed = false;
        this.deletePressed = false;
        this.zPressed = false;

        // Set up keyboard event listeners
        this.initKeyboardListeners();
    }

    private initKeyboardListeners() {
        // Keydown listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control') {
                // Notify listeners on ctrl press
                for (const listener of this.ctrlPressedDownListeners) { listener(); }
                this.ctrlPressed = true;
            } else if (e.key === 'Escape') {
                for (const listener of this.escapePressedDownListeners) { listener(); }
                this.escapePressed = true;
            } else if (e.key === 'Shift') {
                for (const listener of this.shiftPressedDownListeners) { listener();}
                this.shiftPressed = true;
            } else if (e.key === 'Alt') {
                for (const listener of this.altPressedDownListeners) { listener(); }
                this.altPressed = true;
            } else if (e.key === 'Delete') {
                for (const listener of this.deletePressedDownListeners) { listener(); }
                this.deletePressed = true;
            } else if (e.key === 'z') {
                for (const listener of this.zPressedDownListeners) { listener(); }
                this.zPressed = true;
            }
        });
        // Keyup listeners
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                this.ctrlPressed = false;
            } else if (e.key === 'Escape') {
                this.escapePressed = false;
            } else if (e.key === 'Shift') {
                this.shiftPressed = false;
            } else if (e.key === 'Alt') {
                this.altPressed = false;
            } else if (e.key === 'Delete') {
                this.deletePressed = false;
            } else if (e.key === 'z') {
                this.zPressed = false;
            }
        });
    }
}

/**
 * Utility class with helper functions.
 */
class Utils 
{
    /**
     * Create UUIDv4 string
     */
    public static createUUIDv4(): string {
        // Generate a random UUIDv4 string
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}