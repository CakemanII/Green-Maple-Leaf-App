/**
 * Types for Interface Editor
 * Defines all data structures for screen collections, objects, and styling
 */
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
export type InterfaceObjectType = 'LINE_GRAPH' | 'PANEL';
export type InterfaceObject = LineGraphObject | PanelObject;
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
export declare const DEFAULT_OBJECT_SIZE: {
    width: number;
    height: number;
};
export type ValidationError = {
    objectUuid: string;
    field: string;
    message: string;
};
