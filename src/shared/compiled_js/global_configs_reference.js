export class PreferencesReference {
    static get Instance() { return this.instance; }
    constructor() {
        // Singleton pattern - prevent multiple instances
        if (PreferencesReference.instance) {
            console.error("PreferencesReference instance already exists!");
            return;
        }
        PreferencesReference.instance = this;
    }
    /**
     * Get a specific preference value.
     */
    getPreference(key) {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).slice(2);
            const listener = (event) => {
                if (event.source !== window.parent)
                    return;
                const data = event.data;
                if (data.type === PreferencesReference.getPreferenceRECEIVEMessageName &&
                    data.requestId === requestId) {
                    window.removeEventListener("message", listener);
                    resolve(data.value);
                }
            };
            window.addEventListener("message", listener);
            // Send request
            window.parent.postMessage({
                type: PreferencesReference.getPreferencePOSTMessageName,
                key,
                requestId
            }, "*");
            // Optional timeout
            setTimeout(() => {
                window.removeEventListener("message", listener);
                reject("Timeout waiting for preferences");
            }, 5000);
        });
    }
}
PreferencesReference.getPreferencePOSTMessageName = 'getPreference';
PreferencesReference.getPreferenceRECEIVEMessageName = 'preferenceValue';
new PreferencesReference();
//# sourceMappingURL=global_configs_reference.js.map