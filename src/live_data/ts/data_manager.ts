declare const TelemetryReceiver: any;

class LiveTelemetryManager {
    private static instance: LiveTelemetryManager;
    public static get INSTANCE(): LiveTelemetryManager { return LiveTelemetryManager.instance; }

    private graphsDictionary: { [key: string]: GraphicalRepresentation } = {};
    private callbacksDictionary: { [key: string]: () => void } = {};

    constructor() {
        // Ensure singleton
        if (LiveTelemetryManager.instance) {
            throw new Error("Use LiveDataManager.INSTANCE to access the singleton instance.");
        }
        LiveTelemetryManager.instance = this;

        // Initialization code here
        this.intializeMotionGraphs();
        
        // Start listening for data updates
        this.listenForDataUpdates();
    }

    private intializeMotionGraphs(): void {
        const vectorGraphsToCreate: { key: string; title: string; unit: string; yMin: number; yMax: number; scaleY: boolean }[] = [
            { key: 'accel', title: 'Linear Acceleration', unit: 'm/s²', yMin: -1, yMax: 1, scaleY: true },
            { key: 'vel', title: 'Linear Velocity', unit: 'm/s', yMin: -10, yMax: 125, scaleY: true  },
            { key: 'ang_accel', title: 'Angular Acceleration (Derivative)', unit: '°/s²', yMin: 0, yMax: 20, scaleY: true  },
            { key: 'ang_vel', title: 'Angular Velocity', unit: '°/s', yMin: -2, yMax: 2, scaleY: true  },
            { key: 'ang_pos', title: 'Angular Position', unit: '°', yMin: 0, yMax: 360, scaleY: false  }
        ];

       vectorGraphsToCreate.forEach(graphInfo => {    
            const graph: LineGraphRepresentation = new LineGraphRepresentation(
                graphInfo.title,
                graphInfo.unit,
                graphInfo.yMin,
                graphInfo.yMax,
                30,   // timeWindow in seconds
                {
                    "x": { color: '#FF0000', width: 2, opacity: 1 },
                    "y": { color: '#00FF00', width: 2, opacity: 1 },
                    "z": { color: '#0000FF', width: 2, opacity: 1 }
                },
            );
            graph.setOverflowY(graphInfo.scaleY ? LineGraphYOverflowMode.ScaleAxis : LineGraphYOverflowMode.None);
            this.registerGraph(graphInfo.key, graph);
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

        // Set up derivative/integral callbacks
        this.setDerivativeIntegralCallback('ang_vel', 'ang_accel', true);  // Derivative of velocity is acceleration
    }

    private listenForDataUpdates(): void {
        // Track the first timestamp to calculate relative time
        let firstTimestamp: number | null = null;
        
        // Listen for telemetry data from parent window
        new TelemetryReceiver((label: string, timestamp: number, content: any) => {
            // Initialize first timestamp if not set
            if (firstTimestamp === null) {
                firstTimestamp = timestamp;
            }

            // Calculate relative time (elapsed time since first data point)
            const relativeTime = timestamp - firstTimestamp!;

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

                // Calculate the derivative/integral if a callback is registered
                const callback = this.callbacksDictionary[label];
                if (callback) {
                    callback();
                }
            } else {
                console.warn(`[LiveDataManager] No graph found for label '${label}'`);
            }
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

    private setDerivativeIntegralCallback(call_key: string, output_key: string, calc_derivative: boolean): void {
        this.callbacksDictionary[call_key] = () => {
            this.derivativeIntegralCallback(call_key, output_key, calc_derivative);
        };
    } 

    private derivativeIntegralCallback(input_key: string, output_key: string, calc_derivative: boolean): void {
        // Calculate the derivative or integral for the specified output key
        const inputGraph: GraphicalRepresentation = this.graphsDictionary[input_key];
        if (!inputGraph) {
            console.warn(`[LiveDataManager] No graph found for key '${input_key}' to use to calculate derivative/integral.`);
            return;
        }

        // Get the output graph
        const outputGraph: GraphicalRepresentation = this.graphsDictionary[output_key];
        if (!outputGraph) {
            console.warn(`[LiveDataManager] No graph found for key '${output_key}' to store derivative/integral results.`);
            return;
        }

        // Calculate derivative or integral for each collection
        const collectionKeys = inputGraph.getAllCollectionKeys();
        collectionKeys.forEach(collectionKey => {
            // Get the data points for this collection
            const inputDataPoints = inputGraph.getDataPointsCollection(true, 2, collectionKey);
            const a = inputDataPoints[0]; const b = inputDataPoints[1]; // Last two data points

            // If not enough data points, skip
            if (!a || !b) {
                console.warn(`[LiveDataManager] Not enough data points to calculate derivative/integral for key '${input_key}' in collection '${collectionKey}'.`);
                return;
            }

            // Calculate time difference
            const deltaTime = b.x - a.x;

            // Calculate derivative or integral
            if (calc_derivative) {
                // Calculate the time inbetween the points
                const midTime = (a.x + b.x) / 2;

                // Calculate derivative
                const derivativeValue = DerivativeCalculator.calculate(a.y, b.y, deltaTime);
                outputGraph.addDataPoint(midTime, derivativeValue, collectionKey);
            } else {
                // Get the last integral value if exists
                const lastOutputDataPoints = outputGraph.getDataPointsCollection(true, 1, collectionKey);
                const lastIntegralValue = lastOutputDataPoints.length > 0 ? lastOutputDataPoints[0].y : 0;
                // Calculate integral
                const integralValue = IntegralCalculator.calculate(lastIntegralValue, a.y, b.y, deltaTime);
                outputGraph.addDataPoint(b.x, integralValue, collectionKey);
            }
        });
    }
}

new LiveTelemetryManager();

type Vector3D = {
    x: number;
    y: number;
    z: number;
};