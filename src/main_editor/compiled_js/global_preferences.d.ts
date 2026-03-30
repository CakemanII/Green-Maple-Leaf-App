export declare class Preferences {
    private static instance;
    static get Instance(): Preferences;
    private currentPreferences;
    private static readonly PREFERENCE_IFRAME_ID;
    private preference_iframe_window;
    constructor();
    /**
     * Initialize IFrame to primary window communication.
     */
    private initializeExternalIframeCommunication;
    /**
     * Load preferences from the server.
     */
    private loadPreferencesFromServer;
    /**
     * Save current preferences to the server.
     */
    private savePreferencesToServer;
    /**
     * Update preferences to other parts of the application (IFrames).
     */
    private updatePreferencesToIFrames;
    /**
     * Update a specific preference and save to server.
     * Triggered from element change events.
     */
    updatePreference(key: string, value: any): void;
    /**
     * Get a specific preference value.
     */
    getPreference(key: string): any;
    /**
     * Get all preferences.
     */
    getAllPreferences(): {
        [key: string]: any;
    };
}
