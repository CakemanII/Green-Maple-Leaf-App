export class Session
{
    private static instance: Session;
    public static get Instance(): Session { return this.instance; }

    private currentSession: { [key: string]: any } = {};

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (Session.instance) {
            console.error("Session instance already exists!");
            return;
        }
        Session.instance = this;

        // Initialize IFrame to primary window communication.
        this.initializeExternalIframeCommunication();

        // Load initial session data from server.
        setTimeout(() => {
            this.loadSessionDataFromServer();
        }, 0);

        // Set the last opened page in the session to be the editor.
        this.updateSession('last_opened_page', 'gcs');
    }

    /**
     * Initialize IFrame to primary window communication.
     */
    private initializeExternalIframeCommunication(): void {
        window.addEventListener('message', (event) => {
            // Assuming message is from child iframes.
            const messageData = event.data;
            // Check the message type
            if (messageData.type === 'updateSessionRequest') {
                // Update the specific session
                const key = messageData.key;
                const value = messageData.value;
                this.updateSession(key, value);
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
    private loadSessionDataFromServer(): void {
        fetch('/session/load')
            .then(response => response.json())
            .then(data => {
                this.currentSession = data;
            })
            .catch(error => {
                console.error("Error loading session data from server:", error);
            });
    }

    /**
     * Save current session data to the server.
     */
    private saveSessionDataToServer(): void {
        fetch('/session/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Send current session data as query parameters
            body: JSON.stringify(this.currentSession)
        })
        .then(response => {
            if (!response.ok) {
                console.error("Error saving session data to server.");
            }
        });
    }

    /**
     * Update a specific session and save to server.
     * Triggered from element change events.
     */
    public updateSession(key: string, value: any): void {
        this.currentSession[key] = value;
        this.saveSessionDataToServer();
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

new Session();