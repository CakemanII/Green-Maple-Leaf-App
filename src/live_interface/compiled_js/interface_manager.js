import { SessionReference } from "../../shared/compiled_js/global_session_reference.js";
import { InterfaceObjectType } from "../../shared/compiled_js/types.js";
import { TelemetryReceiver } from "../../shared/compiled_js/global_rocket_communication_reference.js";
import { InterfaceScreen } from "./interface_screen.js";
class InterfaceManager {
    static get INSTANCE() { return this.instance; }
    constructor() {
        this.screensByUUID = {};
        this.screenUUIDs = [];
        this.screenTelemetrySubscriptions = {};
        this.interfaceActive = false;
        this.modePollingTimerId = null;
        this.activeScreenUUID = null;
        this.telemetrySessionStartTimestamp = null;
        this.hiddenScreenRenderBudgetPerSecond = 30;
        if (InterfaceManager.instance) {
            throw new Error("InterfaceManager is a singleton class. Use InterfaceManager.INSTANCE to access the instance.");
        }
        InterfaceManager.instance = this;
        this.screensContainer = document.getElementById(InterfaceManager.SCREENS_CONTAINER_ID);
        this.screenTabsContainer = document.getElementById(InterfaceManager.SCREEN_TABS_CONTAINER_ID);
        this.initializeTelemetryReceiving();
        this.initializeOperationalModeWatcher();
        this.initializeCollectionMessageHandler();
    }
    initializeTelemetryReceiving() {
        new TelemetryReceiver((label, timestamp, value) => {
            if (this.telemetrySessionStartTimestamp === null) {
                this.telemetrySessionStartTimestamp = timestamp;
            }
            const packet = {
                label,
                timestampRaw: timestamp,
                timestampRelative: timestamp - this.telemetrySessionStartTimestamp,
                value,
                valueType: this.inferTelemetryValueType(value)
            };
            const subscribers = this.screenTelemetrySubscriptions[label];
            if (!subscribers || subscribers.size === 0) {
                return;
            }
            subscribers.forEach((callback) => callback(packet));
        });
    }
    initializeOperationalModeWatcher() {
        this.pollOperationalMode();
        this.modePollingTimerId = window.setInterval(() => {
            this.pollOperationalMode();
        }, 500);
    }
    async pollOperationalMode() {
        try {
            const response = await fetch(InterfaceManager.OPERATIONAL_STATUS_ROUTE);
            const data = await response.json();
            // If server reports null (unknown/offline), keep live interface available for preview/testing.
            const isOperational = (data === null || data === void 0 ? void 0 : data.is_operational) === true || (data === null || data === void 0 ? void 0 : data.is_operational) === null;
            this.setInterfaceActive(isOperational);
        }
        catch (error) {
            console.warn("[InterfaceManager] Failed to read operational mode status.", error);
            // If the status endpoint is unavailable, keep UI active for local preview/editing.
            this.setInterfaceActive(true);
        }
    }
    setInterfaceActive(active) {
        const previousState = this.interfaceActive;
        this.interfaceActive = active;
        if (previousState === active) {
            return;
        }
        if (active) {
            this.createAllScreens().catch((error) => {
                console.error("[InterfaceManager] Failed to create screens.", error);
            });
            return;
        }
        this.clearAllScreens();
    }
    addScreenTelemetrySubscription(dataLabel, callback) {
        if (!this.screenTelemetrySubscriptions[dataLabel]) {
            this.screenTelemetrySubscriptions[dataLabel] = new Set();
        }
        this.screenTelemetrySubscriptions[dataLabel].add(callback);
    }
    removeScreenTelemetrySubscription(dataLabel, callback) {
        const subscriptions = this.screenTelemetrySubscriptions[dataLabel];
        if (!subscriptions) {
            return;
        }
        subscriptions.delete(callback);
        if (subscriptions.size === 0) {
            delete this.screenTelemetrySubscriptions[dataLabel];
        }
    }
    setScreenUUIDS(screenUUIDS) {
        this.screenUUIDs = screenUUIDS;
    }
    async loadScreenDefinitions() {
        try {
            const fromSession = await SessionReference.Instance.getSession(InterfaceManager.SESSION_SCREENS_KEY);
            if (Array.isArray(fromSession) && fromSession.length > 0) {
                return fromSession;
            }
        }
        catch (_a) {
            // Session may not have this value yet. Fall back to built-in example.
        }
        return this.getDefaultExampleScreens();
    }
    getDefaultExampleScreens() {
        return [
            {
                UUID: "example-screen-acceleration",
                name: "Acceleration Example",
                interfaceObjects: [
                    {
                        UUID: "accel-root-panel",
                        type: InterfaceObjectType.PANEL,
                        posX: 10,
                        posY: 0,
                        width: 80,
                        height: 90,
                        childrenInterfaceObjects: [
                            {
                                UUID: "accel-graph",
                                type: InterfaceObjectType.LINE_GRAPH,
                                posX: 0,
                                posY: 0,
                                width: 50,
                                height: 50,
                                monitorDataKeys: ["absolute_angular_motion.angular_velocity"],
                                lineGraphSettings: {
                                    title: "Absolute Angular Velocity (x, y, z)",
                                    unit: "rad/s",
                                    yMin: -5,
                                    yMax: 5,
                                    maxPoints: 180,
                                    vectorComponents: ["x", "y", "z"]
                                }
                            },
                            {
                                UUID: "VEL-graph",
                                type: InterfaceObjectType.BAR_GRAPH,
                                posX: 52,
                                posY: 0,
                                width: 48,
                                height: 50,
                                monitorDataKeys: ["accel", "runtime"],
                                barGraphSettings: {
                                    title: "Acceleration Groups",
                                    unit: "m/s²",
                                    yMin: -5,
                                    yMax: 5,
                                    decimals: 2,
                                    groups: [
                                        {
                                            id: "g1",
                                            label: "G1",
                                            series: [
                                                { id: "accel-x", label: "Accel X", key: "accel", component: "x" }
                                            ]
                                        },
                                        {
                                            id: "g2",
                                            label: "G2",
                                            series: [
                                                { id: "accel-y", label: "Accel Y", key: "accel", component: "y" }
                                            ]
                                        },
                                        {
                                            id: "g3",
                                            label: "G3",
                                            series: [
                                                { id: "accel-z", label: "Accel Z", key: "accel", component: "z" }
                                            ]
                                        }
                                    ],
                                    barColors: {
                                        "accel-x": "#ff4f4f",
                                        "accel-y": "#4f6bff",
                                        "accel-z": "#45d36b"
                                    }
                                }
                            },
                            {
                                UUID: "abs-rotation-3d",
                                type: InterfaceObjectType.THREE_D_MODEL_ABS_ROTATION,
                                posX: 0,
                                posY: 52,
                                width: 50,
                                height: 48,
                                monitorDataKeys: ["ang_pos"],
                                threeDModelAbsRotationSettings: {
                                    title: "Absolute Rotation (Earth Frame)",
                                    eulerOrder: "ZYX",
                                    angleUnit: "deg",
                                    vectorTelemetryKey: "ang_pos",
                                    modelColor: "#7fb8ff"
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }
    instantiateScreenIntoDOM(screenData) {
        const screen = new InterfaceScreen(screenData, this.screensContainer, this.screenTabsContainer, {
            onTabSelected: (screenUUID) => this.selectScreen(screenUUID),
            onSubscribeKey: (key, callback) => this.addScreenTelemetrySubscription(key, callback),
            onUnsubscribeKey: (key, callback) => this.removeScreenTelemetrySubscription(key, callback)
        }, this.hiddenScreenRenderBudgetPerSecond);
        this.screensByUUID[screen.getUUID()] = screen;
    }
    removeScreenFromDOM(screenUUID) {
        const screen = this.screensByUUID[screenUUID];
        if (!screen) {
            return;
        }
        screen.destroy();
        delete this.screensByUUID[screenUUID];
    }
    async createAllScreens() {
        this.clearAllScreens();
        const screenDefinitions = await this.loadScreenDefinitions();
        this.setScreenUUIDS(screenDefinitions.map((screen) => screen.UUID));
        screenDefinitions.forEach((screenDefinition) => {
            this.instantiateScreenIntoDOM(screenDefinition);
        });
        if (this.screenUUIDs.length === 0) {
            this.activeScreenUUID = null;
            return;
        }
        const savedActiveScreenUUID = await this.getSavedActiveScreenUUID();
        const initialScreenUUID = (savedActiveScreenUUID && this.screensByUUID[savedActiveScreenUUID])
            ? savedActiveScreenUUID
            : this.screenUUIDs[0];
        this.selectScreen(initialScreenUUID);
    }
    clearAllScreens() {
        this.screenUUIDs.forEach((uuid) => {
            this.removeScreenFromDOM(uuid);
        });
        this.screenUUIDs = [];
        this.activeScreenUUID = null;
        this.screenTelemetrySubscriptions = {};
    }
    selectScreen(screenUUID) {
        if (!this.screensByUUID[screenUUID]) {
            return;
        }
        if (this.activeScreenUUID === screenUUID) {
            return;
        }
        Object.values(this.screensByUUID).forEach((screen) => {
            if (screen.getUUID() === screenUUID) {
                screen.showScreen();
            }
            else {
                screen.hideScreen();
            }
        });
        this.activeScreenUUID = screenUUID;
        this.saveActiveScreenUUID(screenUUID);
    }
    async getSavedActiveScreenUUID() {
        try {
            const value = await SessionReference.Instance.getSession(InterfaceManager.SESSION_ACTIVE_SCREEN_KEY);
            return typeof value === "string" ? value : null;
        }
        catch (_a) {
            return null;
        }
    }
    saveActiveScreenUUID(screenUUID) {
        window.parent.postMessage({
            type: "updateSessionRequest",
            key: InterfaceManager.SESSION_ACTIVE_SCREEN_KEY,
            value: screenUUID
        }, "*");
    }
    inferTelemetryValueType(value) {
        if (typeof value === "number") {
            return "number";
        }
        if (typeof value === "string") {
            return "string";
        }
        if (typeof value === "boolean") {
            return "boolean";
        }
        if (this.isVector3D(value)) {
            return "vector3d";
        }
        return "unknown";
    }
    isVector3D(value) {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
    initializeCollectionMessageHandler() {
        window.addEventListener('message', async (e) => {
            var _a, _b, _c, _d;
            if (((_a = e.data) === null || _a === void 0 ? void 0 : _a.type) !== 'loadCollection')
                return;
            const uuid = e.data.uuid;
            if (!uuid)
                return;
            try {
                const response = await fetch(`/interface_collection/fetch?uuid=${encodeURIComponent(uuid)}`);
                const text = await response.text();
                const collection = JSON.parse(text);
                const screenDefs = this.convertCollectionToScreenDefs(collection);
                if (screenDefs.length === 0)
                    return;
                (_c = (_b = window.parent) === null || _b === void 0 ? void 0 : _b.postMessage) === null || _c === void 0 ? void 0 : _c.call(_b, { type: 'updateSessionRequest', key: InterfaceManager.SESSION_SCREENS_KEY, value: screenDefs }, '*');
                // Broadcast notifications to sub-components
                window.dispatchEvent(new MessageEvent('message', { data: { type: 'loadCollection', notifications: (_d = collection.notifications) !== null && _d !== void 0 ? _d : [] } }));
                this.clearAllScreens();
                this.setScreenUUIDS(screenDefs.map((s) => s.UUID));
                screenDefs.forEach((def) => this.instantiateScreenIntoDOM(def));
                if (screenDefs.length > 0)
                    this.selectScreen(screenDefs[0].UUID);
            }
            catch (err) {
                console.error('[InterfaceManager] Failed to load collection:', err);
            }
        });
    }
    convertCollectionToScreenDefs(collection) {
        if (!Array.isArray(collection === null || collection === void 0 ? void 0 : collection.screens))
            return [];
        return collection.screens.map((screen) => {
            var _a;
            return ({
                UUID: screen.uuid,
                name: screen.name,
                interfaceObjects: ((_a = screen.objects) !== null && _a !== void 0 ? _a : []).map((obj) => this.convertEditorObject(obj)).filter(Boolean)
            });
        });
    }
    convertEditorObject(obj) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        const base = {
            UUID: obj.uuid,
            posX: (_b = (_a = obj.position) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0,
            posY: (_d = (_c = obj.position) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0,
            width: (_f = (_e = obj.size) === null || _e === void 0 ? void 0 : _e.width) !== null && _f !== void 0 ? _f : 20,
            height: (_h = (_g = obj.size) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : 20,
        };
        switch (obj.type) {
            case 'PANEL':
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.PANEL, childrenInterfaceObjects: [] });
            case 'LINE_GRAPH':
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.LINE_GRAPH, monitorDataKeys: (_j = obj.monitorDataKeys) !== null && _j !== void 0 ? _j : [], lineGraphSettings: {
                        title: obj.name || 'Line Graph',
                        unit: (_l = (_k = obj.graphStyle) === null || _k === void 0 ? void 0 : _k.unit) !== null && _l !== void 0 ? _l : '',
                        yMin: (_o = (_m = obj.graphStyle) === null || _m === void 0 ? void 0 : _m.yMin) !== null && _o !== void 0 ? _o : 0,
                        yMax: (_q = (_p = obj.graphStyle) === null || _p === void 0 ? void 0 : _p.yMax) !== null && _q !== void 0 ? _q : 100,
                        maxPoints: 180,
                        vectorComponents: ['x', 'y', 'z'],
                        lineColors: (_s = (_r = obj.graphStyle) === null || _r === void 0 ? void 0 : _r.lineColors) !== null && _s !== void 0 ? _s : {}
                    } });
            case 'BAR_GRAPH': {
                const bars = (_t = obj.bars) !== null && _t !== void 0 ? _t : [];
                const groups = bars.map((bar) => ({
                    id: bar.id,
                    label: bar.label,
                    series: [{ id: bar.id, label: bar.label, key: bar.monitorKey }]
                }));
                const barColors = {};
                bars.forEach((bar) => { barColors[bar.id] = bar.color; });
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.BAR_GRAPH, monitorDataKeys: bars.map((b) => b.monitorKey).filter(Boolean), barGraphSettings: {
                        title: (_v = (_u = obj.graphStyle) === null || _u === void 0 ? void 0 : _u.title) !== null && _v !== void 0 ? _v : 'Bar Graph',
                        unit: '',
                        yMin: (_x = (_w = obj.graphStyle) === null || _w === void 0 ? void 0 : _w.yMin) !== null && _x !== void 0 ? _x : 0,
                        yMax: (_z = (_y = obj.graphStyle) === null || _y === void 0 ? void 0 : _y.yMax) !== null && _z !== void 0 ? _z : 100,
                        decimals: 2,
                        groups,
                        barColors
                    } });
            }
            case 'MODEL_3D':
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.THREE_D_MODEL_ABS_ROTATION, monitorDataKeys: [obj.rollKey, obj.pitchKey, obj.yawKey].filter(Boolean), threeDModelAbsRotationSettings: {
                        title: obj.name || '3D Model',
                        eulerOrder: 'ZYX',
                        angleUnit: (_0 = obj.angleUnit) !== null && _0 !== void 0 ? _0 : 'deg',
                        rollKey: obj.rollKey,
                        pitchKey: obj.pitchKey,
                        yawKey: obj.yawKey,
                        modelColor: (_1 = obj.modelColor) !== null && _1 !== void 0 ? _1 : '#7fb8ff'
                    } });
            case 'MINIMAP':
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.MINIMAP, monitorDataKeys: [obj.latKey, obj.lngKey].filter(Boolean), minimapSettings: {
                        defaultZoom: (_2 = obj.defaultZoom) !== null && _2 !== void 0 ? _2 : 15,
                        followRocket: (_3 = obj.followRocket) !== null && _3 !== void 0 ? _3 : true,
                        showGeofences: (_4 = obj.showGeofences) !== null && _4 !== void 0 ? _4 : true,
                        latKey: (_5 = obj.latKey) !== null && _5 !== void 0 ? _5 : '',
                        lngKey: (_6 = obj.lngKey) !== null && _6 !== void 0 ? _6 : ''
                    } });
            case 'STATUS_DISPLAY':
                return Object.assign(Object.assign({}, base), { type: InterfaceObjectType.STATUS_DISPLAY, statusDisplaySettings: {
                        statusUUID: (_7 = obj.statusUUID) !== null && _7 !== void 0 ? _7 : '',
                        title: obj.name || 'Status',
                        emptyText: 'No active flag'
                    } });
            default:
                return null;
        }
    }
}
InterfaceManager.SCREENS_CONTAINER_ID = "screens-container";
InterfaceManager.SCREEN_TABS_CONTAINER_ID = "screen-tabs-container";
InterfaceManager.SESSION_SCREENS_KEY = "live_interface_screens_open";
InterfaceManager.SESSION_ACTIVE_SCREEN_KEY = "live_interface_active_screen_uuid";
InterfaceManager.OPERATIONAL_STATUS_ROUTE = "/radio_rocket_comms_server/get_operational_status";
new InterfaceManager();
//# sourceMappingURL=interface_manager.js.map