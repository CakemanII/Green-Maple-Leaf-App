import { InterfaceObject } from "./interface_objects.js";
import { InterfaceScreen } from "./interface_screen.js";
import { TelemetryReceiver } from "../../shared/compiled_js/global_rocket_communication_reference.js";

class InterfaceManager {
    private static instance: InterfaceManager;
    public static get INSTANCE(): InterfaceManager { return this.instance; }

    private screenUUIDs: string[] = [];
    /**
     * A dictionary mapping telemetry data labels to arrays of callback functions that should be called when new 
     * telemetry data with that label is received.
     */
    private screenTelemetrySubscriptions: { [data: string]: ((timestamp: number, value: any) => void)[] } = {};

    private static SCREENS_CONTAINER_ID: string = "screens-container";
    private screensContainer!: HTMLElement;

    private interfaceActive: boolean = false;

    private constructor() {
        // Assign the singleton instance
        if (InterfaceManager.instance) {
            throw new Error("InterfaceManager is a singleton class. Use InterfaceManager.INSTANCE to access the instance.");
        }
        InterfaceManager.instance = this;

        // Initialize the screens container
        this.screensContainer = document.getElementById(InterfaceManager.SCREENS_CONTAINER_ID) as HTMLElement;

        // Initialize telemetry receiving
        this.initializeTelemetryReceiving();
    }

    // #region Telemetry Receiving
    /**
     * Initializes the telemetry receiving by creating a new TelemetryReceiver and routes incoming telemetry data to the appropriate callbacks based on the data label.
     */
    private initializeTelemetryReceiving(): void {
        new TelemetryReceiver(
            (label: string, timestamp: number, value: any) => {
                // If there are any subscriptions for this label, call the associated callbacks
                if (this.screenTelemetrySubscriptions[label]) {
                    this.screenTelemetrySubscriptions[label].forEach(callback => callback(timestamp, value));
                }
            }
        );
    }

    /**
     * Adds a subscription for telemetry data with the specified label. Whenever new telemetry data with that label is received, the provided callback function will be called with the timestamp and value of the telemetry data.
     */
    private addScreenTelemetrySubscription(dataLabel: string, callback: (timestamp: number, value: any) => void): void {
        // Ensure the label exists
        if (!this.screenTelemetrySubscriptions[dataLabel]) {
            this.screenTelemetrySubscriptions[dataLabel] = [];
        }

        // Add the callback to the list of subscriptions for this label
        this.screenTelemetrySubscriptions[dataLabel].push(callback);
    }
    // #endregion

    /**
     * Sets the interface active state. 
     * When the interface is active, screens will be created and telemetry data will be routed to the screens. 
     * When the interface is inactive, screens will be removed and telemetry data will not be routed to the screens.
     */
    public setInterfaceActive(active: boolean): void {
        // Change the variable
        const previousState = this.interfaceActive;
        this.interfaceActive = active;

        // If the state changed, update the screens.
        if (previousState !== active) {
            if (active)
                this.createAllScreens();
            else
                this.clearAllScreens();
        }
    }

    /**
     * Set active screen uuids.
     */
    public setScreenUUIDS(screenUUIDS: string[]): void {
        this.screenUUIDs = screenUUIDS;
    }

    private async getScreenDataFromServer(screenData: any): Promise<any> {
    }

    // #region DOM Management
    /**
     * Instantiates a new screen in the DOM based on the provided screen data.
     */
    private instantiateScreenIntoDOM(screenData: any): void {
        // Create a new screen element (iframe) based on the screenData

        // Recursively Iterate through each object in the screenData and create corresponding InterfaceObjects, storing them in an array. 

        // Append it to the screens container

        // Add the interface tab to tabs.

        // Create all notifications associated with this screen.

        // Store the screen in the interfaceScreens dictionary
    }

    /**
     * Removes a screen from the DOM based on its UUID.
     */
    private removeScreenFromDOM(screenUUID: string): void {
        // Find the screen element

        // Remove it from the DOM

        // Remove it from the interfaceScreens dictionary

        // Remove all notifications related to this screen

        // Remove the screen's tab from the tabs.
    }

    /**
     * Create all screens.
     */
    private createAllScreens(): void {

    }

    /**
     * Removes all screens from the interface and clears all telemetry subscriptions.
     */
    private clearAllScreens(): void {
        // Remove all screens from the DOM
        this.screenUUIDs.forEach(uuid => {
            this.removeScreenFromDOM(uuid);
        });

        // Clear the screenTelemetrySubscriptions dictionary
        this.screenTelemetrySubscriptions = {};
    }
    // #endregion
}