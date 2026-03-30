import { RegionData } from "./interactable_map/region.js";
export type GeofenceFileMetadata = {
    UUID: string;
    name: string;
    lastModified: string;
    fileSize: number;
};
export type GeoeditFileData = {
    regions: RegionData[];
};
/**
 * Classes for managing geoedit files.
 */
export declare class GeoeditFileManager {
    private static instance;
    static get Instance(): GeoeditFileManager;
    private activeFileUUID;
    private activeFileName;
    constructor();
    /**
     * Parses a geoedit file from a string.
     */
    private parseGeoeditFile;
    /**
     * Gets the active geoedit file UUID.
     */
    private getActiveGeoeditFileUUID;
    /**
     * Verifies the integrity of the geoedit file data.
     */
    private verifyData;
    /**
     * Fetches a list of available geoedit files from the server.
     */
    fetchAvailableGeoeditFiles(): Promise<GeofenceFileMetadata[]>;
    /**
     * Gets and loads a geoedit file with specific UUID.
     */
    loadGeoeditFile(metadata: GeofenceFileMetadata): Promise<void>;
    /**
     * Attempts to save the current geoedit file. If no active file exists, prompts user for a name.
     */
    attemptSaveCurrentToGeoeditFile(forceNewFile: boolean): Promise<void>;
    /**
     * Generates and saves the current geoedit file to the server.
     * Returns
     */
    private saveCurrentToGeoeditFile;
    /**
     * Generates the content of a geoedit file from region data.
     */
    private generateGeoeditFileContent;
}
