/// <reference types="leaflet" />

// Declare L.curve method from leaflet.curve plugin
declare namespace L {
    function curve(path: any[], options?: any): any;
    
    class StripePattern extends L.Layer {
        constructor(options: any);
        addTo(map: L.Map): this;
    }
}

// Type definition for backend anchor data
type BackendAnchorData = Array<{ 
    anchorPos: L.LatLng, 
    relIncomingHandlePos: L.LatLng | null, 
    relOutgoingHandlePos: L.LatLng | null 
}>;

type FrontendAnchorData = Array<{
    anchorPos: L.LatLng, 
    relIncomingHandlePos: L.LatLng | null, 
    relOutgoingHandlePos: L.LatLng | null 
}>;

type RegionStyleParameters = {
    color?: object;
    opacity?: number;
    restricted?: boolean;
    label?: string;
};

/**
 * Base class for map regions.
 */
abstract class MapRegion 
{
    // Primary properties
    private shapeAreaActive: boolean;
    private selfIntercepting: boolean;

    // Anchor Data anchors and shape [BACKEND USE ONLY]
    // These are the true anchor points used to create the curve.
    // Example Element: [LatLng: anchorLatLng, relIncomingHandle: relativeControlHandle1LatLng, relOutgoingHandle: relativeControlHandle2LatLng]
    protected backendAnchorData: BackendAnchorData;

    private curveShape: any;
    private bezierCurveData: any[];

    // Editable Point Data [FRONTEND USE ONLY]
    // These are the elements used for representing visual edittable points.
    // This can directly or indirectly effect the backend anchor data.
    // Example Element: [LatLng: anchorLatLng, relIncomingHandle: relativeControlHandle1LatLng, relOutgoingHandle: relativeControlHandle2LatLng]
    protected frontendShapePointData: FrontendAnchorData;

    // Region Style Parameters
    private restricted: boolean; // Restricted status
    private label: string; // Region label

    private color: object; // RGB color
    private invalid_shape_color: object; // RGB color for invalid shapes
    private opacity: number; // Opacity level
    private isVisible: boolean; // Visibility status

    private lastStyleState: object; // Last applied style state

    private stripes: L.StripePattern | null; // Stripe pattern for restricted regions
    private fillPattern: any | null; // Fill pattern for the region

    constructor(frontendShapePointData: FrontendAnchorData | null)
    {
        // Initialize properties
        this.shapeAreaActive = false;
        this.selfIntercepting = false;

        this.backendAnchorData = [];
        this.curveShape = null;
        this.bezierCurveData = [];
        this.frontendShapePointData = frontendShapePointData ? frontendShapePointData : this.GET_INTIAL_FRONTEND_CONFIGURATION();

        this.restricted = false;
        this.label = "";
        this.color = { r: 0, g: 0, b: 255 }; // Default blue color
        this.invalid_shape_color = { r: 255, g: 0, b: 0 }; // Default red color
        this.opacity = 0.5;
        this.isVisible = true;

        this.lastStyleState = {};
        
        this.stripes = null;
        this.fillPattern = null;

        // Initialize the shape
        this.curveShape = L.curve([], {}).addTo(InteractiveMap.mapInstance);
    }

    // #region Translate Curve Shape Geometry
    /**
     * Translate the shape anchorData into a Cubic Bezier curve format.
     * @param {Array} backendAnchorData - Array of anchor points and data defining the shape.
     * @param {boolean} [closed=false] - Whether the path should be closed.
     * @return {Array} - Array of curve commands for Leaflet.curve
     */
    private anchorDataToCurve(backendAnchorData: BackendAnchorData, closed: boolean = false) {
        if (!backendAnchorData || backendAnchorData.length < 2) { return [] };
        const curve = [];

        // Convert relative anchor position to absolute for curve
        const firstAbsPos = backendAnchorData[0].anchorPos;
        curve.push('M', [firstAbsPos.lat, firstAbsPos.lng]);

        const lastIndex = backendAnchorData.length - 1;
        const segmentCount = closed ? backendAnchorData.length : lastIndex;

        // Build cubic curve segments
        for (let i = 0; i < segmentCount; i++) {
            const current = backendAnchorData[i];
            const next = (i === lastIndex) ? backendAnchorData[0] : backendAnchorData[i + 1];

            // Convert relative anchor positions to absolute
            const currentAbsPos = current.anchorPos;
            const nextAbsPos = next.anchorPos;

            // Calculate absolute positions for control handles (they're stored as relative offsets from anchor)
            const currentOutgoing = [
                currentAbsPos.lat + (current.relOutgoingHandlePos ? current.relOutgoingHandlePos.lat : 0),
                currentAbsPos.lng + (current.relOutgoingHandlePos ? current.relOutgoingHandlePos.lng : 0)
            ];
            const nextIncoming = [
                nextAbsPos.lat + (next.relIncomingHandlePos ? next.relIncomingHandlePos.lat : 0),
                nextAbsPos.lng + (next.relIncomingHandlePos ? next.relIncomingHandlePos.lng : 0)
            ];

            curve.push(
                'C',
                currentOutgoing,
                nextIncoming,
                [nextAbsPos.lat, nextAbsPos.lng]
            );
        }

        // If closed, add a 'Z' to close path
        if (closed) {
            curve.push('Z');
        }

        return curve;
    }
    // #endregion

    // #region Update Functions
    /**
     * Updates the region shape and style on the map.
     */
    public update()
    {
        console.log("Updating region...");

        // Recalculate backend anchor data from frontend shape point data
        this.translateToBackendData();

        // Update the shape
        this.updateShape();

        // Update the region style
        this.updateRegionStyle();
    }

    /**
     * Set region frontend anchor positions.
     */
    public setFrontendAnchorPositions(newFrontendData: FrontendAnchorData) {
        this.frontendShapePointData = newFrontendData;
    }

    /**
     * Updates the shape on the map based on current markers and parameters.
     */
    private updateShape()
    {
        // Ensure the shape exists
        if (!this.curveShape)
        {
            this.selfIntercepting = false; this.shapeAreaActive = false;
            console.warn("Curve shape does not exist. Cannot update region.");
        }

        // Calculate Parameters
        this.selfIntercepting = false;
        if (this.shapeAreaActive && this.backendAnchorData.length < 3) {
            // If there are less than 2 anchors, do not display the shape fill.
            this.shapeAreaActive = false;
        }

        // Update the shape if it exists
        const isClosed = this.shapeAreaActive; // Close the path when shape area is active
        this.bezierCurveData = this.anchorDataToCurve(this.backendAnchorData, isClosed);
        this.curveShape.setPath(this.bezierCurveData);
    }

    /**
     * Update the region style on the map based on current parameters.
     */
    private updateRegionStyle()
    {
        // Ensure the shape exists
        if (!this.curveShape) return;

        // Calculate current style parameters
        var shapeFillOpacity = this.shapeAreaActive ? this.opacity : 0;
        var shapeColor = !this.selfIntercepting ? this.color : this.invalid_shape_color;

        // Check if the stripes need changing
        if (this.restricted) {
            this.setStripes(this.color);
        }

        // Create current style state for comparison (excluding circular references)
        const currentStyleState = {
            color: shapeColor,
            weight: 2,
            opacity: 1,
            fill: this.shapeAreaActive && shapeFillOpacity > 0,
            fillColor: this.shapeAreaActive ? shapeColor : undefined,
            fillOpacity: this.shapeAreaActive ? shapeFillOpacity : 0,
            restrictedRegion: this.restricted // Use boolean instead of the actual stripe object
        };

        // Check if style has actually changed
        const styleChanged = !this.lastStyleState || 
            JSON.stringify(currentStyleState) !== JSON.stringify(this.lastStyleState);

        // Only update if style has changed
        if (styleChanged) {
            // Create the actual style options for Leaflet (including stripe pattern)
            const leafletStyleOptions: any = {
                color: shapeColor,
                weight: 2,
                opacity: 1,
                fill: this.shapeAreaActive && shapeFillOpacity > 0,
                fillColor: this.shapeAreaActive ? shapeColor : undefined,
                fillOpacity: this.shapeAreaActive ? shapeFillOpacity : 0
            };

            // Add stripe pattern if this is a restricted region
            if (this.restricted && this.stripes) {
                leafletStyleOptions.fillPattern = this.stripes;
            }

            // Remove the old curve and create a new one with updated style
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.curveShape = L.curve(this.bezierCurveData, leafletStyleOptions).addTo(InteractiveMap.mapInstance);
            
            // Store the current style state for future comparisons
            this.lastStyleState = { ...currentStyleState }; // "..." is to avoid pointer issues.
        }
    }

    /**
     * Configure stripes for black regions.
     * @param {string} color - The color of the stripes, if null it will use the region color.
     */
    private setStripes(color: object | null = null)
    { 
        // Remove existing stripes if they exist
        if (this.stripes) {
            // Note: Stripe pattern removal may need to be handled differently depending on the plugin
            InteractiveMap.mapInstance.removeLayer(this.stripes);
            this.stripes = null;
        }

        this.stripes = new L.StripePattern({
            weight: 5, // stripe width
            spaceWeight: 12, // space between stripes
            color: color ? color : this.color, // stripe color
            fillColor: color ? color : this.color,
            opacity: 1,
            angle: 45 // stripe angle in degrees
        });
        this.stripes.addTo(InteractiveMap.mapInstance);
    }
    // #endregion

    /**
     * Remove the shape from the region entirely.
     */
    public removeRegion() 
    {
        // Remove all shape data
        this.backendAnchorData = [];
        this.frontendShapePointData = [];
        this.bezierCurveData = [];

        // Remove the shape
        if (this.curveShape) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.curveShape = null;
        }
    }

    /**
     * Update region style parameters and refresh the region shape if it exists.
     * @param {Object} params - An object containing style parameters to update.
     *                          Supported keys: color (string), opacity (number).
     */
    public updateStyleParameters(params: RegionStyleParameters = {}) 
    {
        // Update color parameter
        if (params.color !== undefined) {
            if (typeof params.color !== 'string') {
                console.warn("Invalid color parameter [Not changing]:", params.color);
            }
            else {
                this.color = params.color;
            }
        }
        // Update opacity parameter
        if (params.opacity !== undefined) {
            if (typeof params.opacity !== 'number' || params.opacity < 0 || params.opacity > 1) {
                console.warn("Invalid opacity parameter (must be 0 to 1) [Not changing]:", params.opacity);
            } else {
                this.opacity = params.opacity;
            }
        }
        // Update whiteRegion parameter
        if (params.restricted !== undefined) {
            if (typeof params.restricted !== 'boolean') {
                console.warn("Invalid restrictedRegion parameter (must be boolean) [Not changing]:", params.restricted);
            } else {
                this.restricted = params.restricted;
            }
        }
        // Update regionLabel parameter
        if (params.label !== undefined) {
            if (typeof params.label !== 'string') {   
                console.warn("Invalid regionLabel parameter (must be string) [Not changing]:", params.label);
            } else {
                this.label = params.label;
            }
        }

        // Update the region style
        this.update();
    }

    /**
     * Hide the region from the map
     */
    public hide() {
        if (this.curveShape && this.isVisible) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.isVisible = false;
        }
    }

    /**
     * Show the region on the map
     */
    public show() {
        if (this.curveShape && !this.isVisible) {
            this.curveShape.addTo(InteractiveMap.mapInstance);
            this.isVisible = true;
        }
    }

    /**
     * Toggle region visibility
     */
    public toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
        return this.isVisible;
    }

    /**
     * Get current visibility state
     */
    public isRegionVisible() : boolean {
        return this.isVisible;
    }

    // #region Override Functions (That must be overrided by child class)
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected abstract translateToBackendData() : void;

    protected abstract GET_INTIAL_FRONTEND_CONFIGURATION() : FrontendAnchorData;

    // #endregion
}

// Specific Map Region Types
/**
 * Freeform Region (Any number of points)
 */
class MapFreeformRegion extends MapRegion
{
    constructor(frontendShapePointData: FrontendAnchorData | null) { super(frontendShapePointData); }

    protected override translateToBackendData() : void {
        // Copy all points to backend anchor data with correct property names
        this.backendAnchorData = this.frontendShapePointData.map(point => ({
            anchorPos: point.anchorPos,
            relIncomingHandlePos: point.relIncomingHandlePos,
            relOutgoingHandlePos: point.relOutgoingHandlePos
        }));
    }

    protected override GET_INTIAL_FRONTEND_CONFIGURATION(): FrontendAnchorData {
        return [];
    }
}

/**
 * Rectangle Region (4 control points)
 */
class MapRectangleRegion extends MapRegion
{  
    constructor(frontendShapePointData: FrontendAnchorData | null) { super(frontendShapePointData); }

    // (0, 0) is center
    protected override GET_INTIAL_FRONTEND_CONFIGURATION() : FrontendAnchorData { 
        return [
            {anchorPos: L.latLng(1, -2), relIncomingHandlePos: null, relOutgoingHandlePos: null}, // Top left
            {anchorPos: L.latLng(1, 2), relIncomingHandlePos: null, relOutgoingHandlePos: null}, // Top right
            {anchorPos: L.latLng(-1, 2), relIncomingHandlePos: null, relOutgoingHandlePos: null}, // Bottom right
            {anchorPos: L.latLng(-1, -2), relIncomingHandlePos: null, relOutgoingHandlePos: null} // Bottom left
        ];
    }

    /** 
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected override translateToBackendData() : void
    {
        this.backendAnchorData = [
            {anchorPos: this.frontendShapePointData[0].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.frontendShapePointData[1].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.frontendShapePointData[2].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.frontendShapePointData[3].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null}
        ]
    }
}

/**
 * Circle Region (Perfect circle /w 2 control points (and centralized point))  
 */ 
class MapCircleRegion extends MapRegion
{
    constructor(frontendShapePointData: FrontendAnchorData | null) { super(frontendShapePointData); }

    protected override GET_INTIAL_FRONTEND_CONFIGURATION() : FrontendAnchorData 
    { 
        return [
            {anchorPos: L.latLng(0, 0), relIncomingHandlePos: null, relOutgoingHandlePos: null}, // Center Point
            {anchorPos: L.latLng(0, 1), relIncomingHandlePos: null, relOutgoingHandlePos: null} // Radius Point
        ];
    }

    /** 
     * Calculate and override backend anchor data from frontend shape point data.
     */
    protected override translateToBackendData() : void
    {
        // Get the center point and radius point
        const center = this.frontendShapePointData[0].anchorPos;
        const radiusPoint = this.frontendShapePointData[1].anchorPos;
        
        // Calculate the radius from the center to the radius point
        const RADIUS = center.distanceTo(radiusPoint);
        
        // Convert radius from meters to degrees (approximate)
        const radiusInDegrees = RADIUS / 111320; // 1 degree ≈ 111,320 meters at equator
        
        // Bézier control handle distance for perfect circle (magic number: 0.551915024494)
        const handleDistance = radiusInDegrees * 0.551915024494;

        // Create 4 points around the circle (0°, 90°, 180°, 270°)
        const points: BackendAnchorData = [
            // Right point (0°)
            {
                anchorPos: L.latLng(center.lat, center.lng + radiusInDegrees),
                relIncomingHandlePos: L.latLng(-handleDistance, 0),
                relOutgoingHandlePos: L.latLng(handleDistance, 0)
            },
            // Top point (90°)
            {
                anchorPos: L.latLng(center.lat + radiusInDegrees, center.lng),
                relIncomingHandlePos: L.latLng(0, handleDistance),
                relOutgoingHandlePos: L.latLng(0, -handleDistance)
            },
            // Left point (180°)
            {
                anchorPos: L.latLng(center.lat, center.lng - radiusInDegrees),
                relIncomingHandlePos: L.latLng(handleDistance, 0),
                relOutgoingHandlePos: L.latLng(-handleDistance, 0)
            },
            // Bottom point (270°)
            {
                anchorPos: L.latLng(center.lat - radiusInDegrees, center.lng),
                relIncomingHandlePos: L.latLng(0, -handleDistance),
                relOutgoingHandlePos: L.latLng(0, handleDistance)
            }
        ];

        this.backendAnchorData = points;
    }
}

// #endregion