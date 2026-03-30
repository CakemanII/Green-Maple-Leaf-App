import { TelemetryReceiver } from '../../shared/compiled_js/global_rocket_communication_reference.js';
import { StatusesReference } from '../../shared/compiled_js/global_statuses_reference.js';
import { LineGraphRepresentation, LineGraphYOverflowMode } from './graph_representations.js';
import { StatusRepresentation } from './status_representations.js';
class LiveDisplayUpdater {
    static get INSTANCE() { return LiveDisplayUpdater.instance; }
    constructor() {
        this.graphsDictionary = {};
        this.callbacksDictionary = {};
        this.statusesDictionary = {};
        // Ensure singleton
        if (LiveDisplayUpdater.instance) {
            throw new Error("Use LiveDataManager.INSTANCE to access the singleton instance.");
        }
        LiveDisplayUpdater.instance = this;
        // Initialization code here
        this.intializeMotionGraphs();
        // Initialize status displays
        this.initializeStatusDisplays();
        // Start listening for data updates
        this.listenForDataUpdates();
    }
    /**
     * Initializes motion-related graphs.
     */
    intializeMotionGraphs() {
        const vectorGraphsToCreate = [
            { key: 'accel', title: 'Linear Acceleration', unit: 'm/s²', yMin: -1, yMax: 1, scaleY: true },
            { key: 'vel', title: 'Linear Velocity', unit: 'm/s', yMin: -10, yMax: 125, scaleY: true },
            { key: 'ang_accel', title: 'Angular Acceleration (Derivative)', unit: '°/s²', yMin: 0, yMax: 20, scaleY: true },
            { key: 'ang_vel', title: 'Angular Velocity', unit: '°/s', yMin: -2, yMax: 2, scaleY: true },
            { key: 'ang_pos', title: 'Angular Position', unit: '°', yMin: 0, yMax: 360, scaleY: false }
        ];
        vectorGraphsToCreate.forEach(graphInfo => {
            const graph = new LineGraphRepresentation(graphInfo.title, graphInfo.unit, graphInfo.yMin, graphInfo.yMax, 30, // timeWindow in seconds
            {
                "x": { color: '#FF0000', width: 2, opacity: 1 },
                "y": { color: '#00FF00', width: 2, opacity: 1 },
                "z": { color: '#0000FF', width: 2, opacity: 1 }
            });
            graph.setOverflowY(graphInfo.scaleY ? LineGraphYOverflowMode.ScaleAxis : LineGraphYOverflowMode.None);
            this.registerGraph(graphInfo.key, graph);
        });
        const singleValueGraphsToCreate = [
            { key: 'dps_alt', title: 'Altitude', unit: 'm', yMin: 0, yMax: 200 }
        ];
        singleValueGraphsToCreate.forEach(graphInfo => {
            const graph = new LineGraphRepresentation(graphInfo.title, graphInfo.unit, graphInfo.yMin, graphInfo.yMax, 30);
            this.registerGraph(graphInfo.key, graph);
        });
    }
    listenForDataUpdates() {
        // Track the first timestamp to calculate relative time
        let firstTimestamp = null;
        // Listen for telemetry data from parent window
        new TelemetryReceiver((label, timestamp, content) => {
            // Initialize first timestamp if not set
            if (firstTimestamp === null) {
                firstTimestamp = timestamp;
            }
            // Calculate relative time (elapsed time since first data point)
            const relativeTime = timestamp - firstTimestamp;
            // Find the graph with the matching label
            const graph = this.graphsDictionary[label];
            if (!graph) {
                console.warn(`[LiveDataManager] No graph found for label '${label}'. Available graphs:`, Object.keys(this.graphsDictionary));
            }
            if (graph) {
                // Extract the value from content (assuming it's a number or has a 'value' property)
                let value = content;
                let type = this.getDataType(content);
                // Add the data point to the graph (relative time as x, value as y)
                if (type === 'vector3d') {
                    // For velocity graph, use collection key based on data type
                    graph.addDataPoint(relativeTime, value.x, "x");
                    graph.addDataPoint(relativeTime, value.y, "y");
                    graph.addDataPoint(relativeTime, value.z, "z");
                }
                else {
                    graph.addDataPoint(relativeTime, value);
                }
                // Calculate the derivative/integral if a callback is registered
                const callback = this.callbacksDictionary[label];
                if (callback) {
                    callback();
                }
            }
            else {
                console.warn(`[LiveDataManager] No graph found for label '${label}'`);
            }
        });
    }
    getDataType(data) {
        if (typeof data === 'number') {
            return 'number';
        }
        else if (typeof data === 'string') {
            return 'string';
        }
        else if (typeof data === 'boolean') {
            return 'boolean';
        }
        else if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'z' in data) {
            return 'vector3d';
        }
        else {
            return 'unknown';
        }
    }
    registerGraph(key, graph) {
        this.graphsDictionary[key] = graph;
    }
    /**
     * Initializes status displays.
     */
    async initializeStatusDisplays() {
        // Setup callback 
        StatusesReference.INSTANCE.setOnStatusUpdateCallback(this.updateStatusDisplay.bind(this));
        // Get all statuses and render their displays
        const allStatuses = await StatusesReference.INSTANCE.getAllStatuses();
        console.log(`[LiveDisplayUpdater] Initializing ${allStatuses.length} status displays.`);
        allStatuses.forEach((item) => {
            const representation = new StatusRepresentation(item.statusUUID, item.statusName, item.currentActiveFlagName, item.currentActiveFlagImage);
            this.statusesDictionary[item.statusUUID] = representation;
        });
    }
    /**
     * Update a specific status display.
     */
    updateStatusDisplay(statusUUID, flagName, flagImage) {
        // Implementation for updating a specific status display goes here
        const statusRep = this.statusesDictionary[statusUUID];
        if (statusRep) {
            statusRep.updateDisplay(flagName, flagImage);
        }
        else {
            console.warn(`[LiveDisplayUpdater] No status representation found for UUID '${statusUUID}'`);
        }
    }
}
new LiveDisplayUpdater();
//# sourceMappingURL=live_display.js.map