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
}
InterfaceManager.SCREENS_CONTAINER_ID = "screens-container";
InterfaceManager.SCREEN_TABS_CONTAINER_ID = "screen-tabs-container";
InterfaceManager.SESSION_SCREENS_KEY = "live_interface_screens_open";
InterfaceManager.SESSION_ACTIVE_SCREEN_KEY = "live_interface_active_screen_uuid";
InterfaceManager.OPERATIONAL_STATUS_ROUTE = "/radio_rocket_comms_server/get_operational_status";
new InterfaceManager();
//# sourceMappingURL=interface_manager.js.map