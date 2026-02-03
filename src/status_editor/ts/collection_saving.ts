import { StatusCollection, Status, Flag, SimpleStatus, SimpleStatusCollection } from '../../shared/compiled_js/types.js';
import { CollectionEditorUI } from './collection_editor.js';

export class CollectionEditor
{
    private static instance: CollectionEditor;
    public static get INSTANCE(): CollectionEditor { return CollectionEditor.instance; }
    
    // Represents the current status collection states.
    private previousStatusCollections: StatusCollection[] = [];
    
    private visualStatusCollections: SimpleStatusCollection[] = [];
    private visualStatuses: SimpleStatus[] = [];
    private flags: Flag[] = [];

    constructor()
    {
        // Ensure singleton
        if (CollectionEditor.instance)
            throw new Error("Use CollectionEditorServerCommunication.INSTANCE to access the singleton instance.");
        CollectionEditor.instance = this;

        // Testing
        this.fetchStatusCollectionFromServer('test123')
        .then((collection => {
            this.loadCollectionFromJSON(collection);
            this.previousStatusCollections = [collection];
        }));
    }

    /**
     * Load a collection into the editor from JSON.
     */
    private loadCollectionFromJSON(collectionJSON: StatusCollection): void {
        // Compile and map collection and statuses into the local changes.
        const simpleCollection: SimpleStatusCollection = {
            UUID: collectionJSON.UUID,
            name: collectionJSON.name.trim(),
            description: collectionJSON.description.trim(),
            statusesUUIDs: collectionJSON.statuses.map(status => status.UUID),
        };
        this.visualStatusCollections.push(simpleCollection);

        // Map flags into local changes.
        for (const status of collectionJSON.statuses) {
            // Map simple status
            const simpleStatus: SimpleStatus = {
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
     * Unload a collection from the editor given its JSON.
     */
    private unloadCollectionFromJSON(collectionUUID: string): void {
        // Remove collection from local changes
        this.visualStatusCollections = this.visualStatusCollections.filter(c => c.UUID !== collectionUUID);

        // Remove associated statuses and flags
        const statusesToRemove = this.visualStatuses.filter(s => {
            const collection = this.visualStatusCollections.find(c => c.UUID === collectionUUID);
            return collection ? collection.statusesUUIDs.includes(s.UUID) : false;
        });

        for (const status of statusesToRemove) {
            this.visualStatuses = this.visualStatuses.filter(s => s.UUID !== status.UUID);

            for (const flagUUID of status.flagUUIDs.concat([status.defaultFlagUUID])) {
                this.flags = this.flags.filter(f => f.UUID !== flagUUID);
            }
        }

        // Remove from the editor UI
        CollectionEditorUI.INSTANCE.removeAllCollectionsFromDOM();
    }

    // #region Adding/Editing Local Changes
    /**
     * Add or edits a flag in local save.
     */
    public addFlagContentChanges(flag: Flag): void
    {        
        // Find the flag by UUID
        const existingIndex = this.flags.findIndex(f => f.UUID === flag.UUID);

        // If not found, add it
        if (existingIndex === -1)
            this.flags.push(flag);
        else 
            this.flags[existingIndex] = flag;
    }

    /**
     * Adds or edits a status collections in local save.
     */
    public modifyStatusCollectionChange(visualCollections: SimpleStatusCollection[], visualStatuses: SimpleStatus[]): void
    {
        // Iterate through collections to add or update
        for (const visualCollection of visualCollections)
        {
            // Find the collection by UUID
            const existingIndex = this.visualStatusCollections.findIndex(c => c.UUID === visualCollection.UUID);

            // If not found, add it
            if (existingIndex === -1)
                this.visualStatusCollections.push(visualCollection);
            else 
                this.visualStatusCollections[existingIndex] = visualCollection;
        }

        // Iterate through statuses to add or update
        for (const status of visualStatuses)
        {
            const statusIndex = this.visualStatuses.findIndex(s => s.UUID === status.UUID);
            if (statusIndex === -1)
                this.visualStatuses.push(status);
            else
                this.visualStatuses[statusIndex] = status;
        }
    }

    /**
     * Revert all unsaved changes.
     */
    public revertLocalChanges(): void
    {
        // Clear current local changes
        this.visualStatusCollections = [];
        this.flags = [];
        this.visualStatuses = [];

        // Clear all collections from DOM
        CollectionEditorUI.INSTANCE.removeAllCollectionsFromDOM();

        // Reload previous collections into local changes
        for (const collection of this.previousStatusCollections)
            this.loadCollectionFromJSON(collection);
    }
    // #endregion

    // #region Applying Changes to Server
    /**
     * Save the local changes to server storage.
     */
    public async saveAllChangesToServer(): Promise<void>
    {
        // Create new status collections list with current local data
        const newStatusCollections: StatusCollection[] = [];

        // Add all collections
        for (const simpleCollection of this.visualStatusCollections)
            newStatusCollections.push(this.convertSimpleToFullCollection(simpleCollection));

        // Update previous collections to current state
        this.previousStatusCollections = newStatusCollections;

        // Save each collection to the server
        for (const collection of newStatusCollections)
            await this.saveCollectionToServer(collection);
    }

    /**
     * Converts simple collectio to full status collection.
     */
    private convertSimpleToFullCollection(simpleCollection: SimpleStatusCollection): StatusCollection
    {
        // Map simple collection to full collection
        const fullCollection: StatusCollection = {
            UUID: simpleCollection.UUID,
            name: simpleCollection.name,
            description: simpleCollection.description,
            statuses: [],
        };

        // Map each simple status to full status
        for (const statusUUID of simpleCollection.statusesUUIDs)
        {
            // Find simple status
            const simpleStatus = this.visualStatuses.find(s => s.UUID === statusUUID);
            if (!simpleStatus) continue;
            const fullStatus: Status = {
                UUID: simpleStatus.UUID,
                name: simpleStatus.name,
                defaultFlag: this.flags.find(f => f.UUID === simpleStatus.defaultFlagUUID)!,
                flags: [],
            };
            
            // Map flags
            for (const flagUUID of simpleStatus.flagUUIDs)
            {
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
    private saveCollectionToServer(collection: StatusCollection): Promise<void>
    {
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
                } else {
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
    public async fetchStatusCollectionFromServer(collectionUUID: string): Promise<StatusCollection> {
        // Get the file contents from the server.
        const response = await fetch(`/status_collection/get?uuid=${encodeURIComponent(collectionUUID)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch status collection from server');
        }
        const collection: StatusCollection = this.parseStatusCollectionData(await response.text());
        return collection;
    }

    /**
     * Fetch a flag from local changes by its UUID.
     */
    public fetchFlagFromLocalChanges(flagUUID: string): Flag | null {
        const flag = this.flags.find(f => f.UUID === flagUUID);
        return flag || null;
    }

    /**
     * Parses the contents of a status collection file.
     */
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

    /**
     * Verifies the structure of the status collection data.
     */
    private verifyData(data: any): boolean {
        // Check if StatusCollection structure is valid
        if (data && typeof data === "object" && Array.isArray(data.statuses)) {
            return true;
        }
        return false;
    }
    // #endregion

    // #region Get Flag, Status, Collection by UUID
    /**
     * Get a status collection by its UUID.
     */
    public getStatusCollectionByUUID(collectionUUID: string): SimpleStatusCollection | null {
        const collection = this.visualStatusCollections.find(c => c.UUID === collectionUUID);
        return collection || null;
    }

    /**
     * Get a status by its UUID within a specific collection.
     */
    public getStatusByUUID(statusUUID: string): SimpleStatus | null {
        const status = this.visualStatuses.find(s => s.UUID === statusUUID);
        return status || null;
    }

    /**
     * Get a flag by its UUID within a specific status and collection.
     */
    public getFlagByUUID(flagUUID: string): Flag | null {
        const flag = this.flags.find(f => f.UUID === flagUUID);
        return flag || null;
    }
    // #endregion
}

new CollectionEditor();