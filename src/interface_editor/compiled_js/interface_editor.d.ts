/**
 * InterfaceEditor - Main Controller
 * Manages overall editor state, file operations, and coordination between components
 */
import type { ScreenCollection } from './types.js';
import { EditorScreen } from './editor_screen.js';
export declare class InterfaceEditor {
    static INSTANCE: InterfaceEditor | null;
    private collection;
    private screens;
    private activeScreenUuid;
    private isDirty;
    private currentFilePath;
    private canvas;
    private propertiesPanel;
    private screenTabBar;
    private objectPalette;
    private saveBtn;
    private revertBtn;
    private loadBtn;
    constructor();
    private initializeEventListeners;
    private createEmptyCollection;
    private loadCollectionIntoEditor;
    switchToScreen(uuid: string): void;
    addScreen(name: string): void;
    deleteScreen(uuid: string): void;
    renameScreen(uuid: string, newName: string): void;
    duplicateScreen(uuid: string): void;
    private handleSave;
    private handleLoad;
    private handleRevert;
    private validateCollection;
    markDirty(): void;
    markClean(): void;
    private updateButtonStates;
    generateUUID(): string;
    getCurrentScreen(): EditorScreen | null;
    getCollection(): ScreenCollection | null;
}
