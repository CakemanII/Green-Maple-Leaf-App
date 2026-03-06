import { InterfaceObject } from "./interface_objects.js";
import { TelemetryReceiver } from "../../shared/compiled_js/global_rocket_communication_reference.js";

export class InterfaceScreen {
    private UUID: string;
    private name: string;

    private interfaceObjects: InterfaceObject[];

    constructor(UUID: string, name: string, interfaceObjects: InterfaceObject[]) {
        this.UUID = UUID;
        this.name = name;
        this.interfaceObjects = interfaceObjects;

        this.initializeTelemetryReceiving();
    }

    private initializeTelemetryReceiving(): void {
        
    }

    public showScreen(): void {
        // Implementation for showing the screen goes here
    }

    public hideScreen(): void {
        // Implementation for hiding the screen goes here
    }

    public getUUID(): string { return this.UUID; }
    public getName(): string { return this.name; }
}