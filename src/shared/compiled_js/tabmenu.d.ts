export declare class TabMenu {
    private tabMenuElement;
    private menuSelectionFunctions;
    private static menuOptionButtonsContainerID;
    constructor(menuSelectionFunctions: {
        [key: string]: () => Promise<boolean>;
    });
    /**
     * Setup listener to activate menu when clicked.
     */
    private setupIFrameToggleListener;
    /**
     * Setup menu item selection listeners.
     */
    private setupMenuItemSelectionListeners;
    /**
     * Open tab menu.
     */
    private displayMenu;
    /**
     * Close tab menu.
     */
    closeMenu(): void;
    /**
     * Returns if the tab menu is active or not.
     */
    private isMenuActive;
}
