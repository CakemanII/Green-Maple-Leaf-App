export declare class JSONFileManager {
    private configFilePath;
    private geofenceSaveDirectory;
    private cacheSavedIntoRead;
    private timesLastRead;
    private previousFileContents;
    constructor(configFilePath: string, geofenceSaveDirectory: string, cacheSavedIntoRead: boolean);
}
