
import { InterfaceObjectData, InterfaceObjectType, Vector3D } from "../../shared/compiled_js/types.js";
import {
    BarGraphGroupDefinition,
    BarGraphRepresentation,
    BarStyle,
    GraphicalRepresentation,
    LineGraphRepresentation,
    LineGraphYOverflowMode,
    LineStyle
} from "../../live_data/compiled_js/graph_representations.js";

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
    lineColors: { [seriesName: string]: string };
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
    barColors: { [seriesId: string]: string };
    decimals: number;
};

export type InterfaceObjectRuntimeData = InterfaceObjectData & {
    UUID?: string;
    name?: string;
    monitorDataKeys?: string[];
    lineGraphSettings?: Partial<LineGraphIObjectSettings>;
    barGraphSettings?: Partial<BarGraphIObjectSettings>;
};

export abstract class InterfaceObject {
    protected readonly uuid: string;
    public getUUID(): string { return this.uuid; }

    protected readonly isPanel: boolean;
    protected readonly monitorDataKeys: string[];

    protected readonly childrenInterfaceObjects: InterfaceObject[];

    protected readonly posX: number;
    protected readonly posY: number;
    protected readonly width: number;
    protected readonly height: number;

    protected readonly primaryDOMElement: HTMLDivElement;
    protected readonly secondaryDOMElement: HTMLDivElement;

    constructor(
        uuid: string,
        isPanel: boolean,
        monitorDataKeys: string[],
        posX: number,
        posY: number,
        width: number,
        height: number,
        childrenInterfaceObjects: InterfaceObject[] = []
    ) {
        this.uuid = uuid;
        this.isPanel = isPanel;
        this.monitorDataKeys = monitorDataKeys;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.childrenInterfaceObjects = childrenInterfaceObjects;

        this.primaryDOMElement = document.createElement("div");
        this.primaryDOMElement.className = `iobject-wrapper ${this.isPanel ? "iobject-panel" : "iobject-display"}`;
        this.primaryDOMElement.setAttribute("data-iobject-uuid", this.uuid);

        this.secondaryDOMElement = document.createElement("div");
        this.secondaryDOMElement.className = "iobject-content";
        this.primaryDOMElement.appendChild(this.secondaryDOMElement);

        this.initializeSecondaryDOM();
    }

    public getPrimaryDOMElement(): HTMLDivElement {
        return this.primaryDOMElement;
    }

    public getMonitorDataKeys(): string[] {
        return this.monitorDataKeys.slice();
    }

    public getChildren(): InterfaceObject[] {
        return this.childrenInterfaceObjects.slice();
    }

    // Computes absolute percentages from logical parent space and applies DOM wrapper geometry.
    public applyLayoutWithinParent(parentRect: InterfaceLayoutRect): InterfaceLayoutRect {
        const absoluteRect: InterfaceLayoutRect = {
            left: parentRect.left + (this.posX / 100) * parentRect.width,
            top: parentRect.top + (this.posY / 100) * parentRect.height,
            width: (this.width / 100) * parentRect.width,
            height: (this.height / 100) * parentRect.height
        };

        this.primaryDOMElement.style.left = `${absoluteRect.left}%`;
        this.primaryDOMElement.style.top = `${absoluteRect.top}%`;
        this.primaryDOMElement.style.width = `${absoluteRect.width}%`;
        this.primaryDOMElement.style.height = `${absoluteRect.height}%`;

        return absoluteRect;
    }

    public collectDataDisplayObjectsByKey(output: { [monitorDataKey: string]: InterfaceObject[] }): void {
        if (!this.isPanel) {
            this.monitorDataKeys.forEach((key) => {
                if (!output[key]) {
                    output[key] = [];
                }
                output[key].push(this);
            });
            return;
        }

        this.childrenInterfaceObjects.forEach((child) => child.collectDataDisplayObjectsByKey(output));
    }

    protected abstract initializeSecondaryDOM(): void;
    public abstract updateData(packet: TelemetryPacket): void;
    public abstract renderFrame(): void;
}

export class PanelIObject extends InterfaceObject {
    constructor(
        uuid: string,
        posX: number,
        posY: number,
        width: number,
        height: number,
        childrenInterfaceObjects: InterfaceObject[]
    ) {
        super(uuid, true, [], posX, posY, width, height, childrenInterfaceObjects);
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("panel-content");
    }

    public override updateData(_packet: TelemetryPacket): void {
        // Panels do not directly consume telemetry.
    }

    public override renderFrame(): void {
        // Panels render through their child display objects.
    }
}

export class LineGraphIObject extends InterfaceObject {
    private readonly settings: LineGraphIObjectSettings;
    private graphContainerElement!: HTMLDivElement;
    private graphRepresentation: GraphicalRepresentation | null = null;
    private firstTimestamp: number | null = null;
    private preInitQueue: Array<{ x: number; y: number; collection: string }> = [];
    private isGraphInitializationScheduled: boolean = false;

    constructor(
        uuid: string,
        monitorDataKeys: string[],
        posX: number,
        posY: number,
        width: number,
        height: number,
        settings?: Partial<LineGraphIObjectSettings>
    ) {
        const resolvedSettings: LineGraphIObjectSettings = {
            title: settings?.title ?? "Line Graph",
            unit: settings?.unit ?? "units",
            yMin: settings?.yMin ?? -1,
            yMax: settings?.yMax ?? 1,
            maxPoints: settings?.maxPoints ?? 180,
            vectorComponents: settings?.vectorComponents ?? ["x", "y", "z"],
            lineColors: settings?.lineColors ?? {
                x: "#ff4f4f",
                y: "#64ff64",
                z: "#65a7ff",
                default: "#f5a623"
            }
        };

        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.settings = resolvedSettings;
        this.scheduleGraphInitialization();
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("line-graph-content");

        this.graphContainerElement = document.createElement("div");
        this.graphContainerElement.className = "line-graph-host";
        this.graphContainerElement.id = `graphs-container-${this.uuid}`;
        this.secondaryDOMElement.appendChild(this.graphContainerElement);
    }

    public override updateData(packet: TelemetryPacket): void {
        if (!this.monitorDataKeys.includes(packet.label)) {
            return;
        }

        if (this.firstTimestamp === null) {
            this.firstTimestamp = packet.timestampRaw;
        }
        const objectRelativeTime = packet.timestampRaw - this.firstTimestamp;

        if (packet.valueType === "number" && typeof packet.value === "number") {
            this.pushToGraph(objectRelativeTime, packet.value, packet.label);
            return;
        }

        if (packet.valueType === "vector3d" && this.isVector3D(packet.value)) {
            this.settings.vectorComponents.forEach((component) => {
                const seriesName = this.monitorDataKeys.length === 1 ? component : `${packet.label}.${component}`;
                this.pushToGraph(objectRelativeTime, packet.value[component], seriesName);
            });
        }
    }

    public override renderFrame(): void {
        // Ensure graph is initialized even before telemetry arrives so axes/labels are visible.
        this.tryInitializeGraphRepresentation();
    }

    private pushToGraph(x: number, y: number, collection: string): void {
        if (!this.graphRepresentation) {
            this.preInitQueue.push({ x, y, collection });
            this.scheduleGraphInitialization();
            return;
        }
        this.graphRepresentation.addDataPoint(x, y, collection);
    }

    private scheduleGraphInitialization(): void {
        if (this.isGraphInitializationScheduled) {
            return;
        }
        this.isGraphInitializationScheduled = true;

        // Defer until the object tree is mounted in DOM by InterfaceScreen.
        window.setTimeout(() => {
            this.isGraphInitializationScheduled = false;
            this.tryInitializeGraphRepresentation();
        }, 0);
    }

    private tryInitializeGraphRepresentation(): void {
        if (this.graphRepresentation) {
            return;
        }

        if (!document.getElementById(this.graphContainerElement.id)) {
            this.scheduleGraphInitialization();
            return;
        }

        try {
            this.graphRepresentation = this.createGraphRepresentation();
            this.preInitQueue.forEach((entry) => {
                this.graphRepresentation!.addDataPoint(entry.x, entry.y, entry.collection);
            });
            this.preInitQueue = [];
        } catch (error) {
            console.error(`[LineGraphIObject:${this.uuid}] Failed to initialize graph representation.`, error);
            this.scheduleGraphInitialization();
        }
    }

    private createGraphRepresentation(): GraphicalRepresentation {
        const collections: { [key: string]: LineStyle } = this.buildCollectionsWithStyles();
        const representation = new LineGraphRepresentation(
            this.settings.title,
            this.settings.unit,
            this.settings.yMin,
            this.settings.yMax,
            30,
            collections,
            this.graphContainerElement.id
        );
        representation.setOverflowY(LineGraphYOverflowMode.ScaleAxis);
        return representation;
    }

    private buildCollectionsWithStyles(): { [key: string]: LineStyle } {
        const collections: { [key: string]: LineStyle } = {};

        if (this.monitorDataKeys.length === 1) {
            this.settings.vectorComponents.forEach((component) => {
                collections[component] = {
                    color: this.resolveSeriesColor(component),
                    width: 2,
                    opacity: 1
                };
            });
            return collections;
        }

        this.monitorDataKeys.forEach((key) => {
            this.settings.vectorComponents.forEach((component) => {
                const seriesName = `${key}.${component}`;
                collections[seriesName] = {
                    color: this.resolveSeriesColor(seriesName),
                    width: 2,
                    opacity: 1
                };
            });
            collections[key] = {
                color: this.resolveSeriesColor(key),
                width: 2,
                opacity: 1
            };
        });

        return collections;
    }

    private resolveSeriesColor(seriesName: string): string {
        const segments = seriesName.split(".");
        const component = segments[segments.length - 1];
        if (this.settings.lineColors[seriesName]) {
            return this.settings.lineColors[seriesName];
        }
        if (this.settings.lineColors[component]) {
            return this.settings.lineColors[component];
        }
        return this.settings.lineColors.default ?? "#f5a623";
    }

    private isVector3D(value: any): value is Vector3D {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
}

export class BarGraphIObject extends InterfaceObject {
    private readonly settings: BarGraphIObjectSettings;
    private readonly seriesSettings: BarGraphSeriesSetting[];

    private graphContainerElement!: HTMLDivElement;
    private graphRepresentation: BarGraphRepresentation | null = null;
    private firstTimestamp: number | null = null;

    private readonly latestValueBySeriesId: { [seriesId: string]: number } = {};
    private readonly latestTimeBySeriesId: { [seriesId: string]: number } = {};

    private isGraphInitializationScheduled: boolean = false;

    constructor(
        uuid: string,
        monitorDataKeys: string[],
        posX: number,
        posY: number,
        width: number,
        height: number,
        settings?: Partial<BarGraphIObjectSettings>
    ) {
        const resolvedSettings: BarGraphIObjectSettings = {
            title: settings?.title ?? "Bar Graph",
            unit: settings?.unit ?? "units",
            yMin: settings?.yMin ?? -1,
            yMax: settings?.yMax ?? 1,
            groups: settings?.groups,
            barColors: settings?.barColors ?? {},
            decimals: settings?.decimals ?? 2
        };

        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.settings = resolvedSettings;
        this.seriesSettings = this.resolveSeriesSettings();

        this.scheduleGraphInitialization();
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("line-graph-content");

        this.graphContainerElement = document.createElement("div");
        this.graphContainerElement.className = "line-graph-host";
        this.graphContainerElement.id = `graphs-container-${this.uuid}`;
        this.secondaryDOMElement.appendChild(this.graphContainerElement);
    }

    public override updateData(packet: TelemetryPacket): void {
        if (!this.monitorDataKeys.includes(packet.label)) {
            return;
        }

        if (this.firstTimestamp === null) {
            this.firstTimestamp = packet.timestampRaw;
        }

        const objectRelativeTime = packet.timestampRaw - this.firstTimestamp;

        if (packet.valueType === "number" && typeof packet.value === "number") {
            this.seriesSettings
                .filter((series) => series.key === packet.label && !series.component)
                .forEach((series) => {
                    this.latestValueBySeriesId[series.id] = packet.value;
                    this.latestTimeBySeriesId[series.id] = objectRelativeTime;
                });
            this.flushLatestValuesToGraph();
            return;
        }

        if (packet.valueType === "vector3d" && this.isVector3D(packet.value)) {
            this.seriesSettings
                .filter((series) => series.key === packet.label)
                .forEach((series) => {
                    const value = series.component ? packet.value[series.component] : packet.value.x;
                    this.latestValueBySeriesId[series.id] = value;
                    this.latestTimeBySeriesId[series.id] = objectRelativeTime;
                });
            this.flushLatestValuesToGraph();
        }
    }

    public override renderFrame(): void {
        this.tryInitializeGraphRepresentation();
    }

    private resolveSeriesSettings(): BarGraphSeriesSetting[] {
        if (this.settings.groups && this.settings.groups.length > 0) {
            const series: BarGraphSeriesSetting[] = [];
            this.settings.groups.forEach((group) => {
                group.series.forEach((entry) => {
                    series.push(entry);
                });
            });
            return series;
        }

        return this.monitorDataKeys.map((key) => ({
            id: key,
            label: key,
            key
        }));
    }

    private resolveGroups(): BarGraphGroupSetting[] {
        if (this.settings.groups && this.settings.groups.length > 0) {
            return this.settings.groups;
        }

        return this.monitorDataKeys.map((key, index) => ({
            id: `g${index + 1}`,
            label: key,
            series: [{ id: key, label: key, key }]
        }));
    }

    private scheduleGraphInitialization(): void {
        if (this.isGraphInitializationScheduled) {
            return;
        }
        this.isGraphInitializationScheduled = true;

        window.setTimeout(() => {
            this.isGraphInitializationScheduled = false;
            this.tryInitializeGraphRepresentation();
        }, 0);
    }

    private tryInitializeGraphRepresentation(): void {
        if (this.graphRepresentation) {
            return;
        }

        if (!document.getElementById(this.graphContainerElement.id)) {
            this.scheduleGraphInitialization();
            return;
        }

        try {
            const groups = this.resolveGroups();
            const barGroups: BarGraphGroupDefinition[] = groups.map((group) => ({
                id: group.id,
                label: group.label,
                series: group.series.map((series) => ({ id: series.id, label: series.label }))
            }));

            const barStyles: { [seriesId: string]: BarStyle } = {};
            this.seriesSettings.forEach((series) => {
                barStyles[series.id] = {
                    color: this.settings.barColors[series.id] ?? this.resolveSeriesColor(series.id),
                    opacity: 1
                };
            });

            this.graphRepresentation = new BarGraphRepresentation(
                this.settings.title,
                this.settings.unit,
                this.settings.yMin,
                this.settings.yMax,
                barGroups,
                barStyles,
                this.graphContainerElement.id,
                this.settings.decimals
            );

            this.flushLatestValuesToGraph();
        } catch (error) {
            console.error(`[BarGraphIObject:${this.uuid}] Failed to initialize graph representation.`, error);
            this.scheduleGraphInitialization();
        }
    }

    private flushLatestValuesToGraph(): void {
        if (!this.graphRepresentation) {
            return;
        }

        this.seriesSettings.forEach((series) => {
            const latestValue = this.latestValueBySeriesId[series.id];
            const latestTime = this.latestTimeBySeriesId[series.id];
            if (latestValue === undefined || latestTime === undefined) {
                return;
            }
            this.graphRepresentation!.addDataPoint(latestTime, latestValue, series.id);
        });
    }

    private resolveSeriesColor(seriesId: string): string {
        const defaults = ["#ff4f4f", "#64ff64", "#65a7ff", "#f5a623", "#ce7dff", "#45d3b3"];
        let hash = 0;
        for (let i = 0; i < seriesId.length; i++) {
            hash = (hash << 5) - hash + seriesId.charCodeAt(i);
            hash |= 0;
        }
        return defaults[Math.abs(hash) % defaults.length];
    }

    private isVector3D(value: any): value is Vector3D {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
}

export function createInterfaceObjectFromData(
    data: InterfaceObjectRuntimeData,
    warnings: string[]
): InterfaceObject | null {
    const uuid = data.UUID ?? `iobj-${Math.random().toString(36).slice(2, 10)}`;
    const posX = Number.isFinite(data.posX) ? data.posX : 0;
    const posY = Number.isFinite(data.posY) ? data.posY : 0;
    const width = Number.isFinite(data.width) ? data.width : 100;
    const height = Number.isFinite(data.height) ? data.height : 100;

    if (data.type === InterfaceObjectType.PANEL) {
        if (data.monitorDataKey || (data.monitorDataKeys && data.monitorDataKeys.length > 0)) {
            warnings.push(`[${uuid}] Panel objects cannot define monitorDataKeys. Ignoring those values.`);
        }

        const childObjects: InterfaceObject[] = [];
        const children = data.childrenInterfaceObjects ?? [];
        children.forEach((childData) => {
            const created = createInterfaceObjectFromData(childData as InterfaceObjectRuntimeData, warnings);
            if (created) {
                childObjects.push(created);
            }
        });

        return new PanelIObject(uuid, posX, posY, width, height, childObjects);
    }

    if (data.type === InterfaceObjectType.LINE_GRAPH) {
        if (data.childrenInterfaceObjects && data.childrenInterfaceObjects.length > 0) {
            warnings.push(`[${uuid}] Non-panel objects cannot have children. Children were ignored.`);
        }

        const resolvedKeys = normalizeMonitorDataKeys(data.monitorDataKeys, data.monitorDataKey);
        if (resolvedKeys.length === 0) {
            warnings.push(`[${uuid}] Non-panel object missing monitorDataKeys. Object was skipped.`);
            return null;
        }

        return new LineGraphIObject(uuid, resolvedKeys, posX, posY, width, height, data.lineGraphSettings);
    }

    if (data.type === InterfaceObjectType.BAR_GRAPH) {
        if (data.childrenInterfaceObjects && data.childrenInterfaceObjects.length > 0) {
            warnings.push(`[${uuid}] Non-panel objects cannot have children. Children were ignored.`);
        }

        const resolvedKeys = normalizeBarGraphMonitorDataKeys(
            data.monitorDataKeys,
            data.monitorDataKey,
            data.barGraphSettings
        );

        if (resolvedKeys.length === 0) {
            warnings.push(`[${uuid}] Bar graph object missing monitorDataKeys. Object was skipped.`);
            return null;
        }

        return new BarGraphIObject(uuid, resolvedKeys, posX, posY, width, height, data.barGraphSettings);
    }

    warnings.push(`[${uuid}] Unsupported interface object type '${String(data.type)}'. Object was skipped.`);
    return null;
}

function normalizeMonitorDataKeys(monitorDataKeys?: string[], legacyMonitorDataKey?: string): string[] {
    const keys = new Set<string>();
    (monitorDataKeys ?? []).forEach((key) => {
        if (typeof key === "string" && key.trim().length > 0) {
            keys.add(key.trim());
        }
    });

    if (typeof legacyMonitorDataKey === "string" && legacyMonitorDataKey.trim().length > 0) {
        keys.add(legacyMonitorDataKey.trim());
    }

    return Array.from(keys);
}

function normalizeBarGraphMonitorDataKeys(
    monitorDataKeys?: string[],
    legacyMonitorDataKey?: string,
    settings?: Partial<BarGraphIObjectSettings>
): string[] {
    const keys = new Set(normalizeMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey));

    (settings?.groups ?? []).forEach((group) => {
        (group.series ?? []).forEach((series) => {
            if (typeof series.key === "string" && series.key.trim().length > 0) {
                keys.add(series.key.trim());
            }
        });
    });

    return Array.from(keys);
}