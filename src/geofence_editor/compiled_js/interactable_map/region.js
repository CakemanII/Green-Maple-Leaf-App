/// <reference types="leaflet" />
/// <reference types="leaflet-curve" />
import { InteractiveMap, MAP_LAYER_INDICES } from './map.js';
import { MapRegionDataManager, MapRegionRegionManager } from './map_region_editor.js';
import { MapRegionHightlightingHandler } from '../editor_ui/editor_ui.js';
/**
 * Region types used throughout the editor.
 */
export var RegionType;
(function (RegionType) {
    RegionType[RegionType["Rectangle"] = 0] = "Rectangle";
    RegionType[RegionType["Circle"] = 1] = "Circle";
    RegionType[RegionType["Freeform"] = 2] = "Freeform";
})(RegionType || (RegionType = {}));
/**
 * Base class for map regions.
 */
export class MapRegion {
    get GetSetUUID() { return this.setUUID; }
    // This reference bellow is NOT a direct reference to regionData and is NOT LINKED, this cannot be modified.
    get RegionData() { return JSON.parse(JSON.stringify(this.regionData)); }
    // Editable Point Data [FRONTEND USE ONLY]
    // These are the elements used for representing visual edittable points.
    // This can directly or indirectly effect the backend anchor data.
    // Example Element: [LatLng: anchorLatLng, relIncomingHandle: relativeControlHandle1LatLng, relOutgoingHandle: relativeControlHandle2LatLng]
    get FrontendShapePointData() { return this.regionData.FrontEndData; }
    get BackendAnchorData() { return this.regionData.DerivedBackendData; }
    constructor(regionInput) {
        this.invalid_shape_color = "#FF0000"; // RGB color for invalid shapes
        this.hidden_shape_opacity = 0.2; // Opacity for hidden shapes
        this.hidden_shape_color = "#888888"; // Color for hidden shapes
        this.originalBorderThickness = 2; // Original border thickness
        this.hoverBorderThickness = 7; // Border thickness on hover
        this.setUUID = ""; // No UUID set
        this.regionData = {}; // Temporary initialization placeholder for compiler
        this.updateFromUUID = typeof regionInput === 'string';
        if (this.updateFromUUID) {
            this.setUUID = regionInput;
            this.attemptGetLatestRegionData();
        }
        else {
            this.regionData = regionInput;
        }
        // Initialize properties
        this.shapeAreaActive = false;
        this.selfIntercepting = false;
        this.curvePane = null;
        this.curvePaneID = null;
        this.curveShape = null;
        this.bezierCurveData = [];
        this.lastStyleState = {};
        this.borderThickness = this.originalBorderThickness;
        this.stripes = null;
        this.fillPattern = null;
        // Initialize the pane
        const randomString = (Math.random().toString(36).substring(2, 15))
            + (Math.random().toString(36).substring(2, 15)); // DUCKTAPE FIX
        if (this.GetSetUUID !== "") {
            this.curvePaneID = `region-pane-${this.GetSetUUID}+${randomString}`;
        }
        else {
            this.curvePaneID = `region-pane-temp+${randomString}`;
        }
        this.curvePane = InteractiveMap.mapInstance.createPane(this.curvePaneID);
        console.log(`Created pane with ID: ${this.curvePaneID}`);
        // Initialize the shape
        this.curveShape = L.curve([], {}).addTo(InteractiveMap.mapInstance);
        // Initial update
        this.update();
    }
    // #region Translate Curve Shape Geometry
    /**
     * Translate the shape anchorData into a Cubic Bezier curve format.
     * @param {Array} backendAnchorData - Array of anchor points and data defining the shape.
     * @param {boolean} [closed=false] - Whether the path should be closed.
     * @return {Array} - Array of curve commands for Leaflet.curve
     */
    anchorDataToCurve(backendAnchorData, closed = false) {
        if (!backendAnchorData || backendAnchorData.length < 2) {
            return [];
        }
        ;
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
            curve.push('C', currentOutgoing, nextIncoming, [nextAbsPos.lat, nextAbsPos.lng]);
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
    update() {
        // Get latest region data if updating from UUID
        if (this.updateFromUUID)
            this.attemptGetLatestRegionData();
        // Recalculate backend anchor data from frontend shape point data
        this.translateToBackendData();
        // Update the map pane
        this.updateMapPane();
        // Update the shape
        this.updateShape();
        // Update the region style
        this.updateRegionStyle();
    }
    /**
     * Set region frontend anchor positions.
     */
    setFrontendAnchorPositions(newFrontendData) {
        this.regionData.FrontEndData = newFrontendData;
    }
    /**
     * Attempts to update region data from data manager.
     */
    attemptGetLatestRegionData() {
        if (this.updateFromUUID) {
            const latestData = MapRegionDataManager.INSTANCE.getRegionDataByUUID(this.setUUID);
            if (latestData) {
                this.regionData = latestData;
            }
            else {
                console.warn(`Region data with UUID ${this.setUUID} not found. Cannot update region data.`);
            }
        }
        else {
            console.warn("updateRegionData called but updateFromUUID is false. No action taken.");
        }
    }
    /**
     * Update map pane.
     */
    updateMapPane() {
        if (!this.curvePane) {
            console.warn("Curve pane does not exist. Cannot update map pane.");
        }
        // Get proper z-index from layer index
        const regionLayerRange = MAP_LAYER_INDICES.REGIONS;
        let zIndex = 0;
        if (this.regionData.LayerIndex === undefined) {
            zIndex = regionLayerRange[1]; // Default to base region layer
        }
        else {
            const layerIndex = this.regionData.LayerIndex;
            zIndex = regionLayerRange[0] + layerIndex;
            if (zIndex > regionLayerRange[1]) {
                zIndex = regionLayerRange[1]; // Cap to max region layer
                console.warn(`Region layer index ${layerIndex} exceeds maximum. Capped to ${regionLayerRange[1]}. TOO MANY REGIONS!`);
            }
        }
        // Update the pane z-index
        this.curvePane.style.zIndex = zIndex;
    }
    /**
     * Updates the shape on the map based on current markers and parameters.
     */
    updateShape() {
        // Ensure the shape exists
        if (!this.curveShape) {
            this.selfIntercepting = false;
            this.shapeAreaActive = false;
            console.warn("Curve shape does not exist. Cannot update region.");
            return;
        }
        // Calculate Parameters
        this.selfIntercepting = false;
        // If there are less than 2 anchors, do not display the shape fill.
        this.shapeAreaActive = this.regionData.DerivedBackendData.length > 2;
        // Update the shape if it exists
        const isClosed = this.shapeAreaActive; // Close the path when shape area is active
        this.bezierCurveData = this.anchorDataToCurve(this.regionData.DerivedBackendData, isClosed);
        this.curveShape.setPath(this.bezierCurveData);
    }
    /**
     * Update the region style on the map based on current parameters.
     */
    updateRegionStyle() {
        // Ensure the shape exists
        if (!this.curveShape)
            return;
        // Calculate current style parameters based on visibilityz; ShapeFillOpacity, FillColor, ShapeColor
        let shapeFillOpacity;
        let strokeColor;
        let fillColor;
        if (!this.regionData.General.IsVisible) {
            // Use hidden shape styling
            shapeFillOpacity = this.shapeAreaActive ? this.hidden_shape_opacity : 0;
            strokeColor = this.hidden_shape_color;
            fillColor = this.hidden_shape_color;
        }
        else {
            // Use normal styling
            shapeFillOpacity = this.shapeAreaActive ? this.regionData.Style.FillOpacity : 0;
            strokeColor = !this.selfIntercepting ? this.regionData.Style.StrokeColor : this.invalid_shape_color;
            fillColor = this.regionData.Style.FillColor;
        }
        // Check if the stripes need changing (for both visible and hidden restricted regions)
        if (this.regionData.General.IsRestricted) {
            // Use hidden color for stripes if region is not visible
            const stripeColor = this.regionData.General.IsVisible
                ? this.regionData.Style.FillColor
                : this.hidden_shape_color;
            this.setStripes(stripeColor);
        }
        // Create current style state for comparison (excluding circular references)
        const currentStyleState = {
            color: strokeColor,
            weight: this.borderThickness,
            opacity: this.regionData.General.IsVisible ? 1 : this.hidden_shape_opacity,
            fill: this.shapeAreaActive && shapeFillOpacity > 0,
            fillColor: this.shapeAreaActive ? fillColor : undefined,
            fillOpacity: this.shapeAreaActive ? shapeFillOpacity : 0,
            restrictedRegion: this.regionData.General.IsRestricted,
            isVisible: this.regionData.General.IsVisible
        };
        // Check if style has actually changed
        const styleChanged = !this.lastStyleState ||
            JSON.stringify(currentStyleState) !== JSON.stringify(this.lastStyleState);
        // Only update if style has changed
        if (styleChanged) {
            // Create the actual style options for Leaflet (including stripe pattern)
            const leafletStyleOptions = {
                color: strokeColor,
                weight: this.borderThickness,
                opacity: this.regionData.General.IsVisible ? 1 : this.hidden_shape_opacity,
                fill: this.shapeAreaActive && shapeFillOpacity > 0,
                fillColor: this.shapeAreaActive ? fillColor : undefined,
                fillOpacity: this.shapeAreaActive ? shapeFillOpacity : 0,
                pane: this.curvePaneID,
            };
            // Add stripe pattern if this is a restricted region (both visible and hidden)
            if (this.regionData.General.IsRestricted && this.stripes) {
                leafletStyleOptions.fillPattern = this.stripes;
            }
            // Remove the old curve and create a new one with updated style
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.curveShape = L.curve(this.bezierCurveData, leafletStyleOptions);
            // Only add to map if region is visible
            if (this.regionData.General.IsVisible) {
                this.curveShape.addTo(InteractiveMap.mapInstance);
            }
            // Store the current style state for future comparisons
            this.lastStyleState = Object.assign({}, currentStyleState); // "..." is to avoid pointer issues.
        }
        // Remove or add the shape based on visibility
        if (this.regionData.General.IsVisible === false && MapRegionRegionManager.INSTANCE.ActiveEditingRegion !== this) {
            // Hide the shape if region is not visible
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
        }
        else {
            // Show the shape if it is not already on the map
            if (!InteractiveMap.mapInstance.hasLayer(this.curveShape)) {
                this.curveShape.addTo(InteractiveMap.mapInstance);
            }
        }
    }
    /**
     * Configure stripes for black regions.
     * @param {string} color - The color of the stripes, if null it will use the region color.
     */
    setStripes(color = null) {
        // Remove existing stripes if they exist
        if (this.stripes) {
            // Note: Stripe pattern removal may need to be handled differently depending on the plugin
            InteractiveMap.mapInstance.removeLayer(this.stripes);
            this.stripes = null;
        }
        // @ts-ignore
        this.stripes = new L.StripePattern({
            weight: 5, // stripe width
            spaceWeight: 12, // space between stripes
            color: color ? color : this.regionData.Style.StrokeColor, // stripe color
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
    /**
     * Highlights the region to make it more prominent.
     */
    highlightRegion() {
        if (this.curveShape) {
            // Bring to front
            this.curveShape.bringToFront();
            // Increase border thickness and add glow effect
            this.borderThickness = this.hoverBorderThickness;
            this.updateRegionStyle();
        }
        // Also bring patterns to front if they exist
        if (this.fillPattern && this.fillPattern.bringToFront) {
            this.fillPattern.bringToFront();
        }
    }
    /**
     * Removes the highlight from the region.
     */
    unhighlightRegion() {
        // Restore to original style by calling update
        this.borderThickness = this.originalBorderThickness;
        this.updateRegionStyle();
    }
    removeRegion() {
        // Remove all shape data
        this.bezierCurveData = [];
        // Remove the shape
        if (this.curveShape) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.curveShape = null;
        }
        // Remove stripes if they exist
        if (this.stripes) {
            InteractiveMap.mapInstance.removeLayer(this.stripes);
            this.stripes = null;
        }
        // Remove fill pattern if it exists
        if (this.fillPattern) {
            InteractiveMap.mapInstance.removeLayer(this.fillPattern);
            this.fillPattern = null;
        }
        // Remove the pane
        if (this.curvePane) {
            this.curvePane.remove();
            const panes = InteractiveMap.mapInstance._panes;
            if (panes && panes[this.curvePaneID]) {
                delete panes[this.curvePaneID];
            }
            this.curvePane = null;
        }
    }
    /**
     * Hide the region from the map
     */
    hide() {
        if (this.curveShape && this.regionData.General.IsVisible) {
            InteractiveMap.mapInstance.removeLayer(this.curveShape);
            this.regionData.General.IsVisible = false;
            // Clear highlight sequence if this region was being highlighted as long as it is the one being highlighted
            if (MapRegionHightlightingHandler.INSTANCE.TargetHighlightUUID === this.regionData.UUID) {
                MapRegionHightlightingHandler.INSTANCE.clearHighlightSequence();
            }
        }
    }
    /**
     * Show the region on the map
     */
    show() {
        if (this.curveShape && !this.regionData.General.IsVisible) {
            this.curveShape.addTo(InteractiveMap.mapInstance);
            this.regionData.General.IsVisible = true;
        }
    }
    /**
     * Toggle region visibility
     */
    toggleVisibility() {
        if (this.regionData.General.IsVisible) {
            this.hide();
        }
        else {
            this.show();
        }
        return this.regionData.General.IsVisible;
    }
    /**
     * Get current visibility state
     */
    isRegionVisible() {
        return this.regionData.General.IsVisible;
    }
}
// Specific Map Region Types
/**
 * Freeform Region (Any number of points)
 */
export class MapFreeformRegion extends MapRegion {
    constructor(regionInput) {
        super(regionInput);
        this.regionType = RegionType.Freeform;
    }
    translateToBackendData() {
        // Copy all points to backend anchor data with correct property names
        this.regionData.DerivedBackendData = this.regionData.FrontEndData.map(point => ({
            anchorPos: point.anchorPos,
            relIncomingHandlePos: point.relIncomingHandlePos,
            relOutgoingHandlePos: point.relOutgoingHandlePos
        }));
    }
    GET_INTIAL_FRONTEND_CONFIGURATION() {
        return [];
    }
}
/**
 * Rectangle Region (4 control points)
 */
export class MapRectangleRegion extends MapRegion {
    constructor(regionInput) {
        super(regionInput);
        this.regionType = RegionType.Rectangle;
    }
    // (0, 0) is center
    GET_INTIAL_FRONTEND_CONFIGURATION() {
        return [
            { anchorPos: L.latLng(1, -2), relIncomingHandlePos: null, relOutgoingHandlePos: null }, // Top left
            { anchorPos: L.latLng(1, 2), relIncomingHandlePos: null, relOutgoingHandlePos: null }, // Top right
            { anchorPos: L.latLng(-1, 2), relIncomingHandlePos: null, relOutgoingHandlePos: null }, // Bottom right
            { anchorPos: L.latLng(-1, -2), relIncomingHandlePos: null, relOutgoingHandlePos: null } // Bottom left
        ];
    }
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    translateToBackendData() {
        this.regionData.DerivedBackendData = [
            { anchorPos: this.regionData.FrontEndData[0].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null },
            { anchorPos: this.regionData.FrontEndData[1].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null },
            { anchorPos: this.regionData.FrontEndData[2].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null },
            { anchorPos: this.regionData.FrontEndData[3].anchorPos, relIncomingHandlePos: null, relOutgoingHandlePos: null }
        ];
    }
}
/**
 * Circle Region (Perfect circle /w 2 control points (and centralized point))
 */
export class MapCircleRegion extends MapRegion {
    constructor(regionInput) {
        super(regionInput);
        this.regionType = RegionType.Circle;
    }
    GET_INTIAL_FRONTEND_CONFIGURATION() {
        return [
            { anchorPos: L.latLng(0, 0), relIncomingHandlePos: null, relOutgoingHandlePos: null }, // Center Point
            { anchorPos: L.latLng(0, 1), relIncomingHandlePos: null, relOutgoingHandlePos: null } // Radius Point
        ];
    }
    /**
     * Calculate and override backend anchor data from frontend shape point data.
     */
    translateToBackendData() {
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
        const points = [
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
//# sourceMappingURL=region.js.map