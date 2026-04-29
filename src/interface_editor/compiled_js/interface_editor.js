/**
 * InterfaceEditor - Main Controller
 * Manages overall editor state, file operations, and coordination between components
 */
import { EditorScreen } from './editor_screen.js';
import { EditorCanvas } from './editor_canvas.js';
import { PropertiesPanel } from './properties_panel.js';
import { ScreenTabBar } from './screen_tab_bar.js';
import { ObjectPalette } from './object_palette.js';
import { NotificationPanel } from './notification_panel.js';
import { InterfaceCollectionFileListViewerPrompt, ConfirmationPrompt, SingleTextInputPrompt } from '../../shared/compiled_js/prompts.js';
export class InterfaceEditor {
    constructor() {
        this.collection = null;
        this.originalCollection = null;
        this.screens = new Map();
        this.activeScreenUuid = null;
        this.isDirty = false;
        this.currentFilePath = null;
        if (InterfaceEditor.INSTANCE) {
            throw new Error('InterfaceEditor is a singleton');
        }
        InterfaceEditor.INSTANCE = this;
        // Initialize UI components
        this.canvas = new EditorCanvas(document.getElementById('editor-canvas'));
        this.propertiesPanel = new PropertiesPanel(document.getElementById('properties-content'));
        this.screenTabBar = new ScreenTabBar(document.getElementById('screen-tabs-container'));
        this.objectPalette = new ObjectPalette(this.canvas);
        this.notificationPanel = new NotificationPanel(document.getElementById('notifications-content'), () => this.markDirty());
        // Get button references
        this.saveBtn = document.getElementById('main-save-btn');
        this.revertBtn = document.getElementById('main-revert-btn');
        this.loadBtn = document.getElementById('main-load-btn');
        this.initializeEventListeners();
        this.createEmptyCollection();
    }
    initializeEventListeners() {
        // Save/Load/Revert buttons
        this.saveBtn.addEventListener('click', () => this.handleSave());
        this.revertBtn.addEventListener('click', () => this.handleRevert());
        this.loadBtn.addEventListener('click', () => this.handleLoad());
        // Listen for changes from components
        this.canvas.on('objectChanged', () => this.markDirty());
        this.canvas.on('selectionChanged', (obj) => {
            this.propertiesPanel.setSelectedObject(obj, this.canvas);
        });
        this.canvas.on('positionChanged', (obj) => {
            this.propertiesPanel.updateLivePosition(obj);
        });
        this.screenTabBar.on('screenChanged', (uuid) => this.switchToScreen(uuid));
        this.screenTabBar.on('screenAdded', (name) => this.addScreen(name));
        this.screenTabBar.on('screenDeleted', (uuid) => this.deleteScreen(uuid));
        this.screenTabBar.on('screenRenamed', (uuid, newName) => this.renameScreen(uuid, newName));
        this.screenTabBar.on('screenDuplicated', (uuid) => this.duplicateScreen(uuid));
    }
    createEmptyCollection() {
        this.collection = {
            UUID: this.generateUUID(),
            version: '1.0',
            name: 'Untitled Collection',
            screens: [{
                    uuid: this.generateUUID(),
                    name: 'Screen 1',
                    objects: []
                }],
            notifications: [],
            metadata: {
                lastModified: new Date().toISOString(),
                activeScreen: null
            }
        };
        this.originalCollection = JSON.parse(JSON.stringify(this.collection));
        this.loadCollectionIntoEditor();
        this.markDirty();
    }
    loadCollectionIntoEditor() {
        var _a;
        if (!this.collection)
            return;
        if (!this.collection.notifications)
            this.collection.notifications = [];
        // Clear existing screens
        this.screens.clear();
        // Create EditorScreen instances
        this.collection.screens.forEach(screenData => {
            const screen = new EditorScreen(screenData);
            this.screens.set(screenData.uuid, screen);
        });
        // Update tab bar
        this.screenTabBar.setScreens(this.collection.screens);
        // Load notification panel
        this.notificationPanel.loadCollection(this.collection);
        // Activate first screen or saved active screen
        const firstScreenUuid = this.collection.metadata.activeScreen || ((_a = this.collection.screens[0]) === null || _a === void 0 ? void 0 : _a.uuid);
        if (firstScreenUuid) {
            this.switchToScreen(firstScreenUuid);
        }
        this.markClean();
    }
    switchToScreen(uuid) {
        const screen = this.screens.get(uuid);
        if (!screen)
            return;
        this.activeScreenUuid = uuid;
        this.screenTabBar.setActiveScreen(uuid);
        this.canvas.loadScreen(screen);
        this.propertiesPanel.clearSelection();
    }
    addScreen(name) {
        if (!this.collection)
            return;
        const newScreen = {
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
    deleteScreen(uuid) {
        if (!this.collection)
            return;
        if (this.collection.screens.length <= 1) {
            new ConfirmationPrompt('Cannot Delete', 'Cannot delete the last screen.', 'OK', null, () => { });
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
    renameScreen(uuid, newName) {
        if (!this.collection)
            return;
        const screen = this.collection.screens.find(s => s.uuid === uuid);
        if (screen) {
            screen.name = newName;
            this.screenTabBar.setScreens(this.collection.screens);
            this.markDirty();
        }
    }
    duplicateScreen(uuid) {
        if (!this.collection)
            return;
        const screen = this.collection.screens.find(s => s.uuid === uuid);
        if (!screen)
            return;
        // Deep clone the screen with new UUIDs
        const newScreen = {
            uuid: this.generateUUID(),
            name: `${screen.name} (Copy)`,
            objects: screen.objects.map(obj => (Object.assign(Object.assign({}, obj), { uuid: this.generateUUID() })))
        };
        this.collection.screens.push(newScreen);
        const editorScreen = new EditorScreen(newScreen);
        this.screens.set(newScreen.uuid, editorScreen);
        this.screenTabBar.setScreens(this.collection.screens);
        this.switchToScreen(newScreen.uuid);
        this.markDirty();
    }
    async handleSave() {
        if (!this.collection)
            return;
        // First save — prompt for a name
        if (this.currentFilePath === null) {
            new SingleTextInputPrompt('Save Collection', 'Enter a name for this interface collection:', this.collection.name, 'Save', 'Cancel', async (inputName) => {
                const trimmed = inputName.trim();
                if (!trimmed)
                    return;
                this.collection.name = trimmed;
                this.currentFilePath = this.collection.UUID;
                await this.performSave();
            });
            return;
        }
        await this.performSave();
    }
    async performSave() {
        if (!this.collection)
            return;
        // Validate collection
        const errors = this.validateCollection();
        if (errors.length > 0) {
            const errorList = errors.map(e => `• ${e.message}`).join('<br>');
            new ConfirmationPrompt('Validation Errors', `Cannot save: ${errors.length} error(s) found.<br><br>${errorList}`, 'OK', null, () => { });
            return;
        }
        try {
            this.collection.metadata.lastModified = new Date().toISOString();
            this.collection.metadata.activeScreen = this.activeScreenUuid;
            const response = await fetch('/interface_collection/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.collection)
            });
            if (!response.ok)
                throw new Error('Save failed');
            this.originalCollection = JSON.parse(JSON.stringify(this.collection));
            this.markClean();
            console.log('Collection saved successfully');
        }
        catch (error) {
            console.error('Save error:', error);
            new ConfirmationPrompt('Save Failed', 'Failed to save collection.', 'OK', '', () => { });
        }
    }
    handleLoad() {
        if (this.isDirty) {
            new ConfirmationPrompt('Unsaved Changes', 'You have unsaved changes. Save before loading?', 'Save', 'Discard', () => { this.handleSave().then(() => this.openLoadDialog()); }, () => { this.openLoadDialog(); });
        }
        else {
            this.openLoadDialog();
        }
    }
    openLoadDialog() {
        new InterfaceCollectionFileListViewerPrompt(async (fileMetadata) => {
            try {
                const response = await fetch(`/interface_collection/fetch?uuid=${fileMetadata.UUID}`);
                if (!response.ok) {
                    throw new Error('Failed to load collection');
                }
                const data = await response.json();
                this.collection = data;
                // Store a deep copy of the original collection for revert functionality
                this.originalCollection = JSON.parse(JSON.stringify(data));
                this.currentFilePath = fileMetadata.UUID;
                this.loadCollectionIntoEditor();
                this.markClean();
                console.log('Collection loaded successfully');
            }
            catch (error) {
                console.error('Load error:', error);
                new ConfirmationPrompt('Load Failed', 'Failed to load collection.', 'OK', '', () => { });
            }
        }, () => { });
    }
    handleRevert() {
        new ConfirmationPrompt('Revert Changes', 'Revert all changes? Unsaved work will be lost.', 'Revert', 'Cancel', () => {
            if (!this.originalCollection) {
                console.error('No original collection to revert to');
                return;
            }
            // Restore from the stored original collection
            this.collection = JSON.parse(JSON.stringify(this.originalCollection));
            this.loadCollectionIntoEditor();
            this.markClean();
            console.log('Collection reverted successfully');
        });
    }
    validateCollection() {
        const errors = [];
        if (!this.collection)
            return errors;
        // Validate each screen
        this.collection.screens.forEach(screen => {
            screen.objects.forEach(obj => {
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
    markDirty() {
        this.isDirty = true;
        this.updateButtonStates();
    }
    markClean() {
        this.isDirty = false;
        this.updateButtonStates();
    }
    updateButtonStates() {
        if (this.isDirty) {
            this.saveBtn.classList.remove('deactivated');
            this.revertBtn.classList.remove('deactivated');
        }
        else {
            this.saveBtn.classList.add('deactivated');
            this.revertBtn.classList.add('deactivated');
        }
    }
    generateUUID() {
        return crypto.randomUUID();
    }
    getCurrentScreen() {
        if (!this.activeScreenUuid)
            return null;
        return this.screens.get(this.activeScreenUuid) || null;
    }
    getCollection() {
        return this.collection;
    }
}
InterfaceEditor.INSTANCE = null;
// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
    new InterfaceEditor();
});
//# sourceMappingURL=interface_editor.js.map