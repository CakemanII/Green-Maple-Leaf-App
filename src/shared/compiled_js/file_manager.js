export class JSONFileManager {
    constructor(configFilePath, geofenceSaveDirectory, cacheSavedIntoRead) {
        // Initialize given variables
        this.configFilePath = configFilePath;
        this.geofenceSaveDirectory = geofenceSaveDirectory;
        this.cacheSavedIntoRead = cacheSavedIntoRead;
        // Initialize arrays/maps
        this.timesLastRead = new Map();
        this.previousFileContents = new Map();
    }
}
//# sourceMappingURL=file_manager.js.map