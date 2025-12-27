class LiveDataManager {
    private static instance: LiveDataManager;
    public static get INSTANCE(): LiveDataManager { return LiveDataManager.instance; }

    private graphsDictionary: { [key: string]: GraphicalRepresentation } = {};

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
        const vectorGraphsToCreate: { key: string; title: string; unit: string; yMin: number; yMax: number; }[] = [
            { key: 'accel', title: 'Linear Acceleration', unit: 'm/s²', yMin: -1, yMax: 1 },
            { key: 'vel', title: 'Linear Velocity', unit: 'm/s', yMin: -10, yMax: 125 },
            { key: 'ang_vel', title: 'Angular Velocity', unit: '°/s', yMin: -2, yMax: 2 },
            { key: 'ang_pos', title: 'Angular Position', unit: '°', yMin: -4, yMax: 4 }
        ];

       vectorGraphsToCreate.forEach(graphInfo => {    
            const velGraph: LineGraphRepresentation = new LineGraphRepresentation(
                graphInfo.title,
                graphInfo.unit,
                graphInfo.yMin,
                graphInfo.yMax,
                30,   // timeWindow in seconds
                {
                    "x": { color: '#FF0000', width: 2, opacity: 1 },
                    "y": { color: '#00FF00', width: 2, opacity: 1 },
                    "z": { color: '#0000FF', width: 2, opacity: 1 }
                }
            );
            this.registerGraph(graphInfo.key, velGraph);
        });


        const singleValueGraphsToCreate: { key: string; title: string; unit: string; yMin: number; yMax: number; }[] = [
            { key: 'dps_alt', title: 'Altitude', unit: 'm', yMin: 0, yMax: 200 }
        ];

        singleValueGraphsToCreate.forEach(graphInfo => {
            const graph: LineGraphRepresentation = new LineGraphRepresentation(
                graphInfo.title,
                graphInfo.unit,
                graphInfo.yMin,
                graphInfo.yMax,
                30,   // timeWindow in seconds
            );
            this.registerGraph(graphInfo.key, graph);
        });
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
            console.log(`[LiveDataManager] Available graphs:`, Object.keys(this.graphsDictionary));

            // Find the graph with the matching label
            const graph = this.graphsDictionary[label];
            
            if (!graph) {
                console.warn(`[LiveDataManager] No graph found for label '${label}'. Available graphs:`, Object.keys(this.graphsDictionary));
            }
            
            if (graph) {
                // Extract the value from content (assuming it's a number or has a 'value' property)
                let value: any = content;
                let type: string = this.getDataType(content);

                // Add the data point to the graph (relative time as x, value as y)
                if (type === 'vector3d') {
                    // For velocity graph, use collection key based on data type
                    graph.addDataPoint(relativeTime, (value as Vector3D).x, "x");
                    graph.addDataPoint(relativeTime, (value as Vector3D).y, "y");
                    graph.addDataPoint(relativeTime, (value as Vector3D).z, "z");
                } else {
                    graph.addDataPoint(relativeTime, value as number);
                }
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

    private registerGraph(key: string, graph: GraphicalRepresentation): void {
        this.graphsDictionary[key] = graph;
    }
}

new LiveDataManager();

type Vector3D = {
    x: number;
    y: number;
    z: number;
};