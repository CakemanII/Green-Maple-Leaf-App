import {
    createInterfaceObjectFromData,
    InterfaceLayoutRect,
    InterfaceObject,
    InterfaceObjectRuntimeData,
    TelemetryPacket,
    TelemetryValueType
} from "./interface_objects.js";

export type InterfaceScreenData = {
    UUID: string;
    name: string;
    interfaceObjects: InterfaceObjectRuntimeData[];
};

type ScreenCallbacks = {
    onTabSelected: (screenUUID: string) => void;
    onSubscribeKey: (key: string, callback: (packet: TelemetryPacket) => void) => void;
    onUnsubscribeKey: (key: string, callback: (packet: TelemetryPacket) => void) => void;
};

export class InterfaceScreen {
    private readonly uuid: string;
    private readonly name: string;

    private readonly rootInterfaceObjects: InterfaceObject[];
    private readonly interfaceDisplayObjectsByMonitorKey: { [monitorDataKey: string]: InterfaceObject[] } = {};

    private readonly callbacks: ScreenCallbacks;
    private readonly screenElement: HTMLDivElement;
    private readonly tabElement: HTMLButtonElement;

    private visible: boolean = false;

    private readonly dirtyDisplayObjects: Set<InterfaceObject> = new Set();
    private readonly continuousDisplayObjects: Set<InterfaceObject> = new Set();

    private readonly foregroundRenderIntervalMs: number = 1000 / 30;
    private readonly backgroundRenderIntervalMs: number = 500;
    private readonly backgroundRenderBudgetPerSecond: number;

    private foregroundRenderTimerId: number | null = null;
    private backgroundRenderTimerId: number | null = null;
    private backgroundWindowStartedAt: number = Date.now();
    private backgroundRenderedThisWindow: number = 0;

    private readonly telemetryCallbackByKey: { [key: string]: (packet: TelemetryPacket) => void } = {};

    constructor(
        data: InterfaceScreenData,
        screensContainer: HTMLElement,
        tabsContainer: HTMLElement,
        callbacks: ScreenCallbacks,
        backgroundRenderBudgetPerSecond: number = 30
    ) {
        this.uuid = data.UUID;
        this.name = data.name;
        this.callbacks = callbacks;
        this.backgroundRenderBudgetPerSecond = backgroundRenderBudgetPerSecond;

        this.rootInterfaceObjects = this.buildInterfaceObjects(data.interfaceObjects);

        this.buildMonitorIndex();

        this.screenElement = document.createElement("div");
        this.screenElement.className = "interface-screen";
        this.screenElement.setAttribute("data-screen-uuid", this.uuid);

        const backgroundPanel = document.createElement("div");
        backgroundPanel.className = "screen-root-panel";
        this.screenElement.appendChild(backgroundPanel);
        this.mountObjectTreeAsSiblings(backgroundPanel);

        this.tabElement = document.createElement("button");
        this.tabElement.className = "screen-tab";
        this.tabElement.textContent = this.name;
        this.tabElement.setAttribute("data-screen-uuid", this.uuid);
        this.tabElement.addEventListener("click", () => {
            this.callbacks.onTabSelected(this.uuid);
        });

        screensContainer.appendChild(this.screenElement);
        tabsContainer.appendChild(this.tabElement);

        // Initial render pass so display objects can initialize DOM-driven visuals immediately.
        this.seedInitialRenderPass();

        this.registerSubscriptions();
        this.startRenderLoops();
    }

    public getUUID(): string {
        return this.uuid;
    }

    public getName(): string {
        return this.name;
    }

    public showScreen(): void {
        this.visible = true;
        this.screenElement.classList.add("active");
        this.screenElement.classList.remove("inactive");
        this.tabElement.classList.add("active");
    }

    public hideScreen(): void {
        this.visible = false;
        this.screenElement.classList.remove("active");
        this.screenElement.classList.add("inactive");
        this.tabElement.classList.remove("active");
    }

    public destroy(): void {
        this.stopRenderLoops();
        this.unregisterSubscriptions();
        this.rootInterfaceObjects.forEach((object) => this.destroyObjectTree(object));
        this.tabElement.remove();
        this.screenElement.remove();
    }

    private destroyObjectTree(object: InterfaceObject): void {
        object.getChildren().forEach((child) => this.destroyObjectTree(child));
        object.destroy();
    }

    private buildInterfaceObjects(interfaceObjectsData: InterfaceObjectRuntimeData[]): InterfaceObject[] {
        const warnings: string[] = [];
        const createdObjects: InterfaceObject[] = [];

        interfaceObjectsData.forEach((objectData) => {
            const created = createInterfaceObjectFromData(objectData, warnings);
            if (created) {
                createdObjects.push(created);
            }
        });

        if (createdObjects.length === 0) {
            warnings.push("No valid interface objects were created for this screen.");
        }

        warnings.forEach((warning) => console.warn(`[InterfaceScreen:${this.uuid}] ${warning}`));
        return createdObjects;
    }

    private buildMonitorIndex(): void {
        this.rootInterfaceObjects.forEach((object) => {
            object.collectDataDisplayObjectsByKey(this.interfaceDisplayObjectsByMonitorKey);
        });

        Object.values(this.interfaceDisplayObjectsByMonitorKey).forEach((objects) => {
            objects.forEach((object) => {
                if (object.shouldRenderContinuously()) {
                    this.continuousDisplayObjects.add(object);
                }
            });
        });
    }

    private mountObjectTreeAsSiblings(container: HTMLElement): void {
        const rootLayout: InterfaceLayoutRect = { left: 0, top: 0, width: 100, height: 100 };
        let zIndexCounter = 1;

        const traverse = (object: InterfaceObject, parentLayout: InterfaceLayoutRect): void => {
            const computedLayout = object.applyLayoutWithinParent(parentLayout);
            const objectElement = object.getPrimaryDOMElement();
            objectElement.style.zIndex = `${zIndexCounter++}`;
            container.appendChild(objectElement);

            object.getChildren().forEach((child) => {
                traverse(child, computedLayout);
            });
        };

        this.rootInterfaceObjects.forEach((rootObject) => {
            traverse(rootObject, rootLayout);
        });
    }

    private seedInitialRenderPass(): void {
        const uniqueDisplayObjects = new Set<InterfaceObject>();
        Object.values(this.interfaceDisplayObjectsByMonitorKey).forEach((objects) => {
            objects.forEach((object) => uniqueDisplayObjects.add(object));
        });

        uniqueDisplayObjects.forEach((object) => {
            this.dirtyDisplayObjects.add(object);
        });
    }

    private registerSubscriptions(): void {
        Object.keys(this.interfaceDisplayObjectsByMonitorKey).forEach((key) => {
            const callback = (packet: TelemetryPacket) => this.updateDataForLabel(key, packet);
            this.telemetryCallbackByKey[key] = callback;
            this.callbacks.onSubscribeKey(key, callback);
        });
    }

    private unregisterSubscriptions(): void {
        Object.entries(this.telemetryCallbackByKey).forEach(([key, callback]) => {
            this.callbacks.onUnsubscribeKey(key, callback);
        });
    }

    private updateDataForLabel(label: string, packet: TelemetryPacket): void {
        const objects = this.interfaceDisplayObjectsByMonitorKey[label];
        if (!objects || objects.length === 0) {
            return;
        }

        objects.forEach((object) => {
            object.updateData(packet);
            this.dirtyDisplayObjects.add(object);
        });
    }

    private startRenderLoops(): void {
        this.foregroundRenderTimerId = window.setInterval(() => {
            if (!this.visible) {
                return;
            }
            this.renderVisibleDirtyObjects();
        }, this.foregroundRenderIntervalMs);

        this.backgroundRenderTimerId = window.setInterval(() => {
            if (this.visible) {
                return;
            }
            this.renderHiddenDirtyObjectsWithBudget();
        }, this.backgroundRenderIntervalMs);
    }

    private stopRenderLoops(): void {
        if (this.foregroundRenderTimerId !== null) {
            window.clearInterval(this.foregroundRenderTimerId);
            this.foregroundRenderTimerId = null;
        }
        if (this.backgroundRenderTimerId !== null) {
            window.clearInterval(this.backgroundRenderTimerId);
            this.backgroundRenderTimerId = null;
        }
    }

    private renderVisibleDirtyObjects(): void {
        if (this.dirtyDisplayObjects.size === 0 && this.continuousDisplayObjects.size === 0) {
            return;
        }

        const toRender = new Set<InterfaceObject>();
        this.dirtyDisplayObjects.forEach((object) => toRender.add(object));
        this.continuousDisplayObjects.forEach((object) => toRender.add(object));

        toRender.forEach((object) => {
            object.renderFrame();
        });
        this.dirtyDisplayObjects.clear();
    }

    private renderHiddenDirtyObjectsWithBudget(): void {
        if (this.dirtyDisplayObjects.size === 0) {
            return;
        }

        const now = Date.now();
        if (now - this.backgroundWindowStartedAt >= 1000) {
            this.backgroundWindowStartedAt = now;
            this.backgroundRenderedThisWindow = 0;
        }

        const remainingBudget = this.backgroundRenderBudgetPerSecond - this.backgroundRenderedThisWindow;
        if (remainingBudget <= 0) {
            return;
        }

        const objectsToRender = Array.from(this.dirtyDisplayObjects).slice(0, remainingBudget);
        objectsToRender.forEach((object) => {
            object.renderFrame();
            this.dirtyDisplayObjects.delete(object);
            this.backgroundRenderedThisWindow += 1;
        });
    }

    public static inferTelemetryValueType(value: any): TelemetryValueType {
        if (typeof value === "number") {
            return "number";
        }
        if (typeof value === "string") {
            return "string";
        }
        if (typeof value === "boolean") {
            return "boolean";
        }
        if (value && typeof value === "object" && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number") {
            return "vector3d";
        }
        return "unknown";
    }
}