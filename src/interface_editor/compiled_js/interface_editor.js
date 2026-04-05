/**
 * InterfaceEditor - Main Controller
 * Manages overall editor state, file operations, and coordination between components
 */
import { EditorScreen } from './editor_screen.js';
import { EditorCanvas } from './editor_canvas.js';
import { PropertiesPanel } from './properties_panel.js';
import { ScreenTabBar } from './screen_tab_bar.js';
import { ObjectPalette } from './object_palette.js';
export class InterfaceEditor {
    constructor() {
        this.collection = null;
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
        this.screenTabBar.on('screenChanged', (uuid) => this.switchToScreen(uuid));
        this.screenTabBar.on('screenAdded', (name) => this.addScreen(name));
        this.screenTabBar.on('screenDeleted', (uuid) => this.deleteScreen(uuid));
        this.screenTabBar.on('screenRenamed', (uuid, newName) => this.renameScreen(uuid, newName));
        this.screenTabBar.on('screenDuplicated', (uuid) => this.duplicateScreen(uuid));
    }
    createEmptyCollection() {
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
    loadCollectionIntoEditor() {
        var _a;
        if (!this.collection)
            return;
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
            alert('Cannot delete the last screen');
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
        if (!this.isDirty || !this.collection)
            return;
        // Validate collection
        const errors = this.validateCollection();
        if (errors.length > 0) {
            alert(`Cannot save: ${errors.length} validation errors found.\n\n${errors.map(e => e.message).join('\n')}`);
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
        }
        catch (error) {
            console.error('Save error:', error);
            alert('Failed to save collection');
        }
    }
    async handleLoad() {
        if (this.isDirty) {
            const save = confirm('You have unsaved changes. Save before loading?');
            if (save) {
                await this.handleSave();
            }
        }
        // TODO: Implement file list prompt (similar to status editor)
        console.log('Load not yet implemented - need file list prompt');
    }
    handleRevert() {
        if (!confirm('Revert all changes? Unsaved work will be lost.')) {
            return;
        }
        // Reload from last saved state
        this.loadCollectionIntoEditor();
    }
    validateCollection() {
        const errors = [];
        if (!this.collection)
            return errors;
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