class PreferencesUIManager
{
    private static instance: PreferencesUIManager;
    public static get Instance(): PreferencesUIManager { return this.instance; }

    private static readonly PREFERENCE_IDS: { [key: string]: string } = {
        appearance_theme: 'appearance_setting',
        primary_color: 'primary_color_setting',
        general_map_view_type: 'general_map_view_type_setting',


        default_region_creation_restriction: 'default_region_creation_restriction_setting',
        default_region_creation_visibility: 'default_region_creation_visibility_setting',

        default_region_creation_color: 'default_region_creation_color_setting',
        default_region_creation_border_color: 'default_region_creation_border_color_setting',

        default_region_creation_opacity: 'default_region_creation_opacity_setting',
        default_region_creation_border_opacity: 'default_region_creation_border_opacity_setting',

        geofence_map_view_type: 'geofence_map_view_type_setting',
        geofence_map_initial_zoom_level_setting: 'geofence_map_initial_zoom_level_setting',
        geofence_load_previous_geodata_setting: 'geofence_load_previous_geodata_setting',

        invalid_region_color_setting: 'invalid_region_color_setting',
    };

    private PREFERENCE_INPUT_ELEMENTS: { [key: string]: HTMLInputElement } = {};

    private currentPreferences: { [key: string]: any } = {};

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (PreferencesUIManager.instance) {
            console.error("PreferencesUIHandler instance already exists!");
            return;
        }
        PreferencesUIManager.instance = this;

        // Load initial preferences into UI elements.
        this.initializePreferenceElements();

        // Initialize iframe to primary window communication.
        this.initializeExternalIFrameCommunication();        
    }

    /**
     * Initialize iframe to primary window communication.
     */
    private initializeExternalIFrameCommunication(): void {
        window.addEventListener('message', (event) => {
            // Ensure message is from the main window.
            if (event.source !== window.parent) { return; }

            // Check the message type
            const messageData = event.data;
            if (messageData.type === 'preferencesUpdate') {
                this.currentPreferences = messageData.preferences;
                // Update UI elements with new preferences
                this.updatePreferencesOntoUIElements();
            }
        });
    }

    /**
     * Initialize preference UI elements and bind events to update preferences.
     */
    private initializePreferenceElements(): void {
        // Initialize preference UI elements and bind events to update preferences.
        for (const prefKey in PreferencesUIManager.PREFERENCE_IDS) {
            const elementId = PreferencesUIManager.PREFERENCE_IDS[prefKey];
            const mainElement = document.getElementById(elementId) as HTMLInputElement | null;

            // Ensure it exists
            if (mainElement === null) { console.warn("Unable to find element."); continue; }

            // Get input control element
            const inputElement = mainElement.querySelector(".control")?.firstElementChild as HTMLInputElement;

            // Add the input elements to PREFERENCE_INPUT_ELEMENTS for future reference
            this.PREFERENCE_INPUT_ELEMENTS[prefKey] = inputElement;

            // Bind change event to update preferences
            inputElement.addEventListener('change', () => {
                const newValue = inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value;
                this.updatePreference(prefKey, newValue);
            });
        }
    }

    /**
     * Load preferences from the main window.
     */
    private updatePreferencesOntoUIElements(): void {
        for (const prefKey in PreferencesUIManager.PREFERENCE_IDS) {
            const inputElement = this.PREFERENCE_INPUT_ELEMENTS[prefKey] as HTMLInputElement;

            // Set the value from current preferences
            if (this.currentPreferences.hasOwnProperty(prefKey)) {
                if (inputElement.type === 'checkbox') {
                    inputElement.checked = this.currentPreferences[prefKey];
                } else {
                    inputElement.value = this.currentPreferences[prefKey];
                }
            }
        }
    }

    /**
     * Update a specific preference and send update to main window.
     */
    private updatePreference(key: string, value: any): void {
        this.currentPreferences[key] = value;
        // Send updated preference to main window
        window.parent.postMessage({
            type: 'updatePreferenceRequest',
            key: key,
            value: value
        }, '*');
    }
}

new PreferencesUIManager();