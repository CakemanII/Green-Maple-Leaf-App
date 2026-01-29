// Imports
import { GeneralUtilities } from '../../shared/compiled_js/utilities.js';
import { Status, Flag, ConditionalGroup, TelemetryCondition, StatusCondition, StatusCollection } from '../../shared/compiled_js/types.js';


const ExampleStatus3: Status = {
    UUID: "statustemptemp2",
    name: "Impact Detection",
    defaultFlag: {
        name: "No Critical Impact Detected",
        UUID: "defaultflagtemp2",
        description: "",
        imagePath: "C:\\Users\\tyler\\OneDrive\\Desktop\\Green Maple Leaf App\\saves\\statuses\\statustemptemp2\\all-good.png",
        primaryConditionalGroup: null,
    },
    flags: [
        {
            UUID: "flagtemp1234",
            name: "Terminal Velocity Reached, It's Over Twin",
            description: "Rocket has reached terminal velocity indicating free-fall impact.",
            imagePath: "C:\\Users\\tyler\\OneDrive\\Desktop\\Green Maple Leaf App\\saves\\statuses\\statustemptemp2\\its_over.jpg",
            primaryConditionalGroup: {
                type: 'AND',
                editorColor: 'rgba(11, 58, 146, 1)',
                not: false,
                embededConditionalGroups: [
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'vel.y',
                            operator: 'LTOE',
                            value: -50
                        }
                    },
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'accel.y',
                            operator: 'GTOE',
                            value: -0.1
                        }
                    },
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'accel.y',
                            operator: 'LTOE',
                            value: 0
                        }
                    },
                    {
                        type: 'AND',
                        editorColor: 'rgb(231, 76, 60)',
                        not: false,
                        embededConditionalGroups: [
                            {
                                type: 'CONDITION',
                                not: false,
                                condition: {
                                    telemetryKey: 'vel.y',
                                    operator: 'LTOE',
                                    value: -50
                                }
                            },
                            {
                                type: 'CONDITION',
                                not: false,
                                condition: {
                                    telemetryKey: 'accel.y',
                                    operator: 'GTOE',
                                    value: -0.1
                                }
                            },
                            {
                                type: 'CONDITION',
                                not: false,
                                condition: {
                                    telemetryKey: 'accel.y',
                                    operator: 'LTOE',
                                    value: 0
                                }
                            }
                        ]
                    }
                ]
            }
        },
    ]
};



export class FlagEditor {
    private static instance: FlagEditor
    public static get INSTANCE(): FlagEditor { return FlagEditor.instance; }

    // Conditional Row Telemetry Input Dictionary
    private static readonly TELEMETRY_OPTIONS_DICTIONARY: { [key: string]: string } = {
        'dps_alt': 'DPS Altitude',
        'dps_vel': 'DPS Velocity',
        'ang_vel': 'Angular Velocity',
        "accel.y": "Linear Acceleration Y",
        "vel.y": "Linear Velocity Y",
    }
    private conditionTelemetryOptionsHTML!: string;

    // UI Elements
    private flagCreationPromptElement!: HTMLDivElement;

    private flagCreationCloseBtnElement!: HTMLButtonElement;
    private flagCreationCancelBtnElement!: HTMLButtonElement;

    private flagTitleElement!: HTMLInputElement;
    private flagDescriptionElement!: HTMLTextAreaElement;
    private flagStatusElement!: HTMLSelectElement;
    private flagImageInputElement!: HTMLInputElement;
    private flagAudioInputElement!: HTMLInputElement;

    private saveFlagBtnElement!: HTMLButtonElement;

    private flagPreviewElement!: HTMLImageElement;
    private flagConditionsContainerElement!: HTMLDivElement;

    // Active Flag Being Created/Edited
    private currentFlag: Flag | null = null;
    private currentFlagStatusUUID: string | null = null;
    private currentFlagCollectionUUID: string | null = null;

    // Flag Changes tracker
    private flagChanges: {collection_uuid: string, status_uuid: string, flag: Flag}[] = [];

    constructor() {
        // Ensure singleton
        if (FlagEditor.instance) {
            throw new Error("Use FlagEditor.INSTANCE to access the singleton instance.");
        }
        FlagEditor.instance = this;

        // Get UI elements
        this.flagCreationPromptElement = document.getElementById('flag-creation-prompt') as HTMLDivElement;
        this.flagCreationCloseBtnElement = this.flagCreationPromptElement.querySelector('#flag-creation-close-btn') as HTMLButtonElement;
        this.flagCreationCancelBtnElement = this.flagCreationPromptElement.querySelector('#flag-creation-cancel-btn') as HTMLButtonElement;

        this.flagTitleElement = this.flagCreationPromptElement.querySelector('#flag-title-input') as HTMLInputElement;
        this.flagDescriptionElement = this.flagCreationPromptElement.querySelector('#flag-description-input') as HTMLTextAreaElement;
        this.flagStatusElement = this.flagCreationPromptElement.querySelector('#flag-status-select') as HTMLSelectElement;
        this.flagImageInputElement = this.flagCreationPromptElement.querySelector('#flag-image-input') as HTMLInputElement;
        this.flagAudioInputElement = this.flagCreationPromptElement.querySelector('#flag-audio-input') as HTMLInputElement;

        this.saveFlagBtnElement = this.flagCreationPromptElement.querySelector('#save-flag-btn') as HTMLButtonElement;

        this.flagPreviewElement = this.flagCreationPromptElement.querySelector('#flag-image-preview') as HTMLImageElement;
        this.flagConditionsContainerElement = this.flagCreationPromptElement.querySelector('#flag-conditions-container') as HTMLDivElement;

        // Setup close and cancel button events
        this.flagCreationCloseBtnElement.addEventListener('click', () => this.closeFlagCreationPrompt());
        this.flagCreationCancelBtnElement.addEventListener('click', () => this.closeFlagCreationPrompt());

        // Setup save button event
        this.saveFlagBtnElement.addEventListener('click', () => this.confirmChangesToFlag());

        // Setup condition button events using event delegation
        this.setupConditionButtonEvents();

        // Generate telemetry options HTML for condition rows
        this.conditionTelemetryOptionsHTML = this.generateTelemetryOptionsHTML();

        // Open the prompt for testing
        this.populateHTMLWithFlagJSON(ExampleStatus3['flags'][0]);
    }

    // #region Setup and Initialization
    /**
     * Setup event listeners for add condition buttons using event delegation
     */
    private setupConditionButtonEvents(): void {
        this.flagConditionsContainerElement.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            // Check if clicked element is a toggle button (NOT or AND/OR)
            if (target.classList.contains('toggle-btn')) {
                const toggleType = target.getAttribute('data-toggle');
                
                if (toggleType === 'not') {
                    // Toggle NOT button on/off
                    target.classList.toggle('active');
                } else if (toggleType === 'and' || toggleType === 'or') {
                    // Toggle between AND and OR
                    if (target.classList.contains('active')) {
                        // Currently active, switch to the other
                        if (toggleType === 'and') {
                            target.setAttribute('data-toggle', 'or');
                            target.textContent = 'Or';
                        } else {
                            target.setAttribute('data-toggle', 'and');
                            target.textContent = 'And';
                        }
                    } else {
                        // Not active, make it active
                        target.classList.add('active');
                    }
                }
                return;
            }
            
            // Check if clicked element is an "Add Telemetry Condition" button
            if (target.classList.contains('add-condition-btn') && target.textContent?.includes('Telemetry')) {
                const conditionBody = target.closest('.condition-body') as HTMLDivElement;
                if (conditionBody) {
                    this.addTelemetryCondition(conditionBody);
                }
            }
            
            // Check if clicked element is an "Add Status Conditional" button
            if (target.classList.contains('add-condition-btn') && target.textContent?.includes('Status')) {
                const conditionBody = target.closest('.condition-body') as HTMLDivElement;
                if (conditionBody) {
                    this.addStatusCondition(conditionBody);
                }
            }
            
            // Check if clicked element is an "Add Conditional Group" button
            if (target.classList.contains('add-group-btn')) {
                const conditionBody = target.closest('.condition-body') as HTMLDivElement;
                if (conditionBody) {
                    this.addConditionalGroup(conditionBody);
                }
            }
        });
    }

    /**
     * Populate the flag creation prompt with data from the given Flag JSON
     */
    private generateTelemetryOptionsHTML(): string {
        let optionsHTML = '<option value="" selected>Select Telemetry...</option>';
        for (const key in FlagEditor.TELEMETRY_OPTIONS_DICTIONARY) {
            const displayName = FlagEditor.TELEMETRY_OPTIONS_DICTIONARY[key];
            optionsHTML += `<option value="${key}">${displayName}</option>`;
        }
        return optionsHTML;
    }
    // #endregion



    private async getStatusCollectionFileData(collectionUUID: string): Promise<StatusCollection> {
        // Get the file contents from the server.
        const response = await fetch(`/status_collection/get?uuid=${encodeURIComponent(collectionUUID)}`,
            { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Failed to load status collection file with UUID: ${collectionUUID}`);
        }

        const fileContents: string = await response.text();

        // Parse the file contents.
        const statusCollectionData: StatusCollection = this.parseStatusCollectionData(fileContents);
        return statusCollectionData;
    }

    private parseStatusCollectionData(fileContents: string): StatusCollection {
        // Parse the JSON content
        const data: any = JSON.parse(fileContents);

        // Verify and process region data as needed
        const isValid = this.verifyData(data);
        if (!isValid) {
            throw new Error("Invalid geoedit file format.");
        }

        return data as StatusCollection;
    }

    private verifyData(data: any): boolean {
        // Check if StatusCollection structure is valid
        if (data && typeof data === "object" && Array.isArray(data.statuses)) {
            return true;
        }
        return false;
    }

    // #region DOM Manipulation
    /**
     * Add a telemetry condition row to the specified condition body
     */
    private addTelemetryCondition(conditionBody: HTMLDivElement): HTMLDivElement {
        const conditionRow = document.createElement('div');
        conditionRow.className = 'condition-row';
        conditionRow.setAttribute('condition-type', 'telemetry');
        
        // Generate random color for the condition
        const colors = ['rgb(245, 166, 35)', 'rgb(107, 163, 255)', 'rgb(231, 76, 60)', 'rgb(46, 204, 113)', 'rgb(155, 89, 182)'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        conditionRow.innerHTML = `
            <select class="condition-select" style="flex:1;">
                ${this.conditionTelemetryOptionsHTML}
            </select>
            <select class="condition-operator">
                <option value="E">=</option>
                <option value="NE">!=</option>
                <option value="GT">></option>
                <option value="NGT">!></option>
                <option value="LT"><</option>
                <option value="NLT">!<</option>
                <option value="GTOE">≥</option>
                <option value="NGTOE">!≥</option>
                <option value="LTOE">≤</option>
                <option value="NLTOE">!≤</option>
            </select>
            <input type="number" step="1" class="condition-value-input" placeholder="Value..." value="0" />
            <div class="color-indicator" style="background-color:${randomColor};" title="Click to change color"></div>
        `;
        
        // Insert before the button-row
        const buttonRow = Array.from(conditionBody.children).find(
            child => child.classList.contains('button-row')
        ) as HTMLElement | undefined;
        
        if (buttonRow) {
            conditionBody.insertBefore(conditionRow, buttonRow);
        } else {
            conditionBody.appendChild(conditionRow);
        }

        // Make the border change with the color indicator
        const colorIndicator = conditionRow.querySelector('.color-indicator') as HTMLDivElement;
        colorIndicator.addEventListener('click', () => {
            // Cycle through colors (temp)
            const currentColor = colorIndicator.style.backgroundColor;
            console.log(colorIndicator.style.backgroundColor);
            let currentIndex = colors.indexOf(currentColor);
            console.log(currentIndex);
            currentIndex = (currentIndex + 1) % colors.length;
            const newColor = colors[currentIndex];
            colorIndicator.style.backgroundColor = newColor;

            // Set the colors
            this.updateConditionalGroupStyle(conditionRow);
        });

        return conditionRow;
    }

    /**
     * Add a status condition row to the specified condition body
     */
    private addStatusCondition(conditionBody: HTMLDivElement): HTMLDivElement {
        const conditionRow = document.createElement('div');
        conditionRow.className = 'condition-row';
        conditionRow.setAttribute('condition-type', 'status');
        
        // Generate random color for the condition
        const colors = ['rgb(245, 166, 35)', 'rgb(107, 163, 255)', 'rgb(231, 76, 60)', 'rgb(46, 204, 113)', 'rgb(155, 89, 182)'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        conditionRow.innerHTML = `
            <select class="condition-select">
                <option value="">Select Status...</option>
                <option value="statustemptemp1">Testing!</option>
            </select>
            <select class="condition-operator">
                <option value="is">is</option>
                <option value="isnot">is not</option>
            </select>
            <select class="condition-select">
                <option value="">Flag</option>
                <option value="flagtemp123">Nominal</option>
                <option value="flag2">Warning</option>
                <option value="flag3">Critical</option>
            </select>
            <div class="color-indicator" style="background-color:${randomColor};" title="Click to change color"></div>
        `;
        
        // Insert before the button-row
        const buttonRow = Array.from(conditionBody.children).find(
            child => child.classList.contains('button-row')
        ) as HTMLElement | undefined;
        
        if (buttonRow) {
            conditionBody.insertBefore(conditionRow, buttonRow);
        } else {
            conditionBody.appendChild(conditionRow);
        }

        // Make the border change with the color indicator
        const colorIndicator = conditionRow.querySelector('.color-indicator') as HTMLDivElement;
        colorIndicator.addEventListener('click', () => {
            // Cycle through colors (temp)
            const currentColor = colorIndicator.style.backgroundColor;
            console.log(colorIndicator.style.backgroundColor);
            let currentIndex = colors.indexOf(currentColor);
            console.log(currentIndex);
            currentIndex = (currentIndex + 1) % colors.length;
            const newColor = colors[currentIndex];
            colorIndicator.style.backgroundColor = newColor;

            // Set the colors
            this.updateConditionalGroupStyle(conditionRow);
        });

        return conditionRow;
    }

    /**
     * Add a new conditional group to the conditions container
     */
    private addConditionalGroup(conditionBody: HTMLDivElement): HTMLDivElement {
        const conditionGroup = document.createElement('div');
        conditionGroup.className = 'condition-group';
        
        // Generate random color for the new group
        const colors = ['rgb(245, 166, 35)', 'rgb(107, 163, 255)', 'rgb(231, 76, 60)', 'rgb(46, 204, 113)', 'rgb(155, 89, 182)'];
        
        conditionGroup.innerHTML = `
            <div class="condition-header">
                <button class="toggle-btn" data-toggle="not">Not</button>
                <input type="text" class="condition-name-input" placeholder="Group Name..." value="Conditional Group" />
                <div class="color-indicator" style="background-color:${colors[0]};" title="Click to change color"></div>
                <button class="toggle-btn active" data-toggle="and" id="and-or-btn">And</button>
            </div>
            <div class="condition-body">
                <div class="button-row">
                    <button class="add-condition-btn">+ Add Telemetry Condition</button>
                    <button class="add-condition-btn">+ Add Status Conditional</button>
                </div>
                <button class="add-group-btn">+ Add Conditional Group</button>
            </div>
        `;
        
        // Insert before the button-row (same as other conditions)
        // Use Array.from to find only direct children to avoid selecting nested button-rows
        const buttonRow = Array.from(conditionBody.children).find(
            child => child.classList.contains('button-row')
        ) as HTMLElement | undefined;
        
        if (buttonRow) {
            conditionBody.insertBefore(conditionGroup, buttonRow);
        } else {
            conditionBody.appendChild(conditionGroup);
        }

        // Make the border change with the color indicator
        const colorIndicator = conditionGroup.querySelector('.color-indicator') as HTMLDivElement;
        colorIndicator.addEventListener('click', () => {
            // Cycle through colors (temp)
            const currentColor = colorIndicator.style.backgroundColor;
            console.log(colorIndicator.style.backgroundColor);
            let currentIndex = colors.indexOf(currentColor);
            console.log(currentIndex);
            currentIndex = (currentIndex + 1) % colors.length;
            const newColor = colors[currentIndex];
            colorIndicator.style.backgroundColor = newColor;

            // Set the colors
            this.updateConditionalGroupStyle(conditionGroup);
        });

        return conditionGroup;
    }

    /**
     * Update the style of a conditional group based on its color indicator
     */
    private updateConditionalGroupStyle(conditionalGroup: HTMLDivElement): void {
        const colorIndicator = conditionalGroup.querySelector('.color-indicator') as HTMLDivElement;

        const currentColor = colorIndicator.style.backgroundColor;
        conditionalGroup.style.backgroundColor = GeneralUtilities.darkenRGBColor(currentColor, 0.45);
        conditionalGroup.style.borderColor = currentColor;
    }

    /**
     * Clear all input fields in the flag creation prompt.
     */
    private resetPrompt(): void {
        // Reset variables
        this.currentFlagCollectionUUID = null;
        this.currentFlagStatusUUID = null;

        // Reset the current flag
        this.currentFlag = null;

        this.flagTitleElement.value = '';
        this.flagDescriptionElement.value = '';
        this.flagStatusElement.selectedIndex = 0;
        
        // Image
        // Audio
        this.flagPreviewElement.src = ''; // temp
        
        // Clear conditionals
        this.flagConditionsContainerElement.innerHTML = '<div class="condition-body"></div>';
    }
    // #endregion

    /**
     * Closes the flag creation prompt.
     */
    public closeFlagCreationPrompt(): void {
        this.flagCreationPromptElement.classList.remove('active');
    }

    /**
     * Opens the flag creation prompt.
     */
    private openFlagCreationPrompt(): void {
        this.flagCreationPromptElement.classList.add('active');
    }

    /**
     * Create new flag
     */
    public createNewFlag(): void {
        // Reset and open prompt
        this.resetPrompt();
        this.openFlagCreationPrompt();
    }

    /**
     * Edit existing flag
     */
    public async editExistingFlag(collectionUUID: string, statusUUID: string, flagUUID: string): Promise<void> {
        // Set current variables
        this.currentFlagCollectionUUID = collectionUUID;
        this.currentFlagStatusUUID = statusUUID;

        let flagToEdit: Flag;

        // Check if the flag has already been locally edited.
        // ...

        // Get the status collection data
        const statusCollectionData: StatusCollection = await this.getStatusCollectionFileData(collectionUUID);

        // Find the status
        const statusToEdit = statusCollectionData.statuses.find(status => status.UUID === statusUUID);
        if (!statusToEdit) {
            throw new Error(`Status with UUID ${statusUUID} not found in collection ${collectionUUID}`);
        }

        // Find the flag
        // Check if it's the default flag
        if (statusToEdit.defaultFlag && statusToEdit.defaultFlag.UUID === flagUUID)
            flagToEdit = statusToEdit.defaultFlag;
        else
            flagToEdit = statusToEdit.flags.find(flag => flag.UUID === flagUUID) as Flag;
        
        if (!flagToEdit) {
            throw new Error(`Flag with UUID ${flagUUID} not found in status ${statusUUID}`);
        }

        // Populate the prompt with the flag data
        this.populateHTMLWithFlagJSON(flagToEdit);

        // Open the prompt
        this.openFlagCreationPrompt();
    }

    // #region Translate HTML to JSON
    private translateHTMLInputToFlagJSON(): Flag {
        // Determine if a flag is being created or edited and get according variables
        let uuid: string;
        if (this.currentFlag)
            // Editing existing flag
            uuid = this.currentFlag.UUID;
        else
            // Creating new flag
            uuid = GeneralUtilities.generateUUID();

        // Recursively parse condition groups and conditions
        const primaryConditionalGroupJSON = this.parseConditionGroupElement(
            this.flagConditionsContainerElement.querySelector('.condition-group') as HTMLDivElement
        );

        // Build JSON representation
        const flagJSON: Flag = {
            UUID: uuid,
            name: this.flagTitleElement.value,
            description: this.flagDescriptionElement.value,
            imagePath: "C:\\Users\\tyler\\OneDrive\\Desktop\\Green Maple Leaf App\\saves\\statuses\\statustemptemp\\parachute_deploy.png", // temp
            primaryConditionalGroup: primaryConditionalGroupJSON
        };

        return flagJSON;
    }

    /**
     * Parses a conditional group element and returns its JSON representation.
     */
    private parseConditionGroupElement(groupElement: HTMLDivElement): ConditionalGroup {
        // Get isNot value
        const isNot = groupElement.querySelector('.toggle-btn[data-toggle="not"]')?.classList.contains('active') || false;

        // Get logical operator (AND/OR)
        const andOrBtn = groupElement.querySelector('.toggle-btn.active[data-toggle="and"], .toggle-btn.active[data-toggle="or"]');
        const logicalOperator = andOrBtn ? (andOrBtn.getAttribute('data-toggle') === 'and' ? 'AND' : 'OR') : 'AND';

        // Get group name
        const groupNameInput = groupElement.querySelector('.condition-name-input') as HTMLInputElement;
        const groupName = groupNameInput ? groupNameInput.value : 'Conditional Group';

        // Get group color
        const colorIndicator = groupElement.querySelector('.color-indicator') as HTMLDivElement;
        const groupColor: string | undefined = colorIndicator ? colorIndicator.style.backgroundColor : undefined;

        // Initialize the main ConditionalGroup object
        const mainConditionalGroup: ConditionalGroup = {
            not: isNot,
            type: logicalOperator,
            name: groupName,
            editorColor: groupColor,
            embededConditionalGroups: null, // Will Change
        }

        // Parse conditional rows in the group
        const [embededGroupsForConditions, conditionIndiciesInDOM]: [ConditionalGroup[], number[]] = this.parseConditionsRowsInGroup(groupElement);

        // Parse embeded groups 
        const [embededGroupsForGroups, groupIndiciesInDOM]: [ConditionalGroup[], number[]] = this.parseEmbededGroupsInGroup(groupElement);

        // Merge embeded groups from conditions and groups based on their original order in the DOM
        const totalEmbededGroups: ConditionalGroup[] = [];
        let conditionIndex = 0;
        let groupIndex = 0;

        const totalGroupsCount = embededGroupsForConditions.length + embededGroupsForGroups.length;
        for (let _ = 0; _ < totalGroupsCount; _++) {
            // Get the next indicies in DOM
            const conditionDOMIndex = conditionIndiciesInDOM[conditionIndex];
            const groupDOMIndex = groupIndiciesInDOM[groupIndex];

            if (conditionIndex < embededGroupsForConditions.length && (groupIndex >= embededGroupsForGroups.length || conditionDOMIndex < groupDOMIndex)) {
                // Next is a condition group
                totalEmbededGroups.push(embededGroupsForConditions[conditionIndex]);
                conditionIndex++;
            }
            else if (groupIndex < embededGroupsForGroups.length) {
                // Next is an embeded group
                totalEmbededGroups.push(embededGroupsForGroups[groupIndex]);
                groupIndex++;
            }
        }

        // Assign the merged embeded groups to the main ConditionalGroup
        mainConditionalGroup.embededConditionalGroups = totalEmbededGroups;
        return mainConditionalGroup;
    }

    /**
     * Parses all condition rows in a conditional group element and returns an array of ConditionalGroups.
     */
    private parseConditionsRowsInGroup(groupElement: HTMLDivElement): [ConditionalGroup[], number[]] {
        const embededConditionalGroups: ConditionalGroup[] = [];
        const indiciesInDOM: number[] = []; // (0 being the highest)

        // Find all condition rows
        const conditionRows = Array.from(groupElement.querySelectorAll(':scope > .condition-body > .condition-row')) as HTMLDivElement[];

        // Interate through each condition row and create embeded conditions
        conditionRows.forEach(row => {
            // Initialize embeded ConditionalGroup
            const embededGroup: ConditionalGroup = {
                not: false,
                type: 'CONDITION',
                condition: undefined, // Will Change
                editorColor: undefined, // Will Change
            };

            // Get group color
            const colorIndicator = row.querySelector('.color-indicator') as HTMLDivElement;
            const groupColor: string | undefined = colorIndicator ? colorIndicator.style.backgroundColor : undefined;
            embededGroup.editorColor = groupColor;

            // Determine what type of condition it is
            const conditionType = row.getAttribute('condition-type');
            if (conditionType === 'telemetry') {
                // Telemetry Condition
                const selectElement = row.querySelector('.condition-select') as HTMLSelectElement;
                const operatorElement = row.querySelector('.condition-operator') as HTMLSelectElement;
                const valueElement = row.querySelector('.condition-value-input') as HTMLInputElement;

                // Build TelemetryCondition
                const telemetryCondition: TelemetryCondition = {
                    telemetryKey: selectElement.value,
                    operator: operatorElement.value as TelemetryCondition['operator'],
                    value: parseFloat(valueElement.value)
                };

                // Assign to embeded group
                embededGroup.condition = telemetryCondition;
            }
            else if (conditionType === 'status') {
                // Status Condition
                const statusSelectElement = row.querySelectorAll('.condition-select')[0] as HTMLSelectElement;
                const operatorElement = row.querySelector('.condition-operator') as HTMLSelectElement;
                const flagSelectElement = row.querySelectorAll('.condition-select')[1] as HTMLSelectElement;

                // Build StatusCondition
                const statusCondition: StatusCondition = {
                    statusUUID: statusSelectElement.value,
                    shouldBeActive: operatorElement.value === 'is' ? true : false,
                    flagUUID: flagSelectElement.value
                };

                // Assign to embeded group
                embededGroup.condition = statusCondition;
            }
            
            // Determine index of this row within its parent
            const parentBody = row.parentElement;
            if (parentBody) {
                indiciesInDOM.push(this.getElementIndexInParent(row));
            }
            else
            {
                console.error("Failed to find parent element of condition row.");
            }

            // Add embeded group to array
            embededConditionalGroups.push(embededGroup);
        });

        return [embededConditionalGroups, indiciesInDOM];
    }

    /**
     * Parses all embeded conditional groups in a conditional group element and returns an array of ConditionalGroups.
     */
    private parseEmbededGroupsInGroup(groupElement: HTMLDivElement): [ConditionalGroup[], number[]] {
        const embededGroups: ConditionalGroup[] = [];
        const indiciesInDOM: number[] = []; // (0 being the highest)

        // Find all embeded group elements
        const embededGroupElements = Array.from(groupElement.querySelectorAll(':scope > .condition-body > .condition-group')) as HTMLDivElement[];

        // Iterate through each embeded group element
        embededGroupElements.forEach(groupElement => {
            // Recursively parse the embeded group
            const embededGroup = this.parseConditionGroupElement(groupElement);
            embededGroups.push(embededGroup);
            
            // Determine index of this group within its parent
            const parentBody = groupElement.parentElement;
            if (parentBody) {
                indiciesInDOM.push(this.getElementIndexInParent(groupElement));
            }
            else
            {
                console.error("Failed to find parent element of condition group.");
            }
        });

        return [embededGroups, indiciesInDOM];
    }

    /**
     * Get index from parent element
     */
    private getElementIndexInParent(childElement: HTMLElement): number {
        const parent = childElement.parentElement;
        if (!parent) {
            return -1;
        }

        const children = Array.from(parent.children);
        return children.indexOf(childElement);
    }

    // #endregion

    // #region Translate JSON to HTML
    private populateHTMLWithFlagJSON(flag: Flag): void {
        // Clear existing contents
        this.resetPrompt();

        // Set basic fields
        this.flagTitleElement.value = flag.name;
        this.flagDescriptionElement.value = flag.description;
        this.flagPreviewElement.src = ''; // temp

        // Image
        // Audio

        // Check if it is a default flag
        if (!flag.primaryConditionalGroup) {
            console.warn("Flag has no primary conditional group to populate.");
            return;
        }

        // Recursively populate condition groups
        this.populateConditionGroupElement(
            this.flagConditionsContainerElement,
            flag.primaryConditionalGroup
        );

        // Set current flag being edited
        this.currentFlag = flag;
        // Update save button state
        this.updateSaveButtonState();
    }

    /**
     * Populates a conditional group element based on the provided JSON representation.
     */
    private populateConditionGroupElement(containerElement: HTMLDivElement, groupJSON: ConditionalGroup): void {
        // Create condition group element
        console.log('Populating :', containerElement);
        const containerBody = containerElement.querySelector('.condition-body') as HTMLDivElement;
        const conditionGroupElement = this.addConditionalGroup(containerBody);

        // Set NOT button state
        const notBtn = conditionGroupElement.querySelector('.toggle-btn[data-toggle="not"]') as HTMLButtonElement;
        if (groupJSON.not) {
            notBtn.classList.add('active');
        } else {
            notBtn.classList.remove('active');
        }

        // Set AND/OR button state
        const andOrBtn = conditionGroupElement.querySelector('#and-or-btn') as HTMLButtonElement;
        if (groupJSON.type === 'AND') {
            andOrBtn.classList.add('active');
        } else {
            andOrBtn.classList.remove('active');
        }

        // Set group name
        const groupNameInput = conditionGroupElement.querySelector('.condition-name-input') as HTMLInputElement;
        groupNameInput.value = groupJSON.name || 'Conditional Group';

        // Set group color (if any)
        if (groupJSON.editorColor) {
            const colorIndicator = conditionGroupElement.querySelector('.color-indicator') as HTMLDivElement;
            colorIndicator.style.backgroundColor = groupJSON.editorColor;
            this.updateConditionalGroupStyle(conditionGroupElement);
        }

        // Do not continue if there is nothing to iterate through
        if (!groupJSON.embededConditionalGroups) { return; }
        const embededGroups: ConditionalGroup[] = groupJSON.embededConditionalGroups;

        // Iterate through embeded conditional groups
        embededGroups.forEach(embededGroupJSON => {
            if (embededGroupJSON.type === 'CONDITION' && embededGroupJSON.condition) {
                // It's a condition
                const conditionType = Object.keys(embededGroupJSON.condition)[0];
                if (conditionType === 'telemetryKey') {
                    // Telemetry Condition
                    this.populateTelemetryConditionElement(
                        conditionGroupElement,
                        embededGroupJSON
                    );
                } else if (conditionType === 'statusUUID') {
                    // Status Condition
                    this.populateStatusConditionElement(
                        conditionGroupElement,
                        embededGroupJSON
                    );
                }
            } else {
                // It's an embeded conditional group
                this.populateConditionGroupElement(
                    conditionGroupElement,
                    embededGroupJSON
                );
            }
        });
    }

    /**
     * Populates a telemetry condition row element based on the provided JSON representation.
     */
    private populateTelemetryConditionElement(conditionGroupElement: HTMLDivElement, conditionGroupJSON: ConditionalGroup): void {
        // Create the condition row element
        const conditionRowElement = this.addTelemetryCondition(
            conditionGroupElement.querySelector('.condition-body') as HTMLDivElement
        );

        // Get Input Elements
        const selectElement = conditionRowElement.querySelector('.condition-select') as HTMLSelectElement;
        const operatorElement = conditionRowElement.querySelector('.condition-operator') as HTMLSelectElement;
        const valueElement = conditionRowElement.querySelector('.condition-value-input') as HTMLInputElement;
        const colorIndicator = conditionRowElement.querySelector('.color-indicator') as HTMLDivElement;

        // Populate values
        const telemetryCondition = conditionGroupJSON.condition as TelemetryCondition;
        selectElement.value = telemetryCondition.telemetryKey;
        operatorElement.value = telemetryCondition.operator;
        valueElement.value = telemetryCondition.value.toString();
        // Set color indicator (if any)
        if (conditionGroupJSON.editorColor) {
            colorIndicator.style.backgroundColor = conditionGroupJSON.editorColor;
            this.updateConditionalGroupStyle(conditionRowElement);
        }
    }

    /**
     * Populates a status condition row element based on the provided JSON representation.
     */
    private populateStatusConditionElement(conditionGroupElement: HTMLDivElement, conditionGroupJSON: ConditionalGroup): void {
        // Create the condition row element
        const conditionRowElement = this.addStatusCondition(
            conditionGroupElement.querySelector('.condition-body') as HTMLDivElement
        );

        // Get Input Elements
        const statusSelectElement = conditionRowElement.querySelectorAll('.condition-select')[0] as HTMLSelectElement;
        const operatorElement = conditionRowElement.querySelector('.condition-operator') as HTMLSelectElement;
        const flagSelectElement = conditionRowElement.querySelectorAll('.condition-select')[1] as HTMLSelectElement;
        const colorIndicator = conditionRowElement.querySelector('.color-indicator') as HTMLDivElement;

        // Populate values
        const statusCondition = conditionGroupJSON.condition as StatusCondition;
        statusSelectElement.value = statusCondition.statusUUID;
        operatorElement.value = statusCondition.shouldBeActive ? 'is' : 'isnot';
        flagSelectElement.value = statusCondition.flagUUID;
        // Set color indicator (if any)
        if (conditionGroupJSON.editorColor) {
            colorIndicator.style.backgroundColor = conditionGroupJSON.editorColor;
            this.updateConditionalGroupStyle(conditionRowElement);
        }
    }
    // #endregion

    // #region Tracking Changes And Confirming Changes
    /**
     * Called when saving flag being created/edited
     */
    private confirmChangesToFlag(): void {
        // Translate HTML inputs to Flag JSON
        const flagJSON = this.translateHTMLInputToFlagJSON();
        
        // Check if the flag has already been edited (is in the flagChanges array)
        // Editing existing flag
        const existingIndex = this.flagChanges.findIndex(
            changedFlag => (
                changedFlag.status_uuid === this.currentFlagStatusUUID &&
                changedFlag.flag.UUID === this.currentFlag!.UUID &&
                changedFlag.collection_uuid === this.currentFlagCollectionUUID
            )
        );

        if (existingIndex !== -1) {
            // Update existing change
            this.flagChanges[existingIndex].flag = flagJSON;
        }
        else
        {
            // Add new change
            this.flagChanges.push({
                collection_uuid: this.currentFlagCollectionUUID!,
                status_uuid: this.currentFlagStatusUUID!,
                flag: flagJSON
            });
        }

        // Reset the prompt to be safe
        this.resetPrompt();

        // Close the prompt
        this.closeFlagCreationPrompt();
    }

    /**
     * Update the save button state to either display "Create Flag" or "Save Changes"
     */
    private updateSaveButtonState(): void {
        if (this.currentFlag) {
            // Editing existing flag
            this.saveFlagBtnElement.textContent = 'Save Changes';
        } else {
            // Creating new flag
            this.saveFlagBtnElement.textContent = 'Create Flag';
        }
    }
    // #endregion
}

new FlagEditor();