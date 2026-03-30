/**
 * Abstract class representing a generic graph.
 */
export class GraphicalRepresentation {
    constructor(graphsContainerId = GraphicalRepresentation.GRAPHS_CONTAINER_ID) {
        // Initialize variables
        this.dataPointsCollection = {};
        this.graphsContainerId = graphsContainerId;
    }
    /**
     * Adds a data point to a specific collection.
     */
    addDataPoint(x, y, collectionKey = "default") {
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
    setCollection(dataPoints, collectionKey = "default") {
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
    addCollection(collectionKey) {
        // Check if the collection exists, if not create it.
        if (this.dataPointsCollection[collectionKey]) {
            console.warn(`[GraphicalRepresentation] Data points collection with key '${collectionKey}' already exists`);
            return;
        }
        // Create the collection
        this.dataPointsCollection[collectionKey] = [];
        console.log(`[GraphicalRepresentation] Created new data points collection with key '${collectionKey}'`);
    }
    getDataPointsCollection(latest, amount, collection = 'default') {
        // Get the data points collection
        const dataPoints = this.dataPointsCollection[collection];
        if (!dataPoints) {
            console.warn(`[LineGraphRepresentation] No data points found for collection key '${collection}'`);
            return [];
        }
        // Return the requested data points
        if (latest) {
            return dataPoints.slice(-amount);
        }
        else {
            return dataPoints.slice(0, amount);
        }
    }
    getAllCollectionKeys() {
        return Object.keys(this.dataPointsCollection);
    }
}
GraphicalRepresentation.GRAPHS_CONTAINER_ID = "graphs-container";
// #region LineGraph Representation
/**
 * Enums for linear graph x-axis overflow modes.
 */
export var LineGraphXOverflowMode;
(function (LineGraphXOverflowMode) {
    LineGraphXOverflowMode[LineGraphXOverflowMode["ScaleAxis"] = 0] = "ScaleAxis";
    LineGraphXOverflowMode[LineGraphXOverflowMode["ShiftGraph"] = 1] = "ShiftGraph";
    LineGraphXOverflowMode[LineGraphXOverflowMode["None"] = 2] = "None";
})(LineGraphXOverflowMode || (LineGraphXOverflowMode = {}));
/**
 * Enums for linear graph y-axis overflow modes.
 */
export var LineGraphYOverflowMode;
(function (LineGraphYOverflowMode) {
    LineGraphYOverflowMode[LineGraphYOverflowMode["ScaleAxis"] = 0] = "ScaleAxis";
    LineGraphYOverflowMode[LineGraphYOverflowMode["None"] = 1] = "None";
})(LineGraphYOverflowMode || (LineGraphYOverflowMode = {}));
/**
 * Class representing a line graph.
 */
export class LineGraphRepresentation extends GraphicalRepresentation {
    constructor(title, unit, yMin, yMax, timeWindow = 30, collections = { 'default': LineGraphRepresentation.DEFAULT_LINE_STYLE }, graphsContainerId = GraphicalRepresentation.GRAPHS_CONTAINER_ID) {
        super(graphsContainerId);
        this.collectionBeingInspected = null;
        this.collectionVisibility = {};
        this.collectionVisibilityBeforeInspection = {};
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
    initializeLineGraph() {
        // Get the graphs container
        const container = document.getElementById(this.graphsContainerId);
        if (!container) {
            console.error(`$${this.graphsContainerId} not found`);
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
        }
        else {
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
    initializeCollectionPolyline(collectionKey) {
        // Polyline for graph
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('vector-effect', 'non-scaling-stroke');
        this.polylines[collectionKey] = polyline;
        return polyline;
    }
    createCollectionButton(collectionKey) {
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
    toggleCollectionVisibility(collectionKey) {
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
    updateCollectionButtonAppearance(collectionKey) {
        const button = this.collectionButtons[collectionKey];
        if (!button)
            return;
        const isVisible = this.collectionVisibility[collectionKey];
        const isInspected = this.collectionBeingInspected === collectionKey;
        // Update button style based on state
        if (isInspected) {
            button.style.backgroundColor = '#7a7a7aff';
            button.style.fontWeight = 'bold';
        }
        else {
            button.style.backgroundColor = '#2a2a2a';
            button.style.fontWeight = 'normal';
        }
        if (!isVisible) {
            button.style.opacity = '0.5';
        }
        else {
            button.style.opacity = '1';
        }
    }
    updateAllCollectionButtonsAppearance() {
        for (const collectionKey in this.collectionButtons) {
            this.updateCollectionButtonAppearance(collectionKey);
        }
    }
    update() {
        // Determine the domain (time range) for the graph
        let firstTime = Infinity;
        let lastTime = -Infinity;
        for (const collectionKey in this.dataPointsCollection) {
            // Get the datapoints collection
            const dataPoints = this.dataPointsCollection[collectionKey];
            if (dataPoints.length === 0)
                continue;
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
        // Keep labels stable when there is no data yet.
        if (lastTime === -Infinity || firstTime === Infinity) {
            this.xAxisMinLabel.textContent = this.dataPointsDisplayMinTime.toFixed(1);
            this.xAxisLabel.textContent = this.dataPointsDisplayMaxTime.toFixed(1);
            return;
        }
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
            }
            else {
                // No overflow handling, keep original time window
                console.log(`[LineGraphRepresentation] No x-axis overflow handling applied.`);
            }
        }
        else {
            // Before overflow, show true first/last x values.
            this.dataPointsDisplayMinTime = firstTime;
            this.dataPointsDisplayMaxTime = lastTime;
        }
        // Always show first/last visible x-axis values.
        this.xAxisMinLabel.textContent = this.dataPointsDisplayMinTime.toFixed(1);
        this.xAxisLabel.textContent = this.dataPointsDisplayMaxTime.toFixed(1);
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
    updateCollectionLine(collectionKey) {
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
        if (yAxisScalingEnabled) {
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
            if (point.x < this.dataPointsDisplayMinTime || point.x > this.dataPointsDisplayMaxTime) {
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
    getClosestOutOfBoundsPointIndexices(dataPoints) {
        // Initialize Variables
        let beforeIndex = null;
        let afterIndex = null;
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
    updateInfoStat(statName, value) {
        const infoItem = this.infoStats.querySelector(`[data-stat="${statName}"]`);
        if (infoItem) {
            const valueElement = infoItem.querySelector('.info-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    }
    updateXAxisPosition() {
        // Calculate where y=0 should be in SVG coordinates
        let yPosition;
        // Check if 0 is within the range
        if (this.yMin <= 0 && this.yMax >= 0) {
            // 0 is in range, calculate its position
            // Map 0 from [yMin, yMax] to [100, 0] (inverted SVG coordinates)
            yPosition = 100 - ((0 - this.yMin) / (this.yMax - this.yMin)) * 100;
        }
        else if (this.yMin > 0) {
            // All values are positive, x-axis at bottom
            yPosition = 100;
        }
        else {
            // All values are negative, x-axis at top
            yPosition = 0;
        }
        // Update the x-axis line position
        this.xAxisLine.setAttribute('y1', yPosition.toString());
        this.xAxisLine.setAttribute('y2', yPosition.toString());
    }
    updateYAxisLabels() {
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
            const proximityThreshold = 7.41; //8.3;
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
    updateVisualStyleForCollection(collectionKey) {
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
    setOverflowY(overflowMode) {
        this.styleSettings.yOverflowMode = overflowMode;
    }
    setOverflowX(overflowMode) {
        this.styleSettings.xOverflowMode = overflowMode;
    }
}
// Default line style
LineGraphRepresentation.DEFAULT_LINE_STYLE = {
    color: '#f5a623',
    width: 2,
    opacity: 1
};
export class BarGraphRepresentation extends GraphicalRepresentation {
    constructor(title, unit, yMin, yMax, groups, barStyles = {}, graphsContainerId = GraphicalRepresentation.GRAPHS_CONTAINER_ID, decimals = 2) {
        super(graphsContainerId);
        this.barFillBySeriesId = {};
        this.barValueBySeriesId = {};
        this.infoValueBySeriesId = {};
        this.zeroLineByGroupId = {};
        this.title = title;
        this.unit = unit;
        this.yMin = yMin;
        this.yMax = yMax;
        this.groups = groups;
        this.barStyles = barStyles;
        this.decimals = decimals;
        this.initializeCollections();
        this.initializeBarGraph();
        this.update();
    }
    initializeCollections() {
        this.groups.forEach((group) => {
            group.series.forEach((series) => {
                if (!this.dataPointsCollection[series.id]) {
                    this.dataPointsCollection[series.id] = [];
                }
            });
        });
    }
    initializeBarGraph() {
        const container = document.getElementById(this.graphsContainerId);
        if (!container) {
            console.error(`$${this.graphsContainerId} not found`);
            return;
        }
        this.graphRow = document.createElement("div");
        this.graphRow.className = "graph-row bar-graph-row";
        const graphMain = document.createElement("div");
        graphMain.className = "graph-main";
        const graphHeader = document.createElement("div");
        graphHeader.className = "graph-header";
        this.graphTitle = document.createElement("h2");
        this.graphTitle.className = "graph-title";
        this.graphTitle.textContent = this.title;
        graphHeader.appendChild(this.graphTitle);
        const graphContent = document.createElement("div");
        graphContent.className = "graph-content";
        const yAxisSection = document.createElement("div");
        yAxisSection.className = "y-axis-section";
        const yAxisTitle = document.createElement("div");
        yAxisTitle.className = "y-axis-title";
        yAxisTitle.textContent = this.unit;
        this.yAxisLabels = document.createElement("div");
        this.yAxisLabels.className = "y-axis-labels";
        yAxisSection.appendChild(yAxisTitle);
        yAxisSection.appendChild(this.yAxisLabels);
        this.barsCanvas = document.createElement("div");
        this.barsCanvas.className = "bar-graph-canvas";
        const groupsContainer = document.createElement("div");
        groupsContainer.className = "bar-groups-container";
        this.groups.forEach((group) => {
            const groupElement = document.createElement("div");
            groupElement.className = "bar-group";
            const groupBars = document.createElement("div");
            groupBars.className = "bar-group-bars";
            const zeroLine = document.createElement("div");
            zeroLine.className = "bar-zero-line";
            groupBars.appendChild(zeroLine);
            this.zeroLineByGroupId[group.id] = zeroLine;
            group.series.forEach((series) => {
                const barSlot = document.createElement("div");
                barSlot.className = "bar-slot";
                const barValue = document.createElement("div");
                barValue.className = "bar-value";
                barValue.textContent = "-";
                const barFill = document.createElement("div");
                barFill.className = "bar-fill";
                const style = this.barStyles[series.id];
                if (style) {
                    barFill.style.background = style.color;
                    barFill.style.opacity = `${style.opacity}`;
                }
                const barSeriesLabel = document.createElement("div");
                barSeriesLabel.className = "bar-series-label";
                barSeriesLabel.textContent = series.label;
                barSlot.appendChild(barValue);
                barSlot.appendChild(barFill);
                barSlot.appendChild(barSeriesLabel);
                groupBars.appendChild(barSlot);
                this.barFillBySeriesId[series.id] = barFill;
                this.barValueBySeriesId[series.id] = barValue;
            });
            const groupLabel = document.createElement("div");
            groupLabel.className = "bar-group-label";
            groupLabel.textContent = group.label;
            groupElement.appendChild(groupBars);
            groupElement.appendChild(groupLabel);
            groupsContainer.appendChild(groupElement);
        });
        this.barsCanvas.appendChild(groupsContainer);
        graphContent.appendChild(yAxisSection);
        graphContent.appendChild(this.barsCanvas);
        graphMain.appendChild(graphHeader);
        graphMain.appendChild(graphContent);
        const graphInfo = document.createElement("div");
        graphInfo.className = "graph-info bar-graph-info";
        const infoTitle = document.createElement("h3");
        infoTitle.textContent = "Current Values";
        this.infoStats = document.createElement("div");
        this.infoStats.className = "bar-info-stats";
        this.groups.forEach((group) => {
            group.series.forEach((series) => {
                const infoItem = document.createElement("div");
                infoItem.className = "bar-info-item";
                const label = document.createElement("span");
                label.className = "info-label";
                label.textContent = `${group.label} • ${series.label}`;
                const value = document.createElement("span");
                value.className = "info-value";
                value.textContent = "-";
                infoItem.appendChild(label);
                infoItem.appendChild(value);
                this.infoStats.appendChild(infoItem);
                this.infoValueBySeriesId[series.id] = value;
            });
        });
        graphInfo.appendChild(infoTitle);
        graphInfo.appendChild(this.infoStats);
        this.graphRow.appendChild(graphMain);
        this.graphRow.appendChild(graphInfo);
        container.appendChild(this.graphRow);
    }
    update() {
        if (!this.graphRow) {
            return;
        }
        const latestBySeries = {};
        let maxObserved = -Infinity;
        let minObserved = Infinity;
        Object.keys(this.dataPointsCollection).forEach((seriesId) => {
            const collection = this.dataPointsCollection[seriesId];
            if (!collection || collection.length === 0) {
                return;
            }
            collection.forEach((point) => {
                if (point.y > maxObserved) {
                    maxObserved = point.y;
                }
                if (point.y < minObserved) {
                    minObserved = point.y;
                }
            });
            const latest = collection[collection.length - 1].y;
            latestBySeries[seriesId] = latest;
        });
        if (maxObserved !== -Infinity && maxObserved > this.yMax) {
            this.yMax = Math.ceil(maxObserved * 1.1);
        }
        if (minObserved !== Infinity && minObserved < this.yMin) {
            this.yMin = Math.floor(minObserved * 1.1);
        }
        if (this.yMax === this.yMin) {
            this.yMax = this.yMin + 1;
        }
        const zeroPercentFromTop = this.getZeroPercentFromTop();
        this.updateYAxisLabels(zeroPercentFromTop);
        Object.values(this.zeroLineByGroupId).forEach((zeroLine) => {
            zeroLine.style.top = `${zeroPercentFromTop}%`;
        });
        this.groups.forEach((group) => {
            group.series.forEach((series) => {
                const value = latestBySeries[series.id];
                const fill = this.barFillBySeriesId[series.id];
                const valueLabel = this.barValueBySeriesId[series.id];
                const infoValue = this.infoValueBySeriesId[series.id];
                if (!fill || !valueLabel || !infoValue) {
                    return;
                }
                if (value === undefined) {
                    fill.style.height = "0%";
                    valueLabel.textContent = "-";
                    infoValue.textContent = "-";
                    return;
                }
                const pointPercentFromTop = this.valueToPercentFromTop(value);
                const isPositive = value >= 0;
                const topPercent = isPositive ? pointPercentFromTop : zeroPercentFromTop;
                const heightPercent = Math.abs(zeroPercentFromTop - pointPercentFromTop);
                fill.style.top = `${topPercent}%`;
                fill.style.height = `${Math.max(heightPercent, 1)}%`;
                valueLabel.style.top = `calc(${topPercent}% - 18px)`;
                valueLabel.textContent = `${value.toFixed(this.decimals)}`;
                infoValue.textContent = `${value.toFixed(this.decimals)} ${this.unit}`;
            });
        });
    }
    valueToPercentFromTop(value) {
        const range = this.yMax - this.yMin;
        if (range <= 0) {
            return 100;
        }
        const clamped = Math.max(this.yMin, Math.min(this.yMax, value));
        return 100 - ((clamped - this.yMin) / range) * 100;
    }
    getZeroPercentFromTop() {
        if (this.yMin <= 0 && this.yMax >= 0) {
            return this.valueToPercentFromTop(0);
        }
        if (this.yMin > 0) {
            return 100;
        }
        return 0;
    }
    updateYAxisLabels(zeroPercentFromTop) {
        this.yAxisLabels.innerHTML = "";
        this.yAxisLabels.style.position = "relative";
        const topLabel = document.createElement("span");
        topLabel.className = "y-label";
        topLabel.textContent = this.yMax.toString();
        topLabel.style.position = "absolute";
        topLabel.style.top = "0%";
        topLabel.style.right = "0";
        topLabel.style.transform = "translateY(-50%)";
        const bottomLabel = document.createElement("span");
        bottomLabel.className = "y-label";
        bottomLabel.textContent = this.yMin.toString();
        bottomLabel.style.position = "absolute";
        bottomLabel.style.bottom = "0%";
        bottomLabel.style.right = "0";
        bottomLabel.style.transform = "translateY(50%)";
        this.yAxisLabels.appendChild(topLabel);
        this.yAxisLabels.appendChild(bottomLabel);
        if (this.yMin <= 0 && this.yMax >= 0) {
            const zeroLabel = document.createElement("span");
            zeroLabel.className = "y-label";
            zeroLabel.textContent = "0";
            zeroLabel.style.position = "absolute";
            zeroLabel.style.top = `${zeroPercentFromTop}%`;
            zeroLabel.style.right = "0";
            zeroLabel.style.transform = "translateY(-50%)";
            this.yAxisLabels.appendChild(zeroLabel);
        }
    }
}
// #endregion
//# sourceMappingURL=graph_representations.js.map