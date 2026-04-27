export type DataPoints = Array<{
    x: number;
    y: number;
}>;
export type DataPointsCollection = {
    [collectionKey: string]: DataPoints;
};
/**
 * Abstract class representing a generic graph.
 */
export declare abstract class GraphicalRepresentation {
    protected static GRAPHS_CONTAINER_ID: string;
    protected dataPointsCollection: DataPointsCollection;
    protected readonly graphsContainerId: string;
    constructor(graphsContainerId?: string);
    /**
     * Adds a data point to a specific collection.
     */
    addDataPoint(x: number, y: number, collectionKey?: string): void;
    /**
     * Sets the entire collection of data points for a specific key.
     */
    setCollection(dataPoints: Array<{
        x: number;
        y: number;
    }>, collectionKey?: string): void;
    /**
     * Adds a new empty data points collection.
     */
    private addCollection;
    protected abstract update(): void;
    getDataPointsCollection(latest: boolean, amount: number, collection?: string): DataPoints;
    getAllCollectionKeys(): string[];
}
/**
 * Enums for linear graph x-axis overflow modes.
 */
export declare enum LineGraphXOverflowMode {
    ScaleAxis = 0,
    ShiftGraph = 1,
    None = 2
}
/**
 * Enums for linear graph y-axis overflow modes.
 */
export declare enum LineGraphYOverflowMode {
    ScaleAxis = 0,
    None = 1
}
export type LineStyle = {
    color: string;
    width: number;
    dashArray?: string;
    opacity: number;
};
export type LineGraphStyleSettings = {
    xOverflowMode: LineGraphXOverflowMode;
    yOverflowMode: LineGraphYOverflowMode;
    collectionLineStyles: {
        [collectionKey: string]: LineStyle;
    };
};
/**
 * Class representing a line graph.
 */
export declare class LineGraphRepresentation extends GraphicalRepresentation {
    private graphRow;
    private graphTitle;
    private polylines;
    private xAxisLine;
    private xAxisLabel;
    private xAxisMinLabel;
    private yAxisLabels;
    private infoStats;
    private collectionButtonsContainer;
    private collectionButtons;
    private graphMainEl;
    private graphContentEl;
    private yAxisSectionEl;
    private yAxisTitleEl;
    private graphCanvasEl;
    private xAxisInfoEl;
    private graphInfoEl;
    private title;
    private unit;
    private yMin;
    private yMax;
    private timeWindow;
    private collectionBeingInspected;
    private collectionVisibility;
    private collectionVisibilityBeforeInspection;
    private dataPointsDisplayMinTime;
    private dataPointsDisplayMaxTime;
    private styleSettings;
    private static DEFAULT_LINE_STYLE;
    constructor(title: string, unit: string, yMin: number, yMax: number, timeWindow?: number, collections?: {
        [key: string]: LineStyle;
    }, graphsContainerId?: string);
    private initializeLineGraph;
    private initializeCollectionPolyline;
    private createCollectionButton;
    private toggleCollectionVisibility;
    private updateCollectionButtonAppearance;
    private updateAllCollectionButtonsAppearance;
    protected update(): void;
    /**
     * Updates the line visual for a specific data collection.
     * Returns true if y-axis bounds changed.
     */
    private updateCollectionLine;
    /**
     * Determines if a data point is the closest out-of-bounds point (OOBP) to the visible range.
     */
    private getClosestOutOfBoundsPointIndexices;
    private updateInfoStat;
    private updateXAxisPosition;
    private updateYAxisLabels;
    private updateVisualStyleForCollection;
    setOverflowY(overflowMode: LineGraphYOverflowMode): void;
    setOverflowX(overflowMode: LineGraphXOverflowMode): void;
    setBackgroundColor(color: string): void;
    setShowInfo(visible: boolean): void;
    setFillHeight(): void;
}
export type BarStyle = {
    color: string;
    opacity: number;
};
export type BarGraphSeriesDefinition = {
    id: string;
    label: string;
};
export type BarGraphGroupDefinition = {
    id: string;
    label: string;
    series: BarGraphSeriesDefinition[];
};
export declare class BarGraphRepresentation extends GraphicalRepresentation {
    private readonly title;
    private readonly unit;
    private yMin;
    private yMax;
    private readonly groups;
    private readonly barStyles;
    private readonly decimals;
    private graphRow;
    private graphTitle;
    private yAxisLabels;
    private barsCanvas;
    private infoStats;
    private readonly barFillBySeriesId;
    private readonly barValueBySeriesId;
    private readonly infoValueBySeriesId;
    private readonly zeroLineByGroupId;
    constructor(title: string, unit: string, yMin: number, yMax: number, groups: BarGraphGroupDefinition[], barStyles?: {
        [seriesId: string]: BarStyle;
    }, graphsContainerId?: string, decimals?: number);
    private initializeCollections;
    private initializeBarGraph;
    protected update(): void;
    private valueToPercentFromTop;
    private getZeroPercentFromTop;
    private updateYAxisLabels;
}
