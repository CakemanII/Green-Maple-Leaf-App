import { GlobalStatusesManager } from './global_statuses.js';
/**
 * Manages telemetry communication within the application.
 */
export class GlobalTelemetryManager {
    static get INSTANCE() { return GlobalTelemetryManager.instance; }
    constructor() {
        this.telemetryIframesIDs = [
            'live_interface_tab',
        ];
        this.telemetryIframes = [];
        this.dataCache = {};
        // List of integrals and derivatives to compute
        this.compute_derivatives_integrals = [
            { input: 'ang_vel', output: 'ang_accel', is_derivative: true },
        ];
        // Ensure singleton
        if (GlobalTelemetryManager.instance) {
            throw new Error("Use GlobalTelemetryManager.INSTANCE to access the singleton instance.");
        }
        GlobalTelemetryManager.instance = this;
        // Initialize telemetry iframes
        this.telemetryIframesIDs.forEach(iframeID => {
            const iframe = document.getElementById(iframeID);
            if (iframe) {
                this.telemetryIframes.push(iframe);
            }
            else {
                console.warn(`Iframe with ID ${iframeID} not found.`);
            }
        });
        // Initialize socket communication
        this.initializeSocketCommunication();
    }
    /**
     * Initialize socket listening communication for telemetry data.
     */
    initializeSocketCommunication() {
        // Connect to the Socket.IO server
        const socket = window.io('http://127.0.0.1:5000');
        // Listen for 'rocket_data' events from the server
        socket.on('rocket_data', (data) => {
            // Get data components
            const label = data.label; // Graph key/label
            const timestamp = data.timestamp; // Time value for x-axis
            const content = data.content; // Data value for y-axis
            // Cache data (cap to avoid unbounded growth)
            if (!this.dataCache[label]) {
                this.dataCache[label] = [];
            }
            this.dataCache[label].push({ x: timestamp, y: content });
            if (this.dataCache[label].length > GlobalTelemetryManager.DATA_CACHE_MAX_POINTS) {
                this.dataCache[label].shift();
            }
            // Send data to all telemetry iframes
            this.sendMessageToTelemetryIframes(label, timestamp, content);
            // Notify global statuses of updated telemetry data
            GlobalStatusesManager.INSTANCE.updatedTelemetryData(label);
        });
        socket.on('connect', () => {
            // Connected
        });
        socket.on('disconnect', () => {
            this.dataCache = {};
        });
    }
    /**
     * Called when integral / derivative calculations have been performed.
     */
    onDerivativeIntegralCalculated(label, timestamp, value) {
        // Cache data
        if (!this.dataCache[label]) {
            this.dataCache[label] = [];
        }
        this.dataCache[label].push({ x: timestamp, y: value });
        // Send data to all telemetry iframes
        this.sendMessageToTelemetryIframes(label, timestamp, value);
    }
    /**
     * Sends data to all telemetry iframes.
     */
    sendMessageToTelemetryIframes(label, timestamp, value) {
        this.telemetryIframes.forEach(iframe => {
            var _a;
            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
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
    getCachedData(label) {
        return this.dataCache[label] || null;
    }
    /**
     * Retrieves the most recent data points for a specific label.
     */
    getMostRecentDataPoints(label, count = 1) {
        const dataPoints = this.dataCache[label];
        if (dataPoints && dataPoints.length > 0) {
            return dataPoints.slice(-count);
        }
        return null;
    }
}
GlobalTelemetryManager.DATA_CACHE_MAX_POINTS = 1000;
new GlobalTelemetryManager();
// Expose to global scope for breaking circular dependency
globalThis.GlobalTelemetryManager = GlobalTelemetryManager;
/**
 * Managers rocket input communication from the application.
 */
export class RocketInputCommunicationManager {
    static get INSTANCE() { return RocketInputCommunicationManager.instance; }
    constructor() {
        // Ensure singleton
        if (RocketInputCommunicationManager.instance) {
            throw new Error("Use RocketInputCommunicationManager.INSTANCE to access the singleton instance.");
        }
        RocketInputCommunicationManager.instance = this;
    }
}
//# sourceMappingURL=global_rocket_communication.js.map