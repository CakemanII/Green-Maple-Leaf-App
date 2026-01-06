export class TelemetryReceiver {
    private onReceiveTelemetry: (label: string, timestamp: number, value: any) => void;

    constructor(onReceiveTelemetry: (label: string, timestamp: number, value: any) => void) {
        // Initialize telemetry receiving
        this.onReceiveTelemetry = onReceiveTelemetry;

        // Start listening for telemetry data
        this.initializeTelemetryReceiving();
    }

    /**
     * Initialize telemetry data receiving from parent window.
     */
    private initializeTelemetryReceiving(): void {
        window.addEventListener('message', (event) => {
            const messageData = event.data;
            // Ensure message is from parent window
            if (event.source !== window.parent) return;

            // Check the message type
            if (messageData.type !== 'telemetryData') return;

            // Get data components
            const label = messageData.label;         // Graph key/label
            const timestamp = messageData.timestamp; // Time value for x-axis
            const content = messageData.value;       // Data value for y-axis

            // Invoke the callback with received data
            this.onReceiveTelemetry(label, timestamp, content);
        });
    }
}