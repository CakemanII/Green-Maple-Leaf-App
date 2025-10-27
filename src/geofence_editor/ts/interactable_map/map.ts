/// <reference types="leaflet" />
import * as L from 'leaflet';

export class Map
{
    public static mapInstance: L.Map;
    private readonly HOME_LATITUDE: number = 0;
    private readonly HOME_LONGITUDE: number = 0;
    private readonly INITIAL_ZOOM: number = 2;

    constructor()
    {
        // Ensure map instance does not already exist.
        if (Map.mapInstance !== null)
        {
            console.error("Map instance already exists!");
            return;
        }

        // Initialize the map instance
        Map.mapInstance = L.map('map', {
            boxZoom: false  // Disable box zoom selection
        }).setView([this.HOME_LATITUDE, this.HOME_LONGITUDE], this.INITIAL_ZOOM);

        // ...

        // Initialize the tile layer (using OpenStreetMap tiles as an example)
        const onlineLayer: L.TileLayer = L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=VGcaNwB5jAZdEZGWt0jT', {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
        });

        // Add the tile layer to the map
        onlineLayer.addTo(Map.mapInstance);
    }
}