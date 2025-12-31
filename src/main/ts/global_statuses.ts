declare const IFrameCommunicationUitilies: any;

// Types for statuses, flags, and etc.

// Example: Should Parachute be Deployed?
// Status: Should Parachute be Deployed?
    // Flag: No, Do Not Deploy Parachute
        // (This is the default flag if no other flags are true)
    
    // Flag: Yes, Deploy Parachute
        // PrimaryConditionalGroup (ALWAYS 'AND'):
            // Not: False
            // ConditionalGroup:
                // Not: False
                // Condition: Vertical Velocity LESS_THAN 1
            // ConditionalGroup:
                // Not: False
                // Condition: Acceleration is LESS_THAN 0
            // ConditionalGroup:
                // Not: False
                // Condition: Time Since Launch GREATER_THAN_OR_EQUAL 3 seconds
            // ConditionalGroup:
                // Not: True
                // Condition: Parachute is already Deployed

const ExampleStatus: Status = {
    UUID: "statustemptemp",
    name: "Should Parachute be Deployed?",
    defaultFlag: {
        name: "No, Do Not Deploy Parachute",
        UUID: "defaultflagtemp",
        primaryConditionalGroup: null,
    },
    flags: [
        {
            UUID: "flagtemp123",
            name: "Yes, Deploy Parachute",
            primaryConditionalGroup: {
                type: 'AND',
                not: false,
                embededConditionalGroups: [
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'vel.y',
                            operator: 'LTOE',
                            value: 1
                        }
                    },
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'accel.y',
                            operator: 'LT',
                            value: 0
                        }
                    },
                    /*{
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            telemetryKey: 'time_since_launch',
                            operator: 'GTOE',
                            value: 3
                        }
                    },
                    {
                        type: 'CONDITION',
                        not: false,
                        condition: {
                            statusUUID: 'temptemptemp',
                            flagUUID: 'Deployed',
                            shouldBeActive: false
                        }
                    }*/
                ]
            }
        }
    ]
}

type Status = {
    UUID: string;
    name: string;
    defaultFlag: Flag;
    flags: Flag[]; // Ordered by priority (index 0 being highest priority)
}

type Flag = {
    UUID: string;
    name: string;
    primaryConditionalGroup: ConditionalGroup | null;
}

type ConditionalGroup = {
    not: boolean;
    type: 'AND' | 'OR' | 'CONDITION';
    embededConditionalGroups?: ConditionalGroup[] | null;
    condition?: TelemetryCondition | StatusCondition | null;
}

type TelemetryCondition = {
    telemetryKey: string; // Key to check in some global data source
    operator: 'E' | 'NE' | 'GT' | 'NGT' | 'LT' | 'NLT' | 'GTOE' | 'NLTOE' | 'LTOE' | 'NLTOE';
    value: any; // Value to compare against
}

type StatusCondition = {
    statusUUID: string; // UUID of the status to check
    flagUUID: string;   // UUID of the flag to check
    shouldBeActive: boolean; // Whether the flag should be active or not
}


class GlobalStatusesManager {
    private static instance: GlobalStatusesManager;
    public static get INSTANCE(): GlobalStatusesManager { return GlobalStatusesManager.instance; }

    private readonly statusIframesIDs: string[] = [
        'live_data_tab',
        'live_interface_tab',
    ]
    private telemetryIframes: HTMLIFrameElement[] = [];

    private statuses: Status[] = [];
    private statusEvaluators: { [uuid: string]: LiveStatus } = {};

    constructor() {
        // Ensure singleton
        if (GlobalStatusesManager.instance) {
            throw new Error("Use GlobalStatusesManager.INSTANCE to access the singleton instance.");
        }
        GlobalStatusesManager.instance = this;

        // Initialize iframe references
        this.statusIframesIDs.forEach(iframeID => {
            const iframe = document.getElementById(iframeID) as HTMLIFrameElement;
            if (iframe) {
                this.telemetryIframes.push(iframe);
            }
            else {
                console.warn(`Iframe with ID ${iframeID} not found.`);
            }
        });

        // Load all statuses
        this.statuses = this.loadStatuses();

        // Create evaluators for each status
        this.statuses.forEach(status => {
            this.statusEvaluators[status.UUID] = new LiveStatus(
                status, 
                () => {
                    // Callback to handle status update
                    this.sendStatusUpdateToIframes(
                        status.UUID, 
                        this.statusEvaluators[status.UUID].getActiveFlag().name, 
                        "" // Placeholder for flag image URL or data
                    );
                }
            );
        });
        console.log(`[GlobalStatusesManager] Loaded ${this.statuses.length} statuses.`);

        // Setup iframe communication
        this.initializeIFrameCommunication();
    }

    /**
     * Load all statuses from some data source.
     */
    private loadStatuses(): Status[] {
        // Implementation to retrieve all statuses
        return [
            ExampleStatus // temporary example
        ];
    }

    /**
     * Retreive the active flag uuid for a specific status.
     */
    public getStatusActiveFlag(statusUUID: string): string | null {
        const evaluator = this.statusEvaluators[statusUUID];
        if (evaluator) {
            return evaluator.getActiveFlag().UUID;
        }
        return null;
    }

    /**
     * Update all statuses based on updated telemetry/status data.
     */
    private updateAllStatuses(type: string, value_type: string): void {
        Object.values(this.statusEvaluators).forEach(evaluator => {
            evaluator.evaluate(type, value_type); // Value is not used in shouldEvaluate currently
        });
    }

    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    public updatedTelemetryData(telemetry_data: string): void { this.updateAllStatuses('telemetry', telemetry_data); }

    /**
     * Evaluate all statuses based on updated telemetry/status data.
     */
    public updatedStatusData(status_data: string): void { this.updateAllStatuses('status', status_data); } // re-visit

    /**
     * Send status update to iframes.
     */
    private sendStatusUpdateToIframes(statusUUID: string, flagName: string, flagImage: string): void {
        // Send message to all status iframes
        this.telemetryIframes.forEach(iframe => {
            iframe.contentWindow?.postMessage({ 
                type: 'statusUpdate',
                statusUUID: statusUUID,
                flagName: flagName,
                flagImage: flagImage 
            }, '*');
        });
    }

    /**
     * Setup 2-way communication with iframes.
     */
    private initializeIFrameCommunication(): void {
        IFrameCommunicationUitilies.setupMessageReceiverAndResponse(
            'getAllStatuses', () => {
                // Compile all statuses with their current active flag names and images
                const statusesData = this.statuses.map(status => {
                    const evaluator = this.statusEvaluators[status.UUID];
                    return {
                        statusUUID: status.UUID,
                        statusName: status.name,
                        currentActiveFlagName: evaluator.getActiveFlag().name,
                        currentActiveFlagImage: "" // Placeholder for flag image URL or data
                    };
                });
                return statusesData;
            }
        );
    }
}

/**
 * Evaluate a status live based on current telemetry data.
 */
class LiveStatus {
    private status: Status;
    private onStatusUpdateCallback: (() => void);

    private activeFlag: Flag;
    public getActiveFlag(): Flag { return this.activeFlag; }

    private evaluationTriggers: { telemetry: string[], status: string[] } = { telemetry: [], status: [] };

    constructor(status: Status, onStatusUpdateCallback: (() => void)) {
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
    private initializeEvaluationTriggers(): void {
        // Initialize data list
        // key is either "telemetry" OR "status", value is either telemetry value name OR status name.
        const dataList: { telemetry: string[], status: string[] } = { telemetry: [], status: [] }; 

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
    private extractDataFromConditionalGroup(group: ConditionalGroup, dataList: { [key: string]: any }): void {
        // If it's a condition:
        if (group.type === 'CONDITION' && group.condition) {
            let key: string | null = null;
            let value: string | number | null = null;
            // Determine whether it's telemetry or status condition
            if ('telemetryKey' in group.condition) { 
                key = 'telemetry'; 
                const telemetryKeyParts = group.condition.telemetryKey.split('.');
                value = telemetryKeyParts[0]; // Use main telemetry key only
            }

            // Determine if it's a status condition
            else if ('statusUUID' in group.condition) { key = 'status'; value = group.condition.statusUUID; }

            // Ensure the key and value are valid
            if (!key || !value) { console.warn(`Invalid key or value in condition: key=${key}, value=${value}`); return; }

            // Add to list if not already present
            if (!dataList[key!].includes(value!)) {
                dataList[key!].push(value!);
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
    public evaluate(type: string, value_type: string): void {
        // Check if we should evaluate
        if (!this.shouldEvaluate(type, value_type)) {
            return; // No need to evaluate
        }
        console.log(`[LiveStatus] Evaluating status '${this.status.name}' due to updated ${type} data.`);

        // Go through flags in order of priority
        for (const flag of this.status.flags) {
            if (flag.primaryConditionalGroup) {
                const result = this.evaluateConditionalGroup(flag.primaryConditionalGroup);
                if (result) {
                    this.activeFlag = flag;
                    this.onStatusUpdateCallback!();
                    return; // Exit after first matching flag (This goes in prioirity order)
                }
            }
        }

        // If no flags matched, set to default flag
        if (this.activeFlag.UUID !== this.status.defaultFlag.UUID) {
            this.activeFlag = this.status.defaultFlag;
            this.onStatusUpdateCallback!();
        }
    }


    /**
     * Determine if the status should re-evaluate based on updated telemetry/status data.
     */
    private shouldEvaluate(type: string, value: string): boolean {
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
    private evaluateConditionalGroup(group: ConditionalGroup): boolean {
        // Create result variable
        let result: boolean | null = null;

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
            else
            {
                result = true; // Default to true if no embeded groups
            }
        }

        return result!; // Placeholder
    }

    /**
     * Evaluate a single condition (telemetry or status).
     */
    private evaluateCondition(condition: TelemetryCondition | StatusCondition): boolean {
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
            currentValue = currentValue[0].y // Get just the value part of the data point
            const currentValueSub = (keyParts.length > 1 && currentValue) ? (currentValue as any)[keyParts[1]] : currentValue;

            if (!currentValue) { return false; } // No data means condition fails
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
                case 'NLTOE': return currentValueSub < compareValue;
                case 'LTOE': return currentValueSub <= compareValue;
                case 'NLTOE': return currentValueSub > compareValue;
                default: return false;
            }
        }

        // Status condition
        else if ('statusUUID' in condition) {
            const statusActiveFlagUUID = GlobalStatusesManager.INSTANCE.getStatusActiveFlag(condition.statusUUID);
            if (!statusActiveFlagUUID) { return false; } // Status not found means condition fails

            const isActive = (statusActiveFlagUUID === condition.flagUUID);
            return condition.shouldBeActive ? isActive : !isActive;
        }

        console.error("Invalid condition type.");
        return false; // Default to false
    }
}

new GlobalStatusesManager(); // Temp