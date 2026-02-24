export class SessionReference {
    private static instance: SessionReference;
    public static get Instance(): SessionReference { return this.instance; }

    private static getSessionPOSTMessageName: string = 'getSessionValue';
    private static getSessionRECEIVEMessageName: string = 'sessionValue';

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (SessionReference.instance) {
            console.error("SessionReference instance already exists!");
            return;
        }
        SessionReference.instance = this;
    }

    /**
     * Get a specific session value.
     */
    public getSession(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).slice(2);

            const listener = (event: MessageEvent) => {
                if (event.source !== window.parent) return;

                const data = event.data;

                if (data.type === SessionReference.getSessionRECEIVEMessageName &&
                    data.requestId === requestId) {

                    window.removeEventListener("message", listener);
                    resolve(data.value);
                }
            };

            window.addEventListener("message", listener);

            // Send request
            window.parent.postMessage({
                type: SessionReference.getSessionPOSTMessageName,
                key,
                requestId
            }, "*");

            // Optional timeout
            setTimeout(() => {
                window.removeEventListener("message", listener);
                reject("Timeout waiting for session data");
            }, 5000);
        });
    }

    /**
     * Update a specific session value.
     */
    public saveSession(sessionData: { [key: string]: any }): Promise<void> {
        return new Promise((resolve, reject) => {
            window.parent.postMessage({
                type: 'updateSessionRequest',
                key: 'sessionData',
                value: sessionData
            }, "*");
            resolve();
        });
    }
}

new SessionReference();