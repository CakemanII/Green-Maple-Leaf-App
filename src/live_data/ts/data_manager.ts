class LiveDataManager {
    private static instance: LiveDataManager;
    public static get INSTANCE(): LiveDataManager { return LiveDataManager.instance; }

    private graphsDictionary: { [key: string]: Representation } = {};

    constructor() {
        // Ensure singleton
        if (LiveDataManager.instance) {
            throw new Error("Use LiveDataManager.INSTANCE to access the singleton instance.");
        }
        LiveDataManager.instance = this;

        // Initialization code here
        this.intializeMotionGraphs();
        
        // Start listening for data updates
        this.listenForDataUpdates();
    }

    private intializeMotionGraphs(): void {
        const graphsToCreate: { key: string; title: string; unit: string; yMin: number; yMax: number; }[] = [
            { key: 'accel', title: 'Vertical Acceleration', unit: 'm/s²', yMin: -100, yMax: 100 },
            { key: 'vel', title: 'Vertical Velocity', unit: 'm/s', yMin: -200, yMax: 200 },
            { key: 'alt', title: 'Altitude', unit: 'm', yMin: -900, yMax: 900 }
        ];

        graphsToCreate.forEach(graphInfo => {
            const graph: LineGraphRepresentation = new LineGraphRepresentation(
                graphInfo.title,
                graphInfo.unit,
                graphInfo.yMin,
                graphInfo.yMax,
                30,   // timeWindow in seconds
                300   // max data points
            );
            this.registerGraph(graphInfo.key, graph);
        }
        );
    }

    private listenForDataUpdates(): void {
        // Connect to the Socket.IO server
        const socket = (window as any).io('http://127.0.0.1:5000');

        // Track the first timestamp to calculate relative time
        let firstTimestamp: number | null = null;

        // Listen for 'rocket_data' events from the server
        socket.on('rocket_data', (data: any) => {
            const label = data.label;         // Graph key/label
            const timestamp = data.timestamp; // Time value for x-axis
            const content = data.content;     // Data value for y-axis

            // Initialize first timestamp if not set
            if (firstTimestamp === null) {
                firstTimestamp = timestamp;
            }

            // Calculate relative time (elapsed time since first data point)
            const relativeTime = timestamp - firstTimestamp!;

            console.log(`[LiveDataManager] Received data for '${label}':`, content, `at t=${relativeTime.toFixed(2)}s`);

            // Find the graph with the matching label
            const graph = this.graphsDictionary[label];
            
            if (graph) {
                // Extract the value from content (assuming it's a number or has a 'value' property)
                let value: number;
                let type: string = this.getDataType(content);
                if (type === 'number') {
                    value = content;
                } 
                else if (type === 'vector3d') {
                    value = (content as Vector3D).y; // Example: using x component    
                } 
                else {
                    console.warn(`[LiveDataManager] Unable to extract numeric value from content:`, content);
                    return;
                }

                // Add the data point to the graph (relative time as x, value as y)
                graph.addDataPoint(relativeTime, value);
            } else {
                console.warn(`[LiveDataManager] No graph found for label '${label}'`);
            }
        });

        socket.on('connect', () => {
            console.log('[LiveDataManager] Connected to web server');
        });

        socket.on('disconnect', () => {
            console.log('[LiveDataManager] Disconnected from web server');
        });
    }

    private getDataType(data: any): string {
        if (typeof data === 'number') {
            return 'number';
        } else if (typeof data === 'string') {
            return 'string';
        } else if (typeof data === 'boolean') {
            return 'boolean';
        } else if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'z' in data) {
            return 'vector3d';
        } else {
            return 'unknown';
        }
    }

    private registerGraph(key: string, graph: Representation): void {
        this.graphsDictionary[key] = graph;
    }
}

new LiveDataManager();

type Vector3D = {
    x: number;
    y: number;
    z: number;
};