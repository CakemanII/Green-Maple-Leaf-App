import { StatusCollection, Status, Flag } from '../../shared/compiled_js/types.js';
import { FlagEditor } from './flag_editor.js';

const ExampleStatus4: Status = {
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

const ExampleStatusCollection: StatusCollection = {
    "name": "Example Collection",
    "UUID": "test123",
    "description": "This is an example status collection.",
    "statuses": [
        ExampleStatus4, ExampleStatus4, ExampleStatus4
    ]
};

/**
 * Edit Collection Info Dialog
 */
class EditCollectionInfoDialog {
    /**
     * Show an edit collection info dialog
     * @param initialName - Initial collection name value
     * @param initialDescription - Initial description value
     * @param initialSize - Derived size value (read-only)
     * @param initialStatusCount - Derived status count value (read-only)
     * @param onSave - Callback when user saves (receives name, description)
     * @param onCancel - Optional callback when user cancels
     */
    public static show(
        initialName: string = '',
        initialDescription: string = '',
        initialSize: string = '',
        initialStatusCount: number = 0,
        onSave: (name: string, description: string) => void,
        onCancel?: () => void
    ): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 24px;
            min-width: 450px;
            max-width: 550px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        `;

        // Create title
        const titleEl = document.createElement('h3');
        titleEl.textContent = 'Collection Info Editing';
        titleEl.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
            font-size: 20px;
            font-weight: 600;
        `;

        // Create form fields
        const formContainer = document.createElement('div');
        formContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
        `;

        // Collection Name field
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Collection Name:';
        nameLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = initialName;
        nameInput.placeholder = 'Enter collection name...';
        nameInput.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        `;

        // Description field
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description:';
        descriptionLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const descriptionInput = document.createElement('textarea');
        descriptionInput.value = initialDescription;
        descriptionInput.placeholder = 'Enter description...';
        descriptionInput.rows = 3;
        descriptionInput.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
            resize: vertical;
            font-family: inherit;
        `;

        // Size field (derived, read-only)
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'Size: (Derived)';
        sizeLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const sizeDisplay = document.createElement('div');
        sizeDisplay.textContent = initialSize;
        sizeDisplay.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #1a1a1a;
            color: #888888;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        `;

        // Status count field (derived, read-only)
        const statusCountLabel = document.createElement('label');
        statusCountLabel.textContent = 'Status count: (Derived)';
        statusCountLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const statusCountDisplay = document.createElement('div');
        statusCountDisplay.textContent = initialStatusCount.toString();
        statusCountDisplay.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #1a1a1a;
            color: #888888;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        `;

        // Add fields to form container
        const nameFieldContainer = document.createElement('div');
        nameFieldContainer.appendChild(nameLabel);
        nameFieldContainer.appendChild(nameInput);

        const descriptionFieldContainer = document.createElement('div');
        descriptionFieldContainer.appendChild(descriptionLabel);
        descriptionFieldContainer.appendChild(descriptionInput);

        const sizeFieldContainer = document.createElement('div');
        sizeFieldContainer.appendChild(sizeLabel);
        sizeFieldContainer.appendChild(sizeDisplay);

        const statusCountFieldContainer = document.createElement('div');
        statusCountFieldContainer.appendChild(statusCountLabel);
        statusCountFieldContainer.appendChild(statusCountDisplay);

        formContainer.appendChild(nameFieldContainer);
        formContainer.appendChild(descriptionFieldContainer);
        formContainer.appendChild(sizeFieldContainer);
        formContainer.appendChild(statusCountFieldContainer);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 12px;
        `;

        // Create Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 10px 24px;
            background-color: #3a3a3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        cancelButton.onmouseover = () => { cancelButton.style.backgroundColor = '#4a4a4a'; };
        cancelButton.onmouseout = () => { cancelButton.style.backgroundColor = '#3a3a3a'; };

        // Create Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 10px 24px;
            background-color: #6ba3ff;
            color: #181a1b;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        saveButton.onmouseover = () => { saveButton.style.backgroundColor = '#5a92ee'; };
        saveButton.onmouseout = () => { saveButton.style.backgroundColor = '#6ba3ff'; };

        // Assemble dialog
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        dialog.appendChild(titleEl);
        dialog.appendChild(formContainer);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);

        // Close function
        const closeDialog = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escapeHandler);
        };

        // Event handlers
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDialog();
                if (onCancel) onCancel();
            }
        };

        cancelButton.addEventListener('click', () => {
            closeDialog();
            if (onCancel) onCancel();
        });

        saveButton.addEventListener('click', () => {
            closeDialog();
            onSave(nameInput.value, descriptionInput.value);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
                if (onCancel) onCancel();
            }
        });

        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(overlay);

        // Focus on name input
        setTimeout(() => nameInput.focus(), 0);
    }
}

/**
 * Edit Status Info Dialog
 */
class EditStatusInfoDialog {
    /**
     * Show an edit status info dialog
     * @param initialName - Initial name value
     * @param initialDescription - Initial description value
     * @param initialCollection - Initial collection value
     * @param onSave - Callback when user saves (receives name, description, collection)
     * @param onCancel - Optional callback when user cancels
     */
    public static show(
        initialName: string = '',
        initialDescription: string = '',
        initialCollection: string = '',
        onSave: (name: string, description: string, collection: string) => void,
        onCancel?: () => void
    ): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 24px;
            min-width: 450px;
            max-width: 550px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        `;

        // Create title
        const titleEl = document.createElement('h3');
        titleEl.textContent = 'Edit Status Info';
        titleEl.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
            font-size: 20px;
            font-weight: 600;
        `;

        // Create form fields
        const formContainer = document.createElement('div');
        formContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
        `;

        // Name field
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name';
        nameLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = initialName;
        nameInput.placeholder = 'Enter name...';
        nameInput.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        `;

        // Description field
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description';
        descriptionLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const descriptionInput = document.createElement('textarea');
        descriptionInput.value = initialDescription;
        descriptionInput.placeholder = 'Enter description...';
        descriptionInput.rows = 3;
        descriptionInput.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
            resize: vertical;
            font-family: inherit;
        `;

        // Collection field
        const collectionLabel = document.createElement('label');
        collectionLabel.textContent = 'Collection';
        collectionLabel.style.cssText = `
            color: #cccccc;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        `;

        const collectionInput = document.createElement('input');
        collectionInput.type = 'text';
        collectionInput.value = initialCollection;
        collectionInput.placeholder = 'Enter collection...';
        collectionInput.style.cssText = `
            padding: 10px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        `;

        // Add fields to form container
        const nameFieldContainer = document.createElement('div');
        nameFieldContainer.appendChild(nameLabel);
        nameFieldContainer.appendChild(nameInput);

        const descriptionFieldContainer = document.createElement('div');
        descriptionFieldContainer.appendChild(descriptionLabel);
        descriptionFieldContainer.appendChild(descriptionInput);

        const collectionFieldContainer = document.createElement('div');
        collectionFieldContainer.appendChild(collectionLabel);
        collectionFieldContainer.appendChild(collectionInput);

        formContainer.appendChild(nameFieldContainer);
        formContainer.appendChild(descriptionFieldContainer);
        formContainer.appendChild(collectionFieldContainer);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 12px;
        `;

        // Create Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 10px 24px;
            background-color: #3a3a3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        cancelButton.onmouseover = () => { cancelButton.style.backgroundColor = '#4a4a4a'; };
        cancelButton.onmouseout = () => { cancelButton.style.backgroundColor = '#3a3a3a'; };

        // Create Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 10px 24px;
            background-color: #6ba3ff;
            color: #181a1b;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        saveButton.onmouseover = () => { saveButton.style.backgroundColor = '#5a92ee'; };
        saveButton.onmouseout = () => { saveButton.style.backgroundColor = '#6ba3ff'; };

        // Assemble dialog
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        dialog.appendChild(titleEl);
        dialog.appendChild(formContainer);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);

        // Close function
        const closeDialog = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escapeHandler);
        };

        // Event handlers
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDialog();
                if (onCancel) onCancel();
            }
        };

        cancelButton.addEventListener('click', () => {
            closeDialog();
            if (onCancel) onCancel();
        });

        saveButton.addEventListener('click', () => {
            closeDialog();
            onSave(nameInput.value, descriptionInput.value, collectionInput.value);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
                if (onCancel) onCancel();
            }
        });

        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(overlay);

        // Focus on name input
        setTimeout(() => nameInput.focus(), 0);
    }
}


export class CollectionEditor {
    private static instance: CollectionEditor;
    public static get INSTANCE(): CollectionEditor { return CollectionEditor.instance; }

    // Elements
    private collectionsContainer!: HTMLElement;
    
    // Drag state
    private draggedElement: HTMLElement | null = null;
    private dragType: 'flag' | 'status' | null = null;
    private placeholder: HTMLElement | null = null;
    
    constructor() {
        // Ensure singleton
        if (CollectionEditor.instance) {
            throw new Error("Use CollectionEditor.INSTANCE to access the singleton instance.");
        }
        CollectionEditor.instance = this;

        // Initialize element references
        this.collectionsContainer = document.querySelector('.collections-container') as HTMLElement;

        // Initialize drag and drop
        this.initializeDragAndDrop();

        // testing
        this.initializeCollectionFromJSON(ExampleStatusCollection);
    }


    // #region DOM Initialization Methods
    /**
     * Initialize an entire collection from json.
     */
    private initializeCollectionFromJSON(collectionJSON: StatusCollection): void {
        // Create collection
        const collectionElement = this.initializeStatusCollection(collectionJSON.UUID, collectionJSON.name, collectionJSON.description);

        // Create statuses
        const statusesContainer = collectionElement.querySelector('.statuses-container') as HTMLDivElement;
        collectionJSON.statuses.forEach((statusJSON: Status) => {
            // Create status
            const statusElement = this.initializeStatusElement(statusesContainer, statusJSON.UUID, statusJSON.name);

            // Create default flag
            const flagsContainer = statusElement.querySelector('.flags-container') as HTMLDivElement;
            this.initializeFlagElement(flagsContainer, statusJSON.defaultFlag.UUID, statusJSON.defaultFlag.name, true);

            // Create flags
            statusJSON.flags.forEach((flagJSON: Flag) => {
                // Create flag
                this.initializeFlagElement(flagsContainer, flagJSON.UUID, flagJSON.name, false);
            });
        });
    }


    /**
     * Initialize a status collection in the DOM.
     */
    private initializeStatusCollection(UUID: string, name: string, description: string): HTMLDivElement {
        const collection = document.createElement('div');
        this.collectionsContainer.appendChild(collection);
        collection.className = 'status-collection';
        collection.setAttribute('data-uuid', UUID);
        
        // Create collection header
        const header = document.createElement('div');
        header.className = 'collection-header';
        
        const collectionName = document.createElement('h2');
        collectionName.className = 'collection-name';
        collectionName.textContent = name;
        
        const descriptionElement = document.createElement('p');
        descriptionElement.className = 'collection-description';
        descriptionElement.textContent = description;
        
        header.appendChild(collectionName);
        header.appendChild(descriptionElement);
        
        // Create statuses container
        const statusesContainer = document.createElement('div');
        statusesContainer.className = 'statuses-container';
        
        collection.appendChild(header);
        collection.appendChild(statusesContainer);
        
        // Add cog button to collection name
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m0-18l2.5 2.5m-5 0L12 1m10 11h-6m-6 0H1m18 0l-2.5 2.5m0-5l2.5 2.5M1 12l2.5-2.5m0 5L1 12"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
            </svg>
        `;
        const cogButton = document.createElement('button');
        cogButton.className = 'settings-cog collection-cog';
        cogButton.title = 'Collection Settings';
        cogButton.innerHTML = cogSVG;
        collectionName.appendChild(cogButton);

        // Setup cog button event
        cogButton.addEventListener('click', () => {
            EditCollectionInfoDialog.show(
                name,
                description,
                '125 KB',
                5,
                (name, description) => {
                    // Handle save
                    console.log('Saved:', name, description);
                },
                () => {
                    // Handle cancel (optional)
                    console.log('Cancelled');
                }
            );
        });
        
        return collection;
    }

    /**
     * Initialize a status in the DOM.
     */
    private initializeStatusElement(collectionStatusContainer: HTMLDivElement, UUID: string, name: string): HTMLDivElement {
        const status = document.createElement('div');
        status.className = 'status';
        status.setAttribute('data-uuid', UUID);
        
        // Create status name
        const statusName = document.createElement('h3');
        statusName.className = 'status-name';
        statusName.textContent = name;
        
        // Create flags container
        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'flags-container';
        
        status.appendChild(statusName);
        status.appendChild(flagsContainer);
        
        // Add cog button to status name
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m0-18l2.5 2.5m-5 0L12 1m10 11h-6m-6 0H1m18 0l-2.5 2.5m0-5l2.5 2.5M1 12l2.5-2.5m0 5L1 12"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
            </svg>
        `;
        const cogButton = document.createElement('button');
        cogButton.className = 'settings-cog status-cog';
        cogButton.title = 'Status Settings';
        cogButton.innerHTML = cogSVG;
        statusName.appendChild(cogButton);

        // Setup cog button event
        cogButton.addEventListener('click', () => {
            EditStatusInfoDialog.show(
                name,
                'Initial Description', 
                'Initial Collection',
                (name, description, collection) => {
                    // Handle save - called when user clicks Save
                    console.log('Saved:', name, description, collection);
                },
            );
        });
        
        // Add status to collection
        collectionStatusContainer.appendChild(status);
        
        return status;
    }

    /**
     * Initialize a flag in the DOM.
     */
    private initializeFlagElement(statusFlagContainer: HTMLDivElement, UUID: string, name: string, isDefault: boolean): HTMLDivElement {
        const flag = document.createElement('div');
        flag.className = 'flag';
        flag.setAttribute('data-uuid', UUID);
        flag.setAttribute('data-default-flag', isDefault ? 'true' : 'false');
        
        // Create flag name
        const flagName = document.createElement('h4');
        flagName.className = 'flag-name';
        flagName.textContent = name + (isDefault ? ' (Default)' : '');
        
        // Create flag image container
        const flagImage = document.createElement('div');
        flagImage.className = 'flag-image';
        
        const img = document.createElement('img');
        img.src = 'https://via.placeholder.com/120x120/6ba3ff/ffffff?text=Flag';
        img.alt = 'Flag Icon';
        
        flagImage.appendChild(img);
        flag.appendChild(flagName);
        flag.appendChild(flagImage);
        
        // Add cog button to flag
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m0-18l2.5 2.5m-5 0L12 1m10 11h-6m-6 0H1m18 0l-2.5 2.5m0-5l2.5 2.5M1 12l2.5-2.5m0 5L1 12"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
            </svg>
        `;
        const cogButton = document.createElement('button');
        cogButton.className = 'settings-cog flag-cog';
        cogButton.title = 'Flag Settings';
        cogButton.innerHTML = cogSVG;
        flag.appendChild(cogButton);

        // Setup button event
        cogButton.addEventListener('click', () => {
            this.displayFlagCogMenu(flag);
        });
        
        // Add flag to status container
        statusFlagContainer.appendChild(flag);
        
        return flag;
    }

    /**
     * Find and return a collection element by its UUID.
     */
    private getElementInContainerByUUID(UUID: string, container: HTMLElement, elementsSelector: string): HTMLDivElement | null {
        // Get all elements in the container
        const elements = container.querySelectorAll(elementsSelector);

        // Search for the element with the matching UUID
        for (const element of elements) {
            if (element.getAttribute('data-uuid') === UUID) {
                return element as HTMLDivElement;
            }
        }

        // Not found
        return null;
    }

    /**
     * Update collection information display.
     */
    private updateCollectionDisplay(collectionUUID: string, name: string, description: string): void {
        // Find collection element
        const collectionElement = this.getElementInContainerByUUID(collectionUUID, this.collectionsContainer, '.status-collection');
        if (!collectionElement) return;

        // Update name and description
        const nameElement = collectionElement.querySelector('.collection-name') as HTMLElement;
        const descriptionElement = collectionElement.querySelector('.collection-description') as HTMLElement;
        nameElement.textContent = name;
        descriptionElement.textContent = description;
    }

    /**
     * Update status information display.
     */
    private updateStatusDisplay(collectionUUID: string, statusUUID: string, name: string): void {
        const collectionElement = this.getElementInContainerByUUID(collectionUUID, this.collectionsContainer, '.status-collection');
        if (!collectionElement) return;
        const statusElement = this.getElementInContainerByUUID(statusUUID, collectionElement, '.status');
        if (!statusElement) return;

        // Update name and description
        const nameElement = statusElement.querySelector('.status-name') as HTMLElement;
        nameElement.textContent = name;  
    }

    /**
     * Update flag information display.
     */
    private updateFlagDisplay(collectionUUID: string, statusUUID: string, flagUUID: string, name: string, imagePath: string): void {
        // Find status element
        const collectionElement = this.getElementInContainerByUUID(collectionUUID, this.collectionsContainer, '.status-collection');
        if (!collectionElement) return;
        const statusElement = this.getElementInContainerByUUID(statusUUID, collectionElement, '.status');
        if (!statusElement) return;
        const flagElement = this.getElementInContainerByUUID(flagUUID, statusElement, '.flag');
        if (!flagElement) return;

        // Update name
        const nameElement = flagElement.querySelector('.flag-name') as HTMLElement;
        nameElement.textContent = name;
    }

    // #endregion

    // #region Menus from Cog Buttons
    /**
     * Display menu from flag cog button click.
     */
    private displayFlagCogMenu(flagElement: HTMLDivElement): void {
        // Find flag UUID
        const flagUUID = flagElement.getAttribute('data-uuid') as string;
        // Find status UUID
        const statusElement = flagElement.closest('.status') as HTMLDivElement;
        const statusUUID = statusElement.getAttribute('data-uuid') as string;
        // Find collection UUID
        const collectionElement = flagElement.closest('.status-collection') as HTMLDivElement;
        const collectionUUID = collectionElement.getAttribute('data-uuid') as string;
        // Display menu
        new Promise<void>((resolve) => {
            FlagEditor.INSTANCE.editExistingFlag(collectionUUID, statusUUID, flagUUID);
            resolve();
        });
    }

    // #endregion

    // #region Drag and Dropping
    /**
     * Initialize drag and drop functionality for flags and statuses.
     */
    private initializeDragAndDrop(): void {
        // Use event delegation on the collections container
        this.collectionsContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    /**
     * Handles mouse down events to initiate dragging.
     */
    private handleMouseDown(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        
        // Don't initiate drag if clicking on a cog button
        if (target.closest('.settings-cog')) {
            return;
        }
        
        // Check if clicking on a flag
        const flag = target.closest('.flag') as HTMLElement;
        if (flag) {
            // Don't allow dragging the default flag
            if (flag.getAttribute('data-default-flag') === 'true') {
                return;
            }
            this.startDragging(flag, 'flag', e);
            return;
        }
        
        // Check if clicking on a status (but not on flags inside it)
        const statusName = target.closest('.status-name') as HTMLElement;
        if (statusName) {
            const status = statusName.closest('.status') as HTMLElement;
            if (status) {
                this.startDragging(status, 'status', e);
                return;
            }
        }
    }

    /**
     * Starts the dragging process for a given element.
     */
    private startDragging(element: HTMLElement, type: 'flag' | 'status', e: MouseEvent): void {
        this.draggedElement = element;
        this.dragType = type;
        
        // Add dragging class for smooth animation
        element.classList.add('dragging');
        
        // Create placeholder
        this.placeholder = element.cloneNode(true) as HTMLElement;
        this.placeholder.classList.remove('dragging');
        this.placeholder.style.opacity = '0.3';
        this.placeholder.style.pointerEvents = 'none';
        
        e.preventDefault();
    }

    /**
     * Handles mouse move events to update dragging position.
     */
    private handleMouseMove(e: MouseEvent): void {
        if (!this.draggedElement || !this.dragType) return;

        const target = e.target as HTMLElement;
        
        if (this.dragType === 'flag') {
            this.handleFlagDrag(target, e);
        } else if (this.dragType === 'status') {
            this.handleStatusDrag(target, e);
        }
    }

    /**
     * Handles flag dragging and reordering.
     */
    private handleFlagDrag(target: HTMLElement, e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Find the closest flags container (can be in any status, any collection)
        const flagsContainer = target.closest('.flags-container') as HTMLElement;
        if (!flagsContainer) return;
        
        // Don't do anything if it's the same container and no reordering needed
        const currentContainer = this.draggedElement.parentElement;
        
        // Find the flag we're hovering over
        const hoveredFlag = target.closest('.flag') as HTMLElement;
        
        if (hoveredFlag && hoveredFlag !== this.draggedElement) {
            // Don't allow reordering around the default flag
            if (hoveredFlag.getAttribute('data-default-flag') === 'true') {
                return;
            }
            
            // Insert before or after based on horizontal position
            const rect = hoveredFlag.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            
            if (e.clientX < midpoint) {
                flagsContainer.insertBefore(this.draggedElement, hoveredFlag);
            } else {
                flagsContainer.insertBefore(this.draggedElement, hoveredFlag.nextSibling);
            }
        } else if (!hoveredFlag && flagsContainer !== currentContainer) {
            // Empty container or end of container
            flagsContainer.appendChild(this.draggedElement);
        }
    }

    /**
     * Handles status dragging and reordering.
     */
    private handleStatusDrag(target: HTMLElement, e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Find the closest statuses container (can be in any collection)
        const statusesContainer = target.closest('.statuses-container') as HTMLElement;
        if (!statusesContainer) return;
        
        // Don't do anything if it's the same container
        const currentContainer = this.draggedElement.parentElement;
        
        // Find the status we're hovering over
        const hoveredStatus = target.closest('.status') as HTMLElement;
        
        if (hoveredStatus && hoveredStatus !== this.draggedElement) {
            // Insert before or after based on vertical position
            const rect = hoveredStatus.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                statusesContainer.insertBefore(this.draggedElement, hoveredStatus);
            } else {
                statusesContainer.insertBefore(this.draggedElement, hoveredStatus.nextSibling);
            }
        } else if (!hoveredStatus && statusesContainer !== currentContainer) {
            // Empty container or hovering over empty space
            statusesContainer.appendChild(this.draggedElement);
        }
    }

    /**
     * Handles mouse up events to finalize dragging.
     */
    private handleMouseUp(e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Remove dragging class with smooth transition
        this.draggedElement.classList.remove('dragging');
        
        // Clean up
        if (this.placeholder && this.placeholder.parentElement) {
            this.placeholder.parentElement.removeChild(this.placeholder);
        }
        
        this.draggedElement = null;
        this.dragType = null;
        this.placeholder = null;
    }
    // #endregion
}

new CollectionEditor();