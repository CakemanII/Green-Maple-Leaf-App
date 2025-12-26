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
        
        // Clip oldest data if we exceed maxDataPoints
        if (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift(); // Remove the oldest point
        }
        
        this.update();
    }

    public setDataPoints(dataPoints: Array<{ x: number; y: number }>): void {
        this.dataPoints = dataPoints;
        this.update();
    }

    protected abstract update(): void;
}


/**
 * Class representing a line graph.
 */
class LineGraphRepresentation extends Representation {
    // DOM element references
    private graphRow!: HTMLDivElement;
    private graphTitle!: HTMLHeadingElement;
    private polyline!: SVGPolylineElement;
    private xAxisLine!: SVGLineElement;
    private xAxisLabel!: HTMLSpanElement;
    private xAxisMinLabel!: HTMLSpanElement;
    private yAxisLabels!: HTMLDivElement;
    private infoStats!: HTMLDivElement;
    
    // Graph configuration
    private title: string;
    private unit: string;
    private yMin: number;
    private yMax: number;
    private timeWindow: number; // in seconds

    constructor(
        title: string,
        unit: string,
        yMin: number,
        yMax: number,
        timeWindow: number = 30,
        max_data_points: number = 300
    ) {
        super(max_data_points);
        
        this.title = title;
        this.unit = unit;
        this.yMin = yMin;
        this.yMax = yMax;
        this.timeWindow = timeWindow;

        // Initialize line graph HTML in DOM
        this.initializeLineGraph();
        // Update the graph with initial data points
        this.update();
    }

    private initializeLineGraph(): void {
        // Get the graphs container
        const container = document.getElementById('graphs-container');
        if (!container) {
            console.error('graphs-container not found');
            return;
        }

        // Create the graph row structure
        this.graphRow = document.createElement('div');
        this.graphRow.className = 'graph-row';
        
        // Create graph main section
        const graphMain = document.createElement('div');
        graphMain.className = 'graph-main';
        
        // Create header
        const graphHeader = document.createElement('div');
        graphHeader.className = 'graph-header';
        
        this.graphTitle = document.createElement('h2');
        this.graphTitle.className = 'graph-title';
        this.graphTitle.textContent = this.title;
        graphHeader.appendChild(this.graphTitle);
        
        // Create graph content
        const graphContent = document.createElement('div');
        graphContent.className = 'graph-content';
        
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
        
        // Polyline for graph
        this.polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        this.polyline.setAttribute('fill', 'none');
        this.polyline.setAttribute('stroke', '#f5a623');
        this.polyline.setAttribute('stroke-width', '2');
        this.polyline.setAttribute('vector-effect', 'non-scaling-stroke');
        
        svg.appendChild(this.xAxisLine);
        svg.appendChild(yAxis);
        svg.appendChild(this.polyline);
        
        graphCanvas.appendChild(svg);
        
        // X-axis info
        const xAxisInfo = document.createElement('div');
        xAxisInfo.className = 'x-axis-info';
        
        // Min time label (left side)
        this.xAxisMinLabel = document.createElement('span');
        this.xAxisMinLabel.className = 'x-axis-label-min';
        this.xAxisMinLabel.textContent = '0';
        
        const xAxisTitle = document.createElement('span');
        xAxisTitle.className = 'x-axis-title';
        xAxisTitle.textContent = 'Time (s)';
        
        // Max time label (right side)
        this.xAxisLabel = document.createElement('span');
        this.xAxisLabel.className = 'x-axis-label';
        this.xAxisLabel.textContent = this.timeWindow.toString();
        
        xAxisInfo.appendChild(this.xAxisMinLabel);
        xAxisInfo.appendChild(xAxisTitle);
        xAxisInfo.appendChild(this.xAxisLabel);
        
        canvasWrapper.appendChild(graphCanvas);
        canvasWrapper.appendChild(xAxisInfo);
        
        graphContent.appendChild(yAxisSection);
        graphContent.appendChild(canvasWrapper);
        
        graphMain.appendChild(graphHeader);
        graphMain.appendChild(graphContent);
        
        // Create info section
        const graphInfo = document.createElement('div');
        graphInfo.className = 'graph-info';
        
        const infoTitle = document.createElement('h3');
        infoTitle.textContent = 'Information';
        
        this.infoStats = document.createElement('div');
        this.infoStats.className = 'info-stats';
        
        // Create 6 info items
        const infoLabels = ['Max', 'Min', 'Avg', 'Current', 'Peak', 'Duration'];
        for (const label of infoLabels) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            infoItem.setAttribute('data-stat', label.toLowerCase());
            
            const itemLabel = document.createElement('span');
            itemLabel.className = 'info-label';
            itemLabel.textContent = label;
            
            const itemValue = document.createElement('span');
            itemValue.className = 'info-value';
            itemValue.textContent = '-';
            
            infoItem.appendChild(itemLabel);
            infoItem.appendChild(itemValue);
            this.infoStats.appendChild(infoItem);
        }
        
        graphInfo.appendChild(infoTitle);
        graphInfo.appendChild(this.infoStats);
        
        // Assemble the graph row
        this.graphRow.appendChild(graphMain);
        this.graphRow.appendChild(graphInfo);
        
        // Add to container
        container.appendChild(this.graphRow);
    }

    private updateYAxisLabels(): void {
        this.yAxisLabels.innerHTML = '';
        
        // Set the y-axis labels container to relative positioning
        this.yAxisLabels.style.position = 'relative';
        
        // Top label (yMax)
        const topLabel = document.createElement('span');
        topLabel.className = 'y-label';
        topLabel.textContent = this.yMax.toString();
        topLabel.style.position = 'absolute';
        topLabel.style.top = '0%';
        topLabel.style.right = '0';
        topLabel.style.transform = 'translateY(-50%)';
        
        // Bottom label (yMin)
        const bottomLabel = document.createElement('span');
        bottomLabel.className = 'y-label';
        bottomLabel.textContent = this.yMin.toString();
        bottomLabel.style.position = 'absolute';
        bottomLabel.style.bottom = '0%';
        bottomLabel.style.right = '0';
        bottomLabel.style.transform = 'translateY(50%)';
        
        this.yAxisLabels.appendChild(topLabel);
        this.yAxisLabels.appendChild(bottomLabel);
        
        // Check if 0 is within the range [yMin, yMax]
        const zeroInRange = this.yMin <= 0 && this.yMax >= 0;
        
        if (zeroInRange) {
            // Calculate where 0 should be positioned (as percentage from top)
            // Map 0 from [yMax, yMin] to [0%, 100%]
            const zeroPercentFromTop = ((this.yMax - 0) / (this.yMax - this.yMin)) * 100;
            
            // Calculate distances from top and bottom
            const distanceFromTop = zeroPercentFromTop;
            const distanceFromBottom = 100 - zeroPercentFromTop;
            
            // Threshold based on the ratio max:100, min:-9 where 0 is ~8.26% from bottom
            // max:100, min:-8 where 0 is ~7.41% from bottom
            // Hide the label if it gets closer than 8.3% to either edge
            const proximityThreshold = 7.41 //8.3;
            
            const isTooCloseToTop = distanceFromTop < proximityThreshold;
            const isTooCloseToBottom = distanceFromBottom < proximityThreshold;
            
            // Only show the 0 label if it's not too close to either edge
            if (!isTooCloseToTop && !isTooCloseToBottom) {
                // Create the 0 label
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

    protected update(): void {
        // Always update x-axis position based on current yMin and yMax
        this.updateXAxisPosition();
        
        if (this.dataPoints.length === 0) {
            this.polyline.setAttribute('points', '');
            return;
        }

        // Calculate stats
        const yValues = this.dataPoints.map(p => p.y);
        const max = Math.max(...yValues);
        const min = Math.min(...yValues);
        
        // Dynamically expand y-axis bounds if data exceeds current limits
        // Scale to 110% of the max magnitude point and round to integer
        let boundsChanged = false;
        const scaledMax = Math.ceil(max * 1.10);
        const scaledMin = Math.floor(min * 1.10);
        
        if (scaledMax > this.yMax) {
            this.yMax = scaledMax;
            boundsChanged = true;
        }
        if (scaledMin < this.yMin) {
            this.yMin = scaledMin;
            boundsChanged = true;
        }
        
        // Update y-axis labels and x-axis position if bounds changed
        if (boundsChanged) {
            this.updateYAxisLabels();
            this.updateXAxisPosition();
        }
        
        const avg = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        const current = yValues[yValues.length - 1];
        const peak = max; // Could be calculated differently if needed
        const duration = this.dataPoints.length > 0 
            ? this.dataPoints[this.dataPoints.length - 1].x - this.dataPoints[0].x 
            : 0;

        // Update info stats
        this.updateInfoStat('max', `${max.toFixed(1)} ${this.unit}`);
        this.updateInfoStat('min', `${min.toFixed(1)} ${this.unit}`);
        this.updateInfoStat('avg', `${avg.toFixed(1)} ${this.unit}`);
        this.updateInfoStat('current', `${current.toFixed(1)} ${this.unit}`);
        this.updateInfoStat('peak', `${peak.toFixed(1)} ${this.unit}`);
        this.updateInfoStat('duration', `${duration.toFixed(1)}s`);

        // Determine time range for the graph
        const firstTime = this.dataPoints[0].x;
        const lastTime = this.dataPoints[this.dataPoints.length - 1].x;
        const dataSpan = lastTime - firstTime;
        
        // Determine if we should show the full timeWindow or just the data span
        let displayTimeWindow: number;
        let startTime: number;
        let endTime: number;
        
        if (dataSpan >= this.timeWindow || this.dataPoints.length >= this.maxDataPoints) {
            // We've exceeded the time window OR we're clipping data
            // Use a sliding window that shows the most recent data
            displayTimeWindow = Math.max(dataSpan, this.timeWindow);
            endTime = lastTime;
            startTime = firstTime;
            
            // Update both min and max time labels to show the current time range
            this.xAxisMinLabel.textContent = startTime.toFixed(1);
            this.xAxisLabel.textContent = endTime.toFixed(1);
        } else {
            // Still within initial time window, start from 0
            displayTimeWindow = this.timeWindow;
            startTime = 0;
            endTime = this.timeWindow;
            
            // Keep the original labels (0 and timeWindow)
            this.xAxisMinLabel.textContent = startTime.toFixed(1);
            this.xAxisLabel.textContent = this.timeWindow.toString();
        }

        // Convert data points to SVG coordinates
        // X: map from [startTime, endTime] to [0, 100]
        // Y: map values to 0-100 range (inverted, because SVG y=0 is at top)
        
        const timeRange = endTime - startTime;
        
        // Handle edge case where all points have the same time
        if (timeRange === 0) {
            // Plot all points at x=0 (left side)
            const svgPoints = this.dataPoints.map(point => {
                const x = 0;
                const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
            this.polyline.setAttribute('points', svgPoints);
            return;
        }
        
        const svgPoints = this.dataPoints.map(point => {
            // Map x to start from left (0) and grow to right (100)
            const x = ((point.x - startTime) / timeRange) * 100;
            
            // Map y from [yMin, yMax] to [100, 0] (inverted)
            const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
            
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');

        this.polyline.setAttribute('points', svgPoints);
    }

    private updateInfoStat(statName: string, value: string): void {
        const infoItem = this.infoStats.querySelector(`[data-stat="${statName}"]`);
        if (infoItem) {
            const valueElement = infoItem.querySelector('.info-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    }

    private updateXAxisPosition(): void {
        // Calculate where y=0 should be in SVG coordinates
        let yPosition: number;
        
        // Check if 0 is within the range
        if (this.yMin <= 0 && this.yMax >= 0) {
            // 0 is in range, calculate its position
            // Map 0 from [yMin, yMax] to [100, 0] (inverted SVG coordinates)
            yPosition = 100 - ((0 - this.yMin) / (this.yMax - this.yMin)) * 100;
        } else if (this.yMin > 0) {
            // All values are positive, x-axis at bottom
            yPosition = 100;
        } else {
            // All values are negative, x-axis at top
            yPosition = 0;
        }
        
        // Update the x-axis line position
        this.xAxisLine.setAttribute('y1', yPosition.toString());
        this.xAxisLine.setAttribute('y2', yPosition.toString());
    }
}