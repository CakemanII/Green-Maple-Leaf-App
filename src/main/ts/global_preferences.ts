export class Preferences
{
    private static instance: Preferences;
    public static get Instance(): Preferences { return this.instance; }

    private currentPreferences: { [key: string]: any } = {};

    private static readonly PREFERENCE_IFRAME_ID = 'preferences_tab';

    private preference_iframe_window: Window | null = null;

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (Preferences.instance) {
            console.error("Preferences instance already exists!");
            return;
        }
        Preferences.instance = this;

        // Initialize the preference iframe reference
        this.preference_iframe_window = (document.getElementById(Preferences.PREFERENCE_IFRAME_ID) as HTMLIFrameElement).contentWindow;

        // Initialize IFrame to primary window communication.
        this.initializeExternalIframeCommunication();

        // Load initial preferences from server.
        setTimeout(() => {
            this.loadPreferencesFromServer();
        }, 0);
    }

    /**
     * Initialize IFrame to primary window communication.
     */
    private initializeExternalIframeCommunication(): void {
        window.addEventListener('message', (event) => {
            // Assuming message is from child iframes.
            const messageData = event.data;
            // Check the message type
            if (messageData.type === 'updatePreferenceRequest') {
                // Update the specific preference
                const key = messageData.key;
                const value = messageData.value;
                this.updatePreference(key, value);
            }
            else if (event.data.type === "getPreference") {
                const value = this.getPreference(event.data.key);

                event.source!.postMessage({
                    type: "preferenceValue",
                    value,
                    requestId: event.data.requestId   // Echo back
                });
            }
        });
    }

    /**
     * Load preferences from the server.
     */
    private loadPreferencesFromServer(): void {
        fetch('/load_config')
            .then(response => response.json())
            .then(data => {
                this.currentPreferences = data;
                this.updatePreferencesToIFrames();
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
                this.updatePreferencesToIFrames();
            } else {
                console.error("Error saving preferences to server.");
            }
        });
    }

    /**
     * Update preferences to other parts of the application (IFrames).
     */
    private updatePreferencesToIFrames(): void {
        this.preference_iframe_window!.postMessage({
            type: 'preferencesUpdate',
            preferences: this.currentPreferences
        }, '*');
    }

    /**
     * Update a specific preference and save to server.
     * Triggered from element change events.
     */
    public updatePreference(key: string, value: any): void {
        this.currentPreferences[key] = value;
        this.savePreferencesToServer();
    }

    /**
     * Get a specific preference value.
     */
    public getPreference(key: string): any {
        return this.currentPreferences[key];
    }

    /**
     * Get all preferences.
     */
    public getAllPreferences(): { [key: string]: any } {
        return this.currentPreferences;
    }
}

new Preferences();