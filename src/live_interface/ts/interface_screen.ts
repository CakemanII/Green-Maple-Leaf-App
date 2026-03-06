import { InterfaceObject } from "./interface_objects.js";
import { TelemetryReceiver } from "../../shared/compiled_js/global_rocket_communication_reference.js";

export class InterfaceScreen {
    private UUID: string;
    private name: string;

    private interfaceObjects: InterfaceObject[];
    private telemetryReceiver: TelemetryReceiver | null = null;

    private isVisible: boolean = false;

    constructor(UUID: string, name: string, interfaceObjects: InterfaceObject[]) {
        this.UUID = UUID;
        this.name = name;
        this.interfaceObjects = interfaceObjects;
    }

    /**
     * Initialize telemetry receiving for this screen's objects
     */
    private initializeTelemetryReceiving(): void {
        if (this.telemetryReceiver) {
            return; // Already initialized
        }

        this.telemetryReceiver = new TelemetryReceiver(
            (label: string, timestamp: number, value: any) => {
                // Route telemetry data to matching interface objects
                this.interfaceObjects.forEach(obj => {
                    if (obj.getDataLabel() === label) {
                        obj.updateData(timestamp, value);
                    }
                });
            }
        );
    }

    /**
     * Show this screen in the given container
     */
    public showScreen(container: HTMLElement): void {
        if (this.isVisible) {
            return;
        }

        // Clear the container
        container.innerHTML = '';

        // Add all interface objects to the container
        this.interfaceObjects.forEach(obj => {
            container.appendChild(obj.getElement());
        });

        this.isVisible = true;

        // Initialize telemetry receiving when screen is shown
        this.initializeTelemetryReceiving();
    }

    /**
     * Hide this screen
     */
    public hideScreen(): void {
        if (!this.isVisible) {
            return;
        }

        // Remove all interface objects from their parent
        this.interfaceObjects.forEach(obj => {
            const element = obj.getElement();
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        this.isVisible = false;
    }

    /**
     * Add an interface object to this screen
     */
    public addInterfaceObject(obj: InterfaceObject): void {
        this.interfaceObjects.push(obj);
        
        // If screen is visible, add the object to the container
        if (this.isVisible && obj.getElement().parentNode === null) {
            const container = document.getElementById('interface-container');
            if (container) {
                container.appendChild(obj.getElement());
            }
        }
    }

    public getUUID(): string { return this.UUID; }
    public getName(): string { return this.name; }
}