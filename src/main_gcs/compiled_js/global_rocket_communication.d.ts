/**
 * Manages telemetry communication within the application.
 */
export declare class GlobalTelemetryManager {
    private static instance;
    static get INSTANCE(): GlobalTelemetryManager;
    private readonly telemetryIframesIDs;
    private telemetryIframes;
    private dataCache;
    private static readonly DATA_CACHE_MAX_POINTS;
    private compute_derivatives_integrals;
    constructor();
    /**
     * Initialize socket listening communication for telemetry data.
     */
    initializeSocketCommunication(): void;
    /**
     * Called when integral / derivative calculations have been performed.
     */
    private onDerivativeIntegralCalculated;
    /**
     * Sends data to all telemetry iframes.
     */
    private sendMessageToTelemetryIframes;
    /**
     * Retrieves cached data for a specific label.
     */
    getCachedData(label: string): {
        x: number;
        y: any;
    }[] | null;
    /**
     * Retrieves the most recent data points for a specific label.
     */
    getMostRecentDataPoints(label: string, count?: number): {
        x: number;
        y: any;
    }[] | null;
}
/**
 * Managers rocket input communication from the application.
 */
export declare class RocketInputCommunicationManager {
    private static instance;
    static get INSTANCE(): RocketInputCommunicationManager;
    constructor();
}
