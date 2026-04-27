/**
 * Types for Interface Editor
 * Defines all data structures for screen collections, objects, and styling
 */
// ===== DEFAULT VALUES =====
export const DEFAULT_GRAPH_STYLE = {
    backgroundColor: '#1a1a1a',
    lineColors: {},
    labelDisplayNames: {},
    labelUnits: {},
    axisLabels: true,
    grid: true,
    yMin: 0,
    yMax: 100,
    timeWindow: 30,
    unit: '',
    xAxisRange: { min: 0, max: 20 },
    yAxisRange: { min: 0, max: 20 },
    xAxisLabel: 'Time (s)',
    yAxisLabel: 'Value',
    units: '',
    legendPosition: 'topRight',
    xOverflowMode: 'ShiftGraph',
    yOverflowMode: 'ScaleAxis',
    showInfo: true
};
export const DEFAULT_PANEL_STYLE = {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'solid',
    opacity: 100
};
export const DEFAULT_OBJECT_SIZE = { width: 20, height: 20 };
//# sourceMappingURL=types.js.map