export declare class StatusRepresentation {
    private statusFlag;
    private statusImage;
    private uuid;
    get UUID(): string;
    private statusName;
    private defaultFlagName;
    private defaultFlagImage;
    constructor(uuid: string, statusName: string, defaultFlagName: string, defaultFlagImage: string);
    /**
     * Initializes the status representation display.
     */
    private initializeDisplay;
    /**
     * Updates the status representation display.
     */
    updateDisplay(flagName: string, flagImage: string): void;
    /**
     * Converts an absolute file path to a server route.
     */
    private convertPathToServerRoute;
}
