import { InterfaceObjectType } from "../../shared/compiled_js/types.js";
import { StatusesReference } from "../../shared/compiled_js/global_statuses_reference.js";
import { BarGraphRepresentation, LineGraphRepresentation, LineGraphYOverflowMode } from "../../live_data/compiled_js/graph_representations.js";
export class InterfaceObject {
    getUUID() { return this.uuid; }
    constructor(uuid, isPanel, monitorDataKeys, posX, posY, width, height, childrenInterfaceObjects = []) {
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
    getPrimaryDOMElement() {
        return this.primaryDOMElement;
    }
    getMonitorDataKeys() {
        return this.monitorDataKeys.slice();
    }
    getChildren() {
        return this.childrenInterfaceObjects.slice();
    }
    // Computes absolute percentages from logical parent space and applies DOM wrapper geometry.
    applyLayoutWithinParent(parentRect) {
        const absoluteRect = {
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
    collectDataDisplayObjectsByKey(output) {
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
    destroy() {
        // Optional override for objects that hold external subscriptions/resources.
    }
    shouldRenderContinuously() {
        return false;
    }
}
export class PanelIObject extends InterfaceObject {
    constructor(uuid, posX, posY, width, height, childrenInterfaceObjects) {
        super(uuid, true, [], posX, posY, width, height, childrenInterfaceObjects);
    }
    initializeSecondaryDOM() {
        this.secondaryDOMElement.classList.add("panel-content");
    }
    updateData(_packet) {
        // Panels do not directly consume telemetry.
    }
    renderFrame() {
        // Panels render through their child display objects.
    }
}
export class LineGraphIObject extends InterfaceObject {
    constructor(uuid, monitorDataKeys, posX, posY, width, height, settings) {
        var _a, _b, _c, _d, _e, _f, _g;
        const resolvedSettings = {
            title: (_a = settings === null || settings === void 0 ? void 0 : settings.title) !== null && _a !== void 0 ? _a : "Line Graph",
            unit: (_b = settings === null || settings === void 0 ? void 0 : settings.unit) !== null && _b !== void 0 ? _b : "units",
            yMin: (_c = settings === null || settings === void 0 ? void 0 : settings.yMin) !== null && _c !== void 0 ? _c : -1,
            yMax: (_d = settings === null || settings === void 0 ? void 0 : settings.yMax) !== null && _d !== void 0 ? _d : 1,
            maxPoints: (_e = settings === null || settings === void 0 ? void 0 : settings.maxPoints) !== null && _e !== void 0 ? _e : 180,
            vectorComponents: (_f = settings === null || settings === void 0 ? void 0 : settings.vectorComponents) !== null && _f !== void 0 ? _f : ["x", "y", "z"],
            lineColors: (_g = settings === null || settings === void 0 ? void 0 : settings.lineColors) !== null && _g !== void 0 ? _g : {
                x: "#ff4f4f",
                y: "#64ff64",
                z: "#65a7ff",
                default: "#f5a623"
            }
        };
        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.graphRepresentation = null;
        this.firstTimestamp = null;
        this.preInitQueue = [];
        this.isGraphInitializationScheduled = false;
        this.settings = resolvedSettings;
        this.scheduleGraphInitialization();
    }
    initializeSecondaryDOM() {
        this.secondaryDOMElement.classList.add("line-graph-content");
        this.graphContainerElement = document.createElement("div");
        this.graphContainerElement.className = "line-graph-host";
        this.graphContainerElement.id = `graphs-container-${this.uuid}`;
        this.secondaryDOMElement.appendChild(this.graphContainerElement);
    }
    updateData(packet) {
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
    renderFrame() {
        // Ensure graph is initialized even before telemetry arrives so axes/labels are visible.
        this.tryInitializeGraphRepresentation();
    }
    pushToGraph(x, y, collection) {
        if (!this.graphRepresentation) {
            this.preInitQueue.push({ x, y, collection });
            this.scheduleGraphInitialization();
            return;
        }
        this.graphRepresentation.addDataPoint(x, y, collection);
    }
    scheduleGraphInitialization() {
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
    tryInitializeGraphRepresentation() {
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
                this.graphRepresentation.addDataPoint(entry.x, entry.y, entry.collection);
            });
            this.preInitQueue = [];
        }
        catch (error) {
            console.error(`[LineGraphIObject:${this.uuid}] Failed to initialize graph representation.`, error);
            this.scheduleGraphInitialization();
        }
    }
    createGraphRepresentation() {
        const collections = this.buildCollectionsWithStyles();
        const representation = new LineGraphRepresentation(this.settings.title, this.settings.unit, this.settings.yMin, this.settings.yMax, 30, collections, this.graphContainerElement.id);
        representation.setOverflowY(LineGraphYOverflowMode.ScaleAxis);
        return representation;
    }
    buildCollectionsWithStyles() {
        const collections = {};
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
    resolveSeriesColor(seriesName) {
        var _a;
        const segments = seriesName.split(".");
        const component = segments[segments.length - 1];
        if (this.settings.lineColors[seriesName]) {
            return this.settings.lineColors[seriesName];
        }
        if (this.settings.lineColors[component]) {
            return this.settings.lineColors[component];
        }
        return (_a = this.settings.lineColors.default) !== null && _a !== void 0 ? _a : "#f5a623";
    }
    isVector3D(value) {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
}
export class BarGraphIObject extends InterfaceObject {
    constructor(uuid, monitorDataKeys, posX, posY, width, height, settings) {
        var _a, _b, _c, _d, _e, _f;
        const resolvedSettings = {
            title: (_a = settings === null || settings === void 0 ? void 0 : settings.title) !== null && _a !== void 0 ? _a : "Bar Graph",
            unit: (_b = settings === null || settings === void 0 ? void 0 : settings.unit) !== null && _b !== void 0 ? _b : "units",
            yMin: (_c = settings === null || settings === void 0 ? void 0 : settings.yMin) !== null && _c !== void 0 ? _c : -1,
            yMax: (_d = settings === null || settings === void 0 ? void 0 : settings.yMax) !== null && _d !== void 0 ? _d : 1,
            groups: settings === null || settings === void 0 ? void 0 : settings.groups,
            barColors: (_e = settings === null || settings === void 0 ? void 0 : settings.barColors) !== null && _e !== void 0 ? _e : {},
            decimals: (_f = settings === null || settings === void 0 ? void 0 : settings.decimals) !== null && _f !== void 0 ? _f : 2
        };
        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.graphRepresentation = null;
        this.firstTimestamp = null;
        this.latestValueBySeriesId = {};
        this.latestTimeBySeriesId = {};
        this.isGraphInitializationScheduled = false;
        this.settings = resolvedSettings;
        this.seriesSettings = this.resolveSeriesSettings();
        this.scheduleGraphInitialization();
    }
    initializeSecondaryDOM() {
        this.secondaryDOMElement.classList.add("line-graph-content");
        this.graphContainerElement = document.createElement("div");
        this.graphContainerElement.className = "line-graph-host";
        this.graphContainerElement.id = `graphs-container-${this.uuid}`;
        this.secondaryDOMElement.appendChild(this.graphContainerElement);
    }
    updateData(packet) {
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
    renderFrame() {
        this.tryInitializeGraphRepresentation();
    }
    resolveSeriesSettings() {
        if (this.settings.groups && this.settings.groups.length > 0) {
            const series = [];
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
    resolveGroups() {
        if (this.settings.groups && this.settings.groups.length > 0) {
            return this.settings.groups;
        }
        return this.monitorDataKeys.map((key, index) => ({
            id: `g${index + 1}`,
            label: key,
            series: [{ id: key, label: key, key }]
        }));
    }
    scheduleGraphInitialization() {
        if (this.isGraphInitializationScheduled) {
            return;
        }
        this.isGraphInitializationScheduled = true;
        window.setTimeout(() => {
            this.isGraphInitializationScheduled = false;
            this.tryInitializeGraphRepresentation();
        }, 0);
    }
    tryInitializeGraphRepresentation() {
        if (this.graphRepresentation) {
            return;
        }
        if (!document.getElementById(this.graphContainerElement.id)) {
            this.scheduleGraphInitialization();
            return;
        }
        try {
            const groups = this.resolveGroups();
            const barGroups = groups.map((group) => ({
                id: group.id,
                label: group.label,
                series: group.series.map((series) => ({ id: series.id, label: series.label }))
            }));
            const barStyles = {};
            this.seriesSettings.forEach((series) => {
                var _a;
                barStyles[series.id] = {
                    color: (_a = this.settings.barColors[series.id]) !== null && _a !== void 0 ? _a : this.resolveSeriesColor(series.id),
                    opacity: 1
                };
            });
            this.graphRepresentation = new BarGraphRepresentation(this.settings.title, this.settings.unit, this.settings.yMin, this.settings.yMax, barGroups, barStyles, this.graphContainerElement.id, this.settings.decimals);
            this.flushLatestValuesToGraph();
        }
        catch (error) {
            console.error(`[BarGraphIObject:${this.uuid}] Failed to initialize graph representation.`, error);
            this.scheduleGraphInitialization();
        }
    }
    flushLatestValuesToGraph() {
        if (!this.graphRepresentation) {
            return;
        }
        this.seriesSettings.forEach((series) => {
            const latestValue = this.latestValueBySeriesId[series.id];
            const latestTime = this.latestTimeBySeriesId[series.id];
            if (latestValue === undefined || latestTime === undefined) {
                return;
            }
            this.graphRepresentation.addDataPoint(latestTime, latestValue, series.id);
        });
    }
    resolveSeriesColor(seriesId) {
        const defaults = ["#ff4f4f", "#64ff64", "#65a7ff", "#f5a623", "#ce7dff", "#45d3b3"];
        let hash = 0;
        for (let i = 0; i < seriesId.length; i++) {
            hash = (hash << 5) - hash + seriesId.charCodeAt(i);
            hash |= 0;
        }
        return defaults[Math.abs(hash) % defaults.length];
    }
    isVector3D(value) {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
}
export class ThreeDModelAbsRotationIObject extends InterfaceObject {
    constructor(uuid, monitorDataKeys, posX, posY, width, height, settings) {
        var _a, _b, _c, _d;
        const resolvedSettings = {
            title: (_a = settings === null || settings === void 0 ? void 0 : settings.title) !== null && _a !== void 0 ? _a : "3D Absolute Rotation",
            eulerOrder: (_b = settings === null || settings === void 0 ? void 0 : settings.eulerOrder) !== null && _b !== void 0 ? _b : "ZYX",
            angleUnit: (_c = settings === null || settings === void 0 ? void 0 : settings.angleUnit) !== null && _c !== void 0 ? _c : "deg",
            vectorTelemetryKey: settings === null || settings === void 0 ? void 0 : settings.vectorTelemetryKey,
            rollKey: settings === null || settings === void 0 ? void 0 : settings.rollKey,
            pitchKey: settings === null || settings === void 0 ? void 0 : settings.pitchKey,
            yawKey: settings === null || settings === void 0 ? void 0 : settings.yawKey,
            modelColor: (_d = settings === null || settings === void 0 ? void 0 : settings.modelColor) !== null && _d !== void 0 ? _d : "#8ec5ff"
        };
        super(uuid, false, monitorDataKeys, posX, posY, width, height);
        this.rollRad = 0;
        this.pitchRad = 0;
        this.yawRad = 0;
        this.isCubeInitialized = false;
        this.settings = resolvedSettings;
        this.refreshOverlayText();
        this.initializeCubeIfNeeded();
    }
    initializeSecondaryDOM() {
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
    updateData(packet) {
        var _a;
        if (!this.monitorDataKeys.includes(packet.label)) {
            return;
        }
        const vectorKey = (_a = this.settings.vectorTelemetryKey) !== null && _a !== void 0 ? _a : this.monitorDataKeys[0];
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
    renderFrame() {
        this.initializeCubeIfNeeded();
        if (!this.isCubeInitialized) {
            return;
        }
        this.applyCubeRotation();
        this.refreshOverlayText();
    }
    shouldRenderContinuously() {
        return true;
    }
    setEulerInput(roll, pitch, yaw) {
        this.rollRad = this.toRadians(roll);
        this.pitchRad = this.toRadians(pitch);
        this.yawRad = this.toRadians(yaw);
    }
    toRadians(value) {
        return this.settings.angleUnit === "deg" ? (value * Math.PI) / 180 : value;
    }
    refreshOverlayText() {
        const toDisplay = (rad) => (rad * 180 / Math.PI).toFixed(1);
        this.overlayElement.textContent = `${this.settings.title} | R: ${toDisplay(this.rollRad)} P: ${toDisplay(this.pitchRad)} Y: ${toDisplay(this.yawRad)}`;
    }
    initializeCubeIfNeeded() {
        if (this.isCubeInitialized) {
            return;
        }
        if (!document.body.contains(this.hostElement) || !this.cubeElement) {
            return;
        }
        this.isCubeInitialized = true;
        this.applyCubeRotation();
    }
    applyCubeRotation() {
        if (!this.cubeElement) {
            return;
        }
        const rollDeg = (this.rollRad * 180) / Math.PI;
        const pitchDeg = (this.pitchRad * 180) / Math.PI;
        const yawDeg = (this.yawRad * 180) / Math.PI;
        const angleByAxis = {
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
    isVector3D(value) {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
    // Keep compatibility with previous class shape; no external script loading required.
    static ensureThreeLoaded() {
        return Promise.resolve(null);
    }
}
export class StatusDisplayIObject extends InterfaceObject {
    constructor(uuid, posX, posY, width, height, settings) {
        var _a, _b, _c, _d;
        const resolvedSettings = {
            statusUUID: (_b = (_a = settings === null || settings === void 0 ? void 0 : settings.statusUUID) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "",
            title: (_c = settings === null || settings === void 0 ? void 0 : settings.title) !== null && _c !== void 0 ? _c : "Status",
            emptyText: (_d = settings === null || settings === void 0 ? void 0 : settings.emptyText) !== null && _d !== void 0 ? _d : "No active flag"
        };
        super(uuid, false, [], posX, posY, width, height);
        this.settings = resolvedSettings;
        this.titleElement.textContent = this.settings.title;
        this.applyStatusDisplay(this.settings.emptyText, "");
        StatusDisplayIObject.registerObject(this);
        StatusDisplayIObject.ensureStatusBridgeInitialized();
        StatusDisplayIObject.applyCachedValueIfPresent(this);
    }
    initializeSecondaryDOM() {
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
    updateData(_packet) {
        // STATUS_DISPLAY is driven by global status updates, not telemetry packets.
    }
    renderFrame() {
        // Rendering occurs immediately on status update callback.
    }
    destroy() {
        StatusDisplayIObject.unregisterObject(this);
    }
    getStatusUUID() {
        return this.settings.statusUUID;
    }
    applyStatusDisplay(flagName, flagImage) {
        const hasImage = typeof flagImage === "string" && flagImage.trim().length > 0;
        const hasFlagName = typeof flagName === "string" && flagName.trim().length > 0;
        if (hasImage) {
            this.flagImageElement.src = this.convertPathToServerRoute(flagImage);
            this.flagImageElement.style.display = "block";
        }
        else {
            this.flagImageElement.src = "";
            this.flagImageElement.style.display = "none";
        }
        this.flagNameElement.textContent = hasFlagName ? flagName : this.settings.emptyText;
    }
    convertPathToServerRoute(path) {
        const normalizedPath = path.replace(/\\/g, "/");
        return `/serve_image/${encodeURI(normalizedPath)}`;
    }
    static registerObject(object) {
        const statusUUID = object.getStatusUUID();
        if (!this.objectsByStatusUUID[statusUUID]) {
            this.objectsByStatusUUID[statusUUID] = new Set();
        }
        this.objectsByStatusUUID[statusUUID].add(object);
    }
    static unregisterObject(object) {
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
    static ensureStatusBridgeInitialized() {
        if (this.statusBridgeInitialized) {
            return;
        }
        this.statusBridgeInitialized = true;
        StatusesReference.INSTANCE.setOnStatusUpdateCallback((statusUUID, flag) => {
            var _a;
            this.latestStatusValues[statusUUID] = { flagName: flag.name, flagImage: (_a = flag.imageUUID) !== null && _a !== void 0 ? _a : "" };
            const targets = this.objectsByStatusUUID[statusUUID];
            if (!targets) {
                return;
            }
            targets.forEach((object) => {
                var _a;
                object.applyStatusDisplay(flag.name, (_a = flag.imageUUID) !== null && _a !== void 0 ? _a : "");
            });
        });
        if (!this.initialStatusesLoad) {
            this.initialStatusesLoad = this.loadInitialStatuses();
        }
    }
    static async loadInitialStatuses() {
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
        }
        catch (error) {
            console.warn("[StatusDisplayIObject] Failed to load initial statuses.", error);
        }
    }
    static applyCachedValueIfPresent(object) {
        const cached = this.latestStatusValues[object.getStatusUUID()];
        if (!cached) {
            return;
        }
        object.applyStatusDisplay(cached.flagName, cached.flagImage);
    }
}
StatusDisplayIObject.objectsByStatusUUID = {};
StatusDisplayIObject.latestStatusValues = {};
StatusDisplayIObject.statusBridgeInitialized = false;
StatusDisplayIObject.initialStatusesLoad = null;
export function createInterfaceObjectFromData(data, warnings) {
    var _a, _b, _c, _d, _e;
    const uuid = (_a = data.UUID) !== null && _a !== void 0 ? _a : `iobj-${Math.random().toString(36).slice(2, 10)}`;
    const posX = Number.isFinite(data.posX) ? data.posX : 0;
    const posY = Number.isFinite(data.posY) ? data.posY : 0;
    const width = Number.isFinite(data.width) ? data.width : 100;
    const height = Number.isFinite(data.height) ? data.height : 100;
    if (data.type === InterfaceObjectType.PANEL) {
        if (data.monitorDataKey || (data.monitorDataKeys && data.monitorDataKeys.length > 0)) {
            warnings.push(`[${uuid}] Panel objects cannot define monitorDataKeys. Ignoring those values.`);
        }
        const childObjects = [];
        const children = (_b = data.childrenInterfaceObjects) !== null && _b !== void 0 ? _b : [];
        children.forEach((childData) => {
            const created = createInterfaceObjectFromData(childData, warnings);
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
        const resolvedKeys = normalizeBarGraphMonitorDataKeys(data.monitorDataKeys, data.monitorDataKey, data.barGraphSettings);
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
        const resolvedKeys = normalizeThreeDModelMonitorDataKeys(data.monitorDataKeys, data.monitorDataKey, data.threeDModelAbsRotationSettings);
        if (resolvedKeys.length === 0) {
            warnings.push(`[${uuid}] THREE_D_MODEL_ABS_ROTATION missing monitorDataKeys. Object was skipped.`);
            return null;
        }
        return new ThreeDModelAbsRotationIObject(uuid, resolvedKeys, posX, posY, width, height, data.threeDModelAbsRotationSettings);
    }
    if (data.type === InterfaceObjectType.STATUS_DISPLAY) {
        if (data.childrenInterfaceObjects && data.childrenInterfaceObjects.length > 0) {
            warnings.push(`[${uuid}] Non-panel objects cannot have children. Children were ignored.`);
        }
        if (data.monitorDataKey || (data.monitorDataKeys && data.monitorDataKeys.length > 0)) {
            warnings.push(`[${uuid}] STATUS_DISPLAY ignores monitorDataKeys.`);
        }
        const statusUUID = (_e = (_d = (_c = data.statusDisplaySettings) === null || _c === void 0 ? void 0 : _c.statusUUID) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "";
        if (statusUUID.length === 0) {
            warnings.push(`[${uuid}] STATUS_DISPLAY requires statusDisplaySettings.statusUUID. Object was skipped.`);
            return null;
        }
        return new StatusDisplayIObject(uuid, posX, posY, width, height, data.statusDisplaySettings);
    }
    warnings.push(`[${uuid}] Unsupported interface object type '${String(data.type)}'. Object was skipped.`);
    return null;
}
function normalizeMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey) {
    const keys = new Set();
    (monitorDataKeys !== null && monitorDataKeys !== void 0 ? monitorDataKeys : []).forEach((key) => {
        if (typeof key === "string" && key.trim().length > 0) {
            keys.add(key.trim());
        }
    });
    if (typeof legacyMonitorDataKey === "string" && legacyMonitorDataKey.trim().length > 0) {
        keys.add(legacyMonitorDataKey.trim());
    }
    return Array.from(keys);
}
function normalizeBarGraphMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey, settings) {
    var _a;
    const keys = new Set(normalizeMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey));
    ((_a = settings === null || settings === void 0 ? void 0 : settings.groups) !== null && _a !== void 0 ? _a : []).forEach((group) => {
        var _a;
        ((_a = group.series) !== null && _a !== void 0 ? _a : []).forEach((series) => {
            if (typeof series.key === "string" && series.key.trim().length > 0) {
                keys.add(series.key.trim());
            }
        });
    });
    return Array.from(keys);
}
function normalizeThreeDModelMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey, settings) {
    const keys = new Set(normalizeMonitorDataKeys(monitorDataKeys, legacyMonitorDataKey));
    if ((settings === null || settings === void 0 ? void 0 : settings.vectorTelemetryKey) && settings.vectorTelemetryKey.trim().length > 0) {
        keys.add(settings.vectorTelemetryKey.trim());
    }
    if ((settings === null || settings === void 0 ? void 0 : settings.rollKey) && settings.rollKey.trim().length > 0) {
        keys.add(settings.rollKey.trim());
    }
    if ((settings === null || settings === void 0 ? void 0 : settings.pitchKey) && settings.pitchKey.trim().length > 0) {
        keys.add(settings.pitchKey.trim());
    }
    if ((settings === null || settings === void 0 ? void 0 : settings.yawKey) && settings.yawKey.trim().length > 0) {
        keys.add(settings.yawKey.trim());
    }
    return Array.from(keys);
}
//# sourceMappingURL=interface_objects.js.map