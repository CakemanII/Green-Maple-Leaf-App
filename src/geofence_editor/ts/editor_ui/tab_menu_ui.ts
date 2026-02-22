import { GeoeditFileManager } from "../geofence_filing.js";

class TabMenuUI {
    // Element IDs
    private static readonly TAB_MENU_CONTAINER_ID: string = "tab-menu";

    private static readonly TAB_MENU_SAVE_BUTTON_ID: string = "btn-save-geoedit-data";
    private static readonly TAB_MENU_SAVE_AS_BUTTON_ID: string = "btn-save-as-geoedit-data";
    private static readonly TAB_MENU_LOAD_BUTTON_ID: string = "btn-load-geoedit-data";

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
        this.initializeMenuActivationListeners();
    }

    /**
     * Initializes event listeners for activating the tab menu.
     */
    private initializeMenuActivationListeners(): void {
        // Listen for messages from iframes to show/hide the menu
        window.addEventListener('message', (event) => {
            // Ensure the message is from the parent
            if (event.source !== window.parent) return;
            // Check message type
            if (event.data.type === 'activateMenu') {
                this.showMenu();
            }
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