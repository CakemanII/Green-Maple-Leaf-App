// #region Types for statuses, flags, and etc.
export type StatusCollection = {
    UUID: string;
    name: string;
    description: string;
    statuses: Status[]; // Ordered by priority (index 0 being highest priority)
}

export type Status = {
    UUID: string;
    name: string;
    defaultFlag: Flag;
    flags: Flag[]; // Ordered by priority (index 0 being highest priority)
}

export type Flag = {
    UUID: string;
    name: string;
    description: string;
    imagePath: string | null;
    audioPath: string | null;
    audioRepeat: boolean;
    primaryConditionalGroup: ConditionalGroup | null;
}

export type ConditionalGroup = {
    name?: string;
    not: boolean;
    type: 'AND' | 'OR' | 'CONDITION';
    embededConditionalGroups?: ConditionalGroup[] | null;
    condition?: TelemetryCondition | StatusCondition | null;
    editorColor?: string;
}

export type TelemetryCondition = {
    telemetryKey: string; // Key to check in some global data source
    operator: 'E' | 'NE' | 'GT' | 'NGT' | 'LT' | 'NLT' | 'GTOE' | 'NLGOE' | 'LTOE' | 'NLTOE';
    value: any; // Value to compare against
}

export type StatusCondition = {
    statusUUID: string; // UUID of the status to check
    shouldBeActive: boolean; // Whether the flag should be active or not
    flagUUID: string;   // UUID of the flag to check
}

// Status Collection Save Simplicity Tytpes
export type SimpleStatusCollection = {
    UUID: string;
    name: string;
    description: string;
    statusesUUIDs: string[];
}

export type SimpleStatus = {
    UUID: string;
    name: string;
    defaultFlagUUID: string;
    flagUUIDs: string[]; // Only store the UUIDs of the flags
}
// #endregion

// #region 3D Vector type
export type Vector3D = {
    x: number;
    y: number;
    z: number;
};
// #endregion

// #region File Types
export type FileMetadata = {
    name: string;
    lastModified: string;
    fileSize: number;
    [additionalField: string]: any;
}

export type MediaFileMetadata = FileMetadata & {
    UUID: string;
    file_type: 'img' | 'aud';
    relative_filepath: string;
}

export type StatusCollectionFileMetadata = FileMetadata & {
    UUID: string;
    name: string;
    description: string;
}
// #endregion