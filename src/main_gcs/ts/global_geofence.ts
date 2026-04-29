import { Geofence } from '../../shared/compiled_js/types.js';

export class GlobalGeofence {
    private static instance: GlobalGeofence;
    public static get INSTANCE(): GlobalGeofence { return GlobalGeofence.instance; }

    private readonly geofenceIframeIDs: string[] = ['live_interface_tab'];
    private geofenceIframes: HTMLIFrameElement[] = [];
    private loadedGeofences: Geofence[] = [];

    constructor() {
        if (GlobalGeofence.instance) {
            throw new Error("Use GlobalGeofence.INSTANCE to access the singleton instance.");
        }
        GlobalGeofence.instance = this;

        this.geofenceIframes = this.geofenceIframeIDs
            .map(id => document.getElementById(id) as HTMLIFrameElement)
            .filter(iframe => {
                if (!iframe) console.warn(`GlobalGeofence: iframe '${iframe}' not found.`);
                return iframe !== null;
            });

        this.initializeAsync();
    }

    private async initializeAsync(): Promise<void> {
        await this.loadGeofences();
        this.broadcastGeofences();
        console.log(`[GlobalGeofence] Loaded ${this.loadedGeofences.length} geofence file(s).`);
    }

    private async loadGeofences(): Promise<void> {
        try {
            const listResp = await fetch('/geofence/list_metadatas');
            if (!listResp.ok) return;
            const listData = await listResp.json();
            const metadatas: { UUID: string }[] = listData.metadatas || [];

            for (const meta of metadatas) {
                const resp = await fetch(`/geofence/fetch?uuid=${meta.UUID}`);
                if (!resp.ok) continue;
                const geofence: Geofence = JSON.parse(await resp.text());
                this.loadedGeofences.push(geofence);
            }
        } catch (error) {
            console.error('[GlobalGeofence] Failed to load geofences:', error);
        }
    }

    /**
     * Load specific geofences by UUID (called by operational mode file selection).
     */
    public async loadFromUUIDs(uuids: string[]): Promise<void> {
        this.loadedGeofences = [];
        for (const uuid of uuids) {
            const resp = await fetch(`/geofence/fetch?uuid=${uuid}`);
            if (!resp.ok) continue;
            const geofence: Geofence = JSON.parse(await resp.text());
            this.loadedGeofences.push(geofence);
        }
        this.broadcastGeofences();
        console.log(`[GlobalGeofence] Reloaded ${this.loadedGeofences.length} geofence(s).`);
    }

    private broadcastGeofences(): void {
        const allRegions = ([] as Geofence['regions']).concat(...this.loadedGeofences.map((g: Geofence) => g.regions));
        const message = { type: 'geofenceUpdate', regions: allRegions };
        this.geofenceIframes.forEach(iframe => {
            iframe.contentWindow?.postMessage(message, '*');
        });
    }
}