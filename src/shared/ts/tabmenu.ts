class TabMenu {
    private tabMenuElement!: HTMLElement;
    
    private menuSelectionFunctions!: { [key: string]: () => Promise<boolean> };

    private static menuOptionButtonsContainerID: string = 'tab-menu-options-container';

    constructor(
        menuSelectionFunctions: { [key: string]: () => Promise<boolean> }
    ) {
        // Initialize tab menu element reference
        this.tabMenuElement = document.getElementById('tab-menu') as HTMLElement;

        // Initialize menu selection functions
        this.menuSelectionFunctions = menuSelectionFunctions;

        // Setup menu activation listener
        this.setupIFrameToggleListener();

        // Setup menu item selection listeners
        this.setupMenuItemSelectionListeners();
    }

    /**
     * Setup listener to activate menu when clicked.
     */
    private setupIFrameToggleListener(): void {
        window.addEventListener('message', (event) => {
            const data = event.data;
            // Ensure it is from parent
            if (event.source !== window.parent) { return; }

            // Close the tab if forced
            if (data.type === "close_tab_menu") { 
                this.closeMenu(); 
                return; 
            }

            // Don't continue unless toggle menu visibility
            if (data.type !== "toggle_tab_menu") { return; }

            // Toggle Menu
            if (this.isMenuActive()) 
            {
                // Close Menu
                this.closeMenu(); 
            }
            else 
            {
                // Abstract the absolute position of the bottom left corner of the tab button from the data.
                const tabButtonPositionX = data.tabButtonPositionX as number;
                const position = { x: tabButtonPositionX, y: 0 }; // 0px from top

                // Open Menu
                this.displayMenu(position); 
            }
        });
    }

    /**
     * Setup menu item selection listeners.
     */
    private setupMenuItemSelectionListeners(): void {
        // Create new array of keys for the menu selection functions for troubleshooting avoiding duplications.
        const menuFunctionKeys = Object.keys(this.menuSelectionFunctions);

        // Ensure there are no duplicate keys in the menu selection functions.
        const uniqueKeys = new Set(menuFunctionKeys);
        if (uniqueKeys.size !== menuFunctionKeys.length) {
            console.error('[TabMenu] Duplicate keys found in menu selection functions:', menuFunctionKeys);
        }

        // Get menu options container
        const menuOptionsContainer = document.getElementById(TabMenu.menuOptionButtonsContainerID) as HTMLElement;

        // Iterate through each menu option button
        const menuOptionButtons = menuOptionsContainer.getElementsByClassName('tab-menu-option');
        Array.from(menuOptionButtons).forEach((buttonElement) => {
            // Get button key
            const buttonKey = buttonElement.getAttribute('data-menu-key');

            // Ensure buttonKey exists
            if (buttonKey === null) {
                console.warn(`[TabMenu] Menu option button is missing 'data-menu-key' attribute.`);
                return;
            }

            // Ensure the button has a corresponding function
            if (!menuFunctionKeys.includes(buttonKey)) {
                console.warn(`[TabMenu] No menu selection function found for key '${buttonKey}'.`);
                return;
            }

            // Remove the key from the menuFunctionsKeys
            menuFunctionKeys.splice(menuFunctionKeys.indexOf(buttonKey), 1);

            // Attach click listener to the button
            buttonElement.addEventListener('click', async () => {
                // Execute the corresponding function and await response
                this.menuSelectionFunctions[buttonKey]().then((shouldCloseMenu) => {
                    // Close menu if indicated
                    if (shouldCloseMenu) this.closeMenu();
                });
            });
        });

        // Warn about any menu functions that do not have corresponding buttons
        menuFunctionKeys.forEach((orphanKey) => {
            console.warn(`[TabMenu] No menu option button found for menu selection function key '${orphanKey}'.`);
        });
    }

    /**
     * Open tab menu.
     */
    private displayMenu(tabButtonPosition: { x: number, y: number }): void {
        // Position the menu just below the tab button
        this.tabMenuElement.style.left = `${tabButtonPosition.x}px`;
        this.tabMenuElement.style.top = `${tabButtonPosition.y}px`;
        this.tabMenuElement.style.display = 'block';
    }

    /**
     * Close tab menu.
     */
    public closeMenu(): void {
        this.tabMenuElement.style.display = 'none';
    }

    /**
     * Returns if the tab menu is active or not.
     */
    private isMenuActive(): boolean {
        return this.tabMenuElement.style.display === 'block';
    }
}