export declare class TelemetryReceiver {
    private onReceiveTelemetry;
    constructor(onReceiveTelemetry: (label: string, timestamp: number, value: any) => void);
    /**
     * Initialize telemetry data receiving from parent window.
     */
    private initializeTelemetryReceiving;
}
