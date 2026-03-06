import { InterfaceObject, LineGraphInterfaceObject } from "./interface_objects.js";
import { InterfaceScreen } from "./interface_screen.js";

class InterfaceManager {
    private static instance: InterfaceManager;
    public static get INSTANCE(): InterfaceManager { 
        if (!InterfaceManager.instance) {
            InterfaceManager.instance = new InterfaceManager();
        }
        return InterfaceManager.instance; 
    }

    private screens: Map<string, InterfaceScreen> = new Map();
    private currentScreen: InterfaceScreen | null = null;

    private interfaceContainer!: HTMLDivElement;
    private screenSelector!: HTMLDivElement;

    private constructor() {
        // Initialize DOM references
        this.interfaceContainer = document.getElementById('interface-container') as HTMLDivElement;
        this.screenSelector = document.getElementById('screen-selector') as HTMLDivElement;

        if (!this.interfaceContainer || !this.screenSelector) {
            console.error('[InterfaceManager] Required DOM elements not found');
            return;
        }

        // Initialize with a default screen
        this.initializeDefaultScreens();
    }

    /**
     * Initialize default screens for testing
     */
    private initializeDefaultScreens(): void {
        // Create a line graph centered at 500x500
        // Position it centered on screen: (screen width - graph width) / 2
        const graphWidth = 500;
        const graphHeight = 500;
        const posX = (window.innerWidth - graphWidth) / 2;
        const posY = (window.innerHeight - graphHeight - 50) / 2; // -50 for screen selector height

        const lineGraph = new LineGraphInterfaceObject(
            'line-graph-1',
            'accel',  // Data label to listen for
            'Linear Acceleration',
            'm/s²',
            -10,  // yMin
            10,   // yMax
            { posX, posY },
            { width: graphWidth, height: graphHeight },
            30,   // timeWindow in seconds
            { color: '#f5a623', width: 2, opacity: 1 }
        );

        // Create a default screen with the line graph
        const defaultScreen = new InterfaceScreen(
            'default-screen-1',
            'Screen 1',
            [lineGraph]
        );
        
        this.addScreen(defaultScreen);
        this.switchToScreen('default-screen-1');
    }

    /**
     * Add a screen to the manager
     */
    public addScreen(screen: InterfaceScreen): void {
        this.screens.set(screen.getUUID(), screen);
        this.createScreenTab(screen);
    }

    /**
     * Create a tab button for a screen
     */
    private createScreenTab(screen: InterfaceScreen): void {
        const tab = document.createElement('button');
        tab.className = 'screen-tab';
        tab.textContent = screen.getName();
        tab.dataset.screenId = screen.getUUID();
        
        tab.addEventListener('click', () => {
            this.switchToScreen(screen.getUUID());
        });
        
        this.screenSelector.appendChild(tab);
    }

    /**
     * Switch to a specific screen
     */
    public switchToScreen(screenId: string): void {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.warn(`[InterfaceManager] Screen with ID ${screenId} not found`);
            return;
        }

        // Hide current screen
        if (this.currentScreen) {
            this.currentScreen.hideScreen();
        }

        // Show new screen
        this.currentScreen = screen;
        screen.showScreen(this.interfaceContainer);

        // Update tab states
        this.updateTabStates(screenId);
    }

    /**
     * Update the active state of screen tabs
     */
    private updateTabStates(activeScreenId: string): void {
        const tabs = this.screenSelector.querySelectorAll('.screen-tab');
        tabs.forEach(tab => {
            const tabElement = tab as HTMLButtonElement;
            if (tabElement.dataset.screenId === activeScreenId) {
                tabElement.classList.add('active');
            } else {
                tabElement.classList.remove('active');
            }
        });
    }

    /**
     * Get the interface container element
     */
    public getInterfaceContainer(): HTMLDivElement {
        return this.interfaceContainer;
    }

    /**
     * Static initialization method
     */
    public static initialize(): void {
        InterfaceManager.INSTANCE;
    }
}

// Initialize the interface manager
InterfaceManager.initialize();