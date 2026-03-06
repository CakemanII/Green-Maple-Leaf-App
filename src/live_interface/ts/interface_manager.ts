import { InterfaceObject } from "./interface_objects.js";

class InterfaceManager {
    private static instance: InterfaceManager;
    public static get INSTANCE(): InterfaceManager { return this.instance; }

    private interfaceScreens: { [key: string]: InterfaceObject[] } = {};

    private constructor() {

    }
}