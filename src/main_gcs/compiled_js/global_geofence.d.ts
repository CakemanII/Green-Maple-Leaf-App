export declare class GlobalGeofence {
    private static instance;
    static get INSTANCE(): GlobalGeofence;
    private readonly geofenceIframeIDs;
    private geofenceIframes;
    private loadedGeofences;
    constructor();
    private initializeAsync;
    private loadGeofences;
    /**
     * Load specific geofences by UUID (called by operational mode file selection).
     */
    loadFromUUIDs(uuids: string[]): Promise<void>;
    private broadcastGeofences;
}
