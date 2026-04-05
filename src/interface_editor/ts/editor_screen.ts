/**
 * EditorScreen - Represents a single screen with its objects
 */

import type { Screen, InterfaceObject } from './types.js';

export class EditorScreen {
    public data: Screen;
    public objects: InterfaceObject[];

    constructor(screenData: Screen) {
        this.data = screenData;
        this.objects = [...screenData.objects];
    }

    public addObject(obj: InterfaceObject): void {
        this.objects.push(obj);
        this.data.objects = this.objects;
    }

    public removeObject(uuid: string): void {
        this.objects = this.objects.filter(o => o.uuid !== uuid);
        this.data.objects = this.objects;
    }

    public getObject(uuid: string): InterfaceObject | undefined {
        return this.objects.find(o => o.uuid === uuid);
    }

    public updateObject(uuid: string, updates: Partial<InterfaceObject>): void {
        const obj = this.getObject(uuid);
        if (obj) {
            Object.assign(obj, updates);
        }
    }

    public moveObjectForward(uuid: string): void {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index < this.objects.length - 1) {
            [this.objects[index], this.objects[index + 1]] = [this.objects[index + 1], this.objects[index]];
            this.updateZIndices();
        }
    }

    public moveObjectBackward(uuid: string): void {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index > 0) {
            [this.objects[index], this.objects[index - 1]] = [this.objects[index - 1], this.objects[index]];
            this.updateZIndices();
        }
    }

    public moveObjectToFront(uuid: string): void {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index >= 0) {
            const [obj] = this.objects.splice(index, 1);
            this.objects.push(obj);
            this.updateZIndices();
        }
    }

    public moveObjectToBack(uuid: string): void {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index >= 0) {
            const [obj] = this.objects.splice(index, 1);
            this.objects.unshift(obj);
            this.updateZIndices();
        }
    }

    private updateZIndices(): void {
        this.objects.forEach((obj, index) => {
            obj.zIndex = index;
        });
        this.data.objects = this.objects;
    }
}
