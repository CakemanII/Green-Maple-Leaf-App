import { TabHandler } from "../../shared/compiled_js/tab_handler.js";

type OperationalState = "active" | "edit"

class OperationalStateHandler {
    private static instance: OperationalStateHandler;
    public static get INSTANCE(): OperationalStateHandler { return OperationalStateHandler.instance; }

    // Elements
    private stateToggleButton!: HTMLButtonElement;
    private rocketConnectivityIndicator!: HTMLDivElement;

    private operationalStatePrompt: OperationalStatePrompt;

    private previousOperationalState!: OperationalState;
    private operationalState!: OperationalState;

    private previousRocketConnectionStatus: 'connected' | 'disconnected' | 'attempting' | 'offline' | null = null;

    private readonly DEBUGGING_MODE: boolean = true;

    constructor() {
        // Singleton pattern
        if (OperationalStateHandler.instance) {
            throw new Error("OperationalStateHandler is a singleton class and cannot be instantiated multiple times.");
        }
        OperationalStateHandler.instance = this;

        // Initialize element references
        this.stateToggleButton = document.getElementById('nav-toggle-btn') as HTMLButtonElement;
        this.rocketConnectivityIndicator = document.getElementById('rocket-connectivity-indicator') as HTMLDivElement;
        
        // Initialize operational state updating & rocket connectivity indicator updating
        this.setupOperationalStateUpdating();
        this.setupRocketConnectivityIndicatorUpdating();

        // Initialize prompt
        this.operationalStatePrompt = new OperationalStatePrompt(
            () => this.toggleOperationalState()
        );

        // Initialize button listener
        this.stateToggleButton.addEventListener('click', () => {
            this.operationalStatePrompt.updatePromptText(this.operationalState);
            this.operationalStatePrompt.show();
        });
    }
    
    /**
     * Initialize operational state updating of the application.
     */
    private setupOperationalStateUpdating(): void {
        setInterval(() => {
            // Check if the rocket server is currently running
            // Fetch from the webserver
            let isRocketServerRunning: boolean = false;
            fetch('/radio_rocket_comms_server/get_operational_status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.json())
            .then(data => {
                isRocketServerRunning = data.is_operational;

                // Set initial operational state
                this.operationalState = isRocketServerRunning ? "active" : "edit";

                // Update UI if state has changed
                if (this.previousOperationalState !== this.operationalState) {
                    this.updateOperationalStateButton();
                    this.updateActiveInactiveTabs();
                }

                // Set the previous operational state to current one
                this.previousOperationalState = this.operationalState;
            })
            .catch(error => {
                console.error('Error fetching rocket server status:', error);
            });
        }, 200);
    }

    /**
     * Initialize rocket connectivity indicator updating.
     */
    private setupRocketConnectivityIndicatorUpdating(): void {
        setInterval(() => {
            // Fetch rocket connectivity status from the webserver
            fetch('/radio_rocket_comms_server/get_rocket_connectivity_status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.json())
            .then(data => {
                this.updateNavIndicator(data.rocket_connection_status);
            })
            .catch(error => {
                console.error('Error fetching rocket connectivity status:', error);
            });
        }, 200);
    }

    /**
     * Update the operational state UI elements.
     */
    private updateOperationalStateButton(): void {
        if (this.operationalState === "active") {
            // Update UI for active state
            this.stateToggleButton.textContent = "Operational";
            this.stateToggleButton.classList.add('active');
            // Update indicator to show operational mode status (will check server connection)
        }
        else
        {
            // Update UI for edit state
            this.stateToggleButton.textContent = "Edit Mode";
            this.stateToggleButton.classList.remove('active');
            // Update indicator to show edit mode message
        }
    }

    /**
     * Update the active / inactive tabs.
     */
    private updateActiveInactiveTabs(): void {
        TabHandler.INSTANCE?.setTabEnabled("liveInterface", this.operationalState === "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("interfaceEditor", this.operationalState !== "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("liveData", this.operationalState === "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("statusEditor", this.operationalState !== "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("geofenceEditor", this.operationalState !== "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("preferences", true);
        TabHandler.INSTANCE?.setTabEnabled("settings", this.operationalState !== "active" || this.DEBUGGING_MODE);
    }

    private toggleOperationalState(): void {
        // Toggle the operational state
        if (this.operationalState === "active")
            this.deactivateRocketServer();
        else
            this.activateRocketServer();

        // Close the prompt
        this.operationalStatePrompt.hide();
    }

    private activateRocketServer(): void {
        // Send request to start the web server
        fetch('/radio_rocket_comms_server/set_active', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
    }

    private deactivateRocketServer(): void {
        // Send request to stop the web server
        fetch('/radio_rocket_comms_server/set_inactive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
    }

    /**
     * Update the nav bar rocket connectivity indicator.
     */
    public updateNavIndicator(connectionStatus: 'connected' | 'disconnected' | 'attempting'): void {
        const indicator = this.rocketConnectivityIndicator;
        if (!indicator) return;

        const indicatorText = indicator.querySelector('.indicator-text');
        if (!indicatorText) return;

        // Check if we're in Edit Mode
        if (this.operationalState === "edit") {
            if (this.previousRocketConnectionStatus !== 'offline') {
                // Remove all status classes
                indicator.classList.remove('online', 'offline', 'poor-connection', 'no-connection');
                indicator.classList.add('offline');
                indicatorText.textContent = 'Not Connected (Editing)';
                indicator.title = 'Not Connected (Editing)';
                this.previousRocketConnectionStatus = 'offline';
            }
            return;
        }

        // Operational Mode - show actual connection status
        if (this.previousRocketConnectionStatus === connectionStatus) return; // No Change

        // Remove all status classes
        indicator.classList.remove('online', 'offline', 'poor-connection', 'no-connection');

        // Update previous status
        if (connectionStatus === "connected") {
            indicator.classList.add('online');
            indicatorText.textContent = 'Connected to Rocket';
            indicator.title = 'Connected to Rocket';
        } else if (connectionStatus === "attempting") {
            indicator.classList.add('poor-connection');
            indicatorText.textContent = 'Poor Connection';
            indicator.title = 'Poor Connection';
        } else {
            indicator.classList.add('no-connection');
            console.log("Setting rocket connectivity indicator to no connection.");
            indicatorText.textContent = 'No Connection';
            indicator.title = 'No Connection';
        }
        // Update previous status
        this.previousRocketConnectionStatus = connectionStatus;
    }
}

class OperationalStatePrompt {
    private overlay!: HTMLDivElement;
    private activateBtn!: HTMLButtonElement;
    private titleEl!: HTMLHeadingElement;
    private descriptionEl!: HTMLDivElement;

    constructor(button_click_callback: () => void) {
        this.initializeDOM(button_click_callback);
    }

    private initializeDOM(button_click_callback: () => void): void {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 24px;
            min-width: 450px;
            max-width: 550px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        `;

        // Create title
        this.titleEl = document.createElement('h3');
        this.titleEl.textContent = 'Rocket Operation';
        this.titleEl.style.cssText = `
            margin: 0 0 12px 0;
            color: white;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
        `;

        // Create description
        this.descriptionEl = document.createElement('div');
        this.descriptionEl.textContent = 'Do you want to switch modes?';
        this.descriptionEl.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            text-align: center;
            margin-bottom: 20px;
        `;

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
        `;

        // Activate button container
        const activateBtnContainer = document.createElement('div');
        activateBtnContainer.style.cssText = `
            display: flex;
            justify-content: center;
            padding-bottom: 8px;
        `;

        this.activateBtn = document.createElement('button');
        this.activateBtn.textContent = 'Activate';
        this.activateBtn.style.cssText = `
            padding: 10px 24px;
            background-color: #6ba3ff;
            color: #181a1b;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        this.activateBtn.onmouseover = () => { this.activateBtn.style.backgroundColor = '#5a92ee'; };
        this.activateBtn.onmouseout = () => { this.activateBtn.style.backgroundColor = '#6ba3ff'; };
        
        activateBtnContainer.appendChild(this.activateBtn);

        // Warning label
        const warningLabel = document.createElement('div');
        warningLabel.textContent = 'This may interrupt current rocket communications.';
        warningLabel.style.cssText = `
            color: #ff0000;
            font-size: 15px;
            text-align: center;
            margin-bottom: 8px;
        `;

        // Assemble content
        contentContainer.appendChild(activateBtnContainer);
        contentContainer.appendChild(warningLabel);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 10px 24px;
            background-color: #3a3a3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            width: 100%;
        `;
        closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#4a4a4a'; };
        closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#3a3a3a'; };

        // Assemble dialog
        dialog.appendChild(this.titleEl);
        dialog.appendChild(this.descriptionEl);
        dialog.appendChild(contentContainer);
        dialog.appendChild(closeBtn);
        this.overlay.appendChild(dialog);

        // Event handlers
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };

        this.activateBtn.addEventListener('click', () => {
            if (button_click_callback) {
                button_click_callback();
            }
            else
            {
                console.warn("No button click callback provided for OperationalStatePrompt activate button.");
            }
        });

        closeBtn.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(this.overlay);
    }

    public show(): void {
        this.overlay.style.display = 'flex';
    }

    public hide(): void {
        this.overlay.style.display = 'none';
    }

    /**
     * Update the prompt text based on current operational state.
     */
    public updatePromptText(currentState: OperationalState): void {
        if (currentState === "active") {
            this.titleEl.textContent = 'Switch to Edit Mode?';
            this.descriptionEl.textContent = 'This will stop the rocket connection and allow you to edit configurations.';
            this.activateBtn.textContent = 'Switch to Edit Mode';
        } else {
            this.titleEl.textContent = 'Switch to Operational Mode?';
            this.descriptionEl.textContent = 'This will connect to the rocket and start live operations.';
            this.activateBtn.textContent = 'Switch to Operational Mode';
        }
    }
}

new OperationalStateHandler();