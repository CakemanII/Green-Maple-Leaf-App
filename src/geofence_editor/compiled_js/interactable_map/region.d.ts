type BackendAnchorData = Array<{
    anchorPos: L.LatLng;
    relIncomingHandlePos: L.LatLng | null;
    relOutgoingHandlePos: L.LatLng | null;
}>;
export type FrontendAnchorData = Array<{
    anchorPos: L.LatLng;
    relIncomingHandlePos: L.LatLng | null;
    relOutgoingHandlePos: L.LatLng | null;
}>;
/**
 * Region types used throughout the editor.
 */
export declare enum RegionType {
    Rectangle = 0,
    Circle = 1,
    Freeform = 2
}
export type RegionData = {
    UUID?: string;
    LayerIndex?: number;
    General: {
        Name: string;
        IsVisible: boolean;
        IsRestricted: boolean;
    };
    Style: {
        FillColor: string;
        FillOpacity: number;
        StrokeColor: string;
        StrokeOpacity: number;
    };
    RegionType: RegionType;
    FrontEndData: FrontendAnchorData;
    DerivedBackendData?: BackendAnchorData;
};
/**
 * Base class for map regions.
 */
export declare abstract class MapRegion {
    abstract readonly regionType: RegionType;
    private shapeAreaActive;
    private selfIntercepting;
    private updateFromUUID;
    private setUUID;
    get GetSetUUID(): string;
    protected regionData: RegionData;
    get RegionData(): RegionData;
    private curvePane;
    private curvePaneID;
    private curveShape;
    private bezierCurveData;
    private readonly invalid_shape_color;
    private readonly hidden_shape_opacity;
    private readonly hidden_shape_color;
    private readonly originalBorderThickness;
    private readonly hoverBorderThickness;
    get FrontendShapePointData(): FrontendAnchorData;
    get BackendAnchorData(): BackendAnchorData;
    private lastStyleState;
    private stripes;
    private fillPattern;
    private borderThickness;
    constructor(regionInput: RegionData | string);
    /**
     * Translate the shape anchorData into a Cubic Bezier curve format.
     * @param {Array} backendAnchorData - Array of anchor points and data defining the shape.
     * @param {boolean} [closed=false] - Whether the path should be closed.
     * @return {Array} - Array of curve commands for Leaflet.curve
     */
    private anchorDataToCurve;
    /**
     * Updates the region shape and style on the map.
     */
    update(): void;
    /**
     * Set region frontend anchor positions.
     */
    setFrontendAnchorPositions(newFrontendData: FrontendAnchorData): void;
    /**
     * Attempts to update region data from data manager.
     */
    attemptGetLatestRegionData(): void;
    /**
     * Update map pane.
     */
    private updateMapPane;
    /**
     * Updates the shape on the map based on current markers and parameters.
     */
    private updateShape;
    /**
     * Update the region style on the map based on current parameters.
     */
    private updateRegionStyle;
    /**
     * Configure stripes for black regions.
     * @param {string} color - The color of the stripes, if null it will use the region color.
     */
    private setStripes;
    /**
     * Remove the shape from the region entirely.
     */
    /**
     * Highlights the region to make it more prominent.
     */
    highlightRegion(): void;
    /**
     * Removes the highlight from the region.
     */
    unhighlightRegion(): void;
    removeRegion(): void;
    /**
     * Hide the region from the map
     */
    hide(): void;
    /**
     * Show the region on the map
     */
    show(): void;
    /**
     * Toggle region visibility
     */
    toggleVisibility(): boolean;
    /**
     * Get current visibility state
     */
    isRegionVisible(): boolean;
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected abstract translateToBackendData(): void;
    protected abstract GET_INTIAL_FRONTEND_CONFIGURATION(): FrontendAnchorData;
}
/**
 * Freeform Region (Any number of points)
 */
export declare class MapFreeformRegion extends MapRegion {
    readonly regionType: RegionType;
    constructor(regionInput: RegionData | string);
    protected translateToBackendData(): void;
    protected GET_INTIAL_FRONTEND_CONFIGURATION(): FrontendAnchorData;
}
/**
 * Rectangle Region (4 control points)
 */
export declare class MapRectangleRegion extends MapRegion {
    readonly regionType: RegionType;
    constructor(regionInput: RegionData | string);
    protected GET_INTIAL_FRONTEND_CONFIGURATION(): FrontendAnchorData;
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected translateToBackendData(): void;
}
/**
 * Circle Region (Perfect circle /w 2 control points (and centralized point))
 */
export declare class MapCircleRegion extends MapRegion {
    readonly regionType: RegionType;
    constructor(regionInput: RegionData | string);
    protected GET_INTIAL_FRONTEND_CONFIGURATION(): FrontendAnchorData;
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected translateToBackendData(): void;
}
export {};
