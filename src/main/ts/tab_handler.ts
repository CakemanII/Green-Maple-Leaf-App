class TabHandler {
    // Tabs can be absent in some views, so allow null and initialize to null.
    private live_interface_tab: HTMLIFrameElement | null = null;
    private geofence_editor_tab: HTMLIFrameElement | null = null;
    private live_data_tab: HTMLIFrameElement | null = null;
    private preferences_tab: HTMLIFrameElement | null = null;
    private settings_tab: HTMLIFrameElement | null = null;

    private live_interface_tab_button: HTMLButtonElement | null = null;
    private geofence_editor_tab_button: HTMLButtonElement | null = null;
    private live_data_tab_button: HTMLButtonElement | null = null;
    private preferences_tab_button: HTMLButtonElement | null = null;
    private settings_tab_button: HTMLButtonElement | null = null;

    private static instance: TabHandler | undefined;
    public static Instance(): TabHandler | undefined { return this.instance; }

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (TabHandler.instance) {
            console.error("TabHandler instance already exists!");
            return;
        }
        TabHandler.instance = this;
        
        // Initialize tabs and buttons
        this.live_interface_tab = document.getElementById('live_interface_tab') as HTMLIFrameElement | null;
        this.geofence_editor_tab = document.getElementById('geofence_editor_tab') as HTMLIFrameElement | null;
        this.live_data_tab = document.getElementById('live_data_tab') as HTMLIFrameElement | null;
        this.preferences_tab = document.getElementById('preferences_tab') as HTMLIFrameElement | null;
        this.settings_tab = document.getElementById('settings_tab') as HTMLIFrameElement | null;

        this.live_interface_tab_button = document.getElementById('live_interface_tab_button') as HTMLButtonElement | null;
        this.geofence_editor_tab_button = document.getElementById('geofence_editor_tab_button') as HTMLButtonElement | null;
        this.live_data_tab_button = document.getElementById('live_data_tab_button') as HTMLButtonElement | null;
        this.preferences_tab_button = document.getElementById('preferences_tab_button') as HTMLButtonElement | null;
        this.settings_tab_button = document.getElementById('settings_tab_button') as HTMLButtonElement | null;

        // Initialize tab button events (only attach listeners that target existing elements)
        this.initializeTabButtonEvents();
    }

    /**
     * Initializes the tab button event listeners.
     */
    private initializeTabButtonEvents(): void {
        if (this.live_interface_tab_button) {
            this.live_interface_tab_button.addEventListener('click', () => {
                this.activateTab(this.live_interface_tab);
            });
        }

        if (this.geofence_editor_tab_button) {
            this.geofence_editor_tab_button.addEventListener('click', () => {
                this.activateTab(this.geofence_editor_tab);
            });
        }

        if (this.live_data_tab_button) {
            this.live_data_tab_button.addEventListener('click', () => {
                this.activateTab(this.live_data_tab);
            });
        }

        if (this.preferences_tab_button) {
            this.preferences_tab_button.addEventListener('click', () => {
                this.activateTab(this.preferences_tab);
            });
        }

        if (this.settings_tab_button) {
            this.settings_tab_button.addEventListener('click', () => {
                this.activateTab(this.settings_tab);
            });
        }
    }

    /**
     * Activates the specified tab and hides all others.
     */
    private activateTab(tab: HTMLIFrameElement | null): void {
        if (!tab) {
            console.warn('activateTab called with missing element — nothing to show.');
            return;
        }

        this.hideAllTabs();
        tab.style.display = 'block';
    }

    /**
     * Hides all tabs.
     */
    private hideAllTabs(): void {
        if (this.live_interface_tab) this.live_interface_tab.style.display = 'none';
        if (this.geofence_editor_tab) this.geofence_editor_tab.style.display = 'none';
        if (this.live_data_tab) this.live_data_tab.style.display = 'none';
        if (this.preferences_tab) this.preferences_tab.style.display = 'none';
        if (this.settings_tab) this.settings_tab.style.display = 'none';
    }
}