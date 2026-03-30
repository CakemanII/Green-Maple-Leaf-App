/// <reference types="leaflet" />
export const MAP_LAYER_INDICES = {
    MAPBASE: 200,
    REGIONS: [201, 1999],
    REGION_HANDLE_GUIDES: 2000,
    REGION_ANCHORS: 2001,
    REGION_HANDLES: 2002,
};
export class InteractiveMap {
    constructor() {
        this.HOME_LATITUDE = 0;
        this.HOME_LONGITUDE = 0;
        this.INITIAL_ZOOM = 2;
        // Ensure map instance does not already exist.
        if (InteractiveMap.mapInstance) {
            console.error("Map instance already exists!");
            return;
        }
        // Initialize the map instance
        InteractiveMap.mapInstance = L.map('map', {
            boxZoom: false // Disable box zoom selection
        }).setView([this.HOME_LATITUDE, this.HOME_LONGITUDE], this.INITIAL_ZOOM);
        // Initialize the tile layer (using OpenStreetMap tiles as an example)
        const onlineLayer = L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=VGcaNwB5jAZdEZGWt0jT', {
            maxZoom: 18,
            minZoom: 3,
            attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
        });
        // Add the tile layer to the map
        onlineLayer.addTo(InteractiveMap.mapInstance);
    }
}
// Make class available globally for browser
window.InteractiveMap = InteractiveMap;
new InteractiveMap();
//# sourceMappingURL=map.js.map