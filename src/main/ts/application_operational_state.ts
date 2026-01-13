import { TabHandler } from "./tab_handler.js";

type OperationalState = "active" | "edit"

class OperationalStateHandler {
    private static instance: OperationalStateHandler;
    public static get INSTANCE(): OperationalStateHandler { return OperationalStateHandler.instance; }

    // Elements
    private stateToggleButton!: HTMLButtonElement;
    private rocketConnectivityIndicator!: HTMLDivElement;

    private operationalStatePrompt: OperationalStatePrompt;

    private operationalState!: OperationalState;

    private readonly DEBUGGING_MODE: boolean = false;

    constructor() {
        // Singleton pattern
        if (OperationalStateHandler.instance) {
            throw new Error("OperationalStateHandler is a singleton class and cannot be instantiated multiple times.");
        }
        OperationalStateHandler.instance = this;

        // Initialize element references
        this.stateToggleButton = document.getElementById('nav-toggle-btn') as HTMLButtonElement;
        this.rocketConnectivityIndicator = document.getElementById('rocket-connectivity-indicator') as HTMLDivElement;
        
        // Initialize operational state
        this.initializeOperationalState();

        // Initialize prompt
        this.operationalStatePrompt = new OperationalStatePrompt(
            () => this.toggleOperationalState()
        );
        this.operationalStatePrompt.updateRuntime(null);
        this.operationalStatePrompt.updateServerStatus("Offline");

        // Initialize button listener
        this.stateToggleButton.addEventListener('click', () => {
            this.operationalStatePrompt.show();
        });
    }
    
    /**
     * Initialize the operational state of the application.
     */
    private initializeOperationalState(): void {
        // Check if the rocket server is currently running
        // Fetch from the webserver
        let isRocketServerRunning: boolean = false;
        fetch('/radio_rocket_comms_server/get_status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            isRocketServerRunning = data.status === "active";

            // Set initial operational state
            this.operationalState = isRocketServerRunning ? "active" : "edit";

            // Update UI based on initial state
            this.updateOperationalStateUI();
            this.updateActiveInactiveTabs();
            this.operationalStatePrompt.updateButtonText(isRocketServerRunning);
        })
        .catch(error => {
            console.error('Error fetching rocket server status:', error);
        });
    }

    /**
     * Update the operational state UI elements.
     */
    private updateOperationalStateUI(): void {
        if (this.operationalState === "active") {
            // Update UI for active state
            this.stateToggleButton.textContent = "Operational";
            this.stateToggleButton.classList.add('active');
        }
        else
        {
            // Update UI for edit state
            this.stateToggleButton.textContent = "Edit Mode";
            this.stateToggleButton.classList.remove('active');
        }
    }

    /**
     * Update the active / inactive tabs.
     */
    private updateActiveInactiveTabs(): void {
        TabHandler.INSTANCE?.setTabEnabled("liveInterface", true);
        TabHandler.INSTANCE?.setTabEnabled("liveData", this.operationalState === "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("statusEditor", this.operationalState !== "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("geofenceEditor", this.operationalState !== "active" || this.DEBUGGING_MODE);
        TabHandler.INSTANCE?.setTabEnabled("preferences", true);
        TabHandler.INSTANCE?.setTabEnabled("settings", this.operationalState !== "active" || this.DEBUGGING_MODE);
    }

    private toggleOperationalState(): void {
        if (this.operationalState === "active")
            this.stopRocketServer();
        else
            this.startRocketServer();
    }

    private startRocketServer(): void {
        // Send request to start the web server
        fetch('/radio_rocket_comms_server/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
    }

    private stopRocketServer(): void {
        // Send request to stop the web server
        fetch('/radio_rocket_comms_server/deactivate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
    }
}

class OperationalStatePrompt {
    private overlay!: HTMLDivElement;
    private runtimeValue!: HTMLDivElement;
    private statusValue!: HTMLDivElement;
    private activateBtn!: HTMLButtonElement;

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
        const titleEl = document.createElement('h3');
        titleEl.textContent = 'Rocket Operation';
        titleEl.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
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

        // Runtime label
        const runtimeLabel = document.createElement('div');
        runtimeLabel.textContent = 'Shows runtime when running, N/A otherwise';
        runtimeLabel.style.cssText = `
            color: #888888;
            font-size: 12px;
            font-style: italic;
            text-align: center;
            margin-bottom: 8px;
        `;

        // Server Runtime
        const runtimeContainer = document.createElement('div');

        const runtimeLabelText = document.createElement('label');
        runtimeLabelText.textContent = 'Server Runtime:';
        runtimeLabelText.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
            display: block;
        `;

        this.runtimeValue = document.createElement('div');
        this.runtimeValue.textContent = '0:00:00:000';
        this.runtimeValue.style.cssText = `
            padding: 10px 12px;
            background-color: #1a1a1a;
            color: #6ba3ff;
            border: 1px solid #555555;
            border-radius: 4px;
            font-size: 14px;
            font-family: monospace;
            font-weight: 600;
            text-align: center;
        `;

        runtimeContainer.appendChild(runtimeLabelText);
        runtimeContainer.appendChild(this.runtimeValue);

        // Server Status
        const statusContainer = document.createElement('div');

        const statusLabelText = document.createElement('label');
        statusLabelText.textContent = 'Server Status:';
        statusLabelText.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
            display: block;
        `;

        this.statusValue = document.createElement('div');
        this.statusValue.textContent = 'Online';
        this.statusValue.style.cssText = `
            padding: 10px 12px;
            background-color: #1a1a1a;
            color: #4ade80;
            border: 1px solid #555555;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
        `;

        const statusOptions = document.createElement('div');
        statusOptions.textContent = 'Status: Online | Starting | Offline';
        statusOptions.style.cssText = `
            color: #888888;
            font-size: 12px;
            font-style: italic;
            text-align: center;
            margin-top: 4px;
        `;

        statusContainer.appendChild(statusLabelText);
        statusContainer.appendChild(this.statusValue);
        statusContainer.appendChild(statusOptions);

        // Assemble content
        contentContainer.appendChild(activateBtnContainer);
        contentContainer.appendChild(runtimeLabel);
        contentContainer.appendChild(runtimeContainer);
        contentContainer.appendChild(statusContainer);

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
        dialog.appendChild(titleEl);
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
     * Update the runtime display.
     */
    public updateRuntime(runtimeSeconds: number | null): void {
        if (runtimeSeconds === null) {
            this.runtimeValue.textContent = "N/A";
            return;
        }
        // Convert seconds to HH:MM:SS:MS format
        const hours = Math.floor(runtimeSeconds / 3600);
        const minutes = Math.floor((runtimeSeconds % 3600) / 60);
        const seconds = Math.floor(runtimeSeconds % 60);

        // Format the runtime string
        const runtimeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.runtimeValue.textContent = runtimeStr;
    }

    /**
     * Update the server status display.
     */
    public updateServerStatus(status: "Online" | "Starting" | "Offline"): void {
        this.statusValue.textContent = status;
        
        // Update color based on status
        if (status === "Online") {
            this.statusValue.style.color = '#4ade80';
        } else if (status === "Starting") {
            this.statusValue.style.color = '#fbbf24';
        } else {
            this.statusValue.style.color = '#888888';
        }
    }

    /**
     * Update the button text.
     */
    public updateButtonText(currentlyActive: boolean): void {
        this.activateBtn.textContent = currentlyActive ? "Deactivate" : "Activate";
    }
}

new OperationalStateHandler();