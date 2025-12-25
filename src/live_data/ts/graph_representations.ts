/**
 * Abstract class representing a generic graph.
 */
abstract class Representation {
    private static GRAPHS_CONTAINER_ID: string = "graphs-container"

    protected dataPoints: Array<{ x: number; y: number }>;
    protected maxDataPoints: number;

    constructor(max_data_points: number = 300) {
        // Initialize variables
        this.dataPoints = [];
        this.maxDataPoints = max_data_points;
    }

    public addDataPoint(x: number, y: number): void {
        this.dataPoints.push({ x, y });
        this.updateGraph();
    }

    public setDataPoints(dataPoints: Array<{ x: number; y: number }>): void {
        this.dataPoints = dataPoints;
        this.updateGraph();
    }

    protected abstract updateGraph(): void;
}


/**
 * Class representing a line graph.
 */
class LineGraphRepresentation extends Representation {
    // Variables for DOM elements can be added here
    // ...

    constructor(max_data_points: number = 300) {
        super(max_data_points);

        // Initialize line graph HTML in DOM
        this.initializeLineGraph();
        // Update the graph with initial data points
        this.updateGraph();
    }

    private initializeLineGraph(): void {
        // Init the DOM elements for this graph
        // Also make sure to save important references to class variables
        // Do not input the data points just yet in this function
    }

    protected updateGraph(): void {
        // Update the line graph with new data points
        // ...
    }
}