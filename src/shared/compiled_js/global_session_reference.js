export class SessionReference {
    static get Instance() { return this.instance; }
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
    getSession(key) {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).slice(2);
            const listener = (event) => {
                if (event.source !== window.parent)
                    return;
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
    saveSession(sessionData) {
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
SessionReference.getSessionPOSTMessageName = 'getSessionValue';
SessionReference.getSessionRECEIVEMessageName = 'sessionValue';
new SessionReference();
//# sourceMappingURL=global_session_reference.js.map