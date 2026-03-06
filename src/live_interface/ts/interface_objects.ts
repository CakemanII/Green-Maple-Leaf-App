

export abstract class InterfaceObject {
    private UUID: string;
    public getUUID(): string { return this.UUID; }
    
    protected abstract isPanel: boolean;
    private childrenInterfaceObjects!: InterfaceObject[] | null;

    // Common properties for all interface objects
    protected posX: number;
    protected posY: number;
    protected width: number;
    protected height: number;

    private monitorDataKey: string | string[];

    constructor(UUID: string, monitorDataKey: string | string[], posX: number, posY: number, width: number, height: number, childrenInterfaceObjects?: InterfaceObject[]) {
        // Set properties
        this.UUID = UUID;
        this.monitorDataKey = monitorDataKey;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    }

    private initializePrimaryDOM(): void {
        // This is the main container that will either house secondary.
        // ...
    }

    // This is either the mian container for data display objects OR the panel elements, which will also house the children interface objects.
    protected abstract initializeSecondaryDOM(): void 

    /**
     * Updates the current data in the interface object.
     */
    public abstract updateData(data: any): void;

    /**
     * Renders a frame of the interface object with the current data.
     */
    protected abstract renderFrame(): void;
}

export class PanelIObject extends InterfaceObject {
    protected override isPanel: boolean = true;

    constructor(UUID: string, monitorDataKey: string[], posX: number, posY: number, width: number, height: number, childrenInterfaceObjects: InterfaceObject[]) {
        super(UUID, monitorDataKey, posX, posY, width, height, childrenInterfaceObjects);
        
    }

    protected override initializeSecondaryDOM(): void {
        // Create panel-specific DOM elements and append children interface objects' primary DOM elements.
        // ...
    }

    public override updateData(data: any): void {
        // Updates children interface objects with the relevant subset of the data.
        // ...
    }

    protected override renderFrame(): void {
        // Render the panel and its children interface objects.
        // ...
    }
}

export class LineGraphIObject extends InterfaceObject {
    protected override isPanel: boolean = false;

    constructor(UUID: string, monitorDataKey: string, posX: number, posY: number, width: number, height: number) {
        super(UUID, monitorDataKey, posX, posY, width, height);
    }

    protected override initializeSecondaryDOM(): void {
        // Create line graph-specific DOM elements.
        // This also include the side bar content as well!
        // ...
    }

    public override updateData(data: any): void {
        // Update the line graph with the new data.
        // ...
    }

    protected override renderFrame(): void {
        // Render the line graph.
        // ...
    }
}