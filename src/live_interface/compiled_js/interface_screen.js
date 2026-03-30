import { createInterfaceObjectFromData } from "./interface_objects.js";
export class InterfaceScreen {
    constructor(data, screensContainer, tabsContainer, callbacks, backgroundRenderBudgetPerSecond = 30) {
        this.interfaceDisplayObjectsByMonitorKey = {};
        this.visible = false;
        this.dirtyDisplayObjects = new Set();
        this.continuousDisplayObjects = new Set();
        this.foregroundRenderIntervalMs = 1000 / 30;
        this.backgroundRenderIntervalMs = 500;
        this.foregroundRenderTimerId = null;
        this.backgroundRenderTimerId = null;
        this.backgroundWindowStartedAt = Date.now();
        this.backgroundRenderedThisWindow = 0;
        this.telemetryCallbackByKey = {};
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
    getUUID() {
        return this.uuid;
    }
    getName() {
        return this.name;
    }
    showScreen() {
        this.visible = true;
        this.screenElement.classList.add("active");
        this.screenElement.classList.remove("inactive");
        this.tabElement.classList.add("active");
    }
    hideScreen() {
        this.visible = false;
        this.screenElement.classList.remove("active");
        this.screenElement.classList.add("inactive");
        this.tabElement.classList.remove("active");
    }
    destroy() {
        this.stopRenderLoops();
        this.unregisterSubscriptions();
        this.rootInterfaceObjects.forEach((object) => this.destroyObjectTree(object));
        this.tabElement.remove();
        this.screenElement.remove();
    }
    destroyObjectTree(object) {
        object.getChildren().forEach((child) => this.destroyObjectTree(child));
        object.destroy();
    }
    buildInterfaceObjects(interfaceObjectsData) {
        const warnings = [];
        const createdObjects = [];
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
    buildMonitorIndex() {
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
    mountObjectTreeAsSiblings(container) {
        const rootLayout = { left: 0, top: 0, width: 100, height: 100 };
        let zIndexCounter = 1;
        const traverse = (object, parentLayout) => {
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
    seedInitialRenderPass() {
        const uniqueDisplayObjects = new Set();
        Object.values(this.interfaceDisplayObjectsByMonitorKey).forEach((objects) => {
            objects.forEach((object) => uniqueDisplayObjects.add(object));
        });
        uniqueDisplayObjects.forEach((object) => {
            this.dirtyDisplayObjects.add(object);
        });
    }
    registerSubscriptions() {
        Object.keys(this.interfaceDisplayObjectsByMonitorKey).forEach((key) => {
            const callback = (packet) => this.updateDataForLabel(key, packet);
            this.telemetryCallbackByKey[key] = callback;
            this.callbacks.onSubscribeKey(key, callback);
        });
    }
    unregisterSubscriptions() {
        Object.entries(this.telemetryCallbackByKey).forEach(([key, callback]) => {
            this.callbacks.onUnsubscribeKey(key, callback);
        });
    }
    updateDataForLabel(label, packet) {
        const objects = this.interfaceDisplayObjectsByMonitorKey[label];
        if (!objects || objects.length === 0) {
            return;
        }
        objects.forEach((object) => {
            object.updateData(packet);
            this.dirtyDisplayObjects.add(object);
        });
    }
    startRenderLoops() {
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
    stopRenderLoops() {
        if (this.foregroundRenderTimerId !== null) {
            window.clearInterval(this.foregroundRenderTimerId);
            this.foregroundRenderTimerId = null;
        }
        if (this.backgroundRenderTimerId !== null) {
            window.clearInterval(this.backgroundRenderTimerId);
            this.backgroundRenderTimerId = null;
        }
    }
    renderVisibleDirtyObjects() {
        if (this.dirtyDisplayObjects.size === 0 && this.continuousDisplayObjects.size === 0) {
            return;
        }
        const toRender = new Set();
        this.dirtyDisplayObjects.forEach((object) => toRender.add(object));
        this.continuousDisplayObjects.forEach((object) => toRender.add(object));
        toRender.forEach((object) => {
            object.renderFrame();
        });
        this.dirtyDisplayObjects.clear();
    }
    renderHiddenDirtyObjectsWithBudget() {
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
    static inferTelemetryValueType(value) {
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
//# sourceMappingURL=interface_screen.js.map