declare const MapEditorUITextInputDialog: any;

type GeofenceFileMetadata = {
    UUID: string;
    name: string;
    lastModified: string;
    fileSize: number;
}

type GeoeditFileData = {
    metadata: GeofenceFileMetadata;
    regions: RegionData[];
}

/**
 * Classes for managing geoedit files.
 */
class GeoeditFileManager {
    private static instance: GeoeditFileManager;
    public static get Instance(): GeoeditFileManager { return this.instance }

    private activeFileUUID: string = "";

    constructor() {
        // Ensure Singleton pattern
        if (GeoeditFileManager.instance) {
            throw new Error("GeoeditFileManager instance already exists!");
        }
        GeoeditFileManager.instance = this;
    }

    /**
     * Parses a geoedit file from a string.
     */
    private parseGeoeditFile(fileContent: string): GeoeditFileData {
        // Parse the JSON content
        const data: any = JSON.parse(fileContent);

        // Verify and process region data as needed
        const isValid = this.verifyData(data);
        if (!isValid) {
            throw new Error("Invalid geoedit file format.");
        }

        return data as GeoeditFileData;
    }

    /**
     * Gets the active geoedit file UUID.
     */
    private async getActiveGeoeditFileUUID(UUID: string): Promise<GeoeditFileData> {
        // Get the file contents from the server.
        const response = await fetch(`/get_geoedit?uuid=${encodeURIComponent(UUID)}`,
            { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Failed to load geoedit file with UUID: ${UUID}`);
        }
        
        const fileContents: string = await response.text();

        // Parse the file contents.
        const geoeditData: GeoeditFileData = this.parseGeoeditFile(fileContents);
        return geoeditData;
    }

    /**
     * Verifies the integrity of the geoedit file data.
     */
    private verifyData(data: any): boolean {
        if (
            typeof data === "object" &&
            data !== null &&
            typeof data.metadata === "object" &&
            data.metadata !== null &&
            typeof data.metadata.UUID === "string" &&
            typeof data.metadata.name === "string" &&
            typeof data.metadata.lastModified === "string" &&
            typeof data.metadata.fileSize === "number" &&
            Array.isArray(data.regions)
        ) {
            return true;
        }
        return false;
    }

    //#region Displaying Geoedit Files for Loading
    /**
     * Fetches a list of available geoedit files from the server.
     */
    public async fetchAvailableGeoeditFiles(): Promise<GeofenceFileMetadata[]> {
        const response = await fetch('/get_list_geoedits', { method: 'GET' });

        // Check for successful response
        if (!response.ok) {
            throw new Error("Failed to fetch list of geoedit files.");
        }

        // Parse the response JSON
        const data: any = await response.json();
        // Return the list of geoedit file metadata
        return data.files as GeofenceFileMetadata[];
    }

    //#endregion

    //#region Loading Geoedit Files
    /**
     * Gets and loads a geoedit file with specific UUID.
     */
    public async loadGeoeditFile(fileUUID: string): Promise<void> {
        const geoditData: GeoeditFileData = await this.getActiveGeoeditFileUUID(fileUUID);

        // Set the active file UUID.
        this.activeFileUUID = fileUUID;
        
        // Load regions into the map editor.
        MapRegionRegionManager.INSTANCE.loadGeoeditFileContents(geoditData);
    }
    //#endregion

    //#region Saving Geoedit Files
    /**
     * Attempts to save the current geoedit file. If no active file exists, prompts user for a name.
     */
    public async attemptSaveCurrentToGeoeditFile(): Promise<void> {
        // Continue if there is already an active region file.
        if (this.activeFileUUID !== "") { 
            const results: GeoeditFileData = await this.getActiveGeoeditFileUUID(this.activeFileUUID);
            const name: string = results["metadata"]["name"];

            this.saveCurrentToGeoeditFile(name); 
            return; 
        }
        
        // Get name of new geoedit file from user.
        new MapEditorUITextInputDialog(
            "Save Geoedit File", 
            "Enter a name for the new geoedit file:",
            (inputName: string) => {
                // Create new UUID for the file.
                this.activeFileUUID = Utils.createUUIDv4();
                // Save the file.
                this.saveCurrentToGeoeditFile(inputName);
            },
            (inputName: string) => {
                // Verify the input name is valid (non-empty).
                return inputName.trim().length > 0 ? true : "Please enter a valid file name.";
            }
        );
    }

    /**
     * Generates and saves the current geoedit file to the server.
     * Returns 
     */
    private saveCurrentToGeoeditFile(name: string): void {
        // Get all regions
        const allRegionDatas = MapRegionDataManager.INSTANCE.getAllRegionDatas();

        // Generate the file content
        const fileContent: string = this.generateGeoeditFileContent(allRegionDatas, name);

        // Send the file content to the server to save
        fetch('/save_geoedit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: fileContent
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to save geoedit file.");
            }
            console.log("Geoedit file saved successfully.");
        })
        .catch(error => {
            console.error("Error saving geoedit file:", error);
        });
    }


    /**
     * Generates the content of a geoedit file from region data.
     */
    private generateGeoeditFileContent(regionDatas: RegionData[], name: string): string {
        const fileData: any = {};

        // Create UUID if none exists
        if (this.activeFileUUID === "")
            throw new Error("Active file UUID is not set.");

        // Remove derrivied backend properties from region data
        for (const regionData of regionDatas) {
            delete (regionData as RegionData).DerivedBackendData;
        }

        // Populate file data
        fileData["name"] = name;
        fileData["UUID"] = this.activeFileUUID;
        fileData["regions"] = regionDatas;

        // return stringified JSON
        return JSON.stringify(fileData, null, 4);
    }

    //#endregion
}

/**
 * Classes for managing geofence files.
 */
class GeofenceFileManager {

}

new GeoeditFileManager();
//new GeofenceFileManager();