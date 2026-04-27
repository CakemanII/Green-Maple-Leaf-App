/**
 * InterfaceEditor - Main Controller
 * Manages overall editor state, file operations, and coordination between components
 */

import type { ScreenCollection, Screen, InterfaceObject, ValidationError } from './types.js';
import { EditorScreen } from './editor_screen.js';
import { EditorCanvas } from './editor_canvas.js';
import { PropertiesPanel } from './properties_panel.js';
import { ScreenTabBar } from './screen_tab_bar.js';
import { ObjectPalette } from './object_palette.js';
import { InterfaceCollectionFileListViewerPrompt, ConfirmationPrompt } from '../../shared/compiled_js/prompts.js';
import type { FileMetadata } from '../../shared/compiled_js/types.js';

export class InterfaceEditor {
    public static INSTANCE: InterfaceEditor | null = null;

    private collection: ScreenCollection | null = null;
    private originalCollection: ScreenCollection | null = null;
    private screens: Map<string, EditorScreen> = new Map();
    private activeScreenUuid: string | null = null;
    private isDirty: boolean = false;
    private currentFilePath: string | null = null;

    // UI Components
    private canvas: EditorCanvas;
    private propertiesPanel: PropertiesPanel;
    private screenTabBar: ScreenTabBar;
    private objectPalette: ObjectPalette;

    // UI Elements
    private saveBtn: HTMLButtonElement;
    private revertBtn: HTMLButtonElement;
    private loadBtn: HTMLButtonElement;

    constructor() {
        if (InterfaceEditor.INSTANCE) {
            throw new Error('InterfaceEditor is a singleton');
        }
        InterfaceEditor.INSTANCE = this;

        // Initialize UI components
        this.canvas = new EditorCanvas(document.getElementById('editor-canvas') as HTMLDivElement);
        this.propertiesPanel = new PropertiesPanel(document.getElementById('properties-content') as HTMLDivElement);
        this.screenTabBar = new ScreenTabBar(document.getElementById('screen-tabs-container') as HTMLDivElement);
        this.objectPalette = new ObjectPalette(this.canvas);

        // Get button references
        this.saveBtn = document.getElementById('main-save-btn') as HTMLButtonElement;
        this.revertBtn = document.getElementById('main-revert-btn') as HTMLButtonElement;
        this.loadBtn = document.getElementById('main-load-btn') as HTMLButtonElement;

        this.initializeEventListeners();
        this.createEmptyCollection();
    }

    private initializeEventListeners(): void {
        // Save/Load/Revert buttons
        this.saveBtn.addEventListener('click', () => this.handleSave());
        this.revertBtn.addEventListener('click', () => this.handleRevert());
        this.loadBtn.addEventListener('click', () => this.handleLoad());

        // Listen for changes from components
        this.canvas.on('objectChanged', () => this.markDirty());
        this.canvas.on('selectionChanged', (obj: InterfaceObject | null) => {
            this.propertiesPanel.setSelectedObject(obj, this.canvas);
        });
        this.canvas.on('positionChanged', (obj: InterfaceObject) => {
            this.propertiesPanel.updateLivePosition(obj);
        });

        this.screenTabBar.on('screenChanged', (uuid: string) => this.switchToScreen(uuid));
        this.screenTabBar.on('screenAdded', (name: string) => this.addScreen(name));
        this.screenTabBar.on('screenDeleted', (uuid: string) => this.deleteScreen(uuid));
        this.screenTabBar.on('screenRenamed', (uuid: string, newName: string) => this.renameScreen(uuid, newName));
        this.screenTabBar.on('screenDuplicated', (uuid: string) => this.duplicateScreen(uuid));
    }

    private createEmptyCollection(): void {
        this.collection = {
            version: '1.0',
            collectionName: 'Untitled Collection',
            screens: [{
                uuid: this.generateUUID(),
                name: 'Screen 1',
                objects: []
            }],
            metadata: {
                lastModified: new Date().toISOString(),
                activeScreen: null
            }
        };

        this.loadCollectionIntoEditor();
    }

    private loadCollectionIntoEditor(): void {
        if (!this.collection) return;

        // Clear existing screens
        this.screens.clear();

        // Create EditorScreen instances
        this.collection.screens.forEach(screenData => {
            const screen = new EditorScreen(screenData);
            this.screens.set(screenData.uuid, screen);
        });

        // Update tab bar
        this.screenTabBar.setScreens(this.collection.screens);

        // Activate first screen or saved active screen
        const firstScreenUuid = this.collection.metadata.activeScreen || this.collection.screens[0]?.uuid;
        if (firstScreenUuid) {
            this.switchToScreen(firstScreenUuid);
        }

        this.markClean();
    }

    public switchToScreen(uuid: string): void {
        const screen = this.screens.get(uuid);
        if (!screen) return;

        this.activeScreenUuid = uuid;
        this.screenTabBar.setActiveScreen(uuid);
        this.canvas.loadScreen(screen);
        this.propertiesPanel.clearSelection();
    }

    public addScreen(name: string): void {
        if (!this.collection) return;

        const newScreen: Screen = {
            uuid: this.generateUUID(),
            name: name,
            objects: []
        };

        this.collection.screens.push(newScreen);
        const editorScreen = new EditorScreen(newScreen);
        this.screens.set(newScreen.uuid, editorScreen);

        this.screenTabBar.setScreens(this.collection.screens);
        this.switchToScreen(newScreen.uuid);
        this.markDirty();
    }

    public deleteScreen(uuid: string): void {
        if (!this.collection) return;
        if (this.collection.screens.length <= 1) {
            new ConfirmationPrompt('Cannot Delete', 'Cannot delete the last screen.', 'OK', '', () => {});
            return;
        }

        // Remove from collection
        this.collection.screens = this.collection.screens.filter(s => s.uuid !== uuid);
        this.screens.delete(uuid);

        // Switch to another screen if deleting active
        if (this.activeScreenUuid === uuid) {
            const nextScreen = this.collection.screens[0];
            if (nextScreen) {
                this.switchToScreen(nextScreen.uuid);
            }
        }

        this.screenTabBar.setScreens(this.collection.screens);
        this.markDirty();
    }

    public renameScreen(uuid: string, newName: string): void {
        if (!this.collection) return;

        const screen = this.collection.screens.find(s => s.uuid === uuid);
        if (screen) {
            screen.name = newName;
            this.screenTabBar.setScreens(this.collection.screens);
            this.markDirty();
        }
    }

    public duplicateScreen(uuid: string): void {
        if (!this.collection) return;

        const screen = this.collection.screens.find(s => s.uuid === uuid);
        if (!screen) return;

        // Deep clone the screen with new UUIDs
        const newScreen: Screen = {
            uuid: this.generateUUID(),
            name: `${screen.name} (Copy)`,
            objects: screen.objects.map(obj => ({
                ...obj,
                uuid: this.generateUUID()
            }))
        };

        this.collection.screens.push(newScreen);
        const editorScreen = new EditorScreen(newScreen);
        this.screens.set(newScreen.uuid, editorScreen);

        this.screenTabBar.setScreens(this.collection.screens);
        this.switchToScreen(newScreen.uuid);
        this.markDirty();
    }

    private async handleSave(): Promise<void> {
        if (!this.isDirty || !this.collection) return;

        // Validate collection
        const errors = this.validateCollection();
        if (errors.length > 0) {
            const errorList = errors.map(e => `• ${e.message}`).join('<br>');
            new ConfirmationPrompt('Validation Errors', `Cannot save: ${errors.length} error(s) found.<br><br>${errorList}`, 'OK', '', () => {});
            return;
        }

        try {
            // Update metadata
            this.collection.metadata.lastModified = new Date().toISOString();
            this.collection.metadata.activeScreen = this.activeScreenUuid;

            // Save to server
            const response = await fetch('/interface_collection/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.collection)
            });

            if (!response.ok) {
                throw new Error('Save failed');
            }

            this.markClean();
            console.log('Collection saved successfully');
        } catch (error) {
            console.error('Save error:', error);
            new ConfirmationPrompt('Save Failed', 'Failed to save collection.', 'OK', '', () => {});
        }
    }

    private handleLoad(): void {
        if (this.isDirty) {
            new ConfirmationPrompt(
                'Unsaved Changes',
                'You have unsaved changes. Save before loading?',
                'Save', 'Discard',
                () => { this.handleSave().then(() => this.openLoadDialog()); },
                () => { this.openLoadDialog(); }
            );
        } else {
            this.openLoadDialog();
        }
    }

    private openLoadDialog(): void {
        new InterfaceCollectionFileListViewerPrompt(
            async (fileMetadata: FileMetadata) => {
                try {
                    const response = await fetch(`/interface_collection/fetch?uuid=${fileMetadata.UUID}`);
                    if (!response.ok) {
                        throw new Error('Failed to load collection');
                    }

                    const data = await response.json();
                    this.collection = data as ScreenCollection;
                    // Store a deep copy of the original collection for revert functionality
                    this.originalCollection = JSON.parse(JSON.stringify(data)) as ScreenCollection;
                    this.currentFilePath = fileMetadata.UUID;
                    this.loadCollectionIntoEditor();
                    this.markClean();
                    console.log('Collection loaded successfully');
                } catch (error) {
                    console.error('Load error:', error);
                    new ConfirmationPrompt('Load Failed', 'Failed to load collection.', 'OK', '', () => {});
                }
            },
            () => {}
        );
    }

    private handleRevert(): void {
        new ConfirmationPrompt(
            'Revert Changes',
            'Revert all changes? Unsaved work will be lost.',
            'Revert', 'Cancel',
            () => {
                if (!this.originalCollection) return;
                
                // Restore from the stored original collection
                this.collection = JSON.parse(JSON.stringify(this.originalCollection)) as ScreenCollection;
                this.loadCollectionIntoEditor();
                this.markClean();
                console.log('Collection reverted successfully');
            }
        );
    }

    private validateCollection(): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!this.collection) return errors;

        // Validate each screen
        this.collection.screens.forEach(screen => {
            screen.objects.forEach(obj => {
                // Check for required fields
                if (obj.type === 'LINE_GRAPH') {
                    if (!obj.monitorDataKeys || obj.monitorDataKeys.length === 0) {
                        errors.push({
                            objectUuid: obj.uuid,
                            field: 'monitorDataKeys',
                            message: `Line Graph "${obj.name || obj.uuid}" must have at least one telemetry label`
                        });
                    }
                }

                // Validate position/size ranges
                if (obj.position.x < 0 || obj.position.x > 100 || obj.position.y < 0 || obj.position.y > 100) {
                    errors.push({
                        objectUuid: obj.uuid,
                        field: 'position',
                        message: `Object "${obj.name || obj.uuid}" has invalid position`
                    });
                }

                if (obj.size.width <= 0 || obj.size.width > 100 || obj.size.height <= 0 || obj.size.height > 100) {
                    errors.push({
                        objectUuid: obj.uuid,
                        field: 'size',
                        message: `Object "${obj.name || obj.uuid}" has invalid size`
                    });
                }
            });
        });

        return errors;
    }

    public markDirty(): void {
        this.isDirty = true;
        this.updateButtonStates();
    }

    public markClean(): void {
        this.isDirty = false;
        this.updateButtonStates();
    }

    private updateButtonStates(): void {
        if (this.isDirty) {
            this.saveBtn.classList.remove('deactivated');
            this.revertBtn.classList.remove('deactivated');
        } else {
            this.saveBtn.classList.add('deactivated');
            this.revertBtn.classList.add('deactivated');
        }
    }

    public generateUUID(): string {
        return crypto.randomUUID();
    }

    public getCurrentScreen(): EditorScreen | null {
        if (!this.activeScreenUuid) return null;
        return this.screens.get(this.activeScreenUuid) || null;
    }

    public getCollection(): ScreenCollection | null {
        return this.collection;
    }
}

// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
    new InterfaceEditor();
});
