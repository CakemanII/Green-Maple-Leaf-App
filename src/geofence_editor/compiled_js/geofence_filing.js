import { InputPrompt } from "../../shared/compiled_js/prompts.js";
import { MapRegionRegionManager, MapRegionDataManager } from "./interactable_map/map_region_editor.js";
import { GeneralUtilities } from "../../shared/compiled_js/utilities.js";
/**
 * Classes for managing geoedit files.
 */
export class GeoeditFileManager {
    static get Instance() { return this.instance; }
    constructor() {
        this.activeFileUUID = "";
        this.activeFileName = "";
        // Ensure Singleton pattern
        if (GeoeditFileManager.instance) {
            throw new Error("GeoeditFileManager instance already exists!");
        }
        GeoeditFileManager.instance = this;
    }
    /**
     * Parses a geoedit file from a string.
     */
    parseGeoeditFile(fileContent) {
        // Parse the JSON content
        const data = JSON.parse(fileContent);
        // Verify and process region data as needed
        const isValid = this.verifyData(data);
        if (!isValid) {
            throw new Error("Invalid geoedit file format.");
        }
        return data;
    }
    /**
     * Gets the active geoedit file UUID.
     */
    async getActiveGeoeditFileUUID(UUID) {
        // Get the file contents from the server.
        const response = await fetch(`/geofence/fetch?uuid=${encodeURIComponent(UUID)}`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to load geoedit file with UUID: ${UUID}`);
        }
        const fileContents = await response.text();
        // Parse the file contents.
        const geoeditData = this.parseGeoeditFile(fileContents);
        return geoeditData;
    }
    /**
     * Verifies the integrity of the geoedit file data.
     */
    verifyData(data) {
        if (typeof data === "object" &&
            data !== null &&
            Array.isArray(data.regions)) {
            return true;
        }
        return false;
    }
    //#region Displaying Geoedit Files for Loading
    /**
     * Fetches a list of available geoedit files from the server.
     */
    async fetchAvailableGeoeditFiles() {
        const response = await fetch('/geofence/list_metadatas', { method: 'GET' });
        // Check for successful response
        if (!response.ok) {
            throw new Error("Failed to fetch list of geoedit files.");
        }
        // Parse the response JSON
        const data = await response.json();
        // Return the list of geoedit file metadata
        return data.metadatas;
    }
    //#endregion
    //#region Loading Geoedit Files
    /**
     * Gets and loads a geoedit file with specific UUID.
     */
    async loadGeoeditFile(metadata) {
        const geoditData = await this.getActiveGeoeditFileUUID(metadata.UUID);
        // Set the active file UUID and name.
        this.activeFileUUID = metadata.UUID;
        this.activeFileName = metadata.name;
        // Load regions into the map editor.
        MapRegionRegionManager.INSTANCE.loadGeoeditFileContents(geoditData);
    }
    //#endregion
    //#region Saving Geoedit Files
    /**
     * Attempts to save the current geoedit file. If no active file exists, prompts user for a name.
     */
    async attemptSaveCurrentToGeoeditFile(forceNewFile) {
        // Continue if there is already an active region file.
        if (this.activeFileUUID !== "" && !forceNewFile) {
            await this.saveCurrentToGeoeditFile(this.activeFileName);
            return;
        }
        // Get name of new geoedit file from user - wrap in Promise
        return new Promise((resolve) => {
            new FileInfoPrompt(async (inputName) => {
                // Create new UUID for the file.
                this.activeFileUUID = GeneralUtilities.generateUUID();
                // Save the file.
                await this.saveCurrentToGeoeditFile(inputName);
                resolve();
            }, () => { });
        });
    }
    /**
     * Generates and saves the current geoedit file to the server.
     * Returns
     */
    async saveCurrentToGeoeditFile(name) {
        // Get all regions
        const allRegionDatas = MapRegionDataManager.INSTANCE.getAllRegionDatas();
        // Generate the file content
        const fileContent = this.generateGeoeditFileContent(allRegionDatas, name);
        // Send the file content to the server to save
        try {
            const response = await fetch('/geofence/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: fileContent
            });
            if (!response.ok) {
                throw new Error("Failed to save geoedit file.");
            }
            console.log("Geoedit file saved successfully.");
        }
        catch (error) {
            console.error("Error saving geoedit file:", error);
            throw error;
        }
    }
    /**
     * Generates the content of a geoedit file from region data.
     */
    generateGeoeditFileContent(regionDatas, name) {
        const fileData = {};
        // Create UUID if none exists
        if (this.activeFileUUID === "")
            throw new Error("Active file UUID is not set.");
        // Remove derrivied backend properties from region data
        for (const regionData of regionDatas) {
            delete regionData.DerivedBackendData;
        }
        // Populate metadata and regions
        fileData["metadata"] = {
            UUID: this.activeFileUUID,
            name: name,
            lastModified: new Date().toISOString(),
            fileSize: 0 // Placeholder, server can update this upon saving
        };
        fileData["regions"] = regionDatas;
        // return stringified JSON
        return JSON.stringify(fileData, null, 4);
    }
}
class FileInfoPrompt extends InputPrompt {
    constructor(onConfirm, onCancel = () => { }) {
        super("Save Geoedit File", "Enter a name for the new geoedit file:", "Save", "Cancel", (...args) => onConfirm(args[0]), onCancel);
        this.initializeAdditionalDOM();
    }
    confirm() {
        const value = this.nameInput.value.trim();
        if (value.length === 0) {
            this.feedbackEl.textContent = "Please enter a valid file name.";
            this.nameInput.style.borderColor = '#ff6b6b';
            return;
        }
        super.confirm(value);
    }
    initializeAdditionalDOM() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `margin-bottom: 4px;`;
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'File name...';
        this.nameInput.style.cssText = `
            width: 100%;
            box-sizing: border-box;
            padding: 8px 12px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            color: #e0e0e0;
            font-size: 14px;
            outline: none;
            margin-bottom: 6px;
            transition: border-color 0.15s;
        `;
        this.nameInput.addEventListener('focus', () => {
            this.nameInput.style.borderColor = '#6ba3ff';
        });
        this.nameInput.addEventListener('blur', () => {
            if (this.feedbackEl.textContent === '')
                this.nameInput.style.borderColor = '#3a3a3a';
        });
        this.nameInput.addEventListener('input', () => {
            if (this.nameInput.value.trim().length > 0) {
                this.feedbackEl.textContent = '';
                this.nameInput.style.borderColor = '#6ba3ff';
            }
        });
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                this.confirm();
        });
        this.feedbackEl = document.createElement('div');
        this.feedbackEl.style.cssText = `
            color: #ff6b6b;
            font-size: 12px;
            min-height: 16px;
        `;
        wrapper.appendChild(this.nameInput);
        wrapper.appendChild(this.feedbackEl);
        this.insertElementIntoDialog(wrapper);
        // Auto-focus the input after the dialog is in the DOM
        setTimeout(() => this.nameInput.focus(), 0);
    }
    collectInput() {
        return [this.nameInput.value.trim()];
    }
}
new GeoeditFileManager();
//new GeofenceFileManager();
//# sourceMappingURL=geofence_filing.js.map