/**
 * Types for Interface Editor
 * Defines all data structures for screen collections, objects, and styling
 */

// ===== SCREEN COLLECTION =====

export type ScreenCollection = {
    UUID: string;
    version: string;
    name: string;
    screens: Screen[];
    notifications: NotificationConfig[];
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

export type InterfaceObjectType = 'LINE_GRAPH' | 'PANEL' | 'BAR_GRAPH' | 'MODEL_3D' | 'MINIMAP' | 'STATUS_DISPLAY';

export type InterfaceObject = LineGraphObject | PanelObject | BarGraphObject | Model3DObject | MinimapObject | StatusDisplayObject;

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

// ===== BAR GRAPH =====

export type BarGraphBarDef = {
    id: string;
    label: string;
    monitorKey: string;
    color: string;
};

export type BarGraphStyle = {
    backgroundColor: string;
    yMin: number;
    yMax: number;
    title: string;
};

export type BarGraphObject = BaseObject & {
    type: 'BAR_GRAPH';
    bars: BarGraphBarDef[];
    graphStyle: BarGraphStyle;
};

export const DEFAULT_BAR_GRAPH_STYLE: BarGraphStyle = {
    backgroundColor: '#1a1a1a',
    yMin: 0,
    yMax: 100,
    title: 'Bar Graph',
};

// ===== 3D MODEL =====

export type Model3DObject = BaseObject & {
    type: 'MODEL_3D';
    rollKey: string;    // telemetry key for roll angle
    pitchKey: string;   // telemetry key for pitch angle
    yawKey: string;     // telemetry key for yaw angle
    angleUnit: 'deg' | 'rad';
    modelColor: string;
    backgroundColor: string;
};

// ===== MINIMAP =====

export type MinimapObject = BaseObject & {
    type: 'MINIMAP';
    defaultZoom: number;
    showGeofences: boolean;
    followRocket: boolean;
    latKey: string;   // telemetry key for latitude
    lngKey: string;   // telemetry key for longitude
};

// ===== STATUS DISPLAY =====

export type StatusDisplayStyle = {
    backgroundColor: string;
    borderColor: string;
    showTitle: boolean;
    playAudio: boolean;
};

export type StatusDisplayObject = BaseObject & {
    type: 'STATUS_DISPLAY';
    statusCollectionUUID: string;
    statusUUID: string;
    style: StatusDisplayStyle;
};

export const DEFAULT_STATUS_DISPLAY_STYLE: StatusDisplayStyle = {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
    showTitle: true,
    playAudio: false,
};

export const DEFAULT_OBJECT_SIZE = { width: 20, height: 20 };

// ===== NOTIFICATIONS =====

export type NotificationConfig = {
    uuid: string;
    label: string;
    color: string;
    flashing: boolean;
    title: string;
    text: string;
    displayStatusImage: boolean;
    playFlagAudio: boolean;
    statusCollectionUUID: string;
    statusUUID: string;
    flagUUID: string;
};

// ===== VALIDATION ERRORS =====

export type ValidationError = {
    objectUuid: string;
    field: string;
    message: string;
};
