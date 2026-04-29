declare const STORAGE_KEY_GEOFENCES = "fileSelection_geofenceUUIDs";
declare const STORAGE_KEY_STATUSES = "fileSelection_statusCollectionUUIDs";
declare const STORAGE_KEY_INTERFACE = "fileSelection_interfaceCollectionUUID";
interface FileMeta {
    UUID: string;
    name: string;
    lastModified: string;
}
declare function loadSelected(key: string): string[];
declare function saveSelected(key: string, uuids: string[]): void;
declare function buildCheckboxList(listEl: HTMLUListElement, metaEl: HTMLElement, items: FileMeta[], storageKey: string, multi: boolean): void;
declare function collectChecked(listEl: HTMLUListElement): string[];
declare function fetchMetadatas(endpoint: string): Promise<FileMeta[]>;
declare function init(): Promise<void>;
