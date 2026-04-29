export declare class GlobalStatusesManager {
    private static instance;
    static get INSTANCE(): GlobalStatusesManager;
    private readonly statusIframesIDs;
    private telemetryIframes;
    private statuses;
    private statusEvaluators;
    constructor();
    private initializeAsync;
    /**
     * Load all statuses from all saved status collections on the server.
     */
    private loadStatuses;
    /**
     * Reload statuses from a specific set of collection UUIDs (called by operational mode).
     */
    loadFromCollections(collectionUUIDs: string[]): Promise<void>;
    /**
     * Retreive the active flag uuid for a specific status.
     */
    getStatusActiveFlag(statusUUID: string): string | null;
    /**
     * Update all statuses based on updated telemetry/status data.
     */
    private updateAllStatuses;
    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    updatedTelemetryData(telemetry_data: string): void;
    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    updatedStatusData(status_data: string): void;
    /**
     * Send status update to iframes.
     */
    private sendStatusUpdateToIframes;
    /**
     * Setup 2-way communication with iframes.
     */
    private initializeIFrameCommunication;
}
