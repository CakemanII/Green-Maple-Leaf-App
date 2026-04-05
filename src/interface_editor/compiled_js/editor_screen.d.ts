/**
 * EditorScreen - Represents a single screen with its objects
 */
import type { Screen, InterfaceObject } from './types.js';
export declare class EditorScreen {
    data: Screen;
    objects: InterfaceObject[];
    constructor(screenData: Screen);
    addObject(obj: InterfaceObject): void;
    removeObject(uuid: string): void;
    getObject(uuid: string): InterfaceObject | undefined;
    updateObject(uuid: string, updates: Partial<InterfaceObject>): void;
    moveObjectForward(uuid: string): void;
    moveObjectBackward(uuid: string): void;
    moveObjectToFront(uuid: string): void;
    moveObjectToBack(uuid: string): void;
    private updateZIndices;
}
