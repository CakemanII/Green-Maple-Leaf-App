/**
 * Manages telemetry communication within the application.
 */
class TelemetryCommunicationManager {
    private static instance: TelemetryCommunicationManager;
    public static get INSTANCE(): TelemetryCommunicationManager { return TelemetryCommunicationManager.instance; }

    private readonly telemetryIframesIDs: string[] = [
        'live_data_tab',
        'live_interface_tab',
    ]
    private telemetryIframes: HTMLIFrameElement[] = [];

    private dataCache: { [key: string]: { x: number, y: any }[] } = {};

    constructor() {
        // Ensure singleton
        if (TelemetryCommunicationManager.instance) {
            throw new Error("Use TelemetryCommunicationManager.INSTANCE to access the singleton instance.");
        }
        TelemetryCommunicationManager.instance = this;

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
            console.log('[LiveDataManager] Connected to web server');
        });

        socket.on('disconnect', () => {
            console.log('[LiveDataManager] Disconnected from web server');
        });
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
     * Retrieves the most recent data point for a specific label.
     */
    public getMostRecentDataPoint(label: string): { x: number, y: any } | null {
        const dataPoints = this.dataCache[label];
        if (dataPoints && dataPoints.length > 0) {
            return dataPoints[dataPoints.length - 1];
        }
        return null;
    }
}

new TelemetryCommunicationManager();

/**
 * Managers rocket input communication from the application.
 */
class RocketInputCommunicationManager {
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