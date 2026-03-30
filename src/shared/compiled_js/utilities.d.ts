export declare class GeneralUtilities {
    /**
     * Generates a UUID string.
     */
    static generateUUID(): string;
    /**
     * Takes in a color a returns are darkened version of it (in RGB format).
     */
    static darkenRGBColor(rgb_color: string, factor?: number): string;
}
export declare class IFrameCommunicationUitilies {
    /**
     * Sends a message to a specific iframe.
     */
    static sendMessageAndAwaitResponse(message_identifier: string, ...args: any[]): Promise<any>;
    /**
     * Setup receiving end of message and await response.
     */
    static setupMessageReceiverAndResponse(message_indentifier: string, callback: (...args: any[]) => any): void;
}
