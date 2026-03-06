enum InterfaceObjectType {
    PANEL,

    LINE_GRAPH,
    BAR_GRAPH,

    TWO_D_DIRECTIONAL_INDICATOR,
    THREE_D_DIRECTIONAL_INDICATOR,
    STATUS_DISPLAY,
    MAP,

    CONTROLLER,
}

enum InterfaceNotificationType {
    INFO,
    WARNING,
    ERROR,
}

export abstract class InterfaceObject {
    private UUID: string;
    public getUUID(): string { return this.UUID; }

    // Common properties for all interface objects
    protected abstract type: string;
    protected posX: number;
    protected posY: number;
    protected width: number;
    protected height: number;

    private dataType: string;

    constructor(UUID: string, dataType: string, {posX, posY}: {posX: number, posY: number}, {width, height}: {width: number, height: number}) {
        // Set properties
        this.UUID = UUID;
        this.dataType = dataType;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    }

    /**
     * Updates the current data in the interface object.
     */
    public abstract updateData(data: any): void;

    /**
     * Renders a frame of the interface object with the current data.
     */
    protected abstract renderFrame(): void;
}