declare class PreferencesUIManager {
    private static instance;
    static get Instance(): PreferencesUIManager;
    private static readonly PREFERENCE_IDS;
    private PREFERENCE_INPUT_ELEMENTS;
    private currentPreferences;
    constructor();
    /**
     * Initialize iframe to primary window communication.
     */
    private initializeExternalIFrameCommunication;
    /**
     * Initialize preference UI elements and bind events to update preferences.
     */
    private initializePreferenceElements;
    /**
     * Load preferences from the main window.
     */
    private updatePreferencesOntoUIElements;
    /**
     * Update a specific preference and send update to main window.
     */
    private updatePreference;
}
