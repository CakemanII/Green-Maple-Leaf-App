export class Session
{
    private static instance: Session;
    public static get Instance(): Session { return this.instance; }

    private currentSession: { [key: string]: any } = {};
    private sessionLoaded: boolean = false;
    private pendingSessionUpdates: { [key: string]: any } = {};

    constructor(initialLastOpenedPage: 'editor' | 'gcs' | null = null) {
        // Singleton pattern - prevent multiple instances
        if (Session.instance) {
            console.error("Session instance already exists!");
            return;
        }
        Session.instance = this;

        // Initialize IFrame to primary window communication.
        this.initializeExternalIframeCommunication();

        // Load initial session data from server.
        setTimeout(async () => {
            // Load session data from the server after setting up communication.
            await this.loadSessionDataFromServer();

            // Only top-level main routes should update last_opened_page.
            if (initialLastOpenedPage !== null) {
                await this.updateSession('last_opened_page', initialLastOpenedPage);
            }
        }, 0);
    }

    /**
     * Initialize IFrame to primary window communication.
     */
    private initializeExternalIframeCommunication(): void {
        window.addEventListener('message', async (event) => {
            // Assuming message is from child iframes.
            const messageData = event.data;
            // Check the message type
            if (messageData.type === 'updateSessionRequest') {
                // Update the specific session
                const key = messageData.key;
                const value = messageData.value;
                await this.updateSession(key, value);
            }
            else if (event.data.type === "getSessionValue") {
                const value = this.getSession(event.data.key);

                event.source!.postMessage({
                    type: "sessionValue",
                    value,
                    requestId: event.data.requestId   // Echo back
                });
            }
        });
    }

    /**
     * Load session data from the server.
     */
    private async loadSessionDataFromServer(): Promise<void> {
        try {
            const response = await fetch('/session/load');
            const data = await response.json();
            this.currentSession = data;
            this.sessionLoaded = true;
            await this.applyPendingSessionUpdates();
        } catch (error) {
            console.error("Error loading session data from server:", error);
        }
    }

    /**
     * Apply updates that were requested before session data finished loading.
     */
    private async applyPendingSessionUpdates(): Promise<void> {
        const pendingKeys = Object.keys(this.pendingSessionUpdates);
        if (pendingKeys.length === 0) {
            return;
        }

        for (const key of pendingKeys) {
            this.currentSession[key] = this.pendingSessionUpdates[key];
        }
        this.pendingSessionUpdates = {};
        await this.saveSessionDataToServer();
    }

    /**
     * Save current session data to the server.
     */
    private async saveSessionDataToServer(): Promise<void> {
        try {
            const response = await fetch('/session/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Send current session data as query parameters
                body: JSON.stringify(this.currentSession)
            });
            if (response.ok) {
                console.log("Session data saved successfully.");
            } else {
                console.error("Error saving session data to server.");
            }
        } catch (error) {
            console.error("Error saving session data to server:", error);
        }
    }

    /**
     * Update a specific session and save to server.
     * Triggered from element change events.
     */
    public async updateSession(key: string, value: any): Promise<void> {
        if (!this.sessionLoaded) {
            this.pendingSessionUpdates[key] = value;
            console.log(`Queued session update: ${key} = ${value}`);
            return;
        }
        this.currentSession[key] = value;
        console.log(`Session updated: ${key} = ${value}`);
        await this.saveSessionDataToServer();
    }

    /**
     * Get a specific session value.
     */
    public getSession(key: string): any {
        return this.currentSession[key];
    }

    /**
     * Get all session data.
     */
    public getAllSessionData(): { [key: string]: any } {
        return this.currentSession;
    }
}

const normalizedPath = window.location.pathname.toLowerCase();
const isTopLevelWindow = window.top === window;

let initialLastOpenedPage: 'editor' | 'gcs' | null = null;
if (isTopLevelWindow) {
    if (normalizedPath === '/editor' || normalizedPath === '/editor/') {
        initialLastOpenedPage = 'editor';
    }
    else if (normalizedPath === '/gcs' || normalizedPath === '/gcs/') {
        initialLastOpenedPage = 'gcs';
    }
}

new Session(initialLastOpenedPage);