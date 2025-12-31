class StatusesReference {
    private static instance: StatusesReference;
    public static get INSTANCE(): StatusesReference { return StatusesReference.instance; }

    private onStatusUpdateCallback: (statusUUID: string, flagName: string, flagImage: string) => void = () => {};

    constructor() {
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
    public setOnStatusUpdateCallback(callback: (statusUUID: string, flagName: string, flagImage: string) => void): void {
        this.onStatusUpdateCallback = callback;
    }

    /**
     * Retreive all the statuses.
     */
    public getAllStatuses(): Promise<{statusName: string, statusUUID: string, currentActiveFlagName: string, currentActiveFlagImage: string, }[]> {
        // Implementation to retrieve all statuses goes here
        const statuses: any = IFrameCommunicationUitilies.sendMessageAndAwaitResponse('getAllStatuses');
        return statuses;
    }

    /**
     * Initialize communication between parent window and this iframe.
     */
    private initializeIFrameCommunication(): void {
        window.addEventListener('message', (event) => {
            const messageData = event.data;
            // Ensure message is from parent window
            if (event.source !== window.parent) return;

            // Check the message type
            if (messageData.type !== 'statusUpdate') return;

            // Split the message data
            const statusUUID = messageData.statusUUID;
            const flagName = messageData.flagName;
            const flagImage = messageData.flagImage;

            // Invoke the callback with received data
            this.onStatusUpdateCallback(statusUUID, flagName, flagImage);
        });
    }
}

new StatusesReference();