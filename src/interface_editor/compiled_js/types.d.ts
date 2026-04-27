/**
 * Types for Interface Editor
 * Defines all data structures for screen collections, objects, and styling
 */
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
export type InterfaceObjectType = 'LINE_GRAPH' | 'PANEL' | 'BAR_GRAPH' | 'MODEL_3D' | 'MINIMAP' | 'STATUS_DISPLAY';
export type InterfaceObject = LineGraphObject | PanelObject | BarGraphObject | Model3DObject | MinimapObject | StatusDisplayObject;
export type BaseObject = {
    uuid: string;
    type: InterfaceObjectType;
    name: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    scale: number;
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
export type GraphStyle = {
    backgroundColor: string;
    lineColors: {
        [key: string]: string;
    };
    labelDisplayNames: {
        [key: string]: string;
    };
    labelUnits: {
        [key: string]: string;
    };
    axisLabels: boolean;
    grid: boolean;
    yMin: number;
    yMax: number;
    timeWindow: number;
    unit: string;
    xAxisRange: {
        min: number;
        max: number;
    };
    yAxisRange: {
        min: number;
        max: number;
    };
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
    opacity: number;
};
export type LineStyle = {
    color: string;
    width: number;
    dashArray?: string;
    opacity: number;
};
export declare const DEFAULT_GRAPH_STYLE: GraphStyle;
export declare const DEFAULT_PANEL_STYLE: PanelStyle;
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
export declare const DEFAULT_BAR_GRAPH_STYLE: BarGraphStyle;
export type Model3DObject = BaseObject & {
    type: 'MODEL_3D';
    rollKey: string;
    pitchKey: string;
    yawKey: string;
    angleUnit: 'deg' | 'rad';
    modelColor: string;
    backgroundColor: string;
};
export type MinimapObject = BaseObject & {
    type: 'MINIMAP';
    defaultZoom: number;
    showGeofences: boolean;
    followRocket: boolean;
    latKey: string;
    lngKey: string;
};
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
export declare const DEFAULT_STATUS_DISPLAY_STYLE: StatusDisplayStyle;
export declare const DEFAULT_OBJECT_SIZE: {
    width: number;
    height: number;
};
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
export type ValidationError = {
    objectUuid: string;
    field: string;
    message: string;
};
