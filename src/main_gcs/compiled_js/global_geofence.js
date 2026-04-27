export class GlobalGeofence {
    static get INSTANCE() { return GlobalGeofence.instance; }
    constructor() {
        this.geofenceIframeIDs = ['live_interface_tab'];
        this.geofenceIframes = [];
        this.loadedGeofences = [];
        if (GlobalGeofence.instance) {
            throw new Error("Use GlobalGeofence.INSTANCE to access the singleton instance.");
        }
        GlobalGeofence.instance = this;
        this.geofenceIframes = this.geofenceIframeIDs
            .map(id => document.getElementById(id))
            .filter(iframe => {
            if (!iframe)
                console.warn(`GlobalGeofence: iframe '${iframe}' not found.`);
            return iframe !== null;
        });
        this.initializeAsync();
    }
    async initializeAsync() {
        await this.loadGeofences();
        this.broadcastGeofences();
        console.log(`[GlobalGeofence] Loaded ${this.loadedGeofences.length} geofence file(s).`);
    }
    async loadGeofences() {
        try {
            const listResp = await fetch('/geofence/list_metadatas');
            if (!listResp.ok)
                return;
            const listData = await listResp.json();
            const metadatas = listData.metadatas || [];
            for (const meta of metadatas) {
                const resp = await fetch(`/geofence/fetch?uuid=${meta.UUID}`);
                if (!resp.ok)
                    continue;
                const geofence = JSON.parse(await resp.text());
                this.loadedGeofences.push(geofence);
            }
        }
        catch (error) {
            console.error('[GlobalGeofence] Failed to load geofences:', error);
        }
    }
    /**
     * Load specific geofences by UUID (called by operational mode file selection).
     */
    async loadFromUUIDs(uuids) {
        this.loadedGeofences = [];
        for (const uuid of uuids) {
            const resp = await fetch(`/geofence/fetch?uuid=${uuid}`);
            if (!resp.ok)
                continue;
            const geofence = JSON.parse(await resp.text());
            this.loadedGeofences.push(geofence);
        }
        this.broadcastGeofences();
        console.log(`[GlobalGeofence] Reloaded ${this.loadedGeofences.length} geofence(s).`);
    }
    broadcastGeofences() {
        const allRegions = [].concat(...this.loadedGeofences.map((g) => g.regions));
        const message = { type: 'geofenceUpdate', regions: allRegions };
        this.geofenceIframes.forEach(iframe => {
            var _a;
            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(message, '*');
        });
    }
}
//# sourceMappingURL=global_geofence.js.map