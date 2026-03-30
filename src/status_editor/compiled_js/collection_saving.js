import { GeneralUtilities } from '../../shared/compiled_js/utilities.js';
import { CollectionEditorUI } from './collection_editor.js';
import { Session } from '../../shared/compiled_js/main/global_session.js';
export class CollectionEditor {
    static get INSTANCE() { return CollectionEditor.instance; }
    constructor() {
        // Represents the current status collection states.
        this.changesMade = false;
        this.previousStatusCollections = [];
        this.visualStatusCollections = [];
        this.visualStatuses = [];
        this.flags = [];
        this.newlyLoadedCollectionUUIDs = [];
        // Ensure singleton
        if (CollectionEditor.instance)
            throw new Error("Use CollectionEditorServerCommunication.INSTANCE to access the singleton instance.");
        CollectionEditor.instance = this;
    }
    /**
     * Load a collection into the editor from JSON.
     */
    loadCollectionFromJSON(collectionJSON) {
        // Compile and map collection and statuses into the local changes.
        const simpleCollection = {
            UUID: collectionJSON.UUID,
            name: collectionJSON.name.trim(),
            description: collectionJSON.description.trim(),
            statusesUUIDs: collectionJSON.statuses.map(status => status.UUID),
        };
        this.visualStatusCollections.push(simpleCollection);
        // Map flags into local changes.
        for (const status of collectionJSON.statuses) {
            // Map simple status
            const simpleStatus = {
                UUID: status.UUID,
                name: status.name.trim(),
                defaultFlagUUID: status.defaultFlag.UUID,
                flagUUIDs: status.flags.map(flag => flag.UUID),
            };
            this.visualStatuses.push(simpleStatus);
            // Add each flag
            for (const flag of status.flags.concat([status.defaultFlag]))
                this.flags.push(flag);
        }
        // Load into the editor UI
        CollectionEditorUI.INSTANCE.translateJSONCollectionIntoDOM(simpleCollection);
    }
    /**
     * Unloads a collection from the editor (removes from data model only — does not touch the server file).
     * The collection can be re-loaded via Load at any time.
     */
    unloadCollection(uuid) {
        // Find the collection BEFORE removing it so we have the status UUID list
        const collection = this.visualStatusCollections.find(c => c.UUID === uuid);
        if (!collection)
            return;
        const statusUUIDs = collection.statusesUUIDs;
        // Remove all flags that belong to these statuses
        const statusesToRemove = this.visualStatuses.filter(s => statusUUIDs.includes(s.UUID));
        for (const status of statusesToRemove) {
            const allFlagUUIDs = status.flagUUIDs.concat([status.defaultFlagUUID]);
            this.flags = this.flags.filter(f => !allFlagUUIDs.includes(f.UUID));
        }
        // Remove the statuses
        this.visualStatuses = this.visualStatuses.filter(s => !statusUUIDs.includes(s.UUID));
        // Remove the collection
        this.visualStatusCollections = this.visualStatusCollections.filter(c => c.UUID !== uuid);
        // Mark changes made
        this.changesMade = true;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    // #region Adding/Editing Local Changes
    /**
     * Add or edits a flag in local save.
     */
    addFlagContentChanges(flag) {
        // Find the flag by UUID
        const existingIndex = this.flags.findIndex(f => f.UUID === flag.UUID);
        // If not found, add it
        if (existingIndex === -1)
            this.flags.push(flag);
        else
            this.flags[existingIndex] = flag;
        // Mark that changes have been made
        this.changesMade = true;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    /**
     * Adds or edits a status collections in local save.
     */
    modifyStatusCollectionChange(visualCollections, visualStatuses) {
        // Iterate through collections to add or update
        for (const visualCollection of visualCollections) {
            // Find the collection by UUID
            const existingIndex = this.visualStatusCollections.findIndex(c => c.UUID === visualCollection.UUID);
            // If not found, add it
            if (existingIndex === -1)
                this.visualStatusCollections.push(visualCollection);
            else
                this.visualStatusCollections[existingIndex] = visualCollection;
        }
        // Iterate through statuses to add or update
        for (const status of visualStatuses) {
            const statusIndex = this.visualStatuses.findIndex(s => s.UUID === status.UUID);
            if (statusIndex === -1)
                this.visualStatuses.push(status);
            else
                this.visualStatuses[statusIndex] = status;
        }
        // Mark that changes have been made
        this.changesMade = true;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    /**
     * Revert all unsaved changes.
     */
    revertLocalChanges() {
        // Clear current local changes
        this.visualStatusCollections = [];
        this.flags = [];
        this.visualStatuses = [];
        this.newlyLoadedCollectionUUIDs = [];
        // Clear all collections from DOM
        CollectionEditorUI.INSTANCE.removeAllCollectionsFromDOM();
        // Reload previous collections into local changes
        for (const collection of this.previousStatusCollections)
            this.loadCollectionFromJSON(collection);
        // Un-Mark that changes have been made
        this.changesMade = false;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    // #endregion
    // #region Applying Changes to Server
    /**
     * Save the local changes to server storage.
     * Collections that were unloaded from the editor are simply not saved — their server files are left untouched.
     */
    async saveAllChangesToServer() {
        // Create new status collections list with current local data
        const newStatusCollections = [];
        // Add all collections
        for (const simpleCollection of this.visualStatusCollections)
            newStatusCollections.push(this.convertSimpleToFullCollection(simpleCollection));
        // Update previous collections to current state
        this.previousStatusCollections = newStatusCollections;
        // Save each collection to the server
        for (const collection of newStatusCollections)
            await this.saveCollectionToServer(collection);
        // Set open collection UUIDs in session (for restoration on page reload)
        await Session.Instance.updateSession('collection_editor_collection_UUIDs_open', this.visualStatusCollections.map(c => c.UUID));
        // Save session to server (track open collections)
        await this.saveSessionToServer();
        // Un-Mark that changes have been made
        this.changesMade = false;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    /**
     * Converts simple collectio to full status collection.
     */
    convertSimpleToFullCollection(simpleCollection) {
        // Map simple collection to full collection
        const fullCollection = {
            UUID: simpleCollection.UUID,
            name: simpleCollection.name,
            description: simpleCollection.description,
            statuses: [],
        };
        // Map each simple status to full status
        for (const statusUUID of simpleCollection.statusesUUIDs) {
            // Find simple status
            const simpleStatus = this.visualStatuses.find(s => s.UUID === statusUUID);
            if (!simpleStatus)
                continue;
            const fullStatus = {
                UUID: simpleStatus.UUID,
                name: simpleStatus.name,
                defaultFlag: this.flags.find(f => f.UUID === simpleStatus.defaultFlagUUID),
                flags: [],
            };
            // Map flags
            for (const flagUUID of simpleStatus.flagUUIDs) {
                const flag = this.flags.find(f => f.UUID === flagUUID);
                if (flag)
                    fullStatus.flags.push(flag);
            }
            fullCollection.statuses.push(fullStatus);
        }
        // Return the full collection
        return fullCollection;
    }
    /**
     * Saves a single collection to the server.
     */
    saveCollectionToServer(collection) {
        return new Promise((resolve, reject) => {
            // Send the collection to the server
            fetch('/status_collection/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(collection)
            }).then(response => {
                if (response.ok) {
                    resolve();
                }
                else {
                    reject(new Error('Failed to save collection'));
                }
            }).catch(error => {
                reject(error);
            });
        });
    }
    // #endregion
    // #region Fetching Collections from Server
    /**
     * Fetches the file contents of a specific status collection from the server.
     */
    async fetchStatusCollectionFromServer(collectionUUID) {
        // Get the file contents from the server.
        const response = await fetch(`/status_collection/fetch?uuid=${encodeURIComponent(collectionUUID)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch status collection from server');
        }
        const collection = this.parseStatusCollectionData(await response.text());
        return collection;
    }
    /**
     * Fetch a flag from local changes by its UUID.
     */
    fetchFlagFromLocalChanges(flagUUID) {
        const flag = this.flags.find(f => f.UUID === flagUUID);
        return flag || null;
    }
    /**
     * Parses the contents of a status collection file.
     */
    parseStatusCollectionData(fileContents) {
        // Parse the JSON content
        const data = JSON.parse(fileContents);
        // Verify and process region data as needed
        const isValid = this.verifyData(data);
        if (!isValid) {
            throw new Error("Invalid geoedit file format.");
        }
        return data;
    }
    /**
     * Verifies the structure of the status collection data.
     */
    verifyData(data) {
        // Check if StatusCollection structure is valid
        if (data && typeof data === "object" && Array.isArray(data.statuses)) {
            return true;
        }
        return false;
    }
    // #endregion
    // #region Session Persistence
    /**
     * Saves the currently open collection UUIDs to session.json on the server.
     */
    async saveSessionToServer() {
        // Read the current session first so we don't overwrite unrelated keys
        let current = {};
        try {
            const res = await fetch('/session/load');
            if (res.ok)
                current = await res.json();
        }
        catch ( /* ignore */_a) { /* ignore */ }
        current['collection_editor_collection_UUIDs_open'] = this.visualStatusCollections.map(c => c.UUID);
        await fetch('/session/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(current),
        });
    }
    /**
     * Loads the session from the server and restores any previously open collections.
     * Collections that can no longer be found on the server are silently skipped.
     */
    async restoreFromSession() {
        var _a;
        let uuidsToOpen = [];
        try {
            const res = await fetch('/session/load');
            if (res.ok) {
                const data = await res.json();
                uuidsToOpen = (_a = data['collection_editor_collection_UUIDs_open']) !== null && _a !== void 0 ? _a : [];
            }
        }
        catch (_b) {
            return;
        }
        for (const uuid of uuidsToOpen) {
            try {
                await this.loadCollectionByUUID(uuid, false, true);
            }
            catch (_c) {
                console.warn(`Failed to load collection ${uuid} from session — skipping.`);
            }
        }
    }
    // #endregion
    // #region Load Collection by UUID
    /**
     * Load a collection from the server by UUID and add it to the editor.
     * Returns false if it is already loaded.
     */
    async loadCollectionByUUID(collectionUUID, setChangesFlag = false, initialRestore = false) {
        // Don't load if already visible in the editor
        if (this.visualStatusCollections.some(c => c.UUID === collectionUUID))
            return false;
        const collection = await this.fetchStatusCollectionFromServer(collectionUUID);
        this.loadCollectionFromJSON(collection);
        // Add to the previous collections if restoring.
        if (initialRestore)
            this.previousStatusCollections.push(collection);
        // Set the changes flag if this load should be considered a change (default false since loading from session on page load shouldn't be a "change")
        if (setChangesFlag) {
            this.changesMade = true;
            CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
        }
        return true;
    }
    // #endregion
    // #region Get Flag, Status, Collection by UUID
    /**
     * Get a status collection by its UUID.
     */
    getStatusCollectionByUUID(collectionUUID) {
        const collection = this.visualStatusCollections.find(c => c.UUID === collectionUUID);
        return collection || null;
    }
    /**
     * Get a status by its UUID within a specific collection.
     */
    getStatusByUUID(statusUUID) {
        const status = this.visualStatuses.find(s => s.UUID === statusUUID);
        return status || null;
    }
    /**
     * Get a flag by its UUID within a specific status and collection.
     */
    getFlagByUUID(flagUUID) {
        const flag = this.flags.find(f => f.UUID === flagUUID);
        return flag || null;
    }
    /**
     * Get all loaded status collections.
     */
    getAllCollections() {
        return this.visualStatusCollections;
    }
    /**
     * Get all loaded statuses.
     */
    getAllStatuses() {
        return this.visualStatuses;
    }
    // #endregion
    // #region New Collection / Status Creation
    /**
     * Creates and registers a brand-new empty collection, then adds it to the DOM.
     */
    addNewCollection(name, description) {
        const collectionUUID = GeneralUtilities.generateUUID();
        const newCollection = {
            UUID: collectionUUID,
            name: name || 'New Collection',
            description: description,
            statusesUUIDs: [],
        };
        this.visualStatusCollections.push(newCollection);
        CollectionEditorUI.INSTANCE.addNewCollectionToDOM(collectionUUID, newCollection.name, newCollection.description);
        this.changesMade = true;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    /**
     * Creates and registers a new status inside an existing collection, then adds it to the DOM.
     */
    addNewStatus(collectionUUID, name, description = '') {
        const statusUUID = GeneralUtilities.generateUUID();
        const defaultFlag = this.generateNewFlag(true);
        const newStatus = {
            UUID: statusUUID,
            name: name || 'New Status',
            defaultFlagUUID: defaultFlag.UUID,
            flagUUIDs: [],
        };
        this.flags.push(defaultFlag);
        this.visualStatuses.push(newStatus);
        const collection = this.visualStatusCollections.find(c => c.UUID === collectionUUID);
        if (collection)
            collection.statusesUUIDs.push(statusUUID);
        CollectionEditorUI.INSTANCE.addStatusToCollection(collectionUUID, statusUUID, newStatus.name, description, defaultFlag.UUID);
        this.changesMade = true;
        CollectionEditorUI.INSTANCE.updateSaveRevertButtonStates(this.changesMade);
    }
    // #endregion
    // #region New Flag Creation
    generateNewFlag(isDefaultFlag) {
        // Generate a new UUID for the flag
        const newUUID = GeneralUtilities.generateUUID();
        // Create a new flag with default properties
        const newFlag = {
            UUID: newUUID,
            name: "New Flag",
            description: "",
            imageUUID: null,
            imageDisplayName: null,
            audioUUID: null,
            audioDisplayName: null,
            audioRepeat: false,
            primaryConditionalGroup: isDefaultFlag ? null : {
                name: "Main Conditional Group",
                not: false,
                type: "AND",
                embededConditionalGroups: [],
                editorColor: "#FFFFFF",
            }
        };
        return newFlag;
    }
}
new CollectionEditor();
//# sourceMappingURL=collection_saving.js.map