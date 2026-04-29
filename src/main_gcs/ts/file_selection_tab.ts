const STORAGE_KEY_GEOFENCES = 'fileSelection_geofenceUUIDs';
const STORAGE_KEY_STATUSES  = 'fileSelection_statusCollectionUUIDs';
const STORAGE_KEY_INTERFACE = 'fileSelection_interfaceCollectionUUID';

interface FileMeta { UUID: string; name: string; lastModified: string; }

function loadSelected(key: string): string[] {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function saveSelected(key: string, uuids: string[]): void {
    localStorage.setItem(key, JSON.stringify(uuids));
}

function buildCheckboxList(
    listEl: HTMLUListElement,
    metaEl: HTMLElement,
    items: FileMeta[],
    storageKey: string,
    multi: boolean
): void {
    listEl.innerHTML = '';
    const selected = loadSelected(storageKey);

    if (items.length === 0) {
        listEl.innerHTML = '<li class="empty-state">No files found.</li>';
        metaEl.textContent = '0 files';
        return;
    }

    metaEl.textContent = `${items.length} file${items.length !== 1 ? 's' : ''}`;

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'file-item';

        const input = document.createElement('input');
        input.type = multi ? 'checkbox' : 'radio';
        if (!multi) input.name = storageKey;
        input.value = item.UUID;
        input.checked = selected.includes(item.UUID);

        const info = document.createElement('div');
        info.className = 'file-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'file-name';
        nameEl.textContent = item.name || item.UUID;

        const dateEl = document.createElement('div');
        dateEl.className = 'file-date';
        dateEl.textContent = new Date(item.lastModified).toLocaleString();

        info.appendChild(nameEl);
        info.appendChild(dateEl);
        li.appendChild(input);
        li.appendChild(info);

        li.addEventListener('click', (e) => {
            if (e.target !== input) input.click();
        });

        listEl.appendChild(li);
    });
}

function collectChecked(listEl: HTMLUListElement): string[] {
    return Array.from(listEl.querySelectorAll<HTMLInputElement>('input:checked')).map(i => i.value);
}

async function fetchMetadatas(endpoint: string): Promise<FileMeta[]> {
    try {
        const resp = await fetch(endpoint);
        if (!resp.ok) return [];
        const data = await resp.json();
        return data.metadatas || [];
    } catch { return []; }
}

async function init(): Promise<void> {
    const geofenceList  = document.getElementById('geofence-list')  as HTMLUListElement;
    const statusList    = document.getElementById('status-list')    as HTMLUListElement;
    const interfaceList = document.getElementById('interface-list') as HTMLUListElement;
    const geofenceMeta  = document.getElementById('geofence-meta')!;
    const statusMeta    = document.getElementById('status-meta')!;
    const interfaceMeta = document.getElementById('interface-meta')!;
    const applyBtn      = document.getElementById('apply-btn')       as HTMLButtonElement;
    const footerStatus  = document.getElementById('footer-status')!;

    const [geofences, statuses, interfaces] = await Promise.all([
        fetchMetadatas('/geofence/list_metadatas'),
        fetchMetadatas('/status_collection/list_metadatas'),
        fetchMetadatas('/interface_collection/list_metadatas'),
    ]);

    buildCheckboxList(geofenceList,  geofenceMeta,  geofences,   STORAGE_KEY_GEOFENCES, true);
    buildCheckboxList(statusList,    statusMeta,    statuses,    STORAGE_KEY_STATUSES,  true);
    buildCheckboxList(interfaceList, interfaceMeta, interfaces,  STORAGE_KEY_INTERFACE, false);

    applyBtn.addEventListener('click', () => {
        const selectedGeofences  = collectChecked(geofenceList);
        const selectedStatuses   = collectChecked(statusList);
        const selectedInterface  = collectChecked(interfaceList);

        saveSelected(STORAGE_KEY_GEOFENCES, selectedGeofences);
        saveSelected(STORAGE_KEY_STATUSES,  selectedStatuses);
        saveSelected(STORAGE_KEY_INTERFACE, selectedInterface);

        // Notify parent window to recompile with new selections
        window.parent.postMessage({
            type: 'fileSelectionApplied',
            geofenceUUIDs:           selectedGeofences,
            statusCollectionUUIDs:   selectedStatuses,
            interfaceCollectionUUID: selectedInterface[0] ?? null,
        }, '*');

        footerStatus.textContent = `Selections saved. ${selectedGeofences.length} geofence(s), ${selectedStatuses.length} status collection(s), ${selectedInterface.length > 0 ? '1' : '0'} interface.`;
    });
}

document.addEventListener('DOMContentLoaded', init);
