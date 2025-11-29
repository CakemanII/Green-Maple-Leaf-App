type GeoeditFileData = {
    UUID: string;
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

    //#region Loading Geoedit Files
    /**
     * Gets and loads a geoedit file with specific UUID.
     */
    public async loadGeoeditFile(fileUUID: string): Promise<void> {
        // Get the file contents from the server.
        const response = await fetch(`/get_geoedit?uuid=${encodeURIComponent(fileUUID)}`,
            { method: 'GET' });
        console.log(response);
        if (!response.ok) {
            throw new Error(`Failed to load geoedit file with UUID: ${fileUUID}`);
        }
        
        const fileContents: string = await response.text();

        // Set the active file UUID.
        this.activeFileUUID = fileUUID;

        // Parse the file contents.
        const geoeditData: GeoeditFileData = this.parseGeoeditFile(fileContents);
        
        // Load regions into the map editor.
        MapRegionRegionManager.INSTANCE.loadGeoeditFileContents(geoeditData);
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
     * Verifies the integrity of the geoedit file data.
     */
    private verifyData(data: any): boolean {
        console.log(data);
        // Ensure top-level properties exist
        if (data["regions"] === undefined || !Array.isArray(data["regions"])) {
            console.warn("Regions property missing or not an array.");
            return false;
        }

        if (data["UUID"] === undefined || typeof data["UUID"] !== "string") {
            console.warn("UUID property missing or not a string.");
            return false;
        }

        // Ensure each region has required properties
        for (const region of data["regions"]) {
            // Ensure each region has these properties.
            if (region.UUID === undefined ||
                region.LayerIndex === undefined ||
                region.General === undefined ||
                region.General.Name === undefined ||
                region.General.IsVisible === undefined ||
                region.General.IsRestricted === undefined ||
                region.RegionType === undefined ||
                region.FrontEndData === undefined) { return false; }
            
            // Ensure style properties exist
            if (region.Style === undefined ||
                region.Style.FillColor === undefined ||
                region.Style.FillOpacity === undefined ||
                region.Style.StrokeColor === undefined ||
                region.Style.StrokeOpacity === undefined) { return false; }
            
            // Else continue, has everything.
        }

        // All regions verified
        return true;
    }
    //#endregion

    //#region Saving Geoedit Files
    /**
     * Generates and saves the current geoedit file to the server.
     */
    public saveCurrentToGeoeditFile(): void {
        const allRegionDatas = MapRegionDataManager.INSTANCE.getAllRegionDatas();
        // Generate the file content
        const fileContent: string = this.generateGeoeditFileContent(allRegionDatas);

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
    private generateGeoeditFileContent(regionDatas: RegionData[]): string {
        const fileData: any = {};

        // Create UUID if none exists
        let UUID = this.activeFileUUID;
        if (UUID === "")
            UUID = Utils.createUUIDv4();

        // Remove derrivied backend properties from region data
        for (const regionData of regionDatas) {
            delete (regionData as RegionData).DerivedBackendData;
        }

        // Populate file data
        fileData["UUID"] = UUID;
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