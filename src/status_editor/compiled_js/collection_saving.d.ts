import { StatusCollection, Flag, SimpleStatus, SimpleStatusCollection } from '../../shared/compiled_js/types.js';
export declare class CollectionEditor {
    private static instance;
    static get INSTANCE(): CollectionEditor;
    private changesMade;
    private previousStatusCollections;
    private visualStatusCollections;
    private visualStatuses;
    private flags;
    private newlyLoadedCollectionUUIDs;
    constructor();
    /**
     * Load a collection into the editor from JSON.
     */
    private loadCollectionFromJSON;
    /**
     * Unloads a collection from the editor (removes from data model only — does not touch the server file).
     * The collection can be re-loaded via Load at any time.
     */
    unloadCollection(uuid: string): void;
    /**
     * Add or edits a flag in local save.
     */
    addFlagContentChanges(flag: Flag): void;
    /**
     * Adds or edits a status collections in local save.
     */
    modifyStatusCollectionChange(visualCollections: SimpleStatusCollection[], visualStatuses: SimpleStatus[]): void;
    /**
     * Revert all unsaved changes.
     */
    revertLocalChanges(): void;
    /**
     * Save the local changes to server storage.
     * Collections that were unloaded from the editor are simply not saved — their server files are left untouched.
     */
    saveAllChangesToServer(): Promise<void>;
    /**
     * Converts simple collectio to full status collection.
     */
    private convertSimpleToFullCollection;
    /**
     * Saves a single collection to the server.
     */
    private saveCollectionToServer;
    /**
     * Fetches the file contents of a specific status collection from the server.
     */
    fetchStatusCollectionFromServer(collectionUUID: string): Promise<StatusCollection>;
    /**
     * Fetch a flag from local changes by its UUID.
     */
    fetchFlagFromLocalChanges(flagUUID: string): Flag | null;
    /**
     * Parses the contents of a status collection file.
     */
    private parseStatusCollectionData;
    /**
     * Verifies the structure of the status collection data.
     */
    private verifyData;
    /**
     * Saves the currently open collection UUIDs to session.json on the server.
     */
    private saveSessionToServer;
    /**
     * Loads the session from the server and restores any previously open collections.
     * Collections that can no longer be found on the server are silently skipped.
     */
    restoreFromSession(): Promise<void>;
    /**
     * Load a collection from the server by UUID and add it to the editor.
     * Returns false if it is already loaded.
     */
    loadCollectionByUUID(collectionUUID: string, setChangesFlag?: boolean, initialRestore?: boolean): Promise<boolean>;
    /**
     * Get a status collection by its UUID.
     */
    getStatusCollectionByUUID(collectionUUID: string): SimpleStatusCollection | null;
    /**
     * Get a status by its UUID within a specific collection.
     */
    getStatusByUUID(statusUUID: string): SimpleStatus | null;
    /**
     * Get a flag by its UUID within a specific status and collection.
     */
    getFlagByUUID(flagUUID: string): Flag | null;
    /**
     * Get all loaded status collections.
     */
    getAllCollections(): SimpleStatusCollection[];
    /**
     * Get all loaded statuses.
     */
    getAllStatuses(): SimpleStatus[];
    /**
     * Creates and registers a brand-new empty collection, then adds it to the DOM.
     */
    addNewCollection(name: string, description: string): void;
    /**
     * Creates and registers a new status inside an existing collection, then adds it to the DOM.
     */
    addNewStatus(collectionUUID: string, name: string, description?: string): void;
    generateNewFlag(isDefaultFlag: boolean): Flag;
}
