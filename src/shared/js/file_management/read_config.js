/**
 * Provides specific functionality to read configuration files.
 */
class ConfigReader {
    /**
     * Reads the configuration file and returns specified settings.
     * @param {string} filePath - The path to the configuration file.
     * @param {Array<string>} settings - The settings to read from the file.
     * @returns {Object} The configuration settings.
     */
    static readConfig(filePath, settings) {
        // Get & read the config file
        const CONFIG = require(filePath);

        // Extract only the specified settings
        const result = {};
        settings.forEach(setting => {
            if (CONFIG.hasOwnProperty(setting)) {
                result[setting] = CONFIG[setting];
            }
        });
        // Return the extracted settings
        return result;
    }
}
