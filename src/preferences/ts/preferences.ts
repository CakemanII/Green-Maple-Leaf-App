class PreferencesHandler
{
    private static instance: PreferencesHandler;
    public static get Instance(): PreferencesHandler { return this.instance; }

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

    private currentPreferences: { [key: string]: any } = {};

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (PreferencesHandler.instance) {
            console.error("PreferencesHandler instance already exists!");
            return;
        }
        PreferencesHandler.instance = this;

        // Load initial preferences from server.
        this.loadPreferencesFromServer();

        // Wait until preferences are loaded, then initialize UI elements.
        const checkAndInit = () => {
            if (Object.keys(this.currentPreferences).length > 0) {
                this.initializePreferenceElements();
            } else {
                setTimeout(checkAndInit, 100); // Check again in 100ms
            }
        };
        checkAndInit();
    }

    /**
     * Initialize preference UI elements and bind events to update preferences.
     */
    private initializePreferenceElements(): void {
        // Initialize preference UI elements and bind events to update preferences.
        for (const prefKey in PreferencesHandler.PREFERENCE_IDS) {
            const elementId = PreferencesHandler.PREFERENCE_IDS[prefKey];
            const mainElement = document.getElementById(elementId) as HTMLInputElement | null;

            // Ensure it exists
            if (mainElement === null) { console.warn("Unable to find element."); continue; }

            // Get input control element
            const inputElement = mainElement.querySelector(".control")?.firstElementChild as HTMLInputElement;

            // Set the initial value from current preferences
            if (this.currentPreferences.hasOwnProperty(prefKey)) {
                if (inputElement.type === 'checkbox') {
                    inputElement.checked = this.currentPreferences[prefKey];
                } else {
                    inputElement.value = this.currentPreferences[prefKey];
                }
            }

            // Bind change event to update preferences
            inputElement.addEventListener('change', () => {
                const newValue = inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value;
                this.updatePreference(prefKey, newValue);
            });
        }
    }

    /**
     * Load preferences from the server.
     */
    private loadPreferencesFromServer(): void {
        fetch('/load_config')
            .then(response => response.json())
            .then(data => {
                this.currentPreferences = data;
            })
            .catch(error => {
                console.error("Error loading preferences from server:", error);
            });
    }

    /**
     * Save current preferences to the server.
     */
    private savePreferencesToServer(): void {
        fetch('/save_config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Send current preferences as query parameters
            body: JSON.stringify(this.currentPreferences)
        })
        .then(response => {
            if (response.ok) {
                console.log("Preferences saved successfully.");
            } else {
                console.error("Error saving preferences to server.");
            }
        });
    }

    /**
     * Update a specific preference and save to server.
     * Triggered from element change events.
     */
    private updatePreference(key: string, value: any): void {
        this.currentPreferences[key] = value;
        this.savePreferencesToServer();
    }

    /**
     * Get a specific preference value.
     */
    public getPreference(key: string): any {
        return this.currentPreferences[key];
    }
}

new PreferencesHandler();