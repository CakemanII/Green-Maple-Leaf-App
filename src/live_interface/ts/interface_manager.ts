import { SessionReference } from "../../shared/compiled_js/global_session_reference.js";
import { InterfaceObjectType, Vector3D } from "../../shared/compiled_js/types.js";
import { TelemetryReceiver } from "../../shared/compiled_js/global_rocket_communication_reference.js";
import { InterfaceObjectRuntimeData, TelemetryPacket, TelemetryValueType } from "./interface_objects.js";
import { InterfaceScreen, InterfaceScreenData } from "./interface_screen.js";

class InterfaceManager {
    private static instance: InterfaceManager;
    public static get INSTANCE(): InterfaceManager { return this.instance; }

    private static readonly SCREENS_CONTAINER_ID: string = "screens-container";
    private static readonly SCREEN_TABS_CONTAINER_ID: string = "screen-tabs-container";

    private static readonly SESSION_SCREENS_KEY: string = "live_interface_screens_open";
    private static readonly SESSION_ACTIVE_SCREEN_KEY: string = "live_interface_active_screen_uuid";

    private static readonly OPERATIONAL_STATUS_ROUTE: string = "/radio_rocket_comms_server/get_operational_status";

    private readonly screensByUUID: { [screenUUID: string]: InterfaceScreen } = {};

    private screenUUIDs: string[] = [];
    private screenTelemetrySubscriptions: { [dataLabel: string]: Set<(packet: TelemetryPacket) => void> } = {};

    private screensContainer!: HTMLElement;
    private screenTabsContainer!: HTMLElement;

    private interfaceActive: boolean = false;
    private modePollingTimerId: number | null = null;
    private activeScreenUUID: string | null = null;
    private telemetrySessionStartTimestamp: number | null = null;

    private readonly hiddenScreenRenderBudgetPerSecond: number = 30;

    constructor() {
        if (InterfaceManager.instance) {
            throw new Error("InterfaceManager is a singleton class. Use InterfaceManager.INSTANCE to access the instance.");
        }
        InterfaceManager.instance = this;

        this.screensContainer = document.getElementById(InterfaceManager.SCREENS_CONTAINER_ID) as HTMLElement;
        this.screenTabsContainer = document.getElementById(InterfaceManager.SCREEN_TABS_CONTAINER_ID) as HTMLElement;

        this.initializeTelemetryReceiving();
        this.initializeOperationalModeWatcher();
    }

    private initializeTelemetryReceiving(): void {
        new TelemetryReceiver((label: string, timestamp: number, value: any) => {
            if (this.telemetrySessionStartTimestamp === null) {
                this.telemetrySessionStartTimestamp = timestamp;
            }

            const packet: TelemetryPacket = {
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

    private initializeOperationalModeWatcher(): void {
        this.pollOperationalMode();
        this.modePollingTimerId = window.setInterval(() => {
            this.pollOperationalMode();
        }, 500);
    }

    private async pollOperationalMode(): Promise<void> {
        try {
            const response = await fetch(InterfaceManager.OPERATIONAL_STATUS_ROUTE);
            const data = await response.json();
            // If server reports null (unknown/offline), keep live interface available for preview/testing.
            const isOperational = data?.is_operational === true || data?.is_operational === null;
            this.setInterfaceActive(isOperational);
        } catch (error) {
            console.warn("[InterfaceManager] Failed to read operational mode status.", error);
            // If the status endpoint is unavailable, keep UI active for local preview/editing.
            this.setInterfaceActive(true);
        }
    }

    public setInterfaceActive(active: boolean): void {
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

    private addScreenTelemetrySubscription(dataLabel: string, callback: (packet: TelemetryPacket) => void): void {
        if (!this.screenTelemetrySubscriptions[dataLabel]) {
            this.screenTelemetrySubscriptions[dataLabel] = new Set();
        }
        this.screenTelemetrySubscriptions[dataLabel].add(callback);
    }

    private removeScreenTelemetrySubscription(dataLabel: string, callback: (packet: TelemetryPacket) => void): void {
        const subscriptions = this.screenTelemetrySubscriptions[dataLabel];
        if (!subscriptions) {
            return;
        }

        subscriptions.delete(callback);
        if (subscriptions.size === 0) {
            delete this.screenTelemetrySubscriptions[dataLabel];
        }
    }

    public setScreenUUIDS(screenUUIDS: string[]): void {
        this.screenUUIDs = screenUUIDS;
    }

    private async loadScreenDefinitions(): Promise<InterfaceScreenData[]> {
        try {
            const fromSession = await SessionReference.Instance.getSession(InterfaceManager.SESSION_SCREENS_KEY);
            if (Array.isArray(fromSession) && fromSession.length > 0) {
                return fromSession as InterfaceScreenData[];
            }
        } catch {
            // Session may not have this value yet. Fall back to built-in example.
        }

        return this.getDefaultExampleScreens();
    }

    private getDefaultExampleScreens(): InterfaceScreenData[] {
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
                                monitorDataKeys: ["accel"],
                                lineGraphSettings: {
                                    title: "Linear Acceleration (x, y, z)",
                                    unit: "m/s²",
                                    yMin: -5,
                                    yMax: 5,
                                    maxPoints: 180,
                                    vectorComponents: ["x", "y", "z"]
                                }
                            } as InterfaceObjectRuntimeData,
                            {
                                UUID: "VEL-graph",
                                type: InterfaceObjectType.LINE_GRAPH,
                                posX: 20,
                                posY: 0,
                                width: 50,
                                height: 50,
                                monitorDataKeys: ["accel"],
                                lineGraphSettings: {
                                    title: "Linear Acceleration (x, y, z)",
                                    unit: "m/s²",
                                    yMin: -5,
                                    yMax: 5,
                                    maxPoints: 180,
                                    vectorComponents: ["x", "y", "z"]
                                }
                            } as InterfaceObjectRuntimeData
                        ]
                    } as InterfaceObjectRuntimeData
                ]
            }
        ];
    }

    private instantiateScreenIntoDOM(screenData: InterfaceScreenData): void {
        const screen = new InterfaceScreen(
            screenData,
            this.screensContainer,
            this.screenTabsContainer,
            {
                onTabSelected: (screenUUID: string) => this.selectScreen(screenUUID),
                onSubscribeKey: (key: string, callback: (packet: TelemetryPacket) => void) => this.addScreenTelemetrySubscription(key, callback),
                onUnsubscribeKey: (key: string, callback: (packet: TelemetryPacket) => void) => this.removeScreenTelemetrySubscription(key, callback)
            },
            this.hiddenScreenRenderBudgetPerSecond
        );

        this.screensByUUID[screen.getUUID()] = screen;
    }

    private removeScreenFromDOM(screenUUID: string): void {
        const screen = this.screensByUUID[screenUUID];
        if (!screen) {
            return;
        }
        screen.destroy();
        delete this.screensByUUID[screenUUID];
    }

    private async createAllScreens(): Promise<void> {
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

    private clearAllScreens(): void {
        this.screenUUIDs.forEach((uuid) => {
            this.removeScreenFromDOM(uuid);
        });

        this.screenUUIDs = [];
        this.activeScreenUUID = null;
        this.screenTelemetrySubscriptions = {};
    }

    private selectScreen(screenUUID: string): void {
        if (!this.screensByUUID[screenUUID]) {
            return;
        }

        if (this.activeScreenUUID === screenUUID) {
            return;
        }

        Object.values(this.screensByUUID).forEach((screen) => {
            if (screen.getUUID() === screenUUID) {
                screen.showScreen();
            } else {
                screen.hideScreen();
            }
        });

        this.activeScreenUUID = screenUUID;
        this.saveActiveScreenUUID(screenUUID);
    }

    private async getSavedActiveScreenUUID(): Promise<string | null> {
        try {
            const value = await SessionReference.Instance.getSession(InterfaceManager.SESSION_ACTIVE_SCREEN_KEY);
            return typeof value === "string" ? value : null;
        } catch {
            return null;
        }
    }

    private saveActiveScreenUUID(screenUUID: string): void {
        window.parent.postMessage({
            type: "updateSessionRequest",
            key: InterfaceManager.SESSION_ACTIVE_SCREEN_KEY,
            value: screenUUID
        }, "*");
    }

    private inferTelemetryValueType(value: any): TelemetryValueType {
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

    private isVector3D(value: any): value is Vector3D {
        return value !== null
            && typeof value === "object"
            && typeof value.x === "number"
            && typeof value.y === "number"
            && typeof value.z === "number";
    }
}

new InterfaceManager();