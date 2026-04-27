import { IFrameCommunicationUitilies } from '../../shared/compiled_js/utilities.js';
import { GlobalTelemetryManager } from './global_rocket_communication.js';
// Types for statuses, flags, and etc.
export class GlobalStatusesManager {
    static get INSTANCE() { return GlobalStatusesManager.instance; }
    constructor() {
        this.statusIframesIDs = [
            'live_interface_tab',
        ];
        this.telemetryIframes = [];
        this.statuses = [];
        this.statusEvaluators = {};
        // Ensure singleton
        if (GlobalStatusesManager.instance) {
            throw new Error("Use GlobalStatusesManager.INSTANCE to access the singleton instance.");
        }
        GlobalStatusesManager.instance = this;
        // Initialize iframe references
        this.statusIframesIDs.forEach(iframeID => {
            const iframe = document.getElementById(iframeID);
            if (iframe) {
                this.telemetryIframes.push(iframe);
            }
            else {
                console.warn(`Iframe with ID ${iframeID} not found.`);
            }
        });
        this.initializeAsync();
    }
    async initializeAsync() {
        await this.loadStatuses();
        this.statuses.forEach(status => {
            this.statusEvaluators[status.UUID] = new LiveStatus(status, (flagsTriggeredUUIDs) => {
                const activeFlag = this.statusEvaluators[status.UUID].getActiveFlag();
                this.sendStatusUpdateToIframes(status.UUID, activeFlag, flagsTriggeredUUIDs);
            });
        });
        this.initializeIFrameCommunication();
        console.log(`[GlobalStatusesManager] Loaded ${this.statuses.length} status(es).`);
    }
    /**
     * Load all statuses from all saved status collections on the server.
     */
    async loadStatuses() {
        try {
            const listResp = await fetch('/status_collection/list_metadatas');
            if (!listResp.ok)
                return;
            const listData = await listResp.json();
            const metadatas = listData.metadatas || [];
            for (const meta of metadatas) {
                const collResp = await fetch(`/status_collection/fetch?uuid=${meta.UUID}`);
                if (!collResp.ok)
                    continue;
                const collection = JSON.parse(await collResp.text());
                if (Array.isArray(collection.statuses)) {
                    this.statuses.push(...collection.statuses);
                }
            }
        }
        catch (error) {
            console.error('[GlobalStatusesManager] Failed to load statuses:', error);
        }
    }
    /**
     * Reload statuses from a specific set of collection UUIDs (called by operational mode).
     */
    async loadFromCollections(collectionUUIDs) {
        this.statuses = [];
        this.statusEvaluators = {};
        for (const uuid of collectionUUIDs) {
            const resp = await fetch(`/status_collection/fetch?uuid=${uuid}`);
            if (!resp.ok)
                continue;
            const collection = JSON.parse(await resp.text());
            if (Array.isArray(collection.statuses)) {
                this.statuses.push(...collection.statuses);
            }
        }
        this.statuses.forEach(status => {
            this.statusEvaluators[status.UUID] = new LiveStatus(status, (flagsTriggeredUUIDs) => {
                const activeFlag = this.statusEvaluators[status.UUID].getActiveFlag();
                this.sendStatusUpdateToIframes(status.UUID, activeFlag, flagsTriggeredUUIDs);
            });
        });
        console.log(`[GlobalStatusesManager] Reloaded ${this.statuses.length} status(es) from ${collectionUUIDs.length} collection(s).`);
    }
    /**
     * Retreive the active flag uuid for a specific status.
     */
    getStatusActiveFlag(statusUUID) {
        const evaluator = this.statusEvaluators[statusUUID];
        if (evaluator) {
            return evaluator.getActiveFlag().UUID;
        }
        return null;
    }
    /**
     * Update all statuses based on updated telemetry/status data.
     */
    updateAllStatuses(type, value_type) {
        Object.values(this.statusEvaluators).forEach(evaluator => {
            evaluator.evaluate(type, value_type); // Value is not used in shouldEvaluate currently
        });
    }
    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    updatedTelemetryData(telemetry_data) { this.updateAllStatuses('telemetry', telemetry_data); }
    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    updatedStatusData(status_data) { this.updateAllStatuses('status', status_data); } // re-visit
    /**
     * Send status update to iframes.
     */
    sendStatusUpdateToIframes(statusUUID, flag, flagsTriggeredUUIDs) {
        // Send message to all status iframes
        this.telemetryIframes.forEach(iframe => {
            var _a;
            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
                type: 'statusUpdate',
                statusUUID: statusUUID,
                flag: flag,
                flagsTriggeredUUIDs: flagsTriggeredUUIDs
            }, '*');
        });
    }
    /**
     * Setup 2-way communication with iframes.
     */
    initializeIFrameCommunication() {
        IFrameCommunicationUitilies.setupMessageReceiverAndResponse('getAllStatuses', () => {
            // Compile all statuses with their current active flag names and images
            const statusesData = this.statuses.map(status => {
                var _a;
                const evaluator = this.statusEvaluators[status.UUID];
                const activeFlag = evaluator.getActiveFlag();
                return {
                    statusUUID: status.UUID,
                    statusName: status.name,
                    currentActiveFlagName: activeFlag.name,
                    currentActiveFlagImage: (_a = activeFlag.imageUUID) !== null && _a !== void 0 ? _a : null
                };
            });
            return statusesData;
        });
    }
}
/**
 * Evaluate a status live based on current telemetry data.
 */
class LiveStatus {
    getActiveFlag() { return this.activeFlag; }
    constructor(status, onStatusUpdateCallback) {
        this.evaluationTriggers = { telemetry: [], status: [] };
        this.flagsTriggeredUUIDs = []; // List of all flag UUIDs that have been triggered.
        // Initialize status
        this.status = status;
        this.activeFlag = status.defaultFlag;
        this.onStatusUpdateCallback = onStatusUpdateCallback;
        // Initialize evaluation triggers
        this.initializeEvaluationTriggers();
    }
    /**
     * Determine which values of telemetry/status data to use for evaluation and create a list.
     */
    initializeEvaluationTriggers() {
        // Initialize data list
        // key is either "telemetry" OR "status", value is either telemetry value name OR status name.
        const dataList = { telemetry: [], status: [] };
        // Go through all flags and their conditions to populate dataList
        this.status.flags.forEach(flag => {
            if (flag.primaryConditionalGroup) {
                this.extractDataFromConditionalGroup(flag.primaryConditionalGroup, dataList);
            }
        });
        // Assign to evaluation triggers
        this.evaluationTriggers = dataList;
    }
    /**
     * Recursively extract data keys from conditional groups.
     */
    extractDataFromConditionalGroup(group, dataList) {
        // If it's a condition:
        if (group.type === 'CONDITION' && group.condition) {
            let key = null;
            let value = null;
            // Determine whether it's telemetry or status condition
            if ('telemetryKey' in group.condition) {
                key = 'telemetry';
                const telemetryKeyParts = group.condition.telemetryKey.split('.');
                value = telemetryKeyParts[0]; // Use main telemetry key only
            }
            // Determine if it's a status condition
            else if ('statusKey' in group.condition) {
                key = 'status';
                value = group.condition.statusKey;
            }
            // Ensure the key and value are valid
            if (!key || !value) {
                console.warn(`Invalid key or value in condition: key=${key}, value=${value}`);
                return;
            }
            // Add to list if not already present
            if (!dataList[key].includes(value)) {
                dataList[key].push(value);
            }
        }
        // If it has embeded groups, recurse
        if (group.embededConditionalGroups) {
            group.embededConditionalGroups.forEach(subGroup => {
                this.extractDataFromConditionalGroup(subGroup, dataList);
            });
        }
    }
    /**
     * Evaluate the status and update the active flag if necessary.
     */
    evaluate(type, value_type) {
        // Check if we should evaluate
        if (!this.shouldEvaluate(type, value_type)) {
            return; // No need to evaluate
        }
        // Go through flags in order of priority
        for (const flag of this.status.flags) {
            if (flag.primaryConditionalGroup) {
                const result = this.evaluateConditionalGroup(flag.primaryConditionalGroup);
                if (result) {
                    this.activeFlag = flag;
                    this.addActiveFlagToTriggered();
                    this.onStatusUpdateCallback(this.flagsTriggeredUUIDs);
                    return; // Exit after first matching flag (This goes in prioirity order)
                }
            }
        }
        // If no flags matched, set to default flag
        if (this.activeFlag.UUID !== this.status.defaultFlag.UUID) {
            this.activeFlag = this.status.defaultFlag;
            this.addActiveFlagToTriggered();
            this.onStatusUpdateCallback(this.flagsTriggeredUUIDs);
        }
    }
    /**
     * Determine if the status should re-evaluate based on updated telemetry/status data.
     */
    shouldEvaluate(type, value) {
        if (type === 'telemetry') {
            return this.evaluationTriggers.telemetry.some(item => item === value); // (Same thing as .includes(...))
        }
        else if (type === 'status') {
            return this.evaluationTriggers.status.some(item => item === value); // (Same thing as .includes(...))
        }
        console.warn(`Invalid type '${type}' for shouldEvaluate check.`);
        return false;
    }
    /**
     * Recursively evaluate a conditional group.
     */
    evaluateConditionalGroup(group) {
        // Create result variable
        let result = null;
        // Determine if CONDITIONAL
        if (group.type === 'CONDITION' && group.condition) {
            result = this.evaluateCondition(group.condition);
        }
        else {
            // For AND/OR groups, evaluate embeded groups
            if (group.embededConditionalGroups) {
                if (group.type === 'AND') {
                    result = group.embededConditionalGroups.every(subGroup => this.evaluateConditionalGroup(subGroup));
                }
                else if (group.type === 'OR') {
                    result = group.embededConditionalGroups.some(subGroup => this.evaluateConditionalGroup(subGroup));
                }
            }
            else {
                result = true; // Default to true if no embeded groups
            }
        }
        return result; // Placeholder
    }
    /**
     * Evaluate a single condition (telemetry or status).
     */
    evaluateCondition(condition) {
        // Comment condition (always returns true, doesn't affect evaluation)
        if ('comment' in condition) {
            return true; // Comments are for documentation only
        }
        // Telemetry condition
        if ('telemetryKey' in condition) {
            // Split telemetry key if needed (e.g., "vel.y" -> "vel" and "y")
            const keyParts = condition.telemetryKey.split('.');
            const mainKey = keyParts[0];
            // Retrieve current value from TelemetryCommunicationManager
            let currentValue = GlobalTelemetryManager.INSTANCE.getMostRecentDataPoints(mainKey);
            if (!currentValue) {
                console.warn(`[GlobalStatusesManager] No telemetry data found for key '${mainKey}'`);
                return false;
            }
            // If there's a sub-key, extract it (e.g., for vector data)
            currentValue = currentValue[0].y; // Get just the value part of the data point
            const currentValueSub = (keyParts.length > 1 && currentValue) ? currentValue[keyParts[1]] : currentValue;
            if (!currentValue) {
                return false;
            } // No data means condition fails
            const compareValue = condition.value;
            // Evaluate based on operator
            switch (condition.operator) {
                case 'E': return currentValueSub === compareValue;
                case 'NE': return currentValueSub !== compareValue;
                case 'GT': return currentValueSub > compareValue;
                case 'NGT': return currentValueSub <= compareValue;
                case 'LT': return currentValueSub < compareValue;
                case 'NLT': return currentValueSub >= compareValue;
                case 'GTOE': return currentValueSub >= compareValue;
                case 'NGTOE': return currentValueSub < compareValue;
                case 'LTOE': return currentValueSub <= compareValue;
                case 'NLTOE': return currentValueSub > compareValue;
                case 'IS': return currentValueSub === compareValue; // Boolean: is true/false
                case 'ISNOT': return currentValueSub !== compareValue; // Boolean: is not true/false
                default: return false;
            }
        }
        // Status condition
        else if ('statusKey' in condition) {
            const statusEvaluator = GlobalStatusesManager.INSTANCE['statusEvaluators'][condition.statusKey];
            if (!statusEvaluator) {
                return false;
            } // Status not found means condition fails
            switch (condition.conditionalType) {
                case 'IS_ACTIVE': {
                    const statusActiveFlagUUID = GlobalStatusesManager.INSTANCE.getStatusActiveFlag(condition.statusKey);
                    return statusActiveFlagUUID === condition.flagUUID;
                }
                case 'IS_NOT_ACTIVE': {
                    const statusActiveFlagUUID = GlobalStatusesManager.INSTANCE.getStatusActiveFlag(condition.statusKey);
                    return statusActiveFlagUUID !== condition.flagUUID;
                }
                case 'HAS_BEEN_ACTIVE': {
                    const flagsTriggered = statusEvaluator['flagsTriggeredUUIDs'];
                    return flagsTriggered.includes(condition.flagUUID);
                }
                case 'HAS_NOT_BEEN_ACTIVE': {
                    const flagsTriggered = statusEvaluator['flagsTriggeredUUIDs'];
                    return !flagsTriggered.includes(condition.flagUUID);
                }
                default:
                    return false;
            }
        }
        console.error("Invalid condition type.");
        return false; // Default to false
    }
    /**
     * Add a flag to the list of triggered flags if not already present.
     */
    addActiveFlagToTriggered() {
        if (!this.flagsTriggeredUUIDs.includes(this.activeFlag.UUID)) {
            this.flagsTriggeredUUIDs.push(this.activeFlag.UUID);
        }
    }
}
new GlobalStatusesManager(); // Temp
//# sourceMappingURL=global_statuses.js.map