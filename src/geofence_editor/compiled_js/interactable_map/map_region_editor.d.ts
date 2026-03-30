import { MapRegionEditorTool, ToolType } from './map_region_editor_tools.js';
import { AnchorPoint } from "./anchor_point.js";
import { FrontendAnchorData, MapRegion, RegionData, RegionType } from "./region.js";
import { GeoeditFileData } from "../geofence_filing.js";
/**
 * Main class for the map region editor.
 */
export declare class MapRegionEditor {
    private static instance;
    static get INSTANCE(): MapRegionEditor;
    private activePrimaryTool;
    get ActivePrimaryTool(): MapRegionEditorTool | null;
    private activeAddAnchorTool;
    get IsAddAnchorToolActive(): boolean;
    private justFinishedDragging;
    get JustFinishedDragging(): boolean;
    constructor();
    /**
     * Called when an anchor drag starts
     */
    onAnchorDragStart(anchorPoint: AnchorPoint): void;
    /**
     * Called when an anchor is being dragged
     */
    onAnchorDrag(anchorPoint: AnchorPoint): void;
    /**
     * Called when an anchor drag operation ends
     */
    onAnchorDragEnd(anchorPoint: AnchorPoint): void;
    /**
     * Called when a control handle is being dragged
     */
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    /**
     * Called when a control handle drag ends
     */
    onHandleDragEnd(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    /**
     * Called when an anchor is clicked
     */
    onAnchorClick(anchorPoint: AnchorPoint): void;
    /**
     * Called when a control handle is clicked
     */
    onHandleClick(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    /**
     * Called when an anchor is right-clicked
     */
    onAnchorRightClick(anchorPoint: AnchorPoint, event: any): void;
    /**
     * Switches UI to creation mode - hides tools, shows create buttons
     */
    private showCreationUI;
    /**
     * Sets the active primary tool based on the provided tool given.
     */
    setActivePrimaryTool(editorToolType: ToolType): void;
    /**
     * Sets the active add anchor tool based on the provided flag.
     */
    setActiveAddAnchorTool(isActive: boolean): void;
}
/**
 * Class to manage anchor points within the map region editor.
 */
export declare class MapRegionAnchorManager {
    private static instance;
    static get INSTANCE(): MapRegionAnchorManager;
    private centralizedPoint;
    get CentralizedPoint(): AnchorPoint | null;
    private activeAnchorPoints;
    get ActiveAnchorPoints(): AnchorPoint[];
    private currentPivotAnchor;
    private currentScaleAnchor;
    private anchorStatusMap;
    private ghostVisual;
    private ghostVisualActive;
    private ghostGridLines;
    private selectedAnchors;
    get SelectedAnchors(): Set<AnchorPoint>;
    private selectedHandles;
    get SelectedHandles(): Set<[AnchorPoint, boolean]>;
    private isDragging;
    private handleGuideMapPane;
    private static readonly handleGuideMapPaneID;
    get HandleGuideMapPaneID(): any;
    private anchorMapPane;
    private static readonly anchorMapPaneID;
    get AnchorMapPaneID(): any;
    private handleMapPane;
    private static readonly handleMapPaneID;
    get HandleMapPaneID(): any;
    constructor();
    /**
     * Initialize anchor and handle panes
     */
    private initializePanes;
    /**
     * Sets an anchor as the pivot point and updates visual status.
     * @param {AnchorPoint} anchorPoint - The anchor to set as pivot.
     */
    setPivotAnchor(anchorPoint: AnchorPoint | null): void;
    /**
     * Sets an anchor as the scale point and updates visual status.
     * @param {AnchorPoint} anchorPoint - The anchor to set as scale point.
     */
    setScaleAnchor(anchorPoint: AnchorPoint): void;
    /**
     * Sets visual status on an anchor point.
     * @param {AnchorPoint} anchorPoint - The anchor to set status on.
     * @param {String} status - The status to set ('pivot', 'scale').
     */
    setAnchorStatus(anchorPoint: AnchorPoint, status: string): void;
    /**
     * Clears a specific status from an anchor point.
     * @param {AnchorPoint} anchorPoint - The anchor to clear status from.
     * @param {String} status - The status to clear ('pivot', 'scale').
     */
    clearAnchorStatus(anchorPoint: AnchorPoint, status: string): void;
    /**
     * Clears all anchor statuses and updates visuals.
     */
    clearAllAnchorStatuses(): void;
    /**
     * Updates the visual status of an anchor point based on its current statuses.
     * @param {AnchorPoint} anchorPoint - The anchor to update.
     * @param {boolean} clearAll - Whether to clear all classes before applying new ones.
     */
    updateAnchorVisualStatus(anchorPoint: AnchorPoint, clearAll?: boolean): void;
    getCurrentPivotAnchor(): AnchorPoint | null;
    getCurrentScaleAnchor(): AnchorPoint | null;
    /**
     * Shows a ghost anchor at the specified position to indicate original pivot/scale point.
     * @param {L.LatLng} position - The position to show the ghost anchor.
     * @param {String} type - The type of ghost anchor ('pivot' or 'scale').
     * @param {Array} targetAnchors - Optional array of anchor points to draw grid lines to.
     */
    showGhostAnchor(position: L.LatLng, type?: string, targetAnchors?: AnchorPoint[] | null): void;
    /**
     * Hides the ghost anchor if it's currently shown.
     */
    hideGhostAnchor(): void;
    /**
     * Updates the grid lines from ghost anchor to target anchors with their current positions.
     * @param {Array} targetAnchors - Array of anchor points to draw lines to.
     * @param {String} type - The type of ghost anchor ('pivot' or 'scale').
     */
    updateGhostGridLines(targetAnchors: AnchorPoint[], type?: string): void;
    /**
     * Checks if ghost anchor is currently active.
     * @returns {boolean} True if ghost anchor is active.
     */
    isGhostAnchorActive(): boolean;
    /**
     * Finds the two closest anchor points to a given position and returns their index and distances.
     * @param {L.LatLng} latlng - The position to find closest anchors to.
     * @returns {Object} Object containing information about the two closest anchors.
     */
    findTwoClosestAnchors(latlng: L.LatLng): {
        firstIndex: number;
        secondIndex: number;
        firstDistance: number;
        secondDistance: number;
    };
    /**
     * Finds the closest path segment to a given position in a closed path.
     * @param {L.LatLng} latlng - The position to find the closest segment to.
     * @returns {Object} Object containing the indices of the segment's start and end anchors.
     */
    findClosestSegment(latlng: L.LatLng): {
        startIndex: number;
        endIndex: number;
        distance: number;
    };
    /**
     * Calculates the distance from a point to a line segment.
     * @param {L.LatLng} point - The point.
     * @param {L.LatLng} segmentStart - Start of the line segment.
     * @param {L.LatLng} segmentEnd - End of the line segment.
     * @returns {number} Distance from point to segment.
     */
    private pointToSegmentDistance;
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
    createAnchorPoint(latlng: L.LatLng, relIncomingHandlePos: L.LatLng | null, relOutgoingHandlePos: L.LatLng | null, updateRegion?: boolean, pushToAnchorPoints?: boolean, insertBetweenClosests?: boolean): AnchorPoint;
    /**
     * Clears all anchor points from the manager and removes them from the map.
     */
    clearAnchors(): void;
    /**
     * Updates the interactivity of all anchor points based on current tool state
     */
    updateAllAnchorInteractivity(): void;
    /**
     * Calculates and sets the centralized point based on current anchor points.
     */
    calculateCentralizedPoint(): void;
    /**
     * Update anchor point positions in the active region.
     */
    updateActiveRegionAnchors(newFrontendAnchorData: FrontendAnchorData): void;
}
/**
 * Class to manage regions within the map region editor.
 */
export declare class MapRegionRegionManager {
    private static instance;
    static get INSTANCE(): MapRegionRegionManager;
    private activeEditingRegion;
    get ActiveEditingRegion(): MapRegion | null;
    private regions;
    private editorRegionCreator;
    constructor();
    /**
     * Loads different types of regions and appends them to _regions array.
     * @param {RegionData | string} regionInput - Data defining the region to load or UUID to get regiondata from DataManager
     * @param {boolean} pushToRegionsArray - Whether to add the loaded region to the regions array
     */
    loadRegion(regionInput: RegionData | string, pushToRegionsArray?: boolean): MapRegion | null;
    /**
     * Loads multiple regions from an array of region configurations.
     */
    loadGeoeditFileContents(geoeditFileData: GeoeditFileData): void;
    /**
     * Gets all loaded regions.
     * @returns {Array} Array of all loaded regions
     */
    getAllRegions(): MapRegion[];
    /**
     * Get a region by its regionData UUID.
     */
    getRegionByUUID(uuid: string): MapRegion | null;
    /**
     * Removes a region from the _regions array.
     * @param {number} index - Index of the region to remove
     * @returns {boolean} True if region was removed successfully
     */
    removeRegion(index: number): boolean;
    /**
     * Clears all regions from the _regions array.
     */
    deleteAllRegions(): void;
    updateActiveRegionFrontend(): void;
    updateAllRegions(): void;
    setActiveEditingRegion(UUID: string): void;
    /**
     * Attempts to set the active editing region by UUID, ensuring no other region is being edited.
     */
    attemptStartEditingRegion(UUID: string): void;
    toggleRegionVisibility(UUID: string): void;
    deleteRegion(UUID: string): void;
    /**
     * Loads a region into the editor for editing.
     * @param {MapRegion} region - The region to load into the editor
     * @returns {boolean} True if the region was successfully loaded for editing
     */
    loadRegionAnchorsIntoEditor(region: MapRegion): boolean;
    /**
     * Stops editing the current region and clears the editor.
     * @returns {boolean} True if editing was successfully stopped
     */
    stopEditingRegion(): boolean;
    createRegionFromEditorTriggered(regionType: RegionType): void;
    private startCreatingRegionFromEditor;
    /**
     * Finalizes the creation of a new region from the editor.
     * @param {MapRegionCreatorEditorHandler} mapRegionCreatorEditorHandler - The region creator handler (for security)
     */
    finishedCreatingRegionFromEditor(mapRegionCreatorEditorHandler: MapRegionCreatorEditorHandler): void;
    get IsCreatingRegionFromEditor(): boolean;
    get GetCreatingRegionType(): RegionType | null;
    get IsEditingRegion(): boolean;
}
/**
 * Class for managing conversions from region to region data and etc.
 */
export declare class MapRegionDataManager {
    private static instance;
    static get INSTANCE(): MapRegionDataManager;
    regionDatas: RegionData[];
    constructor();
    /**
     * Append a region's data to the regionDatas array.
     */
    appendRegionData(regionData: RegionData): void;
    /**
     * Update region data in the regionDatas array by UUID.
     * @param UUID - UUID of the region to update
     * @param newRegionData - New region data to set
     */
    setRegionDataWithUUID(UUID: string, newRegionData: RegionData, updateVisualRegion?: boolean, updateEditorPanel?: boolean): void;
    getRegionDataByUUID(UUID: string): RegionData | null;
    getAllRegionDatas(): RegionData[];
    /**
     * Remove region data from the regionDatas array by UUID, gone forever.
     * @param UUID - UUID of the region data to remove
     */
    removeRegionDataByUUID(UUID: string): void;
}
/**
 * Class to handle creating regions from the map region editor.
 * Instanitated when user starts creating a new region.
 * Removed when region creation is complete or cancelled.
 */
export declare class MapRegionCreatorEditorHandler {
    private regionType;
    get RegionType(): RegionType;
    private placedDataPoints;
    private temporaryRegionDataPoints;
    private temporaryRegion;
    private mouseGhostAnchorVisual;
    private placedGhostAnchorVisuals;
    private regionStyle;
    private creationComplete;
    constructor(regionType: RegionType);
    /**
     * Get the region style preferences
     */
    private getRegionStylePreferences;
    /**
     * Initialize mouse click add anchor point listener.
     */
    private initializeMouseListeners;
    /**
     * Initialize escape key listener to cancel region creation.
     */
    private initializeEscapeKeyListener;
    /**
     * Create a ghost anchor point at a position
     */
    private createGhostAnchor;
    /**
     * Creates a ghost anchor that will follow the mouse cursor during region creation.
     */
    private createMouseGhostAnchor;
    /**
     * Removes the mouse ghost anchor from the map.
     */
    private cleanup;
    /**
     * When mouse clicks, adds a new point to the region being created.
     */
    private addPointToPlaced;
    /**
     * Updates the region shape points for the temporary region based on mouse position.
     * @param mouseLatlng The current mouse position
     */
    private updateRegionShapePoints;
    /**
     * Update the shape visual when mouse moves.
     */
    private updateRegionShapeVisual;
    /**
     * Returns true if the region creation has finished
     */
    isCreationComplete(): boolean;
    /**
     * Generate a name based on region type and current length of regions.
     */
    private generateRegionName;
    /**
     * Finalizes the region creation and adds it to the region manager.
     */
    private finalizeRegionCreation;
    /**
     * Cancel the region creation process.
     */
    cancelRegionCreation(): void;
}
/**
 * Class to track the state of modifier keys (Ctrl, Shift, Alt, Delete).
 */
export declare class MapRegionEditorKeyStates {
    private static instance;
    static get INSTANCE(): MapRegionEditorKeyStates;
    private ctrlPressed;
    get isCtrlPressedDown(): boolean;
    private escapePressed;
    get isEscapePressedDown(): boolean;
    private shiftPressed;
    get isShiftPressedDown(): boolean;
    private altPressed;
    get isAltPressedDown(): boolean;
    private deletePressed;
    get isDeletePressedDown(): boolean;
    private zPressed;
    get isZPressedDown(): boolean;
    ctrlPressedDownListeners: Array<() => void>;
    escapePressedDownListeners: Array<() => void>;
    shiftPressedDownListeners: Array<() => void>;
    altPressedDownListeners: Array<() => void>;
    deletePressedDownListeners: Array<() => void>;
    zPressedDownListeners: Array<() => void>;
    constructor();
    private initKeyboardListeners;
}
