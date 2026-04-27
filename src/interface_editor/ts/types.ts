/**
 * Types for Interface Editor
 * Defines all data structures for screen collections, objects, and styling
 */

// ===== SCREEN COLLECTION =====

export type ScreenCollection = {
    version: string;
    collectionName: string;
    screens: Screen[];
    metadata: {
        lastModified: string;
        activeScreen: string | null;
    };
};

export type Screen = {
    uuid: string;
    name: string;
    objects: InterfaceObject[];
};

// ===== INTERFACE OBJECTS =====

export type InterfaceObjectType = 'LINE_GRAPH' | 'PANEL';

export type InterfaceObject = LineGraphObject | PanelObject;

export type BaseObject = {
    uuid: string;
    type: InterfaceObjectType;
    name: string;
    position: { x: number; y: number };  // 0-100 percentage
    size: { width: number; height: number };  // 0-100 percentage
    scale: number;  // 0-300, relative scale (100 = normal)
    zIndex: number;
};

export type LineGraphObject = BaseObject & {
    type: 'LINE_GRAPH';
    monitorDataKeys: string[];
    graphStyle: GraphStyle;
};

export type PanelObject = BaseObject & {
    type: 'PANEL';
    style: PanelStyle;
};

// ===== STYLING =====

export type GraphStyle = {
    backgroundColor: string;
    lineColors: { [key: string]: string };
    labelDisplayNames: { [key: string]: string };
    labelUnits: { [key: string]: string };
    axisLabels: boolean;
    grid: boolean;
    yMin: number;
    yMax: number;
    timeWindow: number;  // in seconds
    unit: string;
    xAxisRange: { min: number; max: number };
    yAxisRange: { min: number; max: number };
    xAxisLabel: string;
    yAxisLabel: string;
    units: string;
    legendPosition: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'none';
    xOverflowMode: 'ShiftGraph' | 'ScaleAxis' | 'None';
    yOverflowMode: 'ScaleAxis' | 'None';
    showInfo: boolean;
};

export type PanelStyle = {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
    opacity: number;  // 0-100
};

// ===== LINE STYLE (for graph rendering) =====

export type LineStyle = {
    color: string;
    width: number;
    dashArray?: string;
    opacity: number;
};

// ===== DEFAULT VALUES =====

export const DEFAULT_GRAPH_STYLE: GraphStyle = {
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

export const DEFAULT_PANEL_STYLE: PanelStyle = {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'solid',
    opacity: 100
};

export const DEFAULT_OBJECT_SIZE = { width: 20, height: 20 };

// ===== VALIDATION ERRORS =====

export type ValidationError = {
    objectUuid: string;
    field: string;
    message: string;
};
