export class TabHandler {
    private static readonly TAB_IDS: Record<string, { tabId: string; buttonId: string }> = {
        liveInterface:   { tabId: 'live_interface_tab',   buttonId: 'live_interface_tab_button' },
        interfaceEditor: { tabId: 'interface_editor_tab', buttonId: 'interface_editor_tab_button' },
        //liveData:        { tabId: 'live_data_tab',        buttonId: 'live_data_tab_button' },
        statusEditor:    { tabId: 'status_editor_tab',     buttonId: 'status_editor_tab_button' },
        geofenceEditor:  { tabId: 'geofence_editor_tab',  buttonId: 'geofence_editor_tab_button' },
        preferences:     { tabId: 'preferences_tab',      buttonId: 'preferences_tab_button' },
        settings:        { tabId: 'settings_tab',         buttonId: 'settings_tab_button' },
    };

    // Tabs can be absent in some views, so allow null and initialize to null.
    // Allow content/button to be null when an element is not present in the DOM.
    private tabs: Record<string, { content: HTMLIFrameElement | null; button: HTMLButtonElement | null }> = {};
    private activeTabKey: string | null = null;

    private static instance: TabHandler | undefined;
    public static Instance(): TabHandler | undefined { return this.instance; }
    public static get INSTANCE(): TabHandler | undefined { return this.instance; }

    constructor() {
        // Singleton pattern - prevent multiple instances
        if (TabHandler.instance) {
            console.error("TabHandler instance already exists!");
            return;
        }
        TabHandler.instance = this;
        
        // Initialize tabs and buttons
        this.tabs = {
            liveInterface: { 
                content: document.getElementById(TabHandler.TAB_IDS.liveInterface.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.liveInterface.buttonId) as HTMLButtonElement 
            },

            /*liveData: { 
                content: document.getElementById(TabHandler.TAB_IDS.liveData.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.liveData.buttonId) as HTMLButtonElement 
            },*/

            interfaceEditor: { 
                content: document.getElementById(TabHandler.TAB_IDS.interfaceEditor.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.interfaceEditor.buttonId) as HTMLButtonElement 
            },

            statusEditor: {
                content: document.getElementById(TabHandler.TAB_IDS.statusEditor.tabId) as HTMLIFrameElement,
                button: document.getElementById(TabHandler.TAB_IDS.statusEditor.buttonId) as HTMLButtonElement
            },

            geofenceEditor: { 
                content: document.getElementById(TabHandler.TAB_IDS.geofenceEditor.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.geofenceEditor.buttonId) as HTMLButtonElement 
            },

            preferences: { 
                content: document.getElementById(TabHandler.TAB_IDS.preferences.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.preferences.buttonId) as HTMLButtonElement 
            },

            settings:  { 
                content: document.getElementById(TabHandler.TAB_IDS.settings.tabId) as HTMLIFrameElement, 
                button: document.getElementById(TabHandler.TAB_IDS.settings.buttonId) as HTMLButtonElement 
            },
        };

        // Initialize tab button events (only attach listeners that target existing elements)
        this.initializeTabButtonEvents();

        // Activate the first available tab by default
        this.activateTab(Object.keys(this.tabs)[0]);
    }

    /**
     * Initializes the tab button event listeners.
     */
    private initializeTabButtonEvents(): void {
        // Attach click event listeners to each tab button
        for (const tabKey in this.tabs) {
            const tabEntry = this.tabs[tabKey];
            tabEntry.button?.addEventListener('click', () => this.onTabButtonClick(tabKey));
        }
    }

    /**
     * Triggers when a tab button is clicked.
     */
    private onTabButtonClick(tabKey: string): void {
        if (this.activeTabKey === tabKey) {
            // Get the tab button position.
            const tabBtnElement = this.tabs[tabKey].button;
            const tabButtonRect = tabBtnElement?.getBoundingClientRect();
            const tabBLButtonPositionX: number = tabButtonRect ? tabButtonRect.left + window.scrollX : 0;

            // Trigger secondary menus or actions if already activated
            this.tabs[tabKey].content!.contentWindow!.postMessage(
                { type: 'toggle_tab_menu', tabButtonPositionX: tabBLButtonPositionX }, 
                '*'
            );
        }
        else {
            this.activateTab(tabKey);
        }
    }

    /**
     * Activates the specified tab and hides all others.
     */
    private activateTab(tabKey: string): void {
        this.deactivateAllTabs();
        const tabEntry = this.tabs[tabKey];
        tabEntry.content?.classList.add('active');
        tabEntry.button?.classList.add('active');
        this.activeTabKey = tabKey;
    }

    /**
     * Hides all tabs.
     */
    private deactivateAllTabs(): void {
        for (const tabKey in this.tabs) {
            this.deactivateTab(tabKey);
        }
    }

    private deactivateTab(tabKey: string): void {
        const tabEntry = this.tabs[tabKey];
        tabEntry.content?.classList.remove('active');
        tabEntry.content?.contentWindow?.postMessage({ type: 'close_tab_menu' }, '*');
        tabEntry.button?.classList.remove('active');
    }

    /**
     * Disable / Enable a tab.
     */
    public setTabEnabled(tabKey: string, enabled: boolean): void {
        // Ensure the tab exists
        const tabEntry = this.tabs[tabKey];
        if (!tabEntry) {
            console.warn(`Tab with key '${tabKey}' does not exist.`);
            return;
        }

        // Set the disabled state on the button
        if (enabled) {
            tabEntry.button?.removeAttribute('disabled');
            tabEntry.button?.classList.remove('disabled');
            return;
        }

        // If disabling the active tab, switch to another available tab
        if (this.activeTabKey === tabKey) {
            for (const otherTabKey in this.tabs) {
                if (otherTabKey !== tabKey && !this.tabs[otherTabKey].button?.hasAttribute('disabled')) {
                    this.activateTab(otherTabKey);
                    break;
                }
            }
        }
        tabEntry.button?.setAttribute('disabled', 'true');
        tabEntry.button?.classList.add('disabled');

        // Close any open menus in the disabled tab
        tabEntry.content?.contentWindow?.postMessage({ type: 'close_tab_menu' }, '*');

        // Hide the disabled tab
        tabEntry.content?.classList.remove('active');
    }
}

new TabHandler();