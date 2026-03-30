import { IFrameCommunicationUitilies } from "./utilities.js";
export class StatusesReference {
    static get INSTANCE() { return StatusesReference.instance; }
    constructor() {
        this.onStatusUpdateCallback = () => { };
        // Singleton enforcement
        if (StatusesReference.instance) {
            throw new Error("Use StatusesReference.INSTANCE to access the singleton instance.");
        }
        StatusesReference.instance = this;
        // Initialize iframe communication
        this.initializeIFrameCommunication();
    }
    /**
     * Sets the callback to be invoked on status updates.
     */
    setOnStatusUpdateCallback(callback) {
        this.onStatusUpdateCallback = callback;
    }
    /**
     * Retreive all the statuses.
     */
    getAllStatuses() {
        // Implementation to retrieve all statuses goes here
        const statuses = IFrameCommunicationUitilies.sendMessageAndAwaitResponse('getAllStatuses');
        return statuses;
    }
    /**
     * Initialize communication between parent window and this iframe.
     */
    initializeIFrameCommunication() {
        window.addEventListener('message', (event) => {
            const messageData = event.data;
            // Ensure message is from parent window
            if (event.source !== window.parent)
                return;
            // Check the message type
            if (messageData.type !== 'statusUpdate')
                return;
            // Split the message data
            const statusUUID = messageData.statusUUID;
            // Invoke the callback with received data
            this.onStatusUpdateCallback(statusUUID, messageData.flag);
        });
    }
}
new StatusesReference();
//# sourceMappingURL=global_statuses_reference.js.map