export declare class TabHandler {
    private static readonly TAB_IDS;
    private tabs;
    private activeTabKey;
    private static instance;
    static Instance(): TabHandler | undefined;
    static get INSTANCE(): TabHandler | undefined;
    constructor();
    /**
     * Initializes the tab button event listeners.
     */
    private initializeTabButtonEvents;
    /**
     * Triggers when a tab button is clicked.
     */
    private onTabButtonClick;
    /**
     * Activates the specified tab and hides all others.
     */
    private activateTab;
    /**
     * Hides all tabs.
     */
    private deactivateAllTabs;
    private deactivateTab;
    /**
     * Disable / Enable a tab.
     */
    setTabEnabled(tabKey: string, enabled: boolean): void;
}
