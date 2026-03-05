import { SimpleStatus, SimpleStatusCollection, Flag } from '../../shared/compiled_js/types.js';
import { CollectionEditor } from './collection_saving.js';
import { FlagEditorUI } from './flag_editor.js';
import { InputPrompt, StatusCollectionFileListViewerPrompt } from "../../shared/compiled_js/prompts.js";


/**
 * Edit Collection Info Prompt
 */
class EditCollectionInfoPrompt extends InputPrompt {
    private nameInputElement!: HTMLInputElement;
    private descriptionInputElement!: HTMLTextAreaElement
    private sizeDisplayElement!: HTMLDivElement;
    private statusCountDisplayElement!: HTMLDivElement;

    private initialName: string;
    private initialDescription: string;

    private initialSize!: string;
    private initialStatusCount!: number;

    private collectionUUID!: string;

    private onRemove: () => void;

    constructor(
        initialName: string = '',
        initialDescription: string = '',
        initialSize: string = '',
        initialStatusCount: number = 0,
        collectionUUID: string,
        onConfirm: (name: string, description: string) => void, 
        onCancel: () => void,
        onRemove: () => void
    ) {
        const confirm = () => {
            const inputs = this.collectInput();
            onConfirm(inputs[0], inputs[1]);
        }

        super("Collection Info Editing", "", "Save", "Cancel", confirm, onCancel);
        this.initialName = initialName;
        this.initialDescription = initialDescription;
        this.initialSize = initialSize;
        this.initialStatusCount = initialStatusCount;
        this.collectionUUID = collectionUUID;
        this.onRemove = onRemove;

        // Set up input elements in the DOM
        this.initializeAdditionalDOM();
    }

    protected initializeAdditionalDOM(): void {
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
        nameInput.value = this.initialName;
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
        descriptionInput.value = this.initialDescription;
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

        // Add fields to form container
        const nameFieldContainer = document.createElement('div');
        nameFieldContainer.appendChild(nameLabel);
        nameFieldContainer.appendChild(nameInput);

        const descriptionFieldContainer = document.createElement('div');
        descriptionFieldContainer.appendChild(descriptionLabel);
        descriptionFieldContainer.appendChild(descriptionInput);

        formContainer.appendChild(nameFieldContainer);
        formContainer.appendChild(descriptionFieldContainer);

        // Add form container to dialog (before buttons)
        this.insertElementIntoDialog(formContainer);

        // Set variables for later use
        this.nameInputElement = nameInput;
        this.descriptionInputElement = descriptionInput;

        // Add delete button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.style.cssText = `
            padding: 10px 24px;
            background-color: #d32f2f;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        removeButton.onmouseover = () => { removeButton.style.backgroundColor = '#b71c1c'; };
        removeButton.onmouseout = () => { removeButton.style.backgroundColor = '#d32f2f'; };

        removeButton.addEventListener('click', () => {
            this.onRemove();
            this.closePrompt();
        });

        this.insertButtonIntoButtonContainer(removeButton, 0); // Add to left side of button container
    }

    public collectInput(): any[] {
        return [this.nameInputElement.value, this.descriptionInputElement.value];
    }
}

/**
 * Edit Status Info Prompt
 */
class EditStatusInfoPrompt extends InputPrompt {
    private nameInputElement!: HTMLInputElement;
    private descriptionInputElement!: HTMLTextAreaElement

    private initialName: string;
    private initialDescription: string;

    private statusUUID: string;

    private onDelete: () => void;

    constructor(
        initialName: string = '',
        initialDescription: string = '',
        statusUUID: string,
        onConfirm: (name: string, description: string) => void, 
        onCancel: () => void,
        onDelete: () => void
    ) {
        const confirm = () => {
            const inputs = this.collectInput();
            onConfirm(inputs[0], inputs[1]);
        }

        super("Edit Status Info", "", "Save", "Cancel", confirm, onCancel);
        this.initialName = initialName;
        this.initialDescription = initialDescription;
        this.statusUUID = statusUUID;
        this.onDelete = onDelete;

        // Set up input elements in the DOM
        this.initializeAdditionalDOM();
    }

    protected initializeAdditionalDOM(): void {
        // Create name & description fields
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
        nameInput.value = this.initialName;
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
        descriptionInput.value = this.initialDescription;
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

        // Add fields to form container
        const nameFieldContainer = document.createElement('div');
        nameFieldContainer.appendChild(nameLabel);
        nameFieldContainer.appendChild(nameInput);

        // Description field container
        const descriptionFieldContainer = document.createElement('div');
        descriptionFieldContainer.appendChild(descriptionLabel);
        descriptionFieldContainer.appendChild(descriptionInput);

        // Add to main form container
        formContainer.appendChild(nameFieldContainer);
        formContainer.appendChild(descriptionFieldContainer);

        // Add form container to dialog (before buttons)
        this.insertElementIntoDialog(formContainer);

        // Set variables for later use
        this.nameInputElement = nameInput;
        this.descriptionInputElement = descriptionInput;

        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.cssText = `
            padding: 10px 24px;
            background-color: #d32f2f;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        deleteButton.onmouseover = () => { deleteButton.style.backgroundColor = '#b71c1c'; };
        deleteButton.onmouseout = () => { deleteButton.style.backgroundColor = '#d32f2f'; };
        deleteButton.addEventListener('click', () => {
            this.onDelete();
            this.closePrompt();
        });
        this.insertButtonIntoButtonContainer(deleteButton, 0); // Add to left side of button container
    }

    public collectInput(): any[] {
        return [this.nameInputElement.value, this.descriptionInputElement.value];
    }
}


/**
 * Prompt for creating a new collection.
 */
class AddCollectionPrompt extends InputPrompt {
    private nameInputElement!: HTMLInputElement;
    private descriptionInputElement!: HTMLTextAreaElement;

    constructor(onConfirm: (name: string, description: string) => void, onCancel: () => void) {
        const confirm = () => {
            const inputs = this.collectInput();
            onConfirm(inputs[0], inputs[1]);
        };
        super('New Collection', '', 'Create', 'Cancel', confirm, onCancel);
        this.initializeAdditionalDOM();
    }

    protected initializeAdditionalDOM(): void {
        const formContainer = document.createElement('div');
        formContainer.style.cssText = `display:flex;flex-direction:column;gap:16px;margin-bottom:24px;`;

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Collection Name:';
        nameLabel.style.cssText = `color:#cccccc;font-size:14px;font-weight:500;margin-bottom:4px;`;
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter collection name...';
        nameInput.style.cssText = `padding:10px 12px;border:1px solid #555555;border-radius:4px;background-color:#3a3a3a;color:white;font-size:14px;width:100%;box-sizing:border-box;`;
        const nameField = document.createElement('div');
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);

        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description:';
        descriptionLabel.style.cssText = `color:#cccccc;font-size:14px;font-weight:500;margin-bottom:4px;`;
        const descriptionInput = document.createElement('textarea');
        descriptionInput.placeholder = 'Enter description...';
        descriptionInput.rows = 3;
        descriptionInput.style.cssText = `padding:10px 12px;border:1px solid #555555;border-radius:4px;background-color:#3a3a3a;color:white;font-size:14px;width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;`;
        const descField = document.createElement('div');
        descField.appendChild(descriptionLabel);
        descField.appendChild(descriptionInput);

        formContainer.appendChild(nameField);
        formContainer.appendChild(descField);
        this.insertElementIntoDialog(formContainer);

        this.nameInputElement = nameInput;
        this.descriptionInputElement = descriptionInput;
        setTimeout(() => nameInput.focus(), 0);
    }

    public collectInput(): any[] {
        return [this.nameInputElement.value.trim(), this.descriptionInputElement.value.trim()];
    }
}

/**
 * Prompt for adding a new status to an existing collection.
 */
class AddStatusPrompt extends InputPrompt {
    private nameInputElement!: HTMLInputElement;
    private descriptionInputElement!: HTMLTextAreaElement;

    constructor(onConfirm: (name: string, description: string) => void, onCancel: () => void) {
        const confirm = () => {
            const inputs = this.collectInput();
            onConfirm(inputs[0], inputs[1]);
        };
        super('New Status', '', 'Create', 'Cancel', confirm, onCancel);
        this.initializeAdditionalDOM();
    }

    protected initializeAdditionalDOM(): void {
        const formContainer = document.createElement('div');
        formContainer.style.cssText = `display:flex;flex-direction:column;gap:16px;margin-bottom:24px;`;

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Status Name:';
        nameLabel.style.cssText = `color:#cccccc;font-size:14px;font-weight:500;margin-bottom:4px;`;
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter status name...';
        nameInput.style.cssText = `padding:10px 12px;border:1px solid #555555;border-radius:4px;background-color:#3a3a3a;color:white;font-size:14px;width:100%;box-sizing:border-box;`;
        const nameField = document.createElement('div');
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);

        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description:';
        descriptionLabel.style.cssText = `color:#cccccc;font-size:14px;font-weight:500;margin-bottom:4px;`;
        const descriptionInput = document.createElement('textarea');
        descriptionInput.placeholder = 'Enter description...';
        descriptionInput.rows = 3;
        descriptionInput.style.cssText = `padding:10px 12px;border:1px solid #555555;border-radius:4px;background-color:#3a3a3a;color:white;font-size:14px;width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;`;
        const descField = document.createElement('div');
        descField.appendChild(descriptionLabel);
        descField.appendChild(descriptionInput);

        formContainer.appendChild(nameField);
        formContainer.appendChild(descField);
        this.insertElementIntoDialog(formContainer);

        this.nameInputElement = nameInput;
        this.descriptionInputElement = descriptionInput;
        setTimeout(() => nameInput.focus(), 0);
    }

    public collectInput(): any[] {
        return [this.nameInputElement.value.trim(), this.descriptionInputElement.value.trim()];
    }
}

export class CollectionEditorUI {
    private static instance: CollectionEditorUI;
    public static get INSTANCE(): CollectionEditorUI { return CollectionEditorUI.instance; }

    // Elements
    private collectionsContainer!: HTMLElement;
    
    // Drag state
    private draggedElementPreviousElementParent: HTMLElement | null = null;
    private draggedElementPreviousIndex: number | null = null;
    private draggedElement: HTMLElement | null = null;
    private dragType: 'flag' | 'status' | null = null;
    private placeholder: HTMLElement | null = null;
    
    constructor() {
        // Ensure singleton
        if (CollectionEditorUI.instance) {
            throw new Error("Use CollectionEditor.INSTANCE to access the singleton instance.");
        }
        CollectionEditorUI.instance = this;

        // Initialize element references
        this.collectionsContainer = document.querySelector('.collections-container') as HTMLElement;

        // Initialize drag and drop
        this.initializeDragAndDrop();

        // Initialize revert, save, and add-collection buttons
        this.initializeRevertAndSaveButtons();
        this.initializeAddCollectionButton();
        this.initializeLoadCollectionButton();

        // Restore previously open collections from the last session
        CollectionEditor.INSTANCE.restoreFromSession();
    }

    // #region DOM Initialization Methods
    /**
     * Initialize a status collection in the DOM.
     */
    private initializeStatusCollection(collectionUUID: string, name: string, description: string): HTMLDivElement {
        // Check if the collection already exists
        const existingCollection = this.collectionsContainer.querySelector(`.status-collection[data-uuid="${collectionUUID}"]`);
        if (existingCollection) {
            throw new Error(`Collection with UUID ${collectionUUID} already exists in the DOM.`);
        }

        const collection = document.createElement('div');
        const addCollectionBtn = this.collectionsContainer.querySelector('#main-add-collection-btn');
        if (addCollectionBtn) {
            this.collectionsContainer.insertBefore(collection, addCollectionBtn);
        } else {
            this.collectionsContainer.appendChild(collection);
        }
        collection.className = 'status-collection';
        collection.setAttribute('data-uuid', collectionUUID);
        
        // Create collection header
        const header = document.createElement('div');
        header.className = 'collection-header';
        
        // Create header top row (name and buttons container)
        const headerTopRow = document.createElement('div');
        headerTopRow.className = 'collection-header-top';
        
        const collectionName = document.createElement('h2');
        collectionName.className = 'collection-name';
        collectionName.textContent = name;
        
        // Add Status button — appended to statuses container, shown on collection hover
        const addStatusButton = document.createElement('button');
        addStatusButton.className = 'add-status-btn';
        addStatusButton.title = 'Add a new status to this collection';
        addStatusButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        addStatusButton.addEventListener('click', () => {
            new AddStatusPrompt(
                (name, description) => { CollectionEditor.INSTANCE.addNewStatus(collectionUUID, name, description); },
                () => {}
            );
        });

        headerTopRow.appendChild(collectionName);

        const descriptionElement = document.createElement('p');
        descriptionElement.className = 'collection-description';
        descriptionElement.textContent = description;
        
        header.appendChild(headerTopRow);
        header.appendChild(descriptionElement);
        
        // Create statuses container
        const statusesContainer = document.createElement('div');
        statusesContainer.className = 'statuses-container';
        
        collection.appendChild(header);
        collection.appendChild(statusesContainer);
        statusesContainer.appendChild(addStatusButton); // Add button at the end of the container
        
        // Add cog button to collection name
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5"/>
            </svg>
        `;
        const cogButton = document.createElement('button');
        cogButton.className = 'settings-cog collection-cog';
        cogButton.title = 'Collection Settings';
        cogButton.innerHTML = cogSVG;
        collectionName.appendChild(cogButton);

        // Setup cog button event
        cogButton.addEventListener('click', () => {
            new EditCollectionInfoPrompt(
                collectionName.childNodes[0].textContent || '',
                descriptionElement.textContent || '',
                '125 KB',
                5,
                collectionUUID,
                (newName, newDescription) => {
                    // Update the text content without removing child elements
                    collectionName.childNodes[0].textContent = newName;
                    descriptionElement.textContent = newDescription;
                    
                    // Save changes to data model
                    const visualData = this.translateDOMToVisualData();
                    CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);
                },
                () => {},
                () => {
                    // Unload from data model (server file is left untouched)
                    CollectionEditor.INSTANCE.unloadCollection(collectionUUID);

                    // Remove from DOM
                    this.removeCollectionFromDOM(collectionUUID);
                }
            )
        });
        
        return collection;
    }

    /**
     * Initialize a status in the DOM.
     */
    private initializeStatusElement(collectionStatusContainer: HTMLDivElement, collectionUUID: string, statusUUID: string, name: string, description: string = ''): HTMLDivElement {
        const status = document.createElement('div');
        status.className = 'status';
        status.setAttribute('data-uuid', statusUUID);
        status.setAttribute('data-collection-uuid', collectionUUID);
        
        // Create status name
        const statusName = document.createElement('h3');
        statusName.className = 'status-name';
        statusName.textContent = name;
        
        // Create status description
        const statusDescription = document.createElement('p');
        statusDescription.className = 'status-description';
        statusDescription.textContent = description;
        
        // Create flags container
        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'flags-container';
        
        // Create add flag button
        const addFlagButton = document.createElement('button');
        addFlagButton.className = 'add-flag-btn';
        addFlagButton.title = 'Add new flag';
        addFlagButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        addFlagButton.addEventListener('click', () => {
            // TODO: Implement flag creation logic
            FlagEditorUI.INSTANCE.createNewFlag(
                status.parentElement?.parentElement?.getAttribute('data-uuid') as string,
                statusUUID,
                false
            );
        });
        
        status.appendChild(statusName);
        status.appendChild(statusDescription);
        status.appendChild(flagsContainer);
        
        // Add the button at the end initially
        flagsContainer.appendChild(addFlagButton);
        
        // Add cog button to status name
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5"/>
            </svg>
        `;
        const cogButton = document.createElement('button');
        cogButton.className = 'settings-cog status-cog';
        cogButton.title = 'Status Settings';
        cogButton.innerHTML = cogSVG;
        statusName.appendChild(cogButton);

        // Setup cog button event
        cogButton.addEventListener('click', () => {
            new EditStatusInfoPrompt(
                statusName.childNodes[0].textContent || '',
                statusDescription.textContent || '', 
                statusUUID,
                (newName, newDescription) => {
                    // Update the text content without removing child elements
                    statusName.childNodes[0].textContent = newName;
                    statusDescription.textContent = newDescription;

                    // Save changes to data model
                    const visualData = this.translateDOMToVisualData();
                    CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);
                },
                () => {},
                () => {
                    // Remove status from DOM
                    this.removeStatusFromDOM(statusUUID);
                    
                    // Save changes to data model
                    const visualData = this.translateDOMToVisualData();
                    CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);
                }
            )
        });
        
        // Add status before the add-status button so it stays at the bottom
        const addStatusBtn = collectionStatusContainer.querySelector('.add-status-btn');
        if (addStatusBtn) {
            collectionStatusContainer.insertBefore(status, addStatusBtn);
        } else {
            collectionStatusContainer.appendChild(status);
        }
        
        return status;
    }

    /**
     * Sets the image inside a .flag-image container, showing a placeholder when no path is available.
     */
    private setFlagImage(container: HTMLDivElement, imagePath: string | null): void {
        container.innerHTML = '';
        if (imagePath) {
            const img = document.createElement('img');
            img.src = `/media/serve_file?path=${encodeURIComponent(imagePath)}`;
            img.alt = 'Flag Image';
            img.onerror = () => {
                container.innerHTML = '';
                container.appendChild(this.createFlagImagePlaceholder());
            };
            container.appendChild(img);
        } else {
            container.appendChild(this.createFlagImagePlaceholder());
        }
    }

    private createFlagImagePlaceholder(): HTMLDivElement {
        const el = document.createElement('div');
        el.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2a2a2a;color:#555;font-size:26px;`;
        el.textContent = '⚑';
        return el;
    }

    /**
     * Initialize a flag in the DOM.
     */
    private initializeFlagElement(statusFlagContainer: HTMLDivElement, collectionUUID: string, statusUUID: string, flagUUID: string, name: string, isDefault: boolean, imagePath: string | null): HTMLDivElement {
        const flag = document.createElement('div');
        flag.className = 'flag';
        flag.setAttribute('data-uuid', flagUUID);
        flag.setAttribute('data-collection-uuid', collectionUUID);
        flag.setAttribute('data-status-uuid', statusUUID);
        flag.setAttribute('data-default-flag', isDefault ? 'true' : 'false');
        
        // Create flag name
        const flagName = document.createElement('h4');
        flagName.className = 'flag-name';
        flagName.textContent = name + (isDefault ? ' (Default)' : '');
        
        // Create flag image container
        const flagImage = document.createElement('div');
        flagImage.className = 'flag-image';
        
        this.setFlagImage(flagImage, imagePath);
        
        flag.appendChild(flagName);
        flag.appendChild(flagImage);
        
        // Add cog button to flag
        const cogSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5"/>
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
        
        // Insert flag before the Add Flag button to keep it at the end
        const addFlagButton = statusFlagContainer.querySelector('.add-flag-btn');
        if (addFlagButton) {
            statusFlagContainer.insertBefore(flag, addFlagButton);
        } else {
            statusFlagContainer.appendChild(flag);
        }
        
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
     * Remove all collections from DOM by UUID.
     */
    public removeAllCollectionsFromDOM(): void {
        const collections = this.collectionsContainer.querySelectorAll('.status-collection');
        collections.forEach(collection => collection.remove());
    }
    // #endregion

    // #region Revert and Save Buttons
    /**
     * Initialize the Load Collection button.
     */
    private initializeLoadCollectionButton(): void {
        const loadBtn = document.querySelector('#main-load-btn') as HTMLButtonElement;
        loadBtn.addEventListener('click', () => {
            new StatusCollectionFileListViewerPrompt(
                (meta) => {
                    CollectionEditor.INSTANCE.loadCollectionByUUID(meta.UUID, true).catch(err =>
                        console.error('Failed to load collection:', err)
                    )
                },
                () => {}
            );
        });
    }

    /**
     * Initialize the Add Collection button.
     */
    private initializeAddCollectionButton(): void {
        const addCollectionButton = document.querySelector('#main-add-collection-btn') as HTMLButtonElement;
        // Move button to end of container so new collections appear above it
        this.collectionsContainer.appendChild(addCollectionButton);
        addCollectionButton.addEventListener('click', () => {
            new AddCollectionPrompt(
                (name, description) => { CollectionEditor.INSTANCE.addNewCollection(name, description); },
                () => {}
            );
        });
    }

    /**
     * Initialize revert and save buttons.
     */
    private initializeRevertAndSaveButtons(): void {
        const revertButton = document.querySelector('#main-revert-btn') as HTMLButtonElement;
        const saveButton = document.querySelector('#main-save-btn') as HTMLButtonElement;

        revertButton.addEventListener('click', () => this.handleRevertButtonClick());
        saveButton.addEventListener('click', () => this.handleSaveButtonClick());
    }

    /**
     * Handle revert button click.
     */
    private handleRevertButtonClick(): void {
        // Logic to revert changes
        CollectionEditor.INSTANCE.revertLocalChanges();
    }

    /**
     * Handle save button click.
     */
    private handleSaveButtonClick(): void {
        // Logic to save changes
        CollectionEditor.INSTANCE.saveAllChangesToServer();
    }

    /**
     * Enable or disable the save button.
     */
    public updateSaveRevertButtonStates(changesMade: boolean): void {
        console.log('Updating save/revert button states. Changes made:', changesMade);
        const saveButton = document.querySelector('#main-save-btn') as HTMLButtonElement;
        saveButton.classList.toggle('deactivated', !changesMade);
        saveButton.disabled = !changesMade;

        const revertButton = document.querySelector('#main-revert-btn') as HTMLButtonElement;
        revertButton.classList.toggle('deactivated', !changesMade);
        revertButton.disabled = !changesMade;
    }
    // #endregion

    // #region Update Display Methods
    /**
     * Create flag display.
     */
    public createFlagDisplay(collectionUUID: string, statusUUID: string, flagUUID: string, isDefault: boolean = false): void {
        // Get status element
        const statusElement = this.getElementInContainerByUUID(statusUUID, this.collectionsContainer, '.status');
        if (!statusElement) throw new Error(`Status element not found for UUID: ${statusUUID}`);

        // Get flags container
        const flagsContainer = statusElement.querySelector('.flags-container') as HTMLDivElement;
        if (!flagsContainer) throw new Error(`Flags container not found in status UUID: ${statusUUID}`);

        // Get flag data
        const flagData: Flag | null = CollectionEditor.INSTANCE.getFlagByUUID(flagUUID);
        if (!flagData) throw new Error(`Flag data not found for UUID: ${flagUUID}`);
        
        // Initialize flag element
        this.initializeFlagElement(flagsContainer, collectionUUID, statusUUID, flagUUID, flagData.name, isDefault, flagData.imagePath ?? null);
    }

    /**
     * Update flag information display.
     */
    public updateFlagDisplay(flagUUID: string): void {
        // Find flag element
        const flagElement = this.getElementInContainerByUUID(flagUUID, this.collectionsContainer, '.flag');
        if (!flagElement) throw new Error(`Flag element not found for UUID: ${flagUUID}`);

        // Get flag data
        const flagData: Flag | null = CollectionEditor.INSTANCE.getFlagByUUID(flagUUID);
        if (!flagData) throw new Error(`Flag data not found for UUID: ${flagUUID}`);

        // Update name
        const nameElement = flagElement.querySelector('.flag-name') as HTMLElement;
        nameElement.textContent = flagData.name + (flagElement.getAttribute('data-default-flag') === 'true' ? ' (Default)' : '');

        // Update flag image
        const flagImageEl = flagElement.querySelector('.flag-image') as HTMLDivElement;
        if (flagImageEl) this.setFlagImage(flagImageEl, flagData.imagePath ?? null);
    }

    /**
     * Remove a flag from the DOM.
     */
    public removeFlagFromDOM(flagUUID: string): void {
        // Find flag element
        const flagElement = this.getElementInContainerByUUID(flagUUID, this.collectionsContainer, '.flag');
        if (!flagElement) {
            console.error(`Flag element not found for UUID: ${flagUUID}`);
            return;
        }

        // Remove from DOM
        flagElement.remove();
    }

    /**
     * Remove a status from the DOM.
     */
    public removeStatusFromDOM(statusUUID: string): void {
        // Find status element
        const statusElement = this.getElementInContainerByUUID(statusUUID, this.collectionsContainer, '.status');
        if (!statusElement) {
            console.error(`Status element not found for UUID: ${statusUUID}`);
            return;
        }

        // Remove from DOM
        statusElement.remove();
    }

    /**
     * Add a new collection to the DOM.
     */
    public addNewCollectionToDOM(uuid: string, name: string, description: string): void {
        this.initializeStatusCollection(uuid, name, description);
    }

    /**
     * Add a new status into an existing collection in the DOM.
     */
    public addStatusToCollection(collectionUUID: string, statusUUID: string, name: string, description: string, defaultFlagUUID: string): void {
        const collectionElement = this.getElementInContainerByUUID(collectionUUID, this.collectionsContainer, '.status-collection');
        if (!collectionElement) throw new Error(`Collection not found: ${collectionUUID}`);

        const statusesContainer = collectionElement.querySelector('.statuses-container') as HTMLDivElement;
        const statusElement = this.initializeStatusElement(statusesContainer, collectionUUID, statusUUID, name, description);

        const flagData: Flag | null = CollectionEditor.INSTANCE.getFlagByUUID(defaultFlagUUID);
        if (flagData) {
            const flagsContainer = statusElement.querySelector('.flags-container') as HTMLDivElement;
            this.initializeFlagElement(flagsContainer, collectionUUID, statusUUID, defaultFlagUUID, flagData.name, true, flagData.imagePath ?? null);
        }
    }

    /**
     * Remove a collection from the DOM.
     */
    public removeCollectionFromDOM(collectionUUID: string): void {
        // Find collection element
        const collectionElement = this.getElementInContainerByUUID(collectionUUID, this.collectionsContainer, '.status-collection');
        if (!collectionElement) {
            console.error(`Collection element not found for UUID: ${collectionUUID}`);
            return;
        }

        // Remove from DOM
        collectionElement.remove();
    }
    // #endregion

    // #region Menus from Cog Buttons
    /**
     * Display menu from flag cog button click.
     */
    private displayFlagCogMenu(flagElement: HTMLDivElement): void {
        // Get UUIDs
        const flagUUID = flagElement.getAttribute('data-uuid') as string;

        // Determine if default flag
        const isDefaultFlag = flagElement.getAttribute('data-default-flag') === 'true';

        // Display menu
        new Promise<void>((resolve) => {
            FlagEditorUI.INSTANCE.editExistingFlag(flagUUID, isDefaultFlag);
            resolve();
        });
    }
    // #endregion

    // #region Drag and Dropping
    /**
     * Ensures the add button (add-flag-btn or add-status-btn) is always the last child of its container.
     */
    private enforceAddButtonLast(container: HTMLElement, btnClass: string): void {
        const btn = container.querySelector(`:scope > .${btnClass}`) as HTMLElement | null;
        if (btn) container.appendChild(btn);
    }

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
        this.draggedElementPreviousElementParent = element.parentElement;
        this.draggedElementPreviousIndex = Array.from(element.parentElement!.children).indexOf(element);
        
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
        // Always keep the add button at the end
        this.enforceAddButtonLast(flagsContainer, 'add-flag-btn');
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
        // Always keep the add button at the end
        this.enforceAddButtonLast(statusesContainer, 'add-status-btn');
    }

    /**
     * Handles mouse up events to finalize dragging.
     */
    private handleMouseUp(e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Remove dragging class with smooth transition
        this.draggedElement.classList.remove('dragging');

        // Final enforcement: ensure add buttons are always last in their containers
        this.collectionsContainer.querySelectorAll<HTMLElement>('.flags-container').forEach(
            c => this.enforceAddButtonLast(c, 'add-flag-btn')
        );
        this.collectionsContainer.querySelectorAll<HTMLElement>('.statuses-container').forEach(
            c => this.enforceAddButtonLast(c, 'add-status-btn')
        );

        // Determine if the order has changed and handle accordingly
        if (
            this.draggedElementPreviousElementParent !== this.draggedElement!.parentElement ||
            this.draggedElementPreviousIndex !== Array.from(this.draggedElement!.parentElement!.children).indexOf(this.draggedElement!)
        ) {            
            // Translate DOM to visual data
            const visualData = this.translateDOMToVisualData();
            CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);
        }
        
        // Clean up
        if (this.placeholder && this.placeholder.parentElement) {
            this.placeholder.parentElement.removeChild(this.placeholder);
        }
        this.draggedElement = null;
        this.dragType = null;
        this.placeholder = null;
        this.draggedElementPreviousElementParent = null;
        this.draggedElementPreviousIndex = null;
    }
    // #endregion

    // #region Translate Visual Data to DOM
    /**
     * Initialize an entire collection from json.
     */
    public translateJSONCollectionIntoDOM(visualStatusCollection: SimpleStatusCollection): void {
        // Create collection
        const collectionElement = this.initializeStatusCollection(visualStatusCollection.UUID, visualStatusCollection.name, visualStatusCollection.description);

        // Create statuses
        const statusesContainer = collectionElement.querySelector('.statuses-container') as HTMLDivElement;
        visualStatusCollection.statusesUUIDs.forEach((statusUUID: string) => {
            // Create status
            const statusJSON: SimpleStatus = CollectionEditor.INSTANCE.getStatusByUUID(statusUUID)!;
            const statusElement = this.initializeStatusElement(statusesContainer, visualStatusCollection.UUID, statusUUID, statusJSON.name); // Name is not available in SimpleStatusCollection

            // Create default flag
            const defaultFlagJSON: Flag = CollectionEditor.INSTANCE.getFlagByUUID(statusJSON.defaultFlagUUID)!;
            const flagsContainer = statusElement.querySelector('.flags-container') as HTMLDivElement;
            this.initializeFlagElement(flagsContainer, visualStatusCollection.UUID, statusUUID, statusJSON.defaultFlagUUID, defaultFlagJSON.name, true, defaultFlagJSON.imagePath ?? null);
            
            // Create flags
            statusJSON.flagUUIDs.forEach((flagUUID: string) => {
                // Create flag
                const flagJSON: Flag = CollectionEditor.INSTANCE.getFlagByUUID(flagUUID)!;
                this.initializeFlagElement(flagsContainer, visualStatusCollection.UUID, statusUUID, flagUUID, flagJSON.name, false, flagJSON.imagePath ?? null);
            });
        });
    }
    // #endregion

    // #region Translate DOM to Visual Data
    /**
     * Translate the current DOM structure into visual data.
     */
    public translateDOMToVisualData(): { visualCollections: SimpleStatusCollection[], visualStatuses: SimpleStatus[] } {
        // Declare arrays
        const visualCollections: SimpleStatusCollection[] = [];
        const visualStatuses: SimpleStatus[] = [];

        // Iterate over collections
        const collectionElements = this.collectionsContainer.querySelectorAll('.status-collection');
        collectionElements.forEach((collectionElement) => {
            // Get collection info
            const collectionUUID = collectionElement.getAttribute('data-uuid') as string;
            const collectionName = (collectionElement.querySelector('.collection-name') as HTMLElement).textContent || '';
            const collectionDescription = (collectionElement.querySelector('.collection-description') as HTMLElement).textContent || '';

            // Prepare collection data
            const visualCollection: SimpleStatusCollection = {
                UUID: collectionUUID,
                name: collectionName,
                description: collectionDescription,
                statusesUUIDs: []
            };

            // Iterate over statuses
            const statusElements = collectionElement.querySelectorAll('.status');
            statusElements.forEach((statusElement) => {
                // Get status info
                const statusUUID = statusElement.getAttribute('data-uuid') as string;
                const statusName = (statusElement.querySelector('.status-name') as HTMLElement).textContent || '';
                // Prepare status data
                const visualStatus: SimpleStatus = {
                    UUID: statusUUID,
                    name: statusName,
                    defaultFlagUUID: '',
                    flagUUIDs: []
                };

                // Add status UUID to collection
                visualCollection.statusesUUIDs.push(statusUUID);

                // Iterate over flags
                const flagElements = statusElement.querySelectorAll('.flag');
                flagElements.forEach((flagElement) => {
                    const flagUUID = flagElement.getAttribute('data-uuid') as string;
                    const isDefault = flagElement.getAttribute('data-default-flag') === 'true';
                    if (isDefault) {
                        visualStatus.defaultFlagUUID = flagUUID;
                    }
                    else
                    {
                        visualStatus.flagUUIDs.push(flagUUID);
                    }
                    
                });
                // Add status to statuses array
                visualStatuses.push(visualStatus);
            });

            // Add collection to collections array
            visualCollections.push(visualCollection);
        });

        // Iterate over statuses
        return { visualCollections: visualCollections, visualStatuses: visualStatuses };
    }
    // #endregion

    /**
     * Get Collection UUID, and Status UUID, from Flag UUID.
     */
    public getCollectionAndStatusUUIDFromFlagUUID(flagUUID: string): { collectionUUID: string, statusUUID: string } | null {
        // Find flag element
        const flagElement = this.getElementInContainerByUUID(flagUUID, this.collectionsContainer, '.flag');
        if (!flagElement) {
            console.error(`Flag element not found for UUID: ${flagUUID}`);
            return null;
        }

        // Get status element
        const statusElement = flagElement.closest('.status') as HTMLElement;
        if (!statusElement) {
            console.error(`Status element not found for flag UUID: ${flagUUID}`);
            return null;
        }

        // Get collection element
        const collectionElement = statusElement.closest('.status-collection') as HTMLElement;
        if (!collectionElement) {
            console.error(`Collection element not found for flag UUID: ${flagUUID}`);
            return null;
        }

        // Return UUIDs
        return {
            collectionUUID: collectionElement.getAttribute('data-uuid') as string,
            statusUUID: statusElement.getAttribute('data-uuid') as string
        };
    }
}

new CollectionEditorUI();