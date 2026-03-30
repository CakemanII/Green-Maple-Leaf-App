export declare class PreferencesReference {
    private static instance;
    static get Instance(): PreferencesReference;
    private static getPreferencePOSTMessageName;
    private static getPreferenceRECEIVEMessageName;
    constructor();
    /**
     * Get a specific preference value.
     */
    getPreference(key: string): Promise<any>;
}
