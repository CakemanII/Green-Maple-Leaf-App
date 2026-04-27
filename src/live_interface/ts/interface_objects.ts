
import { InterfaceObjectData, InterfaceObjectType, Vector3D } from "../../shared/compiled_js/types.js";
import { StatusesReference } from "../../shared/compiled_js/global_statuses_reference.js";
import {
    BarGraphGroupDefinition,
    BarGraphRepresentation,
    BarStyle,
    GraphicalRepresentation,
    LineGraphRepresentation,
    LineGraphYOverflowMode,
    LineStyle
} from "../../live_data/compiled_js/graph_representations.js";
import { Flag } from "../../shared/compiled_js/types.js";

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

export type MinimapIObjectSettings = {
    defaultZoom: number;
    followRocket: boolean;
    showGeofences: boolean;
    latKey: string;
    lngKey: string;
};

export type InterfaceObjectRuntimeData = InterfaceObjectData & {
    UUID?: string;
    name?: string;
    monitorDataKeys?: string[];
    lineGraphSettings?: Partial<LineGraphIObjectSettings>;
    barGraphSettings?: Partial<BarGraphIObjectSettings>;
    threeDModelAbsRotationSettings?: Partial<ThreeDModelAbsRotationIObjectSettings>;
    statusDisplaySettings?: Partial<StatusDisplayIObjectSettings>;
    minimapSettings?: Partial<MinimapIObjectSettings>;
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

    public destroy(): void {
        // Optional override for objects that hold external subscriptions/resources.
    }

    public shouldRenderContinuously(): boolean {
        return false;
    }
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

export class ThreeDModelAbsRotationIObject extends InterfaceObject {
    private readonly settings: ThreeDModelAbsRotationIObjectSettings;

    private hostElement!: HTMLDivElement;
    private overlayElement!: HTMLDivElement;

    private cubeElement!: HTMLDivElement;

    private rollRad: number = 0;
    private pitchRad: number = 0;
    private yawRad: number = 0;

    private isCubeInitialized: boolean = false;

    constructor(
        uuid: string,
        monitorDataKeys: string[],
        posX: number,
        posY: number,
        width: number,
        height: number,
        settings?: Partial<ThreeDModelAbsRotationIObjectSettings>
    ) {
        const resolvedSettings: ThreeDModelAbsRotationIObjectSettings = {
            title: settings?.title ?? "3D Absolute Rotation",
            eulerOrder: settings?.eulerOrder ?? "ZYX",
            angleUnit: settings?.angleUnit ?? "deg",
            vectorTelemetryKey: settings?.vectorTelemetryKey,
            rollKey: settings?.rollKey,
            pitchKey: settings?.pitchKey,
            yawKey: settings?.yawKey,
            modelColor: settings?.modelColor ?? "#8ec5ff"
        };

        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.settings = resolvedSettings;
        this.refreshOverlayText();
        this.initializeCubeIfNeeded();
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("three-model-content");

        this.hostElement = document.createElement("div");
        this.hostElement.className = "three-model-host";

        this.overlayElement = document.createElement("div");
        this.overlayElement.className = "three-model-overlay";
        this.overlayElement.textContent = "3D Absolute Rotation | R: 0.0 P: 0.0 Y: 0.0";

        const scene = document.createElement("div");
        scene.className = "three-model-css-scene";

        this.cubeElement = document.createElement("div");
        this.cubeElement.className = "three-model-cube";

        const rocket = document.createElement("div");
        rocket.className = "three-model-rocket";

        const rectangle = document.createElement("div");
        rectangle.className = "three-model-rectangle";

        const triangleLeft = document.createElement("div");
        triangleLeft.className = "three-model-triangle tri-left";

        const triangleRight = document.createElement("div");
        triangleRight.className = "three-model-triangle tri-right";

        const triangleBack = document.createElement("div");
        triangleBack.className = "three-model-triangle tri-back";

        const pyramid = document.createElement("div");
        pyramid.className = "three-model-pyramid";

        rocket.appendChild(rectangle);
        rocket.appendChild(triangleLeft);
        rocket.appendChild(triangleRight);
        rocket.appendChild(triangleBack);
        rocket.appendChild(pyramid);

        this.cubeElement.appendChild(rocket);

        scene.appendChild(this.cubeElement);
        this.hostElement.appendChild(scene);

        this.secondaryDOMElement.appendChild(this.hostElement);
        this.secondaryDOMElement.appendChild(this.overlayElement);
    }

    public override updateData(packet: TelemetryPacket): void {
        if (!this.monitorDataKeys.includes(packet.label)) {
            return;
        }

        const vectorKey = this.settings.vectorTelemetryKey ?? this.monitorDataKeys[0];

        if (packet.valueType === "vector3d" && this.isVector3D(packet.value) && packet.label === vectorKey) {
            this.setEulerInput(packet.value.x, packet.value.y, packet.value.z);
            return;
        }

        if (packet.valueType === "number" && typeof packet.value === "number") {
            if (this.settings.rollKey && packet.label === this.settings.rollKey) {
                this.rollRad = this.toRadians(packet.value);
            }
            if (this.settings.pitchKey && packet.label === this.settings.pitchKey) {
                this.pitchRad = this.toRadians(packet.value);
            }
            if (this.settings.yawKey && packet.label === this.settings.yawKey) {
                this.yawRad = this.toRadians(packet.value);
            }
        }
    }

    public override renderFrame(): void {
        this.initializeCubeIfNeeded();
        if (!this.isCubeInitialized) {
            return;
        }

        this.applyCubeRotation();
        this.refreshOverlayText();
    }

    public override shouldRenderContinuously(): boolean {
        return true;
    }

    private setEulerInput(roll: number, pitch: number, yaw: number): void {
        this.rollRad = this.toRadians(roll);
        this.pitchRad = this.toRadians(pitch);
        this.yawRad = this.toRadians(yaw);
    }

    private toRadians(value: number): number {
        return this.settings.angleUnit === "deg" ? (value * Math.PI) / 180 : value;
    }

    private refreshOverlayText(): void {
        const toDisplay = (rad: number) => (rad * 180 / Math.PI).toFixed(1);
        this.overlayElement.textContent = `${this.settings.title} | R: ${toDisplay(this.rollRad)} P: ${toDisplay(this.pitchRad)} Y: ${toDisplay(this.yawRad)}`;
    }

    private initializeCubeIfNeeded(): void {
        if (this.isCubeInitialized) {
            return;
        }
        if (!document.body.contains(this.hostElement) || !this.cubeElement) {
            return;
        }

        this.isCubeInitialized = true;
        this.applyCubeRotation();
    }

    private applyCubeRotation(): void {
        if (!this.cubeElement) {
            return;
        }

        const rollDeg = (this.rollRad * 180) / Math.PI;
        const pitchDeg = (this.pitchRad * 180) / Math.PI;
        const yawDeg = (this.yawRad * 180) / Math.PI;

        const angleByAxis: { [axis: string]: number } = {
            X: rollDeg,
            Y: pitchDeg,
            Z: yawDeg
        };

        const orderedRotations = this.settings.eulerOrder
            .split("")
            .map((axis) => `rotate${axis}(${angleByAxis[axis].toFixed(3)}deg)`)
            .join(" ");

        this.cubeElement.style.transform = `translate(-50%, -50%) ${orderedRotations}`;
        this.cubeElement.style.setProperty("--three-model-color", this.settings.modelColor);
    }

    private isVector3D(value: any): value is Vector3D {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }

    // Keep compatibility with previous class shape; no external script loading required.
    private static ensureThreeLoaded(): Promise<any> {
        return Promise.resolve(null);
    }
}

export class StatusDisplayIObject extends InterfaceObject {
    private static readonly objectsByStatusUUID: { [statusUUID: string]: Set<StatusDisplayIObject> } = {};
    private static readonly latestStatusValues: { [statusUUID: string]: { flagName: string; flagImage: string } } = {};
    private static statusBridgeInitialized: boolean = false;
    private static initialStatusesLoad: Promise<void> | null = null;

    private readonly settings: StatusDisplayIObjectSettings;

    private titleElement!: HTMLDivElement;
    private flagImageElement!: HTMLImageElement;
    private flagNameElement!: HTMLDivElement;

    constructor(
        uuid: string,
        posX: number,
        posY: number,
        width: number,
        height: number,
        settings?: Partial<StatusDisplayIObjectSettings>
    ) {
        const resolvedSettings: StatusDisplayIObjectSettings = {
            statusUUID: settings?.statusUUID?.trim() ?? "",
            title: settings?.title ?? "Status",
            emptyText: settings?.emptyText ?? "No active flag"
        };

        super(uuid, false, [], posX, posY, width, height);
        this.settings = resolvedSettings;

        this.titleElement.textContent = this.settings.title;
        this.applyStatusDisplay(this.settings.emptyText, "");

        StatusDisplayIObject.registerObject(this);
        StatusDisplayIObject.ensureStatusBridgeInitialized();
        StatusDisplayIObject.applyCachedValueIfPresent(this);
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("status-display-content");

        this.titleElement = document.createElement("div");
        this.titleElement.className = "status-display-title";

        const imageFrame = document.createElement("div");
        imageFrame.className = "status-display-image-frame";

        this.flagImageElement = document.createElement("img");
        this.flagImageElement.className = "status-display-image";
        this.flagImageElement.alt = "Active status flag";
        this.flagImageElement.style.display = "none";

        this.flagNameElement = document.createElement("div");
        this.flagNameElement.className = "status-display-flag-name";

        imageFrame.appendChild(this.flagImageElement);
        this.secondaryDOMElement.appendChild(this.titleElement);
        this.secondaryDOMElement.appendChild(imageFrame);
        this.secondaryDOMElement.appendChild(this.flagNameElement);
    }

    public override updateData(_packet: TelemetryPacket): void {
        // STATUS_DISPLAY is driven by global status updates, not telemetry packets.
    }

    public override renderFrame(): void {
        // Rendering occurs immediately on status update callback.
    }

    public override destroy(): void {
        StatusDisplayIObject.unregisterObject(this);
    }

    public getStatusUUID(): string {
        return this.settings.statusUUID;
    }

    private applyStatusDisplay(flagName: string, flagImage: string): void {
        const hasImage = typeof flagImage === "string" && flagImage.trim().length > 0;
        const hasFlagName = typeof flagName === "string" && flagName.trim().length > 0;

        if (hasImage) {
            this.flagImageElement.src = this.convertPathToServerRoute(flagImage);
            this.flagImageElement.style.display = "block";
        } else {
            this.flagImageElement.src = "";
            this.flagImageElement.style.display = "none";
        }

        this.flagNameElement.textContent = hasFlagName ? flagName : this.settings.emptyText;
    }

    private convertPathToServerRoute(path: string): string {
        const normalizedPath = path.replace(/\\/g, "/");
        return `/serve_image/${encodeURI(normalizedPath)}`;
    }

    private static registerObject(object: StatusDisplayIObject): void {
        const statusUUID = object.getStatusUUID();
        if (!this.objectsByStatusUUID[statusUUID]) {
            this.objectsByStatusUUID[statusUUID] = new Set();
        }
        this.objectsByStatusUUID[statusUUID].add(object);
    }

    private static unregisterObject(object: StatusDisplayIObject): void {
        const statusUUID = object.getStatusUUID();
        const set = this.objectsByStatusUUID[statusUUID];
        if (!set) {
            return;
        }

        set.delete(object);
        if (set.size === 0) {
            delete this.objectsByStatusUUID[statusUUID];
        }
    }

    private static ensureStatusBridgeInitialized(): void {
        if (this.statusBridgeInitialized) {
            return;
        }
        this.statusBridgeInitialized = true;

        StatusesReference.INSTANCE.setOnStatusUpdateCallback((statusUUID: string, flag: Flag) => {
            this.latestStatusValues[statusUUID] = { flagName: flag.name, flagImage: flag.imageUUID ?? "" };
            const targets = this.objectsByStatusUUID[statusUUID];
            if (!targets) {
                return;
            }

            targets.forEach((object) => {
                object.applyStatusDisplay(flag.name, flag.imageUUID ?? "");
            });
        });

        if (!this.initialStatusesLoad) {
            this.initialStatusesLoad = this.loadInitialStatuses();
        }
    }

    private static async loadInitialStatuses(): Promise<void> {
        try {
            const allStatuses = await StatusesReference.INSTANCE.getAllStatuses();
            allStatuses.forEach((status) => {
                this.latestStatusValues[status.statusUUID] = {
                    flagName: status.currentActiveFlagName,
                    flagImage: status.currentActiveFlagImage
                };

                const targets = this.objectsByStatusUUID[status.statusUUID];
                if (!targets) {
                    return;
                }

                targets.forEach((object) => {
                    object.applyStatusDisplay(status.currentActiveFlagName, status.currentActiveFlagImage);
                });
            });
        } catch (error) {
            console.warn("[StatusDisplayIObject] Failed to load initial statuses.", error);
        }
    }

    private static applyCachedValueIfPresent(object: StatusDisplayIObject): void {
        const cached = this.latestStatusValues[object.getStatusUUID()];
        if (!cached) {
            return;
        }

        object.applyStatusDisplay(cached.flagName, cached.flagImage);
    }
}

export class MinimapIObject extends InterfaceObject {
    private readonly settings: MinimapIObjectSettings;
    private latestLat: number = 0;
    private latestLng: number = 0;
    private mapContainer!: HTMLDivElement;
    private markerEl!: HTMLDivElement;
    private labelEl!: HTMLDivElement;

    constructor(
        uuid: string,
        posX: number,
        posY: number,
        width: number,
        height: number,
        settings?: Partial<MinimapIObjectSettings>
    ) {
        const resolvedSettings: MinimapIObjectSettings = {
            defaultZoom: settings?.defaultZoom ?? 15,
            followRocket: settings?.followRocket ?? true,
            showGeofences: settings?.showGeofences ?? true,
            latKey: settings?.latKey ?? '',
            lngKey: settings?.lngKey ?? ''
        };
        const keys = [resolvedSettings.latKey, resolvedSettings.lngKey].filter(k => k.length > 0);
        super(uuid, false, keys, posX, posY, width, height);
        this.settings = resolvedSettings;
    }

    protected override initializeSecondaryDOM(): void {
        this.secondaryDOMElement.classList.add("minimap-content");
        this.secondaryDOMElement.style.cssText += 'background:#1a1a1a;position:relative;overflow:hidden;';

        this.mapContainer = document.createElement('div');
        this.mapContainer.style.cssText = 'width:100%;height:100%;position:relative;';

        this.markerEl = document.createElement('div');
        this.markerEl.style.cssText = 'position:absolute;width:10px;height:10px;border-radius:50%;background:#ff4444;transform:translate(-50%,-50%);top:50%;left:50%;z-index:2;';

        this.labelEl = document.createElement('div');
        this.labelEl.style.cssText = 'position:absolute;bottom:4px;left:4px;color:#aaa;font-size:11px;z-index:3;';
        this.labelEl.textContent = 'Minimap (no GPS data)';

        const bg = document.createElement('div');
        bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg,#222 0px,#222 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#222 0px,#222 1px,transparent 1px,transparent 40px);';

        this.mapContainer.appendChild(bg);
        this.mapContainer.appendChild(this.markerEl);
        this.mapContainer.appendChild(this.labelEl);
        this.secondaryDOMElement.appendChild(this.mapContainer);
    }

    public override updateData(packet: TelemetryPacket): void {
        if (typeof packet.value !== 'number') return;
        if (packet.label === this.settings.latKey) this.latestLat = packet.value;
        if (packet.label === this.settings.lngKey) this.latestLng = packet.value;
    }

    public override renderFrame(): void {
        this.labelEl.textContent = `Lat: ${this.latestLat.toFixed(5)}  Lng: ${this.latestLng.toFixed(5)}`;
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

    if (data.type === InterfaceObjectType.THREE_D_MODEL_ABS_ROTATION) {
        if (data.childrenInterfaceObjects && data.childrenInterfaceObjects.length > 0) {
            warnings.push(`[${uuid}] Non-panel objects cannot have children. Children were ignored.`);
        }

        const resolvedKeys = normalizeThreeDModelMonitorDataKeys(
            data.monitorDataKeys,
            data.monitorDataKey,
            data.threeDModelAbsRotationSettings
        );

        if (resolvedKeys.length === 0) {
            warnings.push(`[${uuid}] THREE_D_MODEL_ABS_ROTATION missing monitorDataKeys. Object was skipped.`);
            return null;
        }

        return new ThreeDModelAbsRotationIObject(
            uuid,
            resolvedKeys,
            posX,
            posY,
            width,
            height,
            data.threeDModelAbsRotationSettings
        );
    }

    if (data.type === InterfaceObjectType.STATUS_DISPLAY) {
        if (data.childrenInterfaceObjects && data.childrenInterfaceObjects.length > 0) {
            warnings.push(`[${uuid}] Non-panel objects cannot have children. Children were ignored.`);
        }

        if (data.monitorDataKey || (data.monitorDataKeys && data.monitorDataKeys.length > 0)) {
            warnings.push(`[${uuid}] STATUS_DISPLAY ignores monitorDataKeys.`);
        }

        const statusUUID = data.statusDisplaySettings?.statusUUID?.trim() ?? "";
        if (statusUUID.length === 0) {
            warnings.push(`[${uuid}] STATUS_DISPLAY requires statusDisplaySettings.statusUUID. Object was skipped.`);
            return null;
        }

        return new StatusDisplayIObject(uuid, posX, posY, width, height, data.statusDisplaySettings);
    }

    if (data.type === InterfaceObjectType.MINIMAP) {
        return new MinimapIObject(uuid, posX, posY, width, height, data.minimapSettings);
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

function normalizeThreeDModelMonitorDataKeys(
    monitorDataKeys?: string[],
    legacyMonitorDataKey?: string,
    settings?: Partial<ThreeDModelAbsRotationIObjectSettings>
): string[] {
    const keys = new Set(normalizeMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey));

    if (settings?.vectorTelemetryKey && settings.vectorTelemetryKey.trim().length > 0) {
        keys.add(settings.vectorTelemetryKey.trim());
    }
    if (settings?.rollKey && settings.rollKey.trim().length > 0) {
        keys.add(settings.rollKey.trim());
    }
    if (settings?.pitchKey && settings.pitchKey.trim().length > 0) {
        keys.add(settings.pitchKey.trim());
    }
    if (settings?.yawKey && settings.yawKey.trim().length > 0) {
        keys.add(settings.yawKey.trim());
    }

    return Array.from(keys);
}