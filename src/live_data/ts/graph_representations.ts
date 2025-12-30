type DataPoints = Array<{ x: number; y: number }>;
type DataPointsCollection = { [collectionKey: string]: DataPoints }

/**
 * Abstract class representing a generic graph.
 */
abstract class GraphicalRepresentation {
    protected static GRAPHS_CONTAINER_ID: string = "graphs-container"

    protected dataPointsCollection: DataPointsCollection;

    constructor() {
        // Initialize variables
        this.dataPointsCollection = {};
    }

    /**
     * Adds a data point to a specific collection.
     */
    public addDataPoint(x: number, y: number, collectionKey: string = "default"): void {
        // Check if the collection exists, if not create it.
        if (!this.dataPointsCollection[collectionKey]) {
            this.addCollection(collectionKey);
        }

        // Add the data point
        this.dataPointsCollection[collectionKey].push({ x, y });
        // Update the graph interface
        this.update();
    }

    /**
     * Sets the entire collection of data points for a specific key.
     */
    public setCollection(dataPoints: Array<{ x: number; y: number }>, collectionKey: string = "default"): void {
        // Check if the collection exists, if not create it.
        if (!this.dataPointsCollection[collectionKey]) {
            this.addCollection(collectionKey);
        }

        this.dataPointsCollection[collectionKey] = dataPoints;
        this.update();
    }

    /**
     * Adds a new empty data points collection.
     */
    private addCollection(collectionKey: string): void {
        // Check if the collection exists, if not create it.
        if (this.dataPointsCollection[collectionKey])
        {
            console.warn(`[GraphicalRepresentation] Data points collection with key '${collectionKey}' already exists`);
            return;
        }

        // Create the collection
        this.dataPointsCollection[collectionKey] = [];
        console.log(`[GraphicalRepresentation] Created new data points collection with key '${collectionKey}'`);
    }
    
    protected abstract update(): void;


    public getDataPointsCollection(latest: boolean, amount: number, collection: string = 'default'): DataPoints {
        // Get the data points collection
        const dataPoints = this.dataPointsCollection[collection];
        if (!dataPoints) {
            console.warn(`[LineGraphRepresentation] No data points found for collection key '${collection}'`);
            return [];
        }

        // Return the requested data points
        if (latest) {
            return dataPoints.slice(-amount);
        } else {
            return dataPoints.slice(0, amount);
        }
    }

    public getAllCollectionKeys(): string[] {
        return Object.keys(this.dataPointsCollection);
    }
}

// #region LineGraph Representation
/**
 * Enums for linear graph x-axis overflow modes.
 */
enum LineGraphXOverflowMode {
    ScaleAxis,
    ShiftGraph,
    None
}

/**
 * Enums for linear graph y-axis overflow modes.
 */
enum LineGraphYOverflowMode {
    ScaleAxis,
    None
}

type LineStyle = {
    color: string;
    width: number;
    dashArray?: string;
    opacity: number;
}

type LineGraphStyleSettings = {
    // Overflow Modes
    xOverflowMode: LineGraphXOverflowMode;
    yOverflowMode: LineGraphYOverflowMode;

    // Line Styles
    collectionLineStyles: { [collectionKey: string]: LineStyle };
}

/**
 * Class representing a line graph.
 */
class LineGraphRepresentation extends GraphicalRepresentation {
    // DOM element references
    private graphRow!: HTMLDivElement;
    private graphTitle!: HTMLHeadingElement;
    private polylines!: { [collectionKey: string]: SVGPolylineElement };
    private xAxisLine!: SVGLineElement;
    private xAxisLabel!: HTMLSpanElement;
    private xAxisMinLabel!: HTMLSpanElement;
    private yAxisLabels!: HTMLDivElement;
    private infoStats!: HTMLDivElement;
    private collectionButtonsContainer!: HTMLDivElement;
    private collectionButtons!: { [collectionKey: string]: HTMLButtonElement };
    
    // Graph configuration
    private title: string;
    private unit: string;
    private yMin: number;
    private yMax: number;
    private timeWindow: number; // in seconds

    private collectionBeingInspected: string | null = null;
    private collectionVisibility: { [collectionKey: string]: boolean } = {};
    private collectionVisibilityBeforeInspection: { [collectionKey: string]: boolean } = {};

    // Data Point Display
    private dataPointsDisplayMinTime: number;
    private dataPointsDisplayMaxTime: number;

    // Graph Visual Settings
    private styleSettings: LineGraphStyleSettings;

    // Default line style
    private static DEFAULT_LINE_STYLE: LineStyle = {
        color: '#f5a623',
        width: 2,
        opacity: 1
    };

    constructor(
        title: string,
        unit: string,
        yMin: number,
        yMax: number,
        timeWindow: number = 30,
        collections: { [key: string]: LineStyle } = { 'default': LineGraphRepresentation.DEFAULT_LINE_STYLE }
    ) {
        super();
        
        // Initialize general graph settings
        this.title = title;
        this.unit = unit;
        this.yMin = yMin;
        this.yMax = yMax;
        this.timeWindow = timeWindow;

        // Initialize data point display range
        this.dataPointsDisplayMinTime = 0;
        this.dataPointsDisplayMaxTime = timeWindow;

        // Initialize polylines map and collection buttons
        this.polylines = {};
        this.collectionButtons = {};

        // Initialize default style settings
        this.styleSettings = {
            xOverflowMode: LineGraphXOverflowMode.ShiftGraph,
            yOverflowMode: LineGraphYOverflowMode.ScaleAxis,
            collectionLineStyles: {}
        };

        // Initialize collections in data points and provided styles
        for (const collectionKey in collections) {
            console.log(`[LineGraphRepresentation] Initializing collection '${collectionKey}' with style:`, collections[collectionKey]);
            this.styleSettings.collectionLineStyles[collectionKey] = collections[collectionKey];
            this.dataPointsCollection[collectionKey] = [];
            this.collectionVisibility[collectionKey] = true; // All collections visible by default
        }

        // Initialize inspected collection to the first one
        const firstCollectionKey = Object.keys(collections)[0];
        if (firstCollectionKey) {
            this.collectionBeingInspected = firstCollectionKey;
        }

        // Initialize line graph HTML in DOM
        this.initializeLineGraph();
        // Update the graph with initial data points
        this.update();
    }

    private initializeLineGraph(): void {
        // Get the graphs container
        const container = document.getElementById(GraphicalRepresentation.GRAPHS_CONTAINER_ID);
        if (!container) {
            console.error(`$${GraphicalRepresentation.GRAPHS_CONTAINER_ID} not found`);
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
        
        // Append to svg
        svg.appendChild(this.xAxisLine);
        svg.appendChild(yAxis);

        // Create the polyline for each collection
        for (const collectionKey in this.dataPointsCollection) {
            const polyline = this.initializeCollectionPolyline(collectionKey);
            svg.appendChild(polyline);
        }
        
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
        
        // Create collection buttons container
        this.collectionButtonsContainer = document.createElement('div');
        this.collectionButtonsContainer.className = 'collection-buttons';
        this.collectionButtonsContainer.style.display = 'grid';
        this.collectionButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        this.collectionButtonsContainer.style.gap = '4px';
        this.collectionButtonsContainer.style.marginBottom = '10px';
        
        // Only show buttons if there are multiple collections
        const collectionCount = Object.keys(this.dataPointsCollection).length;
        if (collectionCount > 1) {
            // Create a button for each collection
            for (const collectionKey in this.dataPointsCollection) {
                this.createCollectionButton(collectionKey);
            }
        } else {
            // Hide the container if there's only one collection
            this.collectionButtonsContainer.style.display = 'none';
        }
        
        this.infoStats = document.createElement('div');
        this.infoStats.className = 'info-stats';
        
        // Create 6 info items
        const infoLabels = ['Max', 'Min', 'Avg', 'Current', 'Time Delta', 'Duration'];
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
        graphInfo.appendChild(this.collectionButtonsContainer);
        graphInfo.appendChild(this.infoStats);
        
        // Assemble the graph row
        this.graphRow.appendChild(graphMain);
        this.graphRow.appendChild(graphInfo);
        
        // Add to container
        container.appendChild(this.graphRow);
    }

    private initializeCollectionPolyline(collectionKey: string): SVGPolylineElement {
        // Polyline for graph
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('vector-effect', 'non-scaling-stroke')
        this.polylines[collectionKey] = polyline;
        return polyline;
    }

    private createCollectionButton(collectionKey: string): void {
        const button = document.createElement('button');
        button.className = 'collection-button';
        button.textContent = collectionKey;
        button.style.cursor = 'pointer';
        button.style.border = '1px solid #555';
        button.style.borderRadius = '4px';
        button.style.backgroundColor = '#2a2a2a';
        button.style.color = '#ffffff';
        button.style.padding = '4px 8px';
        button.style.fontSize = '12px';
        button.style.transition = 'background-color 0.2s';
        button.style.boxSizing = 'border-box';
        
        // Get the line style color for this collection
        const lineStyle = this.styleSettings.collectionLineStyles[collectionKey];
        if (lineStyle) {
            button.style.borderLeftColor = lineStyle.color;
            button.style.borderLeftWidth = '3px';
        }
        
        // Right click: toggle visibility
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleCollectionVisibility(collectionKey);
            this.updateCollectionButtonAppearance(collectionKey);
        });
        
        // Left click: set as inspected collection
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Restore previous inspected collection's original visibility
            if (this.collectionBeingInspected !== null && this.collectionBeingInspected !== collectionKey) {
                const previousKey = this.collectionBeingInspected;
                const originalVisibility = this.collectionVisibilityBeforeInspection[previousKey];
                if (originalVisibility !== undefined) {
                    this.collectionVisibility[previousKey] = originalVisibility;
                    const previousPolyline = this.polylines[previousKey];
                    if (previousPolyline) {
                        previousPolyline.style.display = originalVisibility ? '' : 'none';
                    }
                }
            }
            
            // Save current visibility before making it inspected
            if (this.collectionBeingInspected !== collectionKey) {
                this.collectionVisibilityBeforeInspection[collectionKey] = this.collectionVisibility[collectionKey];
            }
            
            this.collectionBeingInspected = collectionKey;
            
            // Always make the inspected collection visible
            if (!this.collectionVisibility[collectionKey]) {
                this.collectionVisibility[collectionKey] = true;
                const polyline = this.polylines[collectionKey];
                if (polyline) {
                    polyline.style.display = '';
                }
            }
            
            this.updateAllCollectionButtonsAppearance();
            this.update(); // Update to show new stats
        });
        
        this.collectionButtons[collectionKey] = button;
        this.collectionButtonsContainer.appendChild(button);
        this.updateCollectionButtonAppearance(collectionKey);
    }

    private toggleCollectionVisibility(collectionKey: string): void {
        // Don't allow hiding the inspected collection
        if (this.collectionBeingInspected === collectionKey && this.collectionVisibility[collectionKey]) {
            return; // Cannot hide the inspected collection
        }
        
        this.collectionVisibility[collectionKey] = !this.collectionVisibility[collectionKey];
        const polyline = this.polylines[collectionKey];
        if (polyline) {
            polyline.style.display = this.collectionVisibility[collectionKey] ? '' : 'none';
        }
    }

    private updateCollectionButtonAppearance(collectionKey: string): void {
        const button = this.collectionButtons[collectionKey];
        if (!button) return;
        
        const isVisible = this.collectionVisibility[collectionKey];
        const isInspected = this.collectionBeingInspected === collectionKey;
        
        // Update button style based on state
        if (isInspected) {
            button.style.backgroundColor = '#7a7a7aff';
            button.style.fontWeight = 'bold';
        } else {
            button.style.backgroundColor = '#2a2a2a';
            button.style.fontWeight = 'normal';
        }
        
        if (!isVisible) {
            button.style.opacity = '0.5';
        } else {
            button.style.opacity = '1';
        }
    }

    private updateAllCollectionButtonsAppearance(): void {
        for (const collectionKey in this.collectionButtons) {
            this.updateCollectionButtonAppearance(collectionKey);
        }
    }

    protected update(): void {
        // Determine the domain (time range) for the graph
        let firstTime: number = Infinity;
        let lastTime: number = -Infinity;
        for (const collectionKey in this.dataPointsCollection) {
            // Get the datapoints collection
            const dataPoints = this.dataPointsCollection[collectionKey];
            if (dataPoints.length === 0) continue;

            // Get first and last times
            const first = dataPoints[0].x;
            const last = dataPoints[dataPoints.length - 1].x;

            // Update overall first and last times
            if (last > lastTime)
                lastTime = last;
            if (first < firstTime)
                firstTime = first;
        }
        const dataSpan = lastTime - firstTime;

        // Determine which mode to apply
        if (dataSpan >= this.timeWindow) {
            if (this.styleSettings.xOverflowMode === LineGraphXOverflowMode.ShiftGraph) {
                // Shift the displayed time window to show the most recent data
                this.dataPointsDisplayMinTime = Math.max(lastTime - this.timeWindow, 0);
                this.dataPointsDisplayMaxTime = Math.max(lastTime, this.timeWindow);
            }
            else if (this.styleSettings.xOverflowMode === LineGraphXOverflowMode.ScaleAxis) {
                // Keep the original time window from 0 to timeWindow
                this.dataPointsDisplayMinTime = 0;
                this.dataPointsDisplayMaxTime = Math.max(lastTime, this.timeWindow);
            } else {
                // No overflow handling, keep original time window
                console.log(`[LineGraphRepresentation] No x-axis overflow handling applied.`);
            }
            
            // Update both min and max time labels to show the current time range
            this.xAxisMinLabel.textContent = this.dataPointsDisplayMinTime.toFixed(1);
            this.xAxisLabel.textContent = this.dataPointsDisplayMaxTime.toFixed(1);
        }

        // Set graph inspection to default if only one collection exists and none is selected
        if (this.collectionBeingInspected === null) {
            const collectionKeys = Object.keys(this.dataPointsCollection);
            if (collectionKeys.length > 0) {
                this.collectionBeingInspected = collectionKeys[0];
            }
        }

        // Update the line for each data collection and its visual style
        for (const collectionKey in this.dataPointsCollection) {
            this.updateVisualStyleForCollection(collectionKey);
            this.updateCollectionLine(collectionKey);
        }

        // Update the x-axis position
        this.updateXAxisPosition();
        
        // Update button appearances to reflect current state
        this.updateAllCollectionButtonsAppearance();
    }

    /**
     * Updates the line visual for a specific data collection.
     * Returns true if y-axis bounds changed.
     */
    private updateCollectionLine(collectionKey: string): void
    {
        // Get the datapoints collection
        const dataPoints = this.dataPointsCollection[collectionKey];
        if (!dataPoints) {
            console.warn(`[LineGraphRepresentation] No data points found for collection key '${collectionKey}'`);
            return;
        }

        // Get the polyline element
        const polyline = this.polylines[collectionKey];
        if (!polyline) {
            console.warn(`[LineGraphRepresentation] No polyline found for collection key '${collectionKey}'`);
            return;
        }

        // Stop if there are no data points present
        if (dataPoints.length === 0) {
            polyline.setAttribute('points', '');
            return;
        }

        // Calculate min & max y-values
        const dataPointsSorted = dataPoints.slice().sort((a, b) => a.x - b.x);
        const yValues = dataPointsSorted.map(p => p.y);
        const max = Math.max(...yValues);
        const min = Math.min(...yValues);

        // Determine if the y-axis bounds needs to be updated
        const yAxisScalingEnabled = this.styleSettings.yOverflowMode === LineGraphYOverflowMode.ScaleAxis;
        if (yAxisScalingEnabled)
        {
            let boundsYChanged = false;
            const scaledMax = Math.ceil(max * 1.10);
            const scaledMin = Math.floor(min * 1.10);

            if (scaledMax > this.yMax) {
                this.yMax = scaledMax;
                boundsYChanged = true;
            }
            if (scaledMin < this.yMin) {
                this.yMin = scaledMin;
                boundsYChanged = true;
            }    

            // Update the line y-axis labels and x-axis position if bounds changed
            if (boundsYChanged) {
                this.updateYAxisLabels();
            }
        }

        // Calculate and display info stats if this collection is being inspected
        if (this.collectionBeingInspected === collectionKey) {
            // Calculate other statistics of the collection
            const avg = yValues.reduce((a, b) => a + b, 0) / yValues.length;
            const current = yValues[yValues.length - 1];
            const delay = (dataPointsSorted.length >= 1 ? dataPointsSorted[dataPointsSorted.length - 1].x : 0) - (dataPointsSorted.length >= 2 ? dataPointsSorted[dataPointsSorted.length - 2].x : 0);
            const duration = dataPointsSorted.length > 0 
                ? dataPointsSorted[dataPointsSorted.length - 1].x - dataPointsSorted[0].x 
                : 0;
            
            // Update info stats
            this.updateInfoStat('max', `${max.toFixed(1)} ${this.unit}`);
            this.updateInfoStat('min', `${min.toFixed(1)} ${this.unit}`);
            this.updateInfoStat('avg', `${avg.toFixed(1)} ${this.unit}`);
            this.updateInfoStat('current', `${current.toFixed(1)} ${this.unit}`);
            this.updateInfoStat('time delta', `${delay.toFixed(3)}s`);
            this.updateInfoStat('duration', `${duration.toFixed(1)}s`);
        }

        // Update the polyline points for this collection
        const timeRange = this.dataPointsDisplayMaxTime - this.dataPointsDisplayMinTime;

        // Handle edge case where all points have the same time
        if (timeRange === 0) {
            // Plot all points at x=0 (left side)
            const svgPoints = dataPointsSorted.map(point => {
                const x = 0;
                const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
            polyline.setAttribute('points', svgPoints);
            return;
        }

        // Get closest out-of-bounds points to display range
        const { beforeIndex, afterIndex } = this.getClosestOutOfBoundsPointIndexices(dataPointsSorted);

        // Convert data points that will be displayed to SVG coordinates
        const svgPoints = dataPointsSorted.map(point => {
            // Do not display the point if it's outside the current time window AND not the closest OOBP to the visible point
            if (point.x < this.dataPointsDisplayMinTime || point.x > this.dataPointsDisplayMaxTime) 
            {
                if (beforeIndex !== null && dataPointsSorted[beforeIndex] === point
                    && afterIndex !== null && dataPointsSorted[afterIndex] === point) 
                    return null;
            }

            // Map x to start from left (0) and grow to right (100)
            const x = ((point.x - this.dataPointsDisplayMinTime) / timeRange) * 100;
            
            // Map y from [yMin, yMax] to [100, 0] (inverted)
            const y = 100 - ((point.y - this.yMin) / (this.yMax - this.yMin)) * 100;
            
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).filter(p => p !== null).join(' '); // (This filters out the nulls)

        polyline.setAttribute('points', svgPoints);
    }

    /**
     * Determines if a data point is the closest out-of-bounds point (OOBP) to the visible range.
     */
    private getClosestOutOfBoundsPointIndexices(dataPoints: DataPoints): { beforeIndex: number | null; afterIndex: number | null } {
        // Initialize Variables
        let beforeIndex: number | null = null;
        let afterIndex: number | null = null;

        // Find the closest point before the visible range
        for (let i = dataPoints.length - 1; i >= 0; i--) {
            if (dataPoints[i].x < this.dataPointsDisplayMinTime) {
                beforeIndex = i;
                break;
            }
        }

        // Find the closest point after the visible range
        for (let i = 0; i < dataPoints.length; i++) {
            if (dataPoints[i].x > this.dataPointsDisplayMaxTime) {
                afterIndex = i;
                break;
            }
        }

        return { beforeIndex, afterIndex };
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

    private updateVisualStyleForCollection(collectionKey: string): void {
        // Get the line style for the collection
        const lineStyle = this.styleSettings.collectionLineStyles[collectionKey];
        if (!lineStyle) {
            console.warn(`[LineGraphRepresentation] No line style defined for collection key '${collectionKey}'`);
            return;
        }

        // Get the polyline element
        const polyline = this.polylines[collectionKey];
        if (!polyline) {
            console.warn(`[LineGraphRepresentation] No polyline found for collection key '${collectionKey}'`);
            return;
        }

        // Apply styles to the polyline
        polyline.setAttribute('stroke', lineStyle.color);
        polyline.setAttribute('stroke-width', lineStyle.width.toString());
        polyline.setAttribute('stroke-opacity', lineStyle.opacity.toString());

        // Apply stroke dash array if defined
        if (lineStyle.dashArray) {
            polyline.setAttribute('stroke-dasharray', lineStyle.dashArray);
        }
    }

    public setOverflowY(overflowMode: LineGraphYOverflowMode): void {
        this.styleSettings.yOverflowMode = overflowMode;
    }

    public setOverflowX(overflowMode: LineGraphXOverflowMode): void {
        this.styleSettings.xOverflowMode = overflowMode;
    }
}

// #endregion