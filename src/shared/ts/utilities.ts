type Vector3D = {
    x: number;
    y: number;
    z: number;
};

class GeneralUtilities
{
    /**
     * Generates a UUID string.
     */
    public static generateUUID(): string {
        // Generate a simple UUID (not RFC4122 compliant)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Takes in a color a returns are darkened version of it (in RGB format).
     */
    public static darkenRGBColor(rgb_color: string, factor: number = 0.8): string {
        // Extract RGB components
        const rgbMatch = rgb_color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!rgbMatch) {
            console.warn(`[GeneralUtilities] Invalid RGB color format: ${rgb_color}`);
            return rgb_color; // Return original if format is invalid
        }

        let r = Math.floor(parseInt(rgbMatch[1]) * factor);
        let g = Math.floor(parseInt(rgbMatch[2]) * factor);
        let b = Math.floor(parseInt(rgbMatch[3]) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }
}

class IFrameCommunicationUitilies
{
    /**
     * Sends a message to a specific iframe.
     */
    public static sendMessageAndAwaitResponse(message_identifier: string, ...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            // Generate a unique request ID
            const requestId = GeneralUtilities.generateUUID();

            const listener = (event: MessageEvent) => {
                if (event.source !== window.parent) return;

                const data = event.data;

                if (data.type === message_identifier + "_receive" &&
                    data.requestId === requestId) {

                    window.removeEventListener("message", listener);
                    resolve(data.values);
                }
            };

            window.addEventListener("message", listener);

            // Send request
            window.parent.postMessage({
                type: message_identifier + "_request",
                args,
                requestId
            }, "*");

            // Optional timeout
            setTimeout(() => {
                window.removeEventListener("message", listener);
                reject("Timeout waiting for preferences");
            }, 5000);
        });
    }

    /**
     * Setup receiving end of message and await response.
     */
    public static setupMessageReceiverAndResponse(message_indentifier: string, callback: (...args: any[]) => any): void {
        window.addEventListener('message', (event) => {
            // Assuming message is from child iframes.
            const messageData = event.data;
            // Check the message type
            if (event.data.type === message_indentifier + "_request") {
                const values = callback(...messageData.args);

                event.source!.postMessage({
                    type: message_indentifier + "_receive",
                    values: values,
                    requestId: event.data.requestId   // Echo back
                });
            }
        });
    }
}