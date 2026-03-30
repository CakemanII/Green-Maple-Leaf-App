export class TabHandler {
    static Instance() { return this.instance; }
    static get INSTANCE() { return this.instance; }
    constructor() {
        // Tabs can be absent in some views, so allow null and initialize to null.
        // Allow content/button to be null when an element is not present in the DOM.
        this.tabs = {};
        this.activeTabKey = null;
        // Singleton pattern - prevent multiple instances
        if (TabHandler.instance) {
            console.error("TabHandler instance already exists!");
            return;
        }
        TabHandler.instance = this;
        // Initialize tabs and buttons
        this.tabs = {
            liveInterface: {
                content: document.getElementById(TabHandler.TAB_IDS.liveInterface.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.liveInterface.buttonId)
            },
            /*liveData: {
                content: document.getElementById(TabHandler.TAB_IDS.liveData.tabId) as HTMLIFrameElement,
                button: document.getElementById(TabHandler.TAB_IDS.liveData.buttonId) as HTMLButtonElement
            },*/
            interfaceEditor: {
                content: document.getElementById(TabHandler.TAB_IDS.interfaceEditor.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.interfaceEditor.buttonId)
            },
            statusEditor: {
                content: document.getElementById(TabHandler.TAB_IDS.statusEditor.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.statusEditor.buttonId)
            },
            geofenceEditor: {
                content: document.getElementById(TabHandler.TAB_IDS.geofenceEditor.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.geofenceEditor.buttonId)
            },
            preferences: {
                content: document.getElementById(TabHandler.TAB_IDS.preferences.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.preferences.buttonId)
            },
            settings: {
                content: document.getElementById(TabHandler.TAB_IDS.settings.tabId),
                button: document.getElementById(TabHandler.TAB_IDS.settings.buttonId)
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
    initializeTabButtonEvents() {
        var _a;
        // Attach click event listeners to each tab button
        for (const tabKey in this.tabs) {
            const tabEntry = this.tabs[tabKey];
            (_a = tabEntry.button) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.onTabButtonClick(tabKey));
        }
    }
    /**
     * Triggers when a tab button is clicked.
     */
    onTabButtonClick(tabKey) {
        if (this.activeTabKey === tabKey) {
            // Get the tab button position.
            const tabBtnElement = this.tabs[tabKey].button;
            const tabButtonRect = tabBtnElement === null || tabBtnElement === void 0 ? void 0 : tabBtnElement.getBoundingClientRect();
            const tabBLButtonPositionX = tabButtonRect ? tabButtonRect.left + window.scrollX : 0;
            // Trigger secondary menus or actions if already activated
            this.tabs[tabKey].content.contentWindow.postMessage({ type: 'toggle_tab_menu', tabButtonPositionX: tabBLButtonPositionX }, '*');
        }
        else {
            this.activateTab(tabKey);
        }
    }
    /**
     * Activates the specified tab and hides all others.
     */
    activateTab(tabKey) {
        var _a, _b;
        this.deactivateAllTabs();
        const tabEntry = this.tabs[tabKey];
        (_a = tabEntry.content) === null || _a === void 0 ? void 0 : _a.classList.add('active');
        (_b = tabEntry.button) === null || _b === void 0 ? void 0 : _b.classList.add('active');
        this.activeTabKey = tabKey;
    }
    /**
     * Hides all tabs.
     */
    deactivateAllTabs() {
        for (const tabKey in this.tabs) {
            this.deactivateTab(tabKey);
        }
    }
    deactivateTab(tabKey) {
        var _a, _b, _c, _d;
        const tabEntry = this.tabs[tabKey];
        (_a = tabEntry.content) === null || _a === void 0 ? void 0 : _a.classList.remove('active');
        (_c = (_b = tabEntry.content) === null || _b === void 0 ? void 0 : _b.contentWindow) === null || _c === void 0 ? void 0 : _c.postMessage({ type: 'close_tab_menu' }, '*');
        (_d = tabEntry.button) === null || _d === void 0 ? void 0 : _d.classList.remove('active');
    }
    /**
     * Disable / Enable a tab.
     */
    setTabEnabled(tabKey, enabled) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Ensure the tab exists
        const tabEntry = this.tabs[tabKey];
        if (!tabEntry) {
            console.warn(`Tab with key '${tabKey}' does not exist.`);
            return;
        }
        // Set the disabled state on the button
        if (enabled) {
            (_a = tabEntry.button) === null || _a === void 0 ? void 0 : _a.removeAttribute('disabled');
            (_b = tabEntry.button) === null || _b === void 0 ? void 0 : _b.classList.remove('disabled');
            return;
        }
        // If disabling the active tab, switch to another available tab
        if (this.activeTabKey === tabKey) {
            for (const otherTabKey in this.tabs) {
                if (otherTabKey !== tabKey && !((_c = this.tabs[otherTabKey].button) === null || _c === void 0 ? void 0 : _c.hasAttribute('disabled'))) {
                    this.activateTab(otherTabKey);
                    break;
                }
            }
        }
        (_d = tabEntry.button) === null || _d === void 0 ? void 0 : _d.setAttribute('disabled', 'true');
        (_e = tabEntry.button) === null || _e === void 0 ? void 0 : _e.classList.add('disabled');
        // Close any open menus in the disabled tab
        (_g = (_f = tabEntry.content) === null || _f === void 0 ? void 0 : _f.contentWindow) === null || _g === void 0 ? void 0 : _g.postMessage({ type: 'close_tab_menu' }, '*');
        // Hide the disabled tab
        (_h = tabEntry.content) === null || _h === void 0 ? void 0 : _h.classList.remove('active');
    }
}
TabHandler.TAB_IDS = {
    liveInterface: { tabId: 'live_interface_tab', buttonId: 'live_interface_tab_button' },
    interfaceEditor: { tabId: 'interface_editor_tab', buttonId: 'interface_editor_tab_button' },
    //liveData:        { tabId: 'live_data_tab',        buttonId: 'live_data_tab_button' },
    statusEditor: { tabId: 'status_editor_tab', buttonId: 'status_editor_tab_button' },
    geofenceEditor: { tabId: 'geofence_editor_tab', buttonId: 'geofence_editor_tab_button' },
    preferences: { tabId: 'preferences_tab', buttonId: 'preferences_tab_button' },
    settings: { tabId: 'settings_tab', buttonId: 'settings_tab_button' },
};
new TabHandler();
//# sourceMappingURL=tab_handler.js.map