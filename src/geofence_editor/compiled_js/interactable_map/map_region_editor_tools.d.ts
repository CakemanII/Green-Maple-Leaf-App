import { AnchorPoint } from "./anchor_point.js";
export declare enum ToolType {
    Move = 0,
    Rotate = 1,
    Scale = 2,
    AddAnchor = 3,
    Delete = 4,
    ConvertToFreeform = 5,
    AddHandles = 6
}
export declare abstract class MapRegionEditorTool {
    abstract readonly ToolType: ToolType;
    constructor();
    /**
     * Called when an anchor point is actively being dragged.
     * @param {AnchorPoint} anchorPoint - The anchor point being dragged.
     */
    onAnchorDrag(anchorPoint: AnchorPoint): void;
    /**
     * Called when an anchor point drag operation has ended.
     * @param {AnchorPoint} anchorPoint - The anchor point where dragging has ended.
     */
    onAnchorDragEnd(anchorPoint: AnchorPoint): void;
    /**
     * Called when an anchor point is clicked.
     * @param {AnchorPoint} anchorPoint - The anchor point that was clicked.
     */
    onAnchorClick(anchorPoint: AnchorPoint): void;
    /**
     * Called when an anchor point is right-clicked.
     * @param anchorPoint - The anchor point that was right clicked.
     * @param event - DOM event
     */
    onAnchorRightClick(anchorPoint: AnchorPoint, event: any): void;
    /**
     * Called when a control handle is dragged.
     * @param {AnchorPoint} anchorPoint - The anchor point the handle belongs to.
     * @param {boolean} isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    /**
     * Called when a control handle drag operation has ended.
     * @param anchorPoint - The anchor point the handle belongs to.
     * @param isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    onHandleDragEnd(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    /**
     * Called when a control handle is clicked.
     * @param anchorPoint - The anchor point the handle belongs to.
     * @param isIncoming - True if the handle is the incoming handle, false for outgoing.
     */
    onHandleClick(anchorPoint: AnchorPoint, isIncoming: boolean): void;
}
/**
 * Map Region Editor Translate tool (Move Tool)
 */
export declare class MapRegionEditorTranslateTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    constructor();
    /**
     * Moves all anchor points based on the movement of the centralized point.
     * @param {AnchorPoint} anchorPoint - The anchor point being dragged.
     * @param {L.Marker} anchorVisual - The visual marker of the anchor point.
     */
    private moveAllPointsWithCentralizedPoint;
    onAnchorDrag(anchorPoint: AnchorPoint): void;
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean): void;
}
/**
 * Map Region Editor Rotate tool (Rotate Tool)
 */
export declare class MapRegionEditorRotateTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    private lastAnchorMoved;
    private pivotDistance;
    private originalAngle;
    private originalAnchorPositions;
    private originalPivotPosition;
    private isDragActive;
    private gridLineTargets;
    constructor();
    /**
     * Set active pivot element on the pivot/scale point visual.
     * @param {AnchorPoint} anchorPoint
     */
    private setPointActivePivot;
    onAnchorDrag(anchorPoint: AnchorPoint): void;
    onAnchorDragEnd(anchorPoint: AnchorPoint): void;
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    onAnchorRightClick(anchorPoint: AnchorPoint): void;
}
/**
 * Map Region Editor Scale tool (Scale Tool)
 */
export declare class MapRegionEditorScaleTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    private lastAnchorMoved;
    private originalAnchorPositions;
    private originalScaleAnchorPosition;
    private originalDistance;
    private anchorsToScale;
    private originalCentralizedPosition;
    constructor();
    /**
     * Scales all anchors relative to the scale point when centralized point is moved.
     * @param {AnchorPoint} anchorPoint - The centralized anchor point being dragged.
     * @param {L.Marker} anchorVisual - The visual marker of the centralized anchor point.
     */
    private scaleByCentralizedPoint;
    onAnchorDrag(anchorPoint: AnchorPoint): void;
    onAnchorDragEnd(anchorPoint: AnchorPoint): void;
    onHandleDrag(anchorPoint: AnchorPoint, isIncoming: boolean): void;
    onAnchorRightClick(anchorPoint: AnchorPoint, event: any): void;
}
/**
 * Map Region Editor Add Anchor tool (Add Anchor Tool)
 */
export declare class MapRegionEditorAddAnchorTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    private readonly anchorHandleDistance;
    private removed;
    constructor();
    /**
     * Initialize map click event for adding anchor points.
     */
    initalizeMapClickEvent(): void;
    mapClicked(clickPosition: L.LatLng): void;
    removeTool(): void;
}
/**
 * Add Handles Tool - Adds missing handles to selected anchors
 */
export declare class MapRegionEditorAddHandlesTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    execute(): void;
    removeTool(): void;
}
/**
 * Delete Region Tool - Handles region deletion with confirmation
 */
export declare class MapRegionEditorDeleteTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    private removed;
    private targetUUID;
    constructor(regionUUID: string);
    /**
     * Execute the delete operation
     */
    execute(): void;
    removeTool(): void;
}
/**
 * Convert to Freeform Tool - Converts Rectangle/Circle regions to Freeform
 */
export declare class MapRegionEditorConvertToFreeformTool extends MapRegionEditorTool {
    readonly ToolType: ToolType;
    private removed;
    private targetUUID;
    constructor(regionUUID: string);
    /**
     * Execute the conversion operation
     */
    execute(): void;
    /**
     * Performs the actual conversion after confirmation
     */
    private performConversion;
    removeTool(): void;
}
