class TabMenuUI {
    // Element IDs
    private static readonly TAB_MENU_CONTAINER_ID: string = "tab-menu";

    private static readonly TAB_MENU_SAVE_BUTTON_ID: string = "tab-menu-save-button";
    private static readonly TAB_MENU_SAVE_AS_BUTTON_ID: string = "tab-menu-save-as-button";
    private static readonly TAB_MENU_LOAD_BUTTON_ID: string = "tab-menu-load-button";

    // HTML Element References
    private tabMenuContainer: HTMLElement;

    private saveButton: HTMLButtonElement
    private saveAsButton: HTMLButtonElement
    private loadButton: HTMLButtonElement

    constructor() {
        // Get HTML element references
        this.tabMenuContainer = document.getElementById(TabMenuUI.TAB_MENU_CONTAINER_ID)!;

        this.saveButton = document.getElementById(TabMenuUI.TAB_MENU_SAVE_BUTTON_ID) as HTMLButtonElement;
        this.saveAsButton = document.getElementById(TabMenuUI.TAB_MENU_SAVE_AS_BUTTON_ID) as HTMLButtonElement;
        this.loadButton = document.getElementById(TabMenuUI.TAB_MENU_LOAD_BUTTON_ID) as HTMLButtonElement;

        // Initialize event listeners
        this.initializeEventListeners();
    }

    /**
     * Initializes event listeners for the tab menu UI.
     */
    private initializeEventListeners(): void {
        // Save Button
        this.saveButton.addEventListener('click', async () => {
            // Trigger save functionality
            await GeoeditFileManager.Instance.attemptSaveCurrentToGeoeditFile();
        });
    }

    /**
     * Shows the tab menu UI.
     */
    private showMenu(): void {
        // Position the menu based on the window size and the tab button position.

        // Show the menu.
    }

    /**
     * Hides the tab menu UI.
     */
    private hideMenu(): void {
        // Hide the menu.
    }
}

new TabMenuUI();