import { GlobalStatusesManager } from './global_statuses.js';

/**
 * Manages telemetry communication within the application.
 */
export class GlobalTelemetryManager {
    private static instance: GlobalTelemetryManager;
    public static get INSTANCE(): GlobalTelemetryManager { return GlobalTelemetryManager.instance; }

    private readonly telemetryIframesIDs: string[] = [
        'live_interface_tab',
    ]
    private telemetryIframes: HTMLIFrameElement[] = [];

    private dataCache: { [key: string]: { x: number, y: any }[] } = {};

    // List of integrals and derivatives to compute
    private compute_derivatives_integrals: { input: string, output: string, is_derivative: boolean }[] = [
        { input: 'ang_vel', output: 'ang_accel', is_derivative: true },
    ];

    constructor() {
        // Ensure singleton
        if (GlobalTelemetryManager.instance) {
            throw new Error("Use GlobalTelemetryManager.INSTANCE to access the singleton instance.");
        }
        GlobalTelemetryManager.instance = this;

        // Initialize telemetry iframes
        this.telemetryIframesIDs.forEach(iframeID => {
            const iframe = document.getElementById(iframeID) as HTMLIFrameElement;  
            if (iframe) {
                this.telemetryIframes.push(iframe);
            }
            else
            {
                console.warn(`Iframe with ID ${iframeID} not found.`);
            }
        });

        // Initialize socket communication
        this.initializeSocketCommunication();
    }

    
    /**
     * Initialize socket listening communication for telemetry data.
     */
    public initializeSocketCommunication(): void {
        // Connect to the Socket.IO server
        const socket = (window as any).io('http://127.0.0.1:5000');

        // Listen for 'rocket_data' events from the server
        socket.on('rocket_data', (data: any) => {
            // Get data components
            const label = data.label;         // Graph key/label
            const timestamp = data.timestamp; // Time value for x-axis
            const content = data.content;     // Data value for y-axis

            // Cache data
            if (!this.dataCache[label]) { this.dataCache[label] = []; }
            this.dataCache[label].push({ x: timestamp, y: content });

            // Send data to all telemetry iframes
            this.sendMessageToTelemetryIframes(label, timestamp, content);

            // Notify global statuses of updated telemetry data
            GlobalStatusesManager.INSTANCE.updatedTelemetryData(label);
        });

        socket.on('connect', () => {
            // Connected
        });

        socket.on('disconnect', () => {
            // Disconnected
        });
    }

    /**
     * Called when integral / derivative calculations have been performed.
     */
    private onDerivativeIntegralCalculated(label: string, timestamp: number, value: any): void {
        // Cache data
        if (!this.dataCache[label]) { this.dataCache[label] = []; }
        this.dataCache[label].push({ x: timestamp, y: value });

        // Send data to all telemetry iframes
        this.sendMessageToTelemetryIframes(label, timestamp, value);
    }


    /**
     * Sends data to all telemetry iframes.
     */
    private sendMessageToTelemetryIframes(label: string, timestamp: Number, value: any): void {
        this.telemetryIframes.forEach(iframe => {
            iframe.contentWindow?.postMessage({ 
                type: 'telemetryData',
                label: label, 
                timestamp: timestamp, 
                value: value 
            }, '*');
        });
    }

    /**
     * Retrieves cached data for a specific label.
     */
    public getCachedData(label: string): { x: number, y: any }[] | null {
        return this.dataCache[label] || null;
    }

    /**
     * Retrieves the most recent data points for a specific label.
     */
    public getMostRecentDataPoints(label: string, count: number = 1): { x: number, y: any }[] | null {
        const dataPoints = this.dataCache[label];
        if (dataPoints && dataPoints.length > 0) {
            return dataPoints.slice(-count);
        }
        return null;
    }
}

new GlobalTelemetryManager();

// Expose to global scope for breaking circular dependency
(globalThis as any).GlobalTelemetryManager = GlobalTelemetryManager;

/**
 * Managers rocket input communication from the application.
 */
export class RocketInputCommunicationManager {
    private static instance: RocketInputCommunicationManager
    public static get INSTANCE(): RocketInputCommunicationManager { return RocketInputCommunicationManager.instance; }

    constructor() {
        // Ensure singleton
        if (RocketInputCommunicationManager.instance) {
            throw new Error("Use RocketInputCommunicationManager.INSTANCE to access the singleton instance.");
        }
        RocketInputCommunicationManager.instance = this;
    }

    /**
     * Sends rocket input data to the server.
     */
    // ...
}