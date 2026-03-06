// Imports
import { GeneralUtilities } from '../../shared/compiled_js/utilities.js';
import { Status, Flag, ConditionalGroup, TelemetryCondition, StatusCondition, StatusCollection, MediaFileMetadata } from '../../shared/compiled_js/types.js';
import { CollectionEditor } from './collection_saving.js';
import { CollectionEditorUI } from './collection_editor.js';
import { ConfirmationPrompt, ColorPickerPrompt, MediaFileListViewerPrompt } from '../../shared/compiled_js/prompts.js';


export class FlagEditorUI {
    private static instance: FlagEditorUI
    public static get INSTANCE(): FlagEditorUI { return FlagEditorUI.instance; }

    // UI Elements
    private flagCreationPromptElement!: HTMLDivElement;

    private flagCreationCloseBtnElement!: HTMLButtonElement;
    private flagCreationCancelBtnElement!: HTMLButtonElement;
    private flagDeleteBtnElement!: HTMLButtonElement;

    private flagTitleElement!: HTMLInputElement;
    private flagDescriptionElement!: HTMLTextAreaElement;
    private flagImageInputElement!: HTMLButtonElement;
    private flagAudioInputElement!: HTMLButtonElement;
    private flagAudioPreviewBtnElement!: HTMLButtonElement;
    private audioRepeatToggleElement!: HTMLButtonElement;

    private confirmFlagBtnElement!: HTMLButtonElement;

    private flagPreviewElement!: HTMLDivElement;
    private flagConditionsContainerTitleElement!: HTMLHeadingElement;
    private flagConditionsContainerElement!: HTMLDivElement;

    // Confirmation Dialog Elements
    private confirmationDialogElement!: HTMLDivElement;
    private confirmationTitleElement!: HTMLHeadingElement;
    private confirmationMessageElement!: HTMLParagraphElement;
    private confirmationYesBtnElement!: HTMLButtonElement;
    private confirmationNoBtnElement!: HTMLButtonElement;
    private confirmationCallback: ((confirmed: boolean) => void) | null = null;

    // Active Flag Being Created/Edited
    private currentFlag: Flag | null = null;
    private currentFlagStatusUUID: string | null = null;
    private currentFlagCollectionUUID: string | null = null;
    private isNewFlag: boolean = false;
    private originalFlagSnapshot: string | null = null;
    private isDefaultFlag: boolean = false;

    // Selected Media Paths
    private currentImageUUID: string | null = null;
    private currentImageDisplayName: string | null = null;
    private currentAudioUUID: string | null = null;
    private currentAudioDisplayName: string | null = null;
    private currentAudioRepeat: boolean = false;
    private activeAudioPreviewElement: HTMLAudioElement | null = null;

    // Drag and Drop State
    private draggedElement: HTMLElement | null = null;
    private dragType: 'condition-row' | 'condition-group' | null = null;
    private draggedElementPreviousParent: HTMLElement | null = null;
    private draggedElementPreviousIndex: number = -1;
    private mainConditionalGroup: HTMLElement | null = null;

    private currentColorSelectorPrompt: ColorPickerPrompt | null = null;

    // Telemetry options dictionary
    private telemetry_options_dictionary!: { [category: string]: { [type: string]: any } };

    constructor() {
        // Ensure singleton
        if (FlagEditorUI.instance) {
            throw new Error("Use FlagEditor.INSTANCE to access the singleton instance.");
        }
        FlagEditorUI.instance = this;

        // Get UI elements
        this.flagCreationPromptElement = document.getElementById('flag-creation-prompt') as HTMLDivElement;
        this.flagCreationCloseBtnElement = this.flagCreationPromptElement.querySelector('#flag-creation-close-btn') as HTMLButtonElement;
        this.flagCreationCancelBtnElement = this.flagCreationPromptElement.querySelector('#flag-creation-cancel-btn') as HTMLButtonElement;
        this.flagDeleteBtnElement = this.flagCreationPromptElement.querySelector('#flag-delete-btn') as HTMLButtonElement;

        this.flagTitleElement = this.flagCreationPromptElement.querySelector('#flag-title-input') as HTMLInputElement;
        this.flagDescriptionElement = this.flagCreationPromptElement.querySelector('#flag-description-input') as HTMLTextAreaElement;
        this.flagImageInputElement = this.flagCreationPromptElement.querySelector('#flag-image-input') as HTMLButtonElement;
        this.flagAudioInputElement = this.flagCreationPromptElement.querySelector('#flag-audio-input') as HTMLButtonElement;
        this.flagAudioPreviewBtnElement = this.flagCreationPromptElement.querySelector('#flag-audio-preview-btn') as HTMLButtonElement;
        this.audioRepeatToggleElement = this.flagCreationPromptElement.querySelector('#flag-audio-repeat-toggle') as HTMLButtonElement;

        this.confirmFlagBtnElement = this.flagCreationPromptElement.querySelector('#save-flag-btn') as HTMLButtonElement;

        this.flagPreviewElement = this.flagCreationPromptElement.querySelector('#flag-image-preview') as HTMLDivElement;
        this.flagConditionsContainerElement = this.flagCreationPromptElement.querySelector('#flag-conditions-container') as HTMLDivElement;
        this.flagConditionsContainerTitleElement = this.flagCreationPromptElement.querySelector('#flag-conditions-section-title') as HTMLHeadingElement;

        // Get confirmation dialog elements
        this.confirmationDialogElement = document.getElementById('confirmation-dialog') as HTMLDivElement;
        this.confirmationTitleElement = this.confirmationDialogElement.querySelector('#confirmation-title') as HTMLHeadingElement;
        this.confirmationMessageElement = this.confirmationDialogElement.querySelector('#confirmation-message') as HTMLParagraphElement;
        this.confirmationYesBtnElement = this.confirmationDialogElement.querySelector('#confirmation-yes-btn') as HTMLButtonElement;
        this.confirmationNoBtnElement = this.confirmationDialogElement.querySelector('#confirmation-no-btn') as HTMLButtonElement;

        // Setup close and cancel button events
        this.flagCreationCloseBtnElement.addEventListener('click', () => this.closeFlagCreationPrompt());
        this.flagCreationCancelBtnElement.addEventListener('click', () => this.closeFlagCreationPrompt());

        // Setup delete button event
        this.flagDeleteBtnElement.addEventListener('click', () => this.deleteFlag());

        // Setup save button event
        this.confirmFlagBtnElement.addEventListener('click', async () => await this.confirmChangesToFlag());

        // Live validation: re-check confirm button on any input or select change inside the prompt
        this.flagCreationPromptElement.addEventListener('input',  () => this.validateAndUpdateConfirmButton());
        this.flagCreationPromptElement.addEventListener('change', () => this.validateAndUpdateConfirmButton());

        // Setup confirmation dialog button events
        this.confirmationYesBtnElement.addEventListener('click', () => this.handleConfirmationResponse(true));
        this.confirmationNoBtnElement.addEventListener('click', () => this.handleConfirmationResponse(false));

        // Setup image picker button
        this.flagImageInputElement.addEventListener('click', () => {
            this.stopAudioPreview();
            new MediaFileListViewerPrompt(
                'image',
                async (metadata: MediaFileMetadata) => {
                    this.currentImageUUID = metadata.UUID;
                    this.currentImageDisplayName = metadata.name;
                    const exists = await this.checkFileExists(metadata.UUID, "image");
                    console.log(`Selected image file: ${metadata.name} (UUID: ${metadata.UUID}), exists: ${exists}`);
                    if (exists) {
                        this.flagImageInputElement.textContent = `🖼️ ${metadata.name}`;
                        this.updateFlagImagePreview(metadata.UUID);
                    } else {
                        this.currentImageUUID = null;
                        this.flagImageInputElement.textContent = `⚠️ Missing File: ${metadata.name}`;
                        this.updateFlagImagePreview(null);
                    }
                    this.validateAndUpdateConfirmButton();
                },
                () => {
                    // Verify that the file does exist and if it doesn't, do not show it and show missing instead.
                    this.refreshFileDisplays();
                }
            );
        });
        this.flagImageInputElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentImageUUID) {
                this.currentImageUUID = null;
                this.flagImageInputElement.textContent = `⚠️ Missing File: ${this.currentImageDisplayName ?? '?'}`;
                this.updateFlagImagePreview(null);
                this.validateAndUpdateConfirmButton();
            }
        });

        // Setup audio picker button
        this.flagAudioInputElement.addEventListener('click', () => {
            this.stopAudioPreview();
            new MediaFileListViewerPrompt(
                'audio',
                async (metadata: MediaFileMetadata) => {
                    this.stopAudioPreview();
                    this.currentAudioUUID = metadata.UUID;
                    this.currentAudioDisplayName = metadata.name;
                    const exists = await this.checkFileExists(metadata.UUID, "audio");
                    if (exists) {
                        this.flagAudioInputElement.textContent = `🔊 ${metadata.name}`;
                        this.updateAudioPreviewButtonState(false);
                    } else {
                        this.currentAudioUUID = null;
                        this.flagAudioInputElement.textContent = `⚠️ Missing File: ${metadata.name}`;
                        this.updateAudioPreviewButtonState(false);
                    }
                    this.validateAndUpdateConfirmButton();
                },
                () => {
                    this.refreshFileDisplays();
                }
            );
        });
        this.flagAudioInputElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentAudioUUID) {
                this.stopAudioPreview();
                this.currentAudioUUID = null;
                this.flagAudioInputElement.textContent = `⚠️ Missing File: ${this.currentAudioDisplayName ?? '?'}`;
                this.updateAudioPreviewButtonState(false);
                this.validateAndUpdateConfirmButton();
            }
        });

        this.flagAudioPreviewBtnElement.addEventListener('click', () => {
            if (!this.currentAudioUUID) {
                return;
            }

            if (this.activeAudioPreviewElement) {
                this.stopAudioPreview();
                return;
            }

            const audioUrl = `/media/audio/fetch?uuid=${encodeURIComponent(this.currentAudioUUID)}`;
            const audio = new Audio(audioUrl);
            audio.loop = this.currentAudioRepeat;
            this.activeAudioPreviewElement = audio;
            this.updateAudioPreviewButtonState(true);

            audio.play().catch(() => {
                this.stopAudioPreview();
            });

            audio.addEventListener('ended', () => {
                if (!audio.loop) {
                    this.stopAudioPreview();
                }
            });
        });

        // Setup audio repeat toggle button
        this.audioRepeatToggleElement.addEventListener('click', () => {
            this.currentAudioRepeat = !this.currentAudioRepeat;
            this.audioRepeatToggleElement.classList.toggle('active', this.currentAudioRepeat);
            this.audioRepeatToggleElement.textContent = this.currentAudioRepeat ? '🔁 Repeat On' : '🔁 Repeat Off';
            if (this.activeAudioPreviewElement) {
                this.activeAudioPreviewElement.loop = this.currentAudioRepeat;
            }
            this.validateAndUpdateConfirmButton();
        });

        // Setup condition button events using event delegation
        this.setupConditionButtonEvents();

        // Initialize drag and drop for conditions
        this.initializeDragAndDrop();

        // Set the telemetry options dictionary
        this.getTelemetryOptionsDictionary().then(dictionary => {
            this.telemetry_options_dictionary = dictionary;
        }).catch(error => {
            console.error("Failed to fetch telemetry options dictionary:", error);
            this.telemetry_options_dictionary = {};
        });
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
                    this.validateAndUpdateConfirmButton();
                }
            }
            
            // Check if clicked element is an "Add Status Conditional" button
            if (target.classList.contains('add-condition-btn') && target.textContent?.includes('Status')) {
                const conditionBody = target.closest('.condition-body') as HTMLDivElement;
                if (conditionBody) {
                    this.addStatusCondition(conditionBody);
                    this.validateAndUpdateConfirmButton();
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
    // #endregion
    
    // #region DOM Manipulation
    // #region Telemetry Condition Row
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
            <div class="drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></div>
            <select id="telemetry-category" class="condition-select" style="flex:1;"></select>

            <select id="telemetry-type" class="condition-select" style="flex:1;"></select>

            <select id="telemetry-unit" class="condition-select"></select>

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
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        // Populate telemetry categories h
        const categorySelect = conditionRow.querySelector('#telemetry-category') as HTMLSelectElement;
        const typeSelect     = conditionRow.querySelector('#telemetry-type')     as HTMLSelectElement;
        const unitSelect     = conditionRow.querySelector('#telemetry-unit')     as HTMLSelectElement;
        const operatorSelect = conditionRow.querySelector('.condition-operator')  as HTMLSelectElement;

        const NUMERIC_OPERATORS_HTML = `
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
        `;
        const BOOLEAN_OPERATORS_HTML = `
            <option value="IS">is</option>
            <option value="ISNOT">is not</option>
        `;

        const restoreNumericValueInput = () => {
            const cur = conditionRow.querySelector('.condition-value-input') as HTMLElement;
            if (cur && cur.tagName !== 'INPUT') {
                const numInput = document.createElement('input');
                numInput.type = 'number';
                numInput.step = '1';
                numInput.className = 'condition-value-input';
                numInput.placeholder = 'Value...';
                numInput.value = '0';
                cur.replaceWith(numInput);
            }
        };

        categorySelect.innerHTML = '<option value="" disabled selected>Category...</option>';
        typeSelect.innerHTML = '<option value="" disabled selected>Type...</option>';
        unitSelect.innerHTML = '<option value="" disabled selected>Unit...</option>';
        unitSelect.style.display = 'none'; // hidden until a type with sub-fields is selected
        for (const category of Object.keys(this.telemetry_options_dictionary)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        }

        // Helper: repopulate type select based on selected category
        const repopulateTypes = (selectedCategory: string) => {
            typeSelect.innerHTML = '<option value="" disabled selected>Type...</option>';
            unitSelect.innerHTML = '<option value="" disabled selected>Unit...</option>';
            unitSelect.style.display = 'none';
            operatorSelect.innerHTML = NUMERIC_OPERATORS_HTML;
            restoreNumericValueInput();
            const types = this.telemetry_options_dictionary[selectedCategory];
            if (!types) return;
            for (const typeName of Object.keys(types)) {
                const option = document.createElement('option');
                option.value = typeName;
                option.textContent = typeName;
                typeSelect.appendChild(option);
            }
        };

        // Helper: repopulate unit select based on selected category + type
        const repopulateUnits = (selectedCategory: string, selectedType: string) => {
            unitSelect.innerHTML = '<option value="" disabled selected>Unit...</option>';
            const types = this.telemetry_options_dictionary[selectedCategory];
            if (!types) { unitSelect.style.display = 'none'; return; }
            const typeData = types[selectedType];

            if (typeData === 'boolean') {
                // Boolean type: hide unit, swap operators, swap value input to true/false select
                unitSelect.style.display = 'none';
                operatorSelect.innerHTML = BOOLEAN_OPERATORS_HTML;
                const cur = conditionRow.querySelector('.condition-value-input') as HTMLElement;
                if (cur && cur.tagName !== 'SELECT') {
                    const boolSelect = document.createElement('select');
                    boolSelect.className = 'condition-value-input condition-select';
                    boolSelect.innerHTML = '<option value="true">true</option><option value="false">false</option>';
                    cur.replaceWith(boolSelect);
                }
            } else if (typeData !== null && typeof typeData === 'object' && !Array.isArray(typeData)) {
                // Object with sub-fields — show unit select
                for (const subKey of Object.keys(typeData)) {
                    const option = document.createElement('option');
                    option.value = subKey;
                    option.textContent = subKey;
                    unitSelect.appendChild(option);
                }
                unitSelect.style.display = '';
                operatorSelect.innerHTML = NUMERIC_OPERATORS_HTML;
                restoreNumericValueInput();
            } else {
                // Scalar (e.g. "number") — hide unit, restore numeric operators + input
                unitSelect.style.display = 'none';
                operatorSelect.innerHTML = NUMERIC_OPERATORS_HTML;
                restoreNumericValueInput();
            }
        };

        // Cascade: category → repopulate type (and clear unit)
        categorySelect.addEventListener('change', () => {
            repopulateTypes(categorySelect.value);
        });

        // Cascade: type → repopulate unit
        typeSelect.addEventListener('change', () => {
            repopulateUnits(categorySelect.value, typeSelect.value);
        });

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
        // Apply initial style
        this.updateConditionalGroupStyle(conditionRow);
        // Cycle colors if left click
        colorIndicator.addEventListener('click', () => {
            // Cycle through colors (temp)
            const currentColor = colorIndicator.style.backgroundColor;
            let currentIndex = colors.indexOf(currentColor);
            currentIndex = (currentIndex + 1) % colors.length;
            const newColor = colors[currentIndex];
            colorIndicator.style.backgroundColor = newColor;

            // Set the colors
            this.updateConditionalGroupStyle(conditionRow);
            this.validateAndUpdateConfirmButton();
        });

        // Pick color if right click
        colorIndicator.addEventListener('contextmenu', (e) => {
            // Prevent default context menu
            e.preventDefault();
            console.log("Right click on color indicator - open color picker");

            // Open color picker dialog
            this.openNewColorSelector(e, colorIndicator, conditionRow);
        });

        // Make the delete button remove the entire group
        const deleteBtn = conditionRow.querySelector('.delete-btn') as HTMLButtonElement;
        deleteBtn.addEventListener('dblclick', () => {
            conditionRow.remove();
            this.validateAndUpdateConfirmButton();
        });

        return conditionRow;
    }

    // #endregion
    /**
     * Add a status condition row to the specified condition body.
     * Selects cascade: collection → statuses → flags.
     * condition-select[0] = collection, [1] = status, [2] = flag
     */
    private addStatusCondition(conditionBody: HTMLDivElement): HTMLDivElement {
        const conditionRow = document.createElement('div');
        conditionRow.className = 'condition-row';
        conditionRow.setAttribute('condition-type', 'status');

        // Generate random color for the condition
        const colors = ['rgb(245, 166, 35)', 'rgb(107, 163, 255)', 'rgb(231, 76, 60)', 'rgb(46, 204, 113)', 'rgb(155, 89, 182)'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        conditionRow.innerHTML = `
            <div class="drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></div>
            <select class="condition-select" style="flex:1;">
                <option value="" disabled selected>Collection...</option>
            </select>
            <select class="condition-select" style="flex:1;">
                <option value="" disabled selected>Status...</option>
            </select>
            <select class="condition-operator">
                <option value="is">is</option>
                <option value="isnot">is not</option>
            </select>
            <select class="condition-select">
                <option value="" disabled selected>Flag...</option>
            </select>
            <div class="color-indicator" style="background-color:${randomColor};" title="Click to change color"></div>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
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

        // --- Get the three cascade selects ---
        const allConditionSelects = conditionRow.querySelectorAll('.condition-select');
        const collectionSelect = allConditionSelects[0] as HTMLSelectElement;
        const statusSelect     = allConditionSelects[1] as HTMLSelectElement;
        const flagSelect       = allConditionSelects[2] as HTMLSelectElement;

        // --- Helper: populate status select from a collection UUID ---
        const repopulateStatusOptions = (collectionUUID: string) => {
            // Reset downstream selects
            statusSelect.innerHTML = '<option value="" disabled selected>Status...</option>';
            flagSelect.innerHTML   = '<option value="" disabled selected>Flag...</option>';

            if (!collectionUUID) return;
            const collection = CollectionEditor.INSTANCE.getStatusCollectionByUUID(collectionUUID);
            if (!collection) return;

            collection.statusesUUIDs.forEach(statusUUID => {
                const status = CollectionEditor.INSTANCE.getStatusByUUID(statusUUID);
                if (!status) return;
                const opt = document.createElement('option');
                opt.value       = status.UUID;
                opt.textContent = status.name;
                statusSelect.appendChild(opt);
            });
        };

        // --- Helper: populate flag select from a status UUID ---
        const repopulateFlagOptions = (statusUUID: string) => {
            flagSelect.innerHTML = '<option value="" disabled selected>Flag...</option>';
            if (!statusUUID) return;
            const status = CollectionEditor.INSTANCE.getStatusByUUID(statusUUID);
            if (!status) return;

            // Include the default flag first
            const defaultFlag = CollectionEditor.INSTANCE.getFlagByUUID(status.defaultFlagUUID);
            if (defaultFlag) {
                const opt = document.createElement('option');
                opt.value       = defaultFlag.UUID;
                opt.textContent = `${defaultFlag.name} (Default)`;
                flagSelect.appendChild(opt);
            }

            // Then all other flags
            status.flagUUIDs.forEach(flagUUID => {
                const flag = CollectionEditor.INSTANCE.getFlagByUUID(flagUUID);
                if (!flag) return;
                const opt = document.createElement('option');
                opt.value       = flag.UUID;
                opt.textContent = flag.name;
                flagSelect.appendChild(opt);
            });
        };

        // --- Populate collection select from all loaded collections ---
        CollectionEditor.INSTANCE.getAllCollections().forEach(collection => {
            const opt = document.createElement('option');
            opt.value       = collection.UUID;
            opt.textContent = collection.name;
            collectionSelect.appendChild(opt);
        });

        // --- Cascade event listeners ---
        collectionSelect.addEventListener('change', () => {
            repopulateStatusOptions(collectionSelect.value);
        });

        statusSelect.addEventListener('change', () => {
            repopulateFlagOptions(statusSelect.value);
        });

        // Make the border change with the color indicator
        const colorIndicator = conditionRow.querySelector('.color-indicator') as HTMLDivElement;
        // Apply initial style
        this.updateConditionalGroupStyle(conditionRow);
        // Cycle colors if left click
        colorIndicator.addEventListener('click', () => {
            const currentColor = colorIndicator.style.backgroundColor;
            let currentIndex = colors.indexOf(currentColor);
            currentIndex = (currentIndex + 1) % colors.length;
            colorIndicator.style.backgroundColor = colors[currentIndex];
            this.updateConditionalGroupStyle(conditionRow);
            this.validateAndUpdateConfirmButton();
        });

        // Pick color if right click
        colorIndicator.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.openNewColorSelector(e, colorIndicator, conditionRow);
        });

        // Make the delete button remove the entire row
        const deleteBtn = conditionRow.querySelector('.delete-btn') as HTMLButtonElement;
        deleteBtn.addEventListener('dblclick', () => {
            conditionRow.remove();
            this.validateAndUpdateConfirmButton();
        });

        return conditionRow;
    }

    /**
     * Add a new conditional group to the conditions container
     */
    private addConditionalGroup(conditionBody: HTMLDivElement, isMainConditionalGroup: boolean = false): HTMLDivElement {
        const conditionGroup = document.createElement('div');
        conditionGroup.className = 'condition-group';
        
        // Generate random color for the new group
        const colors = ['rgb(245, 166, 35)', 'rgb(107, 163, 255)', 'rgb(231, 76, 60)', 'rgb(46, 204, 113)', 'rgb(155, 89, 182)'];
        
        conditionGroup.innerHTML = `
            <div class="condition-header">
                ${isMainConditionalGroup ? '' : `<div class="drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></div>`}
                <button class="toggle-btn" data-toggle="not">Not</button>
                <input type="text" class="condition-name-input" ${isMainConditionalGroup ? 'disabled' : ''} placeholder="Group Name..." value="Conditional Group" />
                <div class="color-indicator" style="background-color:${colors[0]};" title="Click to change color"></div>
                <button class="toggle-btn active" data-toggle="and" id="and-or-btn">And</button>
                ${isMainConditionalGroup ? '' : `<button class="delete-btn"><i class="fas fa-trash"></i></button>`}
            </div>
            <div class="condition-body">
                <div class="button-row">
                    <button class="add-condition-btn">+ Add Telemetry Condition</button>
                    <button class="add-condition-btn">+ Add Status Conditional</button>
                    <button class="add-group-btn">+ Add Conditional Group</button>
                </div>
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
        // Apply initial style
        this.updateConditionalGroupStyle(conditionGroup);
        // Cycle colors if left click
        colorIndicator.addEventListener('click', () => {
            // Cycle through colors (temp)
            const currentColor = colorIndicator.style.backgroundColor;
            let currentIndex = colors.indexOf(currentColor);
            currentIndex = (currentIndex + 1) % colors.length;
            const newColor = colors[currentIndex];
            colorIndicator.style.backgroundColor = newColor;

            // Set the colors
            this.updateConditionalGroupStyle(conditionGroup);
            this.validateAndUpdateConfirmButton();
        });

        // Pick color if right click
        colorIndicator.addEventListener('contextmenu', (e) => {
            // Prevent default context menu
            e.preventDefault();
            console.log("Right click on color indicator - open color picker");

            // Open color picker dialog
            this.openNewColorSelector(e, colorIndicator, conditionGroup);
        });

        // Make the delete button remove the entire group
        const deleteBtn = conditionGroup.querySelector('.delete-btn') as HTMLButtonElement;
        if (deleteBtn) {
            deleteBtn.addEventListener('dblclick', () => {
                conditionGroup.remove();
                this.validateAndUpdateConfirmButton();
            });
        }

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
     * Convert an RGB/RGBA color string (e.g. "rgb(245, 166, 35)") to a hex string (e.g. "#f5a623").
     * Returns '#ffffff' if parsing fails.
     */
    private rgbToHex(rgb: string): string {
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) { return '#ffffff'; }
        const [r, g, b] = result.map(Number);
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Returns true if the file at relativePath exists on the server.
     */
    private async checkFileExists(uuid: string, fileType: string): Promise<boolean> {
        try {
            const res = await fetch(`/media/${fileType}/check_file?uuid=${encodeURIComponent(uuid)}`);
            const data = await res.json();
            return data.exists === true;
        } catch {
            return false;
        }
    }

    /**
     * Checks stored image/audio paths against the server and updates button labels
     * to "Missing File" if the file no longer exists.
     */
    private async refreshFileDisplays(): Promise<void> {
        if (this.currentImageUUID) {
            const exists = await this.checkFileExists(this.currentImageUUID, 'image');
            if (!exists) {
                this.currentImageUUID = null;
                this.flagImageInputElement.textContent = `⚠️ Missing File: ${this.currentImageDisplayName ?? '?'}`;
                this.updateFlagImagePreview(null);
                this.validateAndUpdateConfirmButton();
            }
        }
        if (this.currentAudioUUID) {
            const exists = await this.checkFileExists(this.currentAudioUUID, 'audio');
            if (!exists) {
                this.stopAudioPreview();
                this.currentAudioUUID = null;
                this.flagAudioInputElement.textContent = `⚠️ Missing File: ${this.currentAudioDisplayName ?? '?'}`;
                this.updateAudioPreviewButtonState(false);
                this.validateAndUpdateConfirmButton();
            } else {
                this.updateAudioPreviewButtonState(false);
            }
        } else {
            this.updateAudioPreviewButtonState(false);
        }
    }

    private stopAudioPreview(): void {
        if (this.activeAudioPreviewElement) {
            this.activeAudioPreviewElement.pause();
            this.activeAudioPreviewElement.currentTime = 0;
            this.activeAudioPreviewElement = null;
        }
        this.updateAudioPreviewButtonState(false);
    }

    private updateAudioPreviewButtonState(isPlaying: boolean): void {
        const hasAudio = this.currentAudioUUID !== null;
        this.flagAudioPreviewBtnElement.disabled = !hasAudio;

        if (isPlaying && hasAudio) {
            this.flagAudioPreviewBtnElement.textContent = '⏹';
            this.flagAudioPreviewBtnElement.title = 'Stop preview';
            this.flagAudioPreviewBtnElement.style.borderColor = '#6ba3ff';
            this.flagAudioPreviewBtnElement.style.color = '#6ba3ff';
            return;
        }

        this.flagAudioPreviewBtnElement.textContent = '▶';
        this.flagAudioPreviewBtnElement.title = 'Preview audio';
        this.flagAudioPreviewBtnElement.style.borderColor = '#444';
        this.flagAudioPreviewBtnElement.style.color = '#aaa';
    }

    /**
     * Clear all input fields in the flag creation prompt.
     */
    private resetPrompt(): void {
        // Reset variables
        this.isNewFlag = false;
        this.currentFlagStatusUUID = null;
        this.currentFlagCollectionUUID = null;
        this.isDefaultFlag = false;

        // Reset the current flag
        this.currentFlag = null;

        this.flagTitleElement.value = '';
        this.flagDescriptionElement.value = '';
        
        // Image
        this.currentImageUUID = null;
        this.flagImageInputElement.textContent = '\ud83d\udcc1 Choose File';
        this.flagPreviewElement.innerHTML = '<span>Image preview will appear here</span>';
        // Audio
        this.stopAudioPreview();
        this.currentAudioUUID = null;
        this.flagAudioInputElement.textContent = '\ud83d\udcc1 Choose File';
        this.currentAudioRepeat = false;
        this.audioRepeatToggleElement.classList.remove('active');
        this.audioRepeatToggleElement.textContent = '🔁 Repeat Off';
        
        // Clear conditionals
        this.flagConditionsContainerElement.innerHTML = '<div class="condition-body"></div>';
    }

    private updateFlagImagePreview(uuid: string | null): void {
        this.flagPreviewElement.innerHTML = '';
        if (!uuid) {
            this.flagPreviewElement.innerHTML = '<span>Image preview will appear here</span>';
            return;
        }
        const url = `/media/image/fetch?uuid=${encodeURIComponent(uuid)}`;
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Flag Image';
        img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;';
        img.onerror = () => {
            this.flagPreviewElement.innerHTML = '<span>Preview unavailable</span>';
        };
        this.flagPreviewElement.appendChild(img);
    }

    private openNewColorSelector(e: MouseEvent, colorIndicator: HTMLDivElement, conditionGroupOrTelemetryOrStatus: HTMLDivElement): void {
        // Remove old color selector if it exists
        if (this.currentColorSelectorPrompt) {
            this.currentColorSelectorPrompt.forceCancelAndClose();
            this.currentColorSelectorPrompt = null;
        }

        // Open color picker dialog
        const currentColor = colorIndicator.style.backgroundColor;
        this.currentColorSelectorPrompt = new ColorPickerPrompt(
            this.rgbToHex(currentColor),
            e,
            (selectedColor: string | null) => {
                if (selectedColor) {
                    colorIndicator.style.backgroundColor = selectedColor;
                    this.updateConditionalGroupStyle(conditionGroupOrTelemetryOrStatus);
                    this.validateAndUpdateConfirmButton();
                    this.currentColorSelectorPrompt = null;
                }
            },
            (selectedColor: string | null) => {
                // Live preview — disable confirm button while dragging
                this.setConfirmButtonEnabled(false);
                if (selectedColor) {
                    colorIndicator.style.backgroundColor = selectedColor;
                    this.updateConditionalGroupStyle(conditionGroupOrTelemetryOrStatus);
                }
            },
            () => {
                // Reset the color back to normal
                colorIndicator.style.backgroundColor = currentColor;
                this.updateConditionalGroupStyle(conditionGroupOrTelemetryOrStatus);
                this.validateAndUpdateConfirmButton();
                this.currentColorSelectorPrompt = null;
            },
            false
        );
    }
    // #endregion

    /**
     * Closes the flag creation prompt.
     */
    public closeFlagCreationPrompt(): void {
        this.stopAudioPreview();
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
    public async createNewFlag(collectionUUID: string, statusUUID: string, isDefaultFlag: boolean): Promise<void> {
        // Reset and open prompt
        this.resetPrompt();

        // Generate new flag.
        const newFlag = CollectionEditor.INSTANCE.generateNewFlag(false);

        // Populate the prompt with the flag data
        await this.populateHTMLWithFlagJSON(newFlag, isDefaultFlag);

        // Set variables
        this.currentFlagCollectionUUID = collectionUUID;
        this.currentFlagStatusUUID = statusUUID;
        this.isNewFlag = true;

        // Update save button state
        this.updateSaveButtonState();

        // Open the prompt
        this.openFlagCreationPrompt();
    }

    /**
     * Edit existing flag
     */
    public async editExistingFlag(flagUUID: string, isDefaultFlag: boolean): Promise<void> {
        // Get the local flag
        const flagToEdit: Flag | null = CollectionEditor.INSTANCE.fetchFlagFromLocalChanges(flagUUID);
        if (flagToEdit === null) {
            throw new Error(`Failed to find flag with UUID: ${flagUUID} in local changes.`);
        }

        // Populate the prompt with the flag data
        await this.populateHTMLWithFlagJSON(flagToEdit!, isDefaultFlag);

        // Set current flag being edited
        this.isNewFlag = false;

        // Set variables
        const uuids = CollectionEditorUI.INSTANCE.getCollectionAndStatusUUIDFromFlagUUID(flagUUID);
        if (uuids) {
            this.currentFlagCollectionUUID = uuids.collectionUUID;
            this.currentFlagStatusUUID = uuids.statusUUID;
        } else {
            console.error("Failed to find collection and status UUIDs for flag UUID:", flagUUID);
        }

        // Update save button state
        this.updateSaveButtonState();

        // Open the prompt
        this.openFlagCreationPrompt();
    }
    // #endregion

    // #region Translate HTML to JSON
    private translateHTMLInputToFlagJSON(): Flag {
        // Get flag UUID
        let uuid = this.currentFlag!.UUID;

        // Recursively parse condition groups and conditions if not a default flag.
        let primaryConditionalGroupJSON: ConditionalGroup | null = null;
        if (!this.isDefaultFlag) {
            primaryConditionalGroupJSON = this.parseConditionGroupElement(
                this.flagConditionsContainerElement.querySelector('.condition-group') as HTMLDivElement
            );
        }

        // Build JSON representation
        const flagJSON: Flag = {
            UUID: uuid,
            name: this.flagTitleElement.value,
            description: this.flagDescriptionElement.value,
            imageUUID: this.currentImageUUID,
            imageDisplayName: this.currentImageDisplayName,
            audioUUID: this.currentAudioUUID,
            audioDisplayName: this.currentAudioDisplayName,
            audioRepeat: this.currentAudioRepeat,
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
                const categorySelect  = row.querySelector('#telemetry-category') as HTMLSelectElement;
                const typeSelect      = row.querySelector('#telemetry-type')      as HTMLSelectElement;
                const unitSelect      = row.querySelector('#telemetry-unit')      as HTMLSelectElement;
                const operatorElement = row.querySelector('.condition-operator')  as HTMLSelectElement;
                const valueElement    = row.querySelector('.condition-value-input') as HTMLInputElement;

                // Build key: category.type.unit — use "single" when the unit select is hidden/empty
                const unitPart = (unitSelect.style.display !== 'none' && unitSelect.value)
                    ? unitSelect.value
                    : 'single';
                const telemetryKey = `${categorySelect.value}.${typeSelect.value}.${unitPart}`;

                // Build TelemetryCondition
                const telemetryCondition: TelemetryCondition = {
                    telemetryKey,
                    operator: operatorElement.value as TelemetryCondition['operator'],
                    value: parseFloat(valueElement.value)
                };

                // Assign to embeded group
                embededGroup.condition = telemetryCondition;
            }
            else if (conditionType === 'status') {
                // Status Condition — [0]=collection, [1]=status, [2]=flag
                const collectionSelectElement = row.querySelectorAll('.condition-select')[0] as HTMLSelectElement;
                const statusSelectElement     = row.querySelectorAll('.condition-select')[1] as HTMLSelectElement;
                const operatorElement         = row.querySelector('.condition-operator')      as HTMLSelectElement;
                const flagSelectElement        = row.querySelectorAll('.condition-select')[2] as HTMLSelectElement;

                // Build key: collectionUUID.statusUUID
                const statusKey = `${collectionSelectElement.value}.${statusSelectElement.value}`;

                // Build StatusCondition
                const statusCondition: StatusCondition = {
                    statusKey,
                    shouldBeActive: operatorElement.value === 'is',
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
    private async populateHTMLWithFlagJSON(flag: Flag, isDefaultFlag: boolean): Promise<void> {
        // Clear existing contents
        this.resetPrompt();
        this.isDefaultFlag = isDefaultFlag; // set it back to after being reset.

        // Set basic fields
        this.flagTitleElement.value = flag.name;
        this.flagDescriptionElement.value = flag.description;

        // Image
        this.currentImageUUID = flag.imageUUID ?? null;
        this.currentImageDisplayName = flag.imageDisplayName ?? null;
        if (flag.imageUUID && await this.checkFileExists(flag.imageUUID, 'image')) {
            this.flagImageInputElement.textContent = `🖼️ ${flag.imageDisplayName ?? flag.imageUUID}`;
            this.updateFlagImagePreview(flag.imageUUID);
        } else if (flag.imageDisplayName) {
            this.flagImageInputElement.textContent = `⚠️ Missing File: ${flag.imageDisplayName}`;
            this.flagPreviewElement.innerHTML = '<span>Image preview will appear here</span>';
        } else {
            this.flagImageInputElement.textContent = '📁 Choose File';
            this.flagPreviewElement.innerHTML = '<span>Image preview will appear here</span>';
        }

        // Audio
        this.currentAudioUUID = flag.audioUUID ?? null;
        this.currentAudioDisplayName = flag.audioDisplayName ?? null;
        if (flag.audioUUID && await this.checkFileExists(flag.audioUUID, 'audio')) {
            this.flagAudioInputElement.textContent = `🔊 ${flag.audioDisplayName ?? flag.audioUUID}`;
            this.updateAudioPreviewButtonState(false);
        } else if (flag.audioDisplayName) {
            this.flagAudioInputElement.textContent = `⚠️ Missing File: ${flag.audioDisplayName}`;
            this.updateAudioPreviewButtonState(false);
        } else {
            this.flagAudioInputElement.textContent = '📁 Choose File';
            this.updateAudioPreviewButtonState(false);
        }

        // Audio repeat
        this.currentAudioRepeat = flag.audioRepeat ?? false;
        this.audioRepeatToggleElement.classList.toggle('active', this.currentAudioRepeat);
        this.audioRepeatToggleElement.textContent = this.currentAudioRepeat ? '🔁 Repeat On' : '🔁 Repeat Off';

        // Recursively populate condition groups if not default flag.
        if (!this.isDefaultFlag) {
            // Check if it is a default flag
            if (!flag.primaryConditionalGroup) {
                console.warn("Flag has no primary conditional group to populate.");
                return;
            }

            this.populateConditionGroupElement(
                this.flagConditionsContainerElement,
                flag.primaryConditionalGroup!,
                true // is main conditional group
            );

            // Display the flag conditions container and section title
            this.flagConditionsContainerElement.style.display = 'block';
            this.flagConditionsContainerTitleElement.style.display = 'block';
        }
        else
        {
            // Hide the flag conditions container since default flags don't have conditions
            this.flagConditionsContainerElement.style.display = 'none';
            // Hide the section title
            this.flagConditionsContainerTitleElement.style.display = 'none';
        }

        // Set current flag being edited
        this.currentFlag = flag;

        // Snapshot the original flag for change detection
        this.originalFlagSnapshot = JSON.stringify(flag);

        // Set initial button state (disabled until something changes)
        this.validateAndUpdateConfirmButton();

        // Async: check if stored files still exist and update labels if missing
        this.refreshFileDisplays();
    }

    /**
     * Populates a conditional group element based on the provided JSON representation.
     */
    private populateConditionGroupElement(containerElement: HTMLDivElement, groupJSON: ConditionalGroup, isMainConditionalGroup: boolean = false): void {
        // Create condition group element
        console.log('Populating :', containerElement);
        const containerBody = containerElement.querySelector('.condition-body') as HTMLDivElement;
        const conditionGroupElement = this.addConditionalGroup(containerBody, isMainConditionalGroup);

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
                } else if (conditionType === 'statusKey') {
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
        const categorySelect  = conditionRowElement.querySelector('#telemetry-category') as HTMLSelectElement;
        const typeSelect      = conditionRowElement.querySelector('#telemetry-type')      as HTMLSelectElement;
        const unitSelect      = conditionRowElement.querySelector('#telemetry-unit')      as HTMLSelectElement;
        const operatorElement = conditionRowElement.querySelector('.condition-operator')  as HTMLSelectElement;
        const colorIndicator  = conditionRowElement.querySelector('.color-indicator')     as HTMLDivElement;

        // Parse saved key: "category.type.unit"
        const telemetryCondition = conditionGroupJSON.condition as TelemetryCondition;
        const [keyCategory, keyType, keyUnit] = telemetryCondition.telemetryKey.split('.');

        // Cascade-populate: set category → dispatch change (fills type options)
        categorySelect.value = keyCategory;
        categorySelect.dispatchEvent(new Event('change'));

        // Set type → dispatch change (fills unit options + handles boolean UI)
        typeSelect.value = keyType;
        typeSelect.dispatchEvent(new Event('change'));

        // Set unit only if not a scalar
        if (keyUnit && keyUnit !== 'single') {
            unitSelect.value = keyUnit;
        }

        // Set operator
        operatorElement.value = telemetryCondition.operator;

        // Set value (read after potential boolean select swap)
        const valueElement = conditionRowElement.querySelector('.condition-value-input') as HTMLInputElement | HTMLSelectElement;
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
        // Create the condition row element (already has cascade listeners attached)
        const conditionRowElement = this.addStatusCondition(
            conditionGroupElement.querySelector('.condition-body') as HTMLDivElement
        );

        // Get Input Elements — [0]=collection, [1]=status, [2]=flag
        const allConditionSelects = conditionRowElement.querySelectorAll('.condition-select');
        const collectionSelectElement = allConditionSelects[0] as HTMLSelectElement;
        const statusSelectElement     = allConditionSelects[1] as HTMLSelectElement;
        const operatorElement         = conditionRowElement.querySelector('.condition-operator') as HTMLSelectElement;
        const flagSelectElement       = allConditionSelects[2] as HTMLSelectElement;
        const colorIndicator          = conditionRowElement.querySelector('.color-indicator') as HTMLDivElement;

        const statusCondition = conditionGroupJSON.condition as StatusCondition;

        // Parse saved key: "collectionUUID.statusUUID"
        const [collectionUUID, statusUUID] = statusCondition.statusKey.split('.');

        // Set collection and fire change to cascade-populate the status options
        collectionSelectElement.value = collectionUUID;
        collectionSelectElement.dispatchEvent(new Event('change'));

        // Set status and fire change to cascade-populate the flag options
        statusSelectElement.value = statusUUID;
        statusSelectElement.dispatchEvent(new Event('change'));

        // Set flag
        flagSelectElement.value = statusCondition.flagUUID;

        // Set operator
        operatorElement.value = statusCondition.shouldBeActive ? 'is' : 'isnot';

        // Set color indicator (if any)
        if (conditionGroupJSON.editorColor) {
            colorIndicator.style.backgroundColor = conditionGroupJSON.editorColor;
            this.updateConditionalGroupStyle(conditionRowElement);
        }
    }
    // #endregion

    // #region Tracking Changes And Confirming Changes
    /**
     * Enables or disables the confirm button with a visual dull state.
     */
    private setConfirmButtonEnabled(enabled: boolean): void {
        this.confirmFlagBtnElement.disabled = !enabled;
        this.confirmFlagBtnElement.style.opacity = enabled ? '' : '0.4';
        this.confirmFlagBtnElement.style.cursor  = enabled ? '' : 'not-allowed';
    }

    /**
     * Checks whether the confirm button should be enabled and updates it.
     * Disabled when: any condition row has unfilled selects, or nothing has changed.
     */
    private validateAndUpdateConfirmButton(): void {
        // Check for incomplete condition rows
        const conditionRows = Array.from(
            this.flagConditionsContainerElement.querySelectorAll('.condition-row')
        ) as HTMLDivElement[];

        for (const row of conditionRows) {
            const conditionType = row.getAttribute('condition-type');
            if (conditionType === 'telemetry') {
                const cat  = (row.querySelector('#telemetry-category') as HTMLSelectElement).value;
                const type = (row.querySelector('#telemetry-type')     as HTMLSelectElement).value;
                if (!cat || !type) { this.setConfirmButtonEnabled(false); return; }
            } else if (conditionType === 'status') {
                const selects = Array.from(row.querySelectorAll('.condition-select')) as HTMLSelectElement[];
                if (selects.some(s => !s.value)) { this.setConfirmButtonEnabled(false); return; }
            }
        }

        // Check if anything has actually changed
        if (this.originalFlagSnapshot !== null) {
            const current = JSON.stringify(this.translateHTMLInputToFlagJSON());
            if (current === this.originalFlagSnapshot) { this.setConfirmButtonEnabled(false); return; }
        }

        this.setConfirmButtonEnabled(true);
    }

    /**
     * Called when saving flag being created/edited
     */
    private async confirmChangesToFlag(): Promise<void> {
        // Translate HTML inputs to Flag JSON
        const flagJSON = this.translateHTMLInputToFlagJSON();
        
        // Save the flag JSON to local changes
        CollectionEditor.INSTANCE.addFlagContentChanges(flagJSON);

        // Update the flag display in the editor
        if (this.isNewFlag === false)
            await CollectionEditorUI.INSTANCE.updateFlagDisplay(flagJSON.UUID);
        else
        {
            // New Flag created, so create its display
            CollectionEditorUI.INSTANCE.createFlagDisplay(
                this.currentFlagCollectionUUID as string,
                this.currentFlagStatusUUID as string,
                flagJSON.UUID,
            );
            // Update the status and collections to hold the new flag
            const visualData = CollectionEditorUI.INSTANCE.translateDOMToVisualData();
            CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);
        }
            
        // Reset the prompt to be safe
        this.resetPrompt();

        // Close the prompt
        this.closeFlagCreationPrompt();
    }

    /**
     * Update the save button state to either display "Create Flag" or "Save Changes"
     * Also show/hide the delete button based on whether it's a new flag
     */
    private updateSaveButtonState(): void {
        if (this.isNewFlag === false) {
            // Editing existing flag
            this.confirmFlagBtnElement.textContent = 'Confirm Changes';

            // Hide the delete button if it's a default flag
            if (this.isDefaultFlag)
                this.flagDeleteBtnElement.style.display = 'none';
            else
                this.flagDeleteBtnElement.style.display = 'inline-block';
        } else {
            // Creating new flag
            this.confirmFlagBtnElement.textContent = 'Create Flag';
            this.flagDeleteBtnElement.style.display = 'none';
        }
    }

    /**
     * Handle confirmation dialog response
     */
    private handleConfirmationResponse(confirmed: boolean): void {
        this.confirmationDialogElement.classList.remove('active');
        if (this.confirmationCallback) {
            this.confirmationCallback(confirmed);
            this.confirmationCallback = null;
        }
    }

    /**
     * Delete the current flag from local changes
     */
    private deleteFlag(): void {
        if (!this.currentFlag || !this.currentFlagCollectionUUID || !this.currentFlagStatusUUID) {
            console.error('Cannot delete flag: missing current flag data');
            return;
        }

        if (this.isDefaultFlag || this.isNewFlag)
        {
            console.error("Cannot delete default flags or flags that haven't been created yet.");
            return;
        }

        // Show confirmation dialog
        new ConfirmationPrompt(
            'Delete Flag',
            `Are you sure you want to delete the flag "${this.currentFlag.name}"?\n\nThis action cannot be undone.`,
            "Delete",
            "Cancel",
            () => {
                // Get the flag UUID
                const flagUUID = this.currentFlag!.UUID;

                // Remove flag from DOM
                CollectionEditorUI.INSTANCE.removeFlagFromDOM(flagUUID);

                // Update the data model
                const visualData = CollectionEditorUI.INSTANCE.translateDOMToVisualData();
                CollectionEditor.INSTANCE.modifyStatusCollectionChange(visualData.visualCollections, visualData.visualStatuses);

                // Close the modal
                this.closeFlagCreationPrompt();
            }
        );
    }
    // #endregion

    // #region Drag and Drop
    /**
     * Initialize drag and drop functionality for condition rows and groups.
     */
    private initializeDragAndDrop(): void {
        this.flagConditionsContainerElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    /**
     * Handles mouse down events to initiate dragging.
     */
    private handleMouseDown(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        
        // Only allow dragging from the drag handle
        const dragHandle = target.closest('.drag-handle') as HTMLElement;
        if (!dragHandle) {
            return;
        }
        
        // Check if clicking on a condition row
        const conditionRow = dragHandle.closest('.condition-row') as HTMLElement;
        if (conditionRow) {
            this.startDragging(conditionRow, 'condition-row', e);
            return;
        }
        
        // Check if clicking on a condition group header (not its children)
        const conditionHeader = dragHandle.closest('.condition-header') as HTMLElement;
        if (conditionHeader) {
            const conditionGroup = conditionHeader.closest('.condition-group') as HTMLElement;
            if (conditionGroup) {
                // Don't allow dragging the main conditional group
                const mainGroup = this.flagConditionsContainerElement.querySelector('.condition-group');
                if (conditionGroup === mainGroup) {
                    return;
                }
                this.startDragging(conditionGroup, 'condition-group', e);
                return;
            }
        }
    }

    /**
     * Starts the dragging process for a given element.
     */
    private startDragging(element: HTMLElement, type: 'condition-row' | 'condition-group', e: MouseEvent): void {
        this.draggedElement = element;
        this.dragType = type;
        this.draggedElementPreviousParent = element.parentElement;
        this.draggedElementPreviousIndex = Array.from(element.parentElement!.children).indexOf(element);
        
        // Find and store the main conditional group (topmost condition-group)
        this.mainConditionalGroup = this.flagConditionsContainerElement.querySelector('.condition-group') as HTMLElement;
        
        // Add dragging class for visual feedback
        element.classList.add('dragging');
        
        e.preventDefault();
    }

    /**
     * Handles mouse move events to update dragging position.
     */
    private handleMouseMove(e: MouseEvent): void {
        if (!this.draggedElement || !this.dragType || !this.mainConditionalGroup) return;

        const target = e.target as HTMLElement;
        
        // Find the closest condition-body (parent container)
        const conditionBody = target.closest('.condition-body') as HTMLElement;
        if (!conditionBody) return;
        
        // Only allow dragging within the main conditional group
        // Check if the conditionBody is a descendant of the main conditional group
        if (!this.mainConditionalGroup.contains(conditionBody)) return;
        
        this.handleDragging(conditionBody, target, e);
    }

    /**
     * Ensures the button-row is always the last child of a condition body.
     */
    private enforceButtonRowLast(conditionBody: HTMLElement): void {
        const buttonRow = Array.from(conditionBody.children).find(
            child => child.classList.contains('button-row')
        ) as HTMLElement | undefined;
        if (buttonRow) conditionBody.appendChild(buttonRow);
    }

    /**
     * Handles dragging for both condition rows and groups.
     */
    private handleDragging(conditionBody: HTMLElement, target: HTMLElement, e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Find if we're hovering over a condition row
        const hoveredRow = target.closest('.condition-row') as HTMLElement;
        
        // Find if we're hovering over a condition group (but not nested ones)
        let hoveredGroup = target.closest('.condition-group') as HTMLElement;
        
        // Determine which element we're actually hovering over that's a direct child of conditionBody
        let hoveredElement: HTMLElement | null = null;
        
        if (hoveredRow && hoveredRow !== this.draggedElement && hoveredRow.parentElement === conditionBody) {
            hoveredElement = hoveredRow;
        } else if (hoveredGroup && hoveredGroup !== this.draggedElement && hoveredGroup.parentElement === conditionBody) {
            hoveredElement = hoveredGroup;
        }
        
        if (hoveredElement) {
            // Insert before or after based on vertical position
            const rect = hoveredElement.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                conditionBody.insertBefore(this.draggedElement, hoveredElement);
            } else {
                conditionBody.insertBefore(this.draggedElement, hoveredElement.nextSibling);
            }
            // Re-enforce button-row is last (nextSibling may have been null, causing an implicit append after it)
            this.enforceButtonRowLast(conditionBody);
        } else {
            // If not hovering over any specific element, check if we should append to the body
            // This handles dragging into empty containers or to the end of a container
            const childrenInBody = Array.from(conditionBody.children).filter(child => 
                (child.classList.contains('condition-row') || child.classList.contains('condition-group')) &&
                child !== this.draggedElement
            );
            
            // Find the button-row to insert before it
            const buttonRow = Array.from(conditionBody.children).find(
                child => child.classList.contains('button-row')
            ) as HTMLElement | undefined;
            
            // If dragged element is not already in this body, or if we're in an empty area
            if (this.draggedElement.parentElement !== conditionBody) {
                if (buttonRow) {
                    conditionBody.insertBefore(this.draggedElement, buttonRow);
                } else {
                    conditionBody.appendChild(this.draggedElement);
                }
                // Ensure button-row remains last after inserting into a new container
                this.enforceButtonRowLast(conditionBody);
            }
        }
    }

    /**
     * Handles mouse up events to finalize dragging.
     */
    private handleMouseUp(e: MouseEvent): void {
        if (!this.draggedElement) return;
        
        // Remove dragging class
        this.draggedElement.classList.remove('dragging');

        // Final enforcement: ensure button-row is last in every condition body
        const allConditionBodies = this.flagConditionsContainerElement.querySelectorAll('.condition-body') as NodeListOf<HTMLElement>;
        allConditionBodies.forEach(body => this.enforceButtonRowLast(body));

        // Reset drag state
        this.draggedElement = null;
        this.dragType = null;
        this.draggedElementPreviousParent = null;
        this.draggedElementPreviousIndex = -1;
        this.mainConditionalGroup = null;
    }
    // #endregion

    private async getTelemetryOptionsDictionary(): Promise<{ [category: string]: { [type: string]: any } }> {
        // Fetch the telemetry options dictionary from the server.
        const response = await fetch('/telemetry/get_types', { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to fetch telemetry types: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        // Guard against the server double-encoding (returning a JSON string instead of an object)
        return (typeof result === 'string' ? JSON.parse(result) : result) as { [category: string]: { [type: string]: any } };
    }
}

new FlagEditorUI();