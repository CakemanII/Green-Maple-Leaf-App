import { Flag } from "./types.js";
export declare class StatusesReference {
    private static instance;
    static get INSTANCE(): StatusesReference;
    private onStatusUpdateCallback;
    constructor();
    /**
     * Sets the callback to be invoked on status updates.
     */
    setOnStatusUpdateCallback(callback: (statusUUID: string, flag: Flag) => void): void;
    /**
     * Retreive all the statuses.
     */
    getAllStatuses(): Promise<{
        statusName: string;
        statusUUID: string;
        currentActiveFlagName: string;
        currentActiveFlagImage: string;
    }[]>;
    /**
     * Initialize communication between parent window and this iframe.
     */
    private initializeIFrameCommunication;
}
