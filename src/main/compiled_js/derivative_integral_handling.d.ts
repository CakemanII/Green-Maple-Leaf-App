export declare class DerivativeIntegralHandler {
    private static instance;
    static get INSTANCE(): DerivativeIntegralHandler;
    private callbacksDictionary;
    private get telemetryManager();
    constructor();
    setDerivativeIntegralCallback(call_key: string, output_key: string, calc_derivative: boolean, callback: (label: string, timestamp: number, value: any) => void): void;
    private derivativeIntegralCallback;
    /**
     * Called when a telemetry data point is received.
     */
    onTelemetryDataReceived(label: string): void;
}
