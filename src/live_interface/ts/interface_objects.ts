enum InterfaceObjectType {
    PANEL,

    LINE_GRAPH,
    BAR_GRAPH,

    TWO_D_DIRECTIONAL_INDICATOR,
    THREE_D_DIRECTIONAL_INDICATOR,
    STATUS_DISPLAY,
    MAP,

    CONTROLLER,
}

enum InterfaceNotificationType {
    INFO,
    WARNING,
    ERROR,
}

export type DataPoint = { x: number; y: number };
export type LineStyle = {
    color: string;
    width: number;
    dashArray?: string;
    opacity: number;
};

export abstract class InterfaceObject {
    private UUID: string;
    public getUUID(): string { return this.UUID; }

    // Common properties for all interface objects
    protected abstract type: string;
    protected posX: number;
    protected posY: number;
    protected width: number;
    protected height: number;

    protected dataLabel: string;

    // DOM element
    protected element!: HTMLDivElement;

    constructor(UUID: string, dataLabel: string, {posX, posY}: {posX: number, posY: number}, {width, height}: {width: number, height: number}) {
        // Set properties
        this.UUID = UUID;
        this.dataLabel = dataLabel;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    }

    /**
     * Updates the current data in the interface object.
     */
    public abstract updateData(timestamp: number, value: any): void;

    /**
     * Renders a frame of the interface object with the current data.
     */
    protected abstract renderFrame(): void;

    /**
     * Initializes the DOM element for the interface object.
     */
    protected abstract initializeElement(): void;

    /**
     * Returns the DOM element.
     */
    public getElement(): HTMLDivElement {
        return this.element;
    }

    /**
     * Returns the data label this object listens to.
     */
    public getDataLabel(): string {
        return this.dataLabel;
    }
}

/**
 * Line Graph Interface Object
 */
export class LineGraphInterfaceObject extends InterfaceObject {
    protected type: string = 'LINE_GRAPH';

    // Graph configuration
    private title: string;
    private unit: string;
    private yMin: number;
    private yMax: number;
    private timeWindow: number; // in seconds

    // Data storage
    private dataPoints: DataPoint[] = [];

    // Data Point Display
    private dataPointsDisplayMinTime: number;
    private dataPointsDisplayMaxTime: number;

    // DOM references
    private graphTitle!: HTMLHeadingElement;
    private polyline!: SVGPolylineElement;
    private xAxisLine!: SVGLineElement;
    private xAxisLabel!: HTMLSpanElement;
    private xAxisMinLabel!: HTMLSpanElement;
    private yAxisLabels!: HTMLDivElement;

    // Visual settings
    private lineStyle: LineStyle;

    // Track first timestamp for relative time calculation
    private firstTimestamp: number | null = null;

    constructor(
        UUID: string,
        dataLabel: string,
        title: string,
        unit: string,
        yMin: number,
        yMax: number,
        position: {posX: number, posY: number},
        size: {width: number, height: number},
        timeWindow: number = 30,
        lineStyle?: LineStyle
    ) {
        super(UUID, dataLabel, position, size);
        
        this.title = title;
        this.unit = unit;
        this.yMin = yMin;
        this.yMax = yMax;
        this.timeWindow = timeWindow;

        // Initialize data point display range
        this.dataPointsDisplayMinTime = 0;
        this.dataPointsDisplayMaxTime = timeWindow;

        // Default line style
        this.lineStyle = lineStyle || {
            color: '#f5a623',
            width: 2,
            opacity: 1
        };

        // Initialize DOM element
        this.initializeElement();
    }

    protected initializeElement(): void {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'interface-object line-graph-object';
        this.element.style.left = `${this.posX}px`;
        this.element.style.top = `${this.posY}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;

        // Create header
        const header = document.createElement('div');
        header.className = 'line-graph-header';
        
        this.graphTitle = document.createElement('h2');
        this.graphTitle.className = 'line-graph-title';
        this.graphTitle.textContent = this.title;
        header.appendChild(this.graphTitle);

        // Create content container
        const content = document.createElement('div');
        content.className = 'line-graph-content';

        // Y-axis section
        const yAxisSection = document.createElement('div');
        yAxisSection.className = 'y-axis-section';
        
        const yAxisTitle = document.createElement('div');
        yAxisTitle.className = 'y-axis-title';
        yAxisTitle.textContent = this.unit;
        
        this.yAxisLabels = document.createElement('div');
        this.yAxisLabels.className = 'y-axis-labels';
        this.updateYAxisLabels();
        
        yAxisSection.appendChild(yAxisTitle);
        yAxisSection.appendChild(this.yAxisLabels);

        // Graph canvas wrapper
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'graph-canvas-wrapper';
        
        const graphCanvas = document.createElement('div');
        graphCanvas.className = 'graph-canvas';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'graph-svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // X-axis line
        this.xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.xAxisLine.setAttribute('x1', '0');
        this.xAxisLine.setAttribute('y1', '50');
        this.xAxisLine.setAttribute('x2', '100');
        this.xAxisLine.setAttribute('y2', '50');
        this.xAxisLine.setAttribute('stroke', '#555555');
        this.xAxisLine.setAttribute('stroke-width', '1');
        this.xAxisLine.setAttribute('vector-effect', 'non-scaling-stroke');
        
        // Y-axis line
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', '0');
        yAxis.setAttribute('y1', '0');
        yAxis.setAttribute('x2', '0');
        yAxis.setAttribute('y2', '100');
        yAxis.setAttribute('stroke', '#555555');
        yAxis.setAttribute('stroke-width', '1');
        yAxis.setAttribute('vector-effect', 'non-scaling-stroke');
        
        // Polyline for data
        this.polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        this.polyline.setAttribute('fill', 'none');
        this.polyline.setAttribute('vector-effect', 'non-scaling-stroke');
        this.polyline.setAttribute('stroke', this.lineStyle.color);
        this.polyline.setAttribute('stroke-width', this.lineStyle.width.toString());
        this.polyline.setAttribute('stroke-opacity', this.lineStyle.opacity.toString());
        if (this.lineStyle.dashArray) {
            this.polyline.setAttribute('stroke-dasharray', this.lineStyle.dashArray);
        }
        
        svg.appendChild(this.xAxisLine);
        svg.appendChild(yAxis);
        svg.appendChild(this.polyline);
        
        graphCanvas.appendChild(svg);
        
        // X-axis info
        const xAxisInfo = document.createElement('div');
        xAxisInfo.className = 'x-axis-info';
        
        this.xAxisMinLabel = document.createElement('span');
        this.xAxisMinLabel.className = 'x-axis-label-min';
        this.xAxisMinLabel.textContent = '0';
        
        const xAxisTitle = document.createElement('span');
        xAxisTitle.className = 'x-axis-title';
        xAxisTitle.textContent = 'Time (s)';
        
        this.xAxisLabel = document.createElement('span');
        this.xAxisLabel.className = 'x-axis-label';
        this.xAxisLabel.textContent = this.timeWindow.toString();
        
        xAxisInfo.appendChild(this.xAxisMinLabel);
        xAxisInfo.appendChild(xAxisTitle);
        xAxisInfo.appendChild(this.xAxisLabel);
        
        canvasWrapper.appendChild(graphCanvas);
        canvasWrapper.appendChild(xAxisInfo);
        
        content.appendChild(yAxisSection);
        content.appendChild(canvasWrapper);

        // Assemble
        this.element.appendChild(header);
        this.element.appendChild(content);
    }

    public updateData(timestamp: number, value: any): void {
        // Initialize first timestamp if not set
        if (this.firstTimestamp === null) {
            this.firstTimestamp = timestamp;
        }

        // Calculate relative time
        const relativeTime = timestamp - this.firstTimestamp;

        // Extract numeric value
        let numericValue: number;
        if (typeof value === 'number') {
            numericValue = value;
        } else if (typeof value === 'object' && value !== null && 'value' in value) {
            numericValue = value.value;
        } else {
            console.warn(`[LineGraphInterfaceObject] Invalid value type for ${this.dataLabel}:`, value);
            return;
        }

        // Add data point
        this.dataPoints.push({ x: relativeTime, y: numericValue });

        // Render update
        this.renderFrame();
    }

    protected renderFrame(): void {
        if (this.dataPoints.length === 0) {
            this.polyline.setAttribute('points', '');
            return;
        }

        // Determine time range
        const lastTime = this.dataPoints[this.dataPoints.length - 1].x;
        const firstTime = this.dataPoints[0].x;
        const dataSpan = lastTime - firstTime;

        // Update display window if data exceeds time window
        if (dataSpan >= this.timeWindow) {
            this.dataPointsDisplayMinTime = Math.max(lastTime - this.timeWindow, 0);
            this.dataPointsDisplayMaxTime = Math.max(lastTime, this.timeWindow);
            
            this.xAxisMinLabel.textContent = this.dataPointsDisplayMinTime.toFixed(1);
            this.xAxisLabel.textContent = this.dataPointsDisplayMaxTime.toFixed(1);
        }

        // Update polyline
        const timeRange = this.dataPointsDisplayMaxTime - this.dataPointsDisplayMinTime;
        
        if (timeRange === 0) {
            const svgPoints = this.dataPoints.map(point => {
                const x = 0;
                const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
            this.polyline.setAttribute('points', svgPoints);
            return;
        }

        // Filter and convert data points to SVG coordinates
        const svgPoints = this.dataPoints
            .filter(point => point.x >= this.dataPointsDisplayMinTime && point.x <= this.dataPointsDisplayMaxTime)
            .map(point => {
                const x = ((point.x - this.dataPointsDisplayMinTime) / timeRange) * 100;
                const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(' ');

        this.polyline.setAttribute('points', svgPoints);

        // Update x-axis position
        this.updateXAxisPosition();
    }

    private updateXAxisPosition(): void {
        let yPosition: number;
        
        if (this.yMin <= 0 && this.yMax >= 0) {
            yPosition = 100 - ((0 - this.yMin) / (this.yMax - this.yMin)) * 100;
        } else if (this.yMin > 0) {
            yPosition = 100;
        } else {
            yPosition = 0;
        }
        
        this.xAxisLine.setAttribute('y1', yPosition.toString());
        this.xAxisLine.setAttribute('y2', yPosition.toString());
    }

    private updateYAxisLabels(): void {
        this.yAxisLabels.innerHTML = '';
        this.yAxisLabels.style.position = 'relative';
        
        const topLabel = document.createElement('span');
        topLabel.className = 'y-label';
        topLabel.textContent = this.yMax.toString();
        topLabel.style.position = 'absolute';
        topLabel.style.top = '0%';
        topLabel.style.right = '0';
        topLabel.style.transform = 'translateY(-50%)';
        
        const bottomLabel = document.createElement('span');
        bottomLabel.className = 'y-label';
        bottomLabel.textContent = this.yMin.toString();
        bottomLabel.style.position = 'absolute';
        bottomLabel.style.bottom = '0%';
        bottomLabel.style.right = '0';
        bottomLabel.style.transform = 'translateY(50%)';
        
        this.yAxisLabels.appendChild(topLabel);
        this.yAxisLabels.appendChild(bottomLabel);
        
        // Add zero label if in range
        if (this.yMin <= 0 && this.yMax >= 0) {
            const zeroPercentFromTop = ((this.yMax - 0) / (this.yMax - this.yMin)) * 100;
            const distanceFromTop = zeroPercentFromTop;
            const distanceFromBottom = 100 - zeroPercentFromTop;
            const proximityThreshold = 7.41;
            
            if (distanceFromTop >= proximityThreshold && distanceFromBottom >= proximityThreshold) {
                const zeroLabel = document.createElement('span');
                zeroLabel.className = 'y-label';
                zeroLabel.textContent = '0';
                zeroLabel.style.position = 'absolute';
                zeroLabel.style.top = `${zeroPercentFromTop}%`;
                zeroLabel.style.right = '0';
                zeroLabel.style.transform = 'translateY(-50%)';
                
                this.yAxisLabels.appendChild(zeroLabel);
            }
        }
    }
}