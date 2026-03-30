export class StatusRepresentation {
    get UUID() { return this.uuid; }
    constructor(uuid, statusName, defaultFlagName, defaultFlagImage) {
        this.statusFlag = null;
        this.statusImage = null;
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
    initializeDisplay() {
        // Get the statuses container
        const statusesContainer = document.querySelector('.statuses-container');
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
        const statusImage = document.createElement('img');
        statusImage.className = 'status-image';
        statusImage.style.width = '100%';
        statusImage.style.height = '100%';
        statusImage.style.objectFit = 'contain';
        // Convert absolute path to server route
        statusImage.src = this.convertPathToServerRoute(this.defaultFlagImage);
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
    updateDisplay(flagName, flagImage) {
        if (this.statusFlag) {
            this.statusFlag.textContent = flagName;
        }
        if (this.statusImage && this.statusImage instanceof HTMLImageElement) {
            this.statusImage.src = this.convertPathToServerRoute(flagImage);
        }
    }
    /**
     * Converts an absolute file path to a server route.
     */
    convertPathToServerRoute(absolutePath) {
        // Normalize backslashes to forward slashes
        const normalizedPath = absolutePath.replace(/\\/g, '/');
        // Use path parameter
        return `http://127.0.0.1:5000/serve_image/${normalizedPath}`;
    }
}
//# sourceMappingURL=status_representations.js.map