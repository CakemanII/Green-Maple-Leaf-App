export type GeofenceAnchorPoint = {
    anchorPos: {
        lat: number;
        lng: number;
    };
    relIncomingHandlePos: {
        lat: number;
        lng: number;
    } | null;
    relOutgoingHandlePos: {
        lat: number;
        lng: number;
    } | null;
};
export type GeofenceRegion = {
    UUID: string;
    LayerIndex: number;
    RegionType: number;
    General: {
        Name: string;
        IsVisible: boolean;
        IsRestricted: boolean;
    };
    Style: {
        FillColor: string;
        FillOpacity: number;
        StrokeColor: string;
        StrokeOpacity: number;
    };
    FrontEndData: GeofenceAnchorPoint[];
};
export type Geofence = {
    metadata: {
        UUID: string;
        name: string;
        lastModified: string;
        fileSize: number;
    };
    regions: GeofenceRegion[];
};
export type StatusCollection = {
    UUID: string;
    name: string;
    description: string;
    statuses: Status[];
};
export type Status = {
    UUID: string;
    name: string;
    defaultFlag: Flag;
    flags: Flag[];
};
export type Flag = {
    UUID: string;
    name: string;
    description: string;
    imageUUID: string | null;
    imageDisplayName: string | null;
    audioUUID: string | null;
    audioDisplayName: string | null;
    audioRepeat: boolean;
    primaryConditionalGroup: ConditionalGroup | null;
};
export type ConditionalGroup = {
    name?: string;
    not: boolean;
    type: 'AND' | 'OR' | 'CONDITION';
    embededConditionalGroups?: ConditionalGroup[] | null;
    condition?: TelemetryCondition | StatusCondition | CommentCondition | null;
    editorColor?: string;
};
export type TelemetryCondition = {
    telemetryKey: string;
    operator: 'E' | 'NE' | 'GT' | 'NGT' | 'LT' | 'NLT' | 'GTOE' | 'NGTOE' | 'LTOE' | 'NLTOE' | 'IS' | 'ISNOT';
    value: any;
};
export type StatusConditionalType = 'IS_ACTIVE' | 'IS_NOT_ACTIVE' | 'HAS_BEEN_ACTIVE' | 'HAS_NOT_BEEN_ACTIVE';
export type StatusCondition = {
    statusKey: string;
    conditionalType: StatusConditionalType;
    flagUUID: string;
};
export type CommentCondition = {
    comment: string;
};
export type SimpleStatusCollection = {
    UUID: string;
    name: string;
    description: string;
    statusesUUIDs: string[];
};
export type SimpleStatus = {
    UUID: string;
    name: string;
    defaultFlagUUID: string;
    flagUUIDs: string[];
};
export type Vector3D = {
    x: number;
    y: number;
    z: number;
};
export type FileMetadata = {
    name: string;
    lastModified: string;
    fileSize: number;
    [additionalField: string]: any;
};
export type MediaFileMetadata = FileMetadata & {
    UUID: string;
    file_type: 'img' | 'aud';
    relative_filepath: string;
};
export type StatusCollectionFileMetadata = FileMetadata & {
    UUID: string;
    name: string;
    description: string;
};
export declare enum InterfaceObjectType {
    PANEL = 0,
    LINE_GRAPH = 1,
    BAR_GRAPH = 2,
    THREE_D_MODEL_ABS_ROTATION = 3,
    STATUS_DISPLAY = 4,
    MINIMAP = 5
}
export type InterfaceObjectData = {
    type: InterfaceObjectType;
    posX: number;
    posY: number;
    width: number;
    height: number;
    childrenInterfaceObjects?: InterfaceObjectData[];
    monitorDataKey?: string;
    monitorDataKeys?: string[];
};
