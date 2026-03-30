export declare class Session {
    private static instance;
    static get Instance(): Session;
    private currentSession;
    private sessionLoaded;
    private pendingSessionUpdates;
    constructor(initialLastOpenedPage?: 'editor' | 'gcs' | null);
    /**
     * Initialize IFrame to primary window communication.
     */
    private initializeExternalIframeCommunication;
    /**
     * Load session data from the server.
     */
    private loadSessionDataFromServer;
    /**
     * Apply updates that were requested before session data finished loading.
     */
    private applyPendingSessionUpdates;
    /**
     * Save current session data to the server.
     */
    private saveSessionDataToServer;
    /**
     * Update a specific session and save to server.
     * Triggered from element change events.
     */
    updateSession(key: string, value: any): Promise<void>;
    /**
     * Get a specific session value.
     */
    getSession(key: string): any;
    /**
     * Get all session data.
     */
    getAllSessionData(): {
        [key: string]: any;
    };
}
