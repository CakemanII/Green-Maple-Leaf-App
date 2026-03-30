class TabMenuUI {
    constructor() {
        // Get HTML element references
        this.tabMenuContainer = document.getElementById(TabMenuUI.TAB_MENU_CONTAINER_ID);
        this.saveButton = document.getElementById(TabMenuUI.TAB_MENU_SAVE_BUTTON_ID);
        this.saveAsButton = document.getElementById(TabMenuUI.TAB_MENU_SAVE_AS_BUTTON_ID);
        this.loadButton = document.getElementById(TabMenuUI.TAB_MENU_LOAD_BUTTON_ID);
        // Initialize event listeners
        this.initializeMenuActivationListeners();
    }
    /**
     * Initializes event listeners for activating the tab menu.
     */
    initializeMenuActivationListeners() {
        // Listen for messages from iframes to show/hide the menu
        window.addEventListener('message', (event) => {
            // Ensure the message is from the parent
            if (event.source !== window.parent)
                return;
            // Check message type
            if (event.data.type === 'activateMenu') {
                this.showMenu();
            }
        });
    }
    /**
     * Shows the tab menu UI.
     */
    showMenu() {
        // Position the menu based on the window size and the tab button position.
        // Show the menu.
    }
    /**
     * Hides the tab menu UI.
     */
    hideMenu() {
        // Hide the menu.
    }
}
// Element IDs
TabMenuUI.TAB_MENU_CONTAINER_ID = "tab-menu";
TabMenuUI.TAB_MENU_SAVE_BUTTON_ID = "btn-save-geoedit-data";
TabMenuUI.TAB_MENU_SAVE_AS_BUTTON_ID = "btn-save-as-geoedit-data";
TabMenuUI.TAB_MENU_LOAD_BUTTON_ID = "btn-load-geoedit-data";
new TabMenuUI();
export {};
//# sourceMappingURL=tab_menu_ui.js.map