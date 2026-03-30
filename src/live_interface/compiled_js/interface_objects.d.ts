import { InterfaceObjectData } from "../../shared/compiled_js/types.js";
export type TelemetryValueType = "number" | "vector3d" | "boolean" | "string" | "unknown";
export type TelemetryPacket = {
    label: string;
    timestampRaw: number;
    timestampRelative: number;
    value: any;
    valueType: TelemetryValueType;
};
export type InterfaceLayoutRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};
export type LineGraphIObjectSettings = {
    title: string;
    unit: string;
    yMin: number;
    yMax: number;
    maxPoints: number;
    vectorComponents: Array<"x" | "y" | "z">;
    lineColors: {
        [seriesName: string]: string;
    };
};
export type BarGraphSeriesSetting = {
    id: string;
    label: string;
    key: string;
    component?: "x" | "y" | "z";
};
export type BarGraphGroupSetting = {
    id: string;
    label: string;
    series: BarGraphSeriesSetting[];
};
export type BarGraphIObjectSettings = {
    title: string;
    unit: string;
    yMin: number;
    yMax: number;
    groups?: BarGraphGroupSetting[];
    barColors: {
        [seriesId: string]: string;
    };
    decimals: number;
};
export type ThreeDModelAbsRotationIObjectSettings = {
    title: string;
    eulerOrder: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
    angleUnit: "deg" | "rad";
    vectorTelemetryKey?: string;
    rollKey?: string;
    pitchKey?: string;
    yawKey?: string;
    modelColor: string;
};
export type StatusDisplayIObjectSettings = {
    statusUUID: string;
    title: string;
    emptyText: string;
};
export type InterfaceObjectRuntimeData = InterfaceObjectData & {
    UUID?: string;
    name?: string;
    monitorDataKeys?: string[];
    lineGraphSettings?: Partial<LineGraphIObjectSettings>;
    barGraphSettings?: Partial<BarGraphIObjectSettings>;
    threeDModelAbsRotationSettings?: Partial<ThreeDModelAbsRotationIObjectSettings>;
    statusDisplaySettings?: Partial<StatusDisplayIObjectSettings>;
};
export declare abstract class InterfaceObject {
    protected readonly uuid: string;
    getUUID(): string;
    protected readonly isPanel: boolean;
    protected readonly monitorDataKeys: string[];
    protected readonly childrenInterfaceObjects: InterfaceObject[];
    protected readonly posX: number;
    protected readonly posY: number;
    protected readonly width: number;
    protected readonly height: number;
    protected readonly primaryDOMElement: HTMLDivElement;
    protected readonly secondaryDOMElement: HTMLDivElement;
    constructor(uuid: string, isPanel: boolean, monitorDataKeys: string[], posX: number, posY: number, width: number, height: number, childrenInterfaceObjects?: InterfaceObject[]);
    getPrimaryDOMElement(): HTMLDivElement;
    getMonitorDataKeys(): string[];
    getChildren(): InterfaceObject[];
    applyLayoutWithinParent(parentRect: InterfaceLayoutRect): InterfaceLayoutRect;
    collectDataDisplayObjectsByKey(output: {
        [monitorDataKey: string]: InterfaceObject[];
    }): void;
    protected abstract initializeSecondaryDOM(): void;
    abstract updateData(packet: TelemetryPacket): void;
    abstract renderFrame(): void;
    destroy(): void;
    shouldRenderContinuously(): boolean;
}
export declare class PanelIObject extends InterfaceObject {
    constructor(uuid: string, posX: number, posY: number, width: number, height: number, childrenInterfaceObjects: InterfaceObject[]);
    protected initializeSecondaryDOM(): void;
    updateData(_packet: TelemetryPacket): void;
    renderFrame(): void;
}
export declare class LineGraphIObject extends InterfaceObject {
    private readonly settings;
    private graphContainerElement;
    private graphRepresentation;
    private firstTimestamp;
    private preInitQueue;
    private isGraphInitializationScheduled;
    constructor(uuid: string, monitorDataKeys: string[], posX: number, posY: number, width: number, height: number, settings?: Partial<LineGraphIObjectSettings>);
    protected initializeSecondaryDOM(): void;
    updateData(packet: TelemetryPacket): void;
    renderFrame(): void;
    private pushToGraph;
    private scheduleGraphInitialization;
    private tryInitializeGraphRepresentation;
    private createGraphRepresentation;
    private buildCollectionsWithStyles;
    private resolveSeriesColor;
    private isVector3D;
}
export declare class BarGraphIObject extends InterfaceObject {
    private readonly settings;
    private readonly seriesSettings;
    private graphContainerElement;
    private graphRepresentation;
    private firstTimestamp;
    private readonly latestValueBySeriesId;
    private readonly latestTimeBySeriesId;
    private isGraphInitializationScheduled;
    constructor(uuid: string, monitorDataKeys: string[], posX: number, posY: number, width: number, height: number, settings?: Partial<BarGraphIObjectSettings>);
    protected initializeSecondaryDOM(): void;
    updateData(packet: TelemetryPacket): void;
    renderFrame(): void;
    private resolveSeriesSettings;
    private resolveGroups;
    private scheduleGraphInitialization;
    private tryInitializeGraphRepresentation;
    private flushLatestValuesToGraph;
    private resolveSeriesColor;
    private isVector3D;
}
export declare class ThreeDModelAbsRotationIObject extends InterfaceObject {
    private readonly settings;
    private hostElement;
    private overlayElement;
    private cubeElement;
    private rollRad;
    private pitchRad;
    private yawRad;
    private isCubeInitialized;
    constructor(uuid: string, monitorDataKeys: string[], posX: number, posY: number, width: number, height: number, settings?: Partial<ThreeDModelAbsRotationIObjectSettings>);
    protected initializeSecondaryDOM(): void;
    updateData(packet: TelemetryPacket): void;
    renderFrame(): void;
    shouldRenderContinuously(): boolean;
    private setEulerInput;
    private toRadians;
    private refreshOverlayText;
    private initializeCubeIfNeeded;
    private applyCubeRotation;
    private isVector3D;
    private static ensureThreeLoaded;
}
export declare class StatusDisplayIObject extends InterfaceObject {
    private static readonly objectsByStatusUUID;
    private static readonly latestStatusValues;
    private static statusBridgeInitialized;
    private static initialStatusesLoad;
    private readonly settings;
    private titleElement;
    private flagImageElement;
    private flagNameElement;
    constructor(uuid: string, posX: number, posY: number, width: number, height: number, settings?: Partial<StatusDisplayIObjectSettings>);
    protected initializeSecondaryDOM(): void;
    updateData(_packet: TelemetryPacket): void;
    renderFrame(): void;
    destroy(): void;
    getStatusUUID(): string;
    private applyStatusDisplay;
    private convertPathToServerRoute;
    private static registerObject;
    private static unregisterObject;
    private static ensureStatusBridgeInitialized;
    private static loadInitialStatuses;
    private static applyCachedValueIfPresent;
}
export declare function createInterfaceObjectFromData(data: InterfaceObjectRuntimeData, warnings: string[]): InterfaceObject | null;
