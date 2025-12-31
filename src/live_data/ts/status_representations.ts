class StatusRepresentation {
    private statusFlag: HTMLElement | null = null;
    private statusImage: HTMLElement | null = null;

    private uuid: string;
    public get UUID(): string { return this.uuid; }

    private statusName: string;
    private defaultFlagName: string;
    private defaultFlagImage: string;
    
    constructor(uuid: string, statusName: string, defaultFlagName: string, defaultFlagImage: string) {
        // Initialize properties
        this.uuid = uuid;
        this.statusName = statusName;
        this.defaultFlagName = defaultFlagName;
        this.defaultFlagImage = defaultFlagImage;

        // Initialize the display
        this.initializeDisplay();
    }

    /**
     * Initializes the status representation display.
     */
    private initializeDisplay(): void {
        // Get the statuses container
        const statusesContainer = document.querySelector('.statuses-container') as HTMLElement;
        if (!statusesContainer) {
            console.warn('[StatusRepresentation] Statuses container not found');
            return;
        }

        // Create status card
        const statusCard = document.createElement('div');
        statusCard.className = 'status-card';
        statusCard.id = `status-${this.uuid}`;

        // Create status name
        const statusName = document.createElement('h3');
        statusName.className = 'status-name';
        statusName.textContent = this.statusName;

        // Create status flag
        const statusFlag = document.createElement('div');
        statusFlag.className = 'status-flag';
        statusFlag.textContent = this.defaultFlagName;
        this.statusFlag = statusFlag;

        // Create status image
        const statusImage = document.createElement('div');
        statusImage.className = 'status-image';
        statusImage.textContent = this.defaultFlagImage;
        this.statusImage = statusImage;

        // Append elements to status card
        statusCard.appendChild(statusName);
        statusCard.appendChild(statusFlag);
        statusCard.appendChild(statusImage);

        // Append status card to container
        statusesContainer.appendChild(statusCard);
    }

    /**
     * Updates the status representation display.
     */
    public updateDisplay(flagName: string, flagImage: string): void {
        if (this.statusFlag) {
            this.statusFlag.textContent = flagName;
        }
        if (this.statusImage) {
            this.statusImage.textContent = flagImage;
        }
    }
}