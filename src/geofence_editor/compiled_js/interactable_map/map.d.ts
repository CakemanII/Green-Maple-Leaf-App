export declare const MAP_LAYER_INDICES: {
    [key: string]: [number, number] | number;
};
export declare class InteractiveMap {
    static mapInstance: L.Map;
    private readonly HOME_LATITUDE;
    private readonly HOME_LONGITUDE;
    private readonly INITIAL_ZOOM;
    constructor();
}
