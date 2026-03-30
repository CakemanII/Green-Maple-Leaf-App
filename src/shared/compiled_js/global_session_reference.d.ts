export declare class SessionReference {
    private static instance;
    static get Instance(): SessionReference;
    private static getSessionPOSTMessageName;
    private static getSessionRECEIVEMessageName;
    constructor();
    /**
     * Get a specific session value.
     */
    getSession(key: string): Promise<any>;
    /**
     * Update a specific session value.
     */
    saveSession(sessionData: {
        [key: string]: any;
    }): Promise<void>;
}
