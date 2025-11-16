/// <reference types="leaflet" />
/// <reference types="leaflet-curve" />

// Declare L.StripePattern from leaflet-stripe-pattern plugin
declare namespace L {
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

/**
 * Region types used throughout the editor.
 */
enum RegionType {
    Rectangle,
    Circle,
    Freeform
}

type RegionData = {
    UUID?: string;
    LayerIndex?: number; // 0 is top, most visible layer
    General: {
        Name: string;
        IsVisible: boolean;
        IsRestricted: boolean;
    };

    Style: {
        FillColor: string;
        FillOpacity: number;
        BorderColor: string;
        BorderOpacity: number;
    }

    RegionType: RegionType;
    FrontEndData: FrontendAnchorData;
    DerivedBackendData?: BackendAnchorData;
}

/**
 * Base class for map regions.
 */
abstract class MapRegion 
{
    public abstract readonly regionType: RegionType; 

    // Primary properties
    private shapeAreaActive: boolean;
    private selfIntercepting: boolean;

    // Region Data
    protected regionData: RegionData;
    public get RegionData() : RegionData { return this.regionData; }

    // Anchor Data anchors and shape [BACKEND USE ONLY]
    // These are the true anchor points used to create the curve.
    // Example Element: [LatLng: anchorLatLng, relIncomingHandle: relativeControlHandle1LatLng, relOutgoingHandle: relativeControlHandle2LatLng]

    private curveShape: any;
    private bezierCurveData: any[];

    private readonly invalid_shape_color: string = "#FF0000"; // RGB color for invalid shapes

    // Editable Point Data [FRONTEND USE ONLY]
    // These are the elements used for representing visual edittable points.
    // This can directly or indirectly effect the backend anchor data.
    // Example Element: [LatLng: anchorLatLng, relIncomingHandle: relativeControlHandle1LatLng, relOutgoingHandle: relativeControlHandle2LatLng]
    public get FrontendShapePointData() : FrontendAnchorData { return this.regionData.FrontEndData; }

    private lastStyleState: object; // Last applied style state

    private stripes: L.StripePattern | null; // Stripe pattern for restricted regions
    private fillPattern: any | null; // Fill pattern for the region

    constructor(regionData: RegionData)
    {
        this.regionData = regionData;

        // Initialize properties
        this.shapeAreaActive = false;
        this.selfIntercepting = false;

        this.curveShape = null;
        this.bezierCurveData = [];

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
        this.regionData.FrontEndData = newFrontendData;
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
            return;
        }

        // Calculate Parameters
        this.selfIntercepting = false;
        // If there are less than 2 anchors, do not display the shape fill.
        this.shapeAreaActive = this.regionData.DerivedBackendData!.length > 2;

        // Update the shape if it exists
        const isClosed = this.shapeAreaActive; // Close the path when shape area is active
        this.bezierCurveData = this.anchorDataToCurve(this.regionData.DerivedBackendData!, isClosed);
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
        var shapeFillOpacity = this.shapeAreaActive ? this.regionData.Style.FillOpacity : 0;
        var shapeColor = !this.selfIntercepting ? this.regionData.Style.FillColor : this.invalid_shape_color;

        // Check if the stripes need changing
        if (this.regionData.General.IsRestricted) {
            this.setStripes(this.regionData.Style.FillColor);
        }

        // Create current style state for comparison (excluding circular references)
        const currentStyleState = {
            color: shapeColor,
            weight: 2,
            opacity: 1,
            fill: this.shapeAreaActive && shapeFillOpacity > 0,
            fillColor: this.shapeAreaActive ? shapeColor : undefined,
            fillOpacity: this.shapeAreaActive ? shapeFillOpacity : 0,
            restrictedRegion: this.regionData.General.IsRestricted // Use boolean instead of the actual stripe object
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
            if (this.regionData.General.IsRestricted && this.stripes) {
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
    private setStripes(color: string | null = null)
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
            color: color ? color : this.regionData.Style.FillColor, // stripe color
            fillColor: color ? color : this.regionData.Style.FillColor,
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
        this.bezierCurveData = [];

        // Remove the shape
        if (this.curveShape) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.curveShape = null;
        }
    }

    /**
     * Hide the region from the map
     */
    public hide() {
        if (this.curveShape && this.regionData.General.IsVisible) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.regionData.General.IsVisible = false;
        }
    }

    /**
     * Show the region on the map
     */
    public show() {
        if (this.curveShape && !this.regionData.General.IsVisible) {
            this.curveShape.addTo(InteractiveMap.mapInstance);
            this.regionData.General.IsVisible = true;
        }
    }

    /**
     * Toggle region visibility
     */
    public toggleVisibility() {
        if (this.regionData.General.IsVisible) {
            this.hide();
        } else {
            this.show();
        }
        return this.regionData.General.IsVisible;
    }

    /**
     * Get current visibility state
     */
    public isRegionVisible() : boolean {
        return this.regionData.General.IsVisible;
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
    public override readonly regionType: RegionType = RegionType.Freeform;

    constructor(regionData: RegionData) { super(regionData); }

    protected override translateToBackendData() : void { // (1 to 1 conversion)
        // Copy all points to backend anchor data with correct property names
        this.regionData.DerivedBackendData = this.regionData.FrontEndData.map(point => ({
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
    public override readonly regionType: RegionType = RegionType.Rectangle;

    constructor(regionData: RegionData) { super(regionData); }

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
        this.regionData.DerivedBackendData = [
            {anchorPos: this.regionData.FrontEndData[0].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.regionData.FrontEndData[1].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.regionData.FrontEndData[2].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null},
            {anchorPos: this.regionData.FrontEndData[3].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null}
        ]
    }
}

/**
 * Circle Region (Perfect circle /w 2 control points (and centralized point))  
 */ 
class MapCircleRegion extends MapRegion
{
    public override readonly regionType: RegionType = RegionType.Circle;

    constructor(regionData: RegionData) { super(regionData); }

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
        const center = this.regionData.FrontEndData[0].anchorPos;
        const radiusPoint = this.regionData.FrontEndData[1].anchorPos;
        
        // Calculate radius in degrees for both lat and lng
        const radiusLat = Math.abs(radiusPoint.lat - center.lat);
        const radiusLng = Math.abs(radiusPoint.lng - center.lng);
        
        // Compensate for longitude compression at different latitudes
        // At the equator, 1 degree lng = 1 degree lat, but this ratio changes with latitude
        const latRadians = center.lat * Math.PI / 180;
        const cosLat = Math.cos(latRadians);
        
        // Convert longitude difference to equivalent latitude difference
        const radiusLngCorrected = radiusLng * cosLat;
        
        // Calculate the true radius using corrected longitude
        const radiusInDegrees = Math.sqrt(radiusLat * radiusLat + radiusLngCorrected * radiusLngCorrected);
        
        // Calculate longitude radius (accounts for latitude compression)
        const radiusLngDegrees = radiusInDegrees / cosLat;
        
        // Bézier control handle distance for perfect circle (magic number: 0.551915024494)
        const handleDistanceLat = radiusInDegrees * 0.551915024494;
        const handleDistanceLng = radiusLngDegrees * 0.551915024494;

        // Create 4 points around the circle (0°, 90°, 180°, 270°)
        const points: BackendAnchorData = [
            // Right point (0°)
            {
                anchorPos: L.latLng(center.lat, center.lng + radiusLngDegrees),
                relIncomingHandlePos: L.latLng(-handleDistanceLat, 0),
                relOutgoingHandlePos: L.latLng(handleDistanceLat, 0)
            },
            // Top point (90°)
            {
                anchorPos: L.latLng(center.lat + radiusInDegrees, center.lng),
                relIncomingHandlePos: L.latLng(0, handleDistanceLng),
                relOutgoingHandlePos: L.latLng(0, -handleDistanceLng)
            },
            // Left point (180°)
            {
                anchorPos: L.latLng(center.lat, center.lng - radiusLngDegrees),
                relIncomingHandlePos: L.latLng(handleDistanceLat, 0),
                relOutgoingHandlePos: L.latLng(-handleDistanceLat, 0)
            },
            // Bottom point (270°)
            {
                anchorPos: L.latLng(center.lat - radiusInDegrees, center.lng),
                relIncomingHandlePos: L.latLng(0, -handleDistanceLng),
                relOutgoingHandlePos: L.latLng(0, handleDistanceLng)
            }
        ];

        this.regionData.DerivedBackendData = points;
    }
}

// #endregion