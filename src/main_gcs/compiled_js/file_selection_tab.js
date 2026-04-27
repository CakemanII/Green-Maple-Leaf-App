"use strict";
const STORAGE_KEY_GEOFENCES = 'fileSelection_geofenceUUIDs';
const STORAGE_KEY_STATUSES = 'fileSelection_statusCollectionUUIDs';
const STORAGE_KEY_INTERFACE = 'fileSelection_interfaceCollectionUUID';
function loadSelected(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    catch (_a) {
        return [];
    }
}
function saveSelected(key, uuids) {
    localStorage.setItem(key, JSON.stringify(uuids));
}
function buildCheckboxList(listEl, metaEl, items, storageKey, multi) {
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
        if (!multi)
            input.name = storageKey;
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
            if (e.target !== input)
                input.click();
        });
        listEl.appendChild(li);
    });
}
function collectChecked(listEl) {
    return Array.from(listEl.querySelectorAll('input:checked')).map(i => i.value);
}
async function fetchMetadatas(endpoint) {
    try {
        const resp = await fetch(endpoint);
        if (!resp.ok)
            return [];
        const data = await resp.json();
        return data.metadatas || [];
    }
    catch (_a) {
        return [];
    }
}
async function init() {
    const geofenceList = document.getElementById('geofence-list');
    const statusList = document.getElementById('status-list');
    const interfaceList = document.getElementById('interface-list');
    const geofenceMeta = document.getElementById('geofence-meta');
    const statusMeta = document.getElementById('status-meta');
    const interfaceMeta = document.getElementById('interface-meta');
    const applyBtn = document.getElementById('apply-btn');
    const footerStatus = document.getElementById('footer-status');
    const [geofences, statuses, interfaces] = await Promise.all([
        fetchMetadatas('/geofence/list_metadatas'),
        fetchMetadatas('/status_collection/list_metadatas'),
        fetchMetadatas('/interface_collection/list_metadatas'),
    ]);
    buildCheckboxList(geofenceList, geofenceMeta, geofences, STORAGE_KEY_GEOFENCES, true);
    buildCheckboxList(statusList, statusMeta, statuses, STORAGE_KEY_STATUSES, true);
    buildCheckboxList(interfaceList, interfaceMeta, interfaces, STORAGE_KEY_INTERFACE, false);
    applyBtn.addEventListener('click', () => {
        var _a;
        const selectedGeofences = collectChecked(geofenceList);
        const selectedStatuses = collectChecked(statusList);
        const selectedInterface = collectChecked(interfaceList);
        saveSelected(STORAGE_KEY_GEOFENCES, selectedGeofences);
        saveSelected(STORAGE_KEY_STATUSES, selectedStatuses);
        saveSelected(STORAGE_KEY_INTERFACE, selectedInterface);
        // Notify parent window to recompile with new selections
        window.parent.postMessage({
            type: 'fileSelectionApplied',
            geofenceUUIDs: selectedGeofences,
            statusCollectionUUIDs: selectedStatuses,
            interfaceCollectionUUID: (_a = selectedInterface[0]) !== null && _a !== void 0 ? _a : null,
        }, '*');
        footerStatus.textContent = `Selections saved. ${selectedGeofences.length} geofence(s), ${selectedStatuses.length} status collection(s), ${selectedInterface.length > 0 ? '1' : '0'} interface.`;
    });
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=file_selection_tab.js.map