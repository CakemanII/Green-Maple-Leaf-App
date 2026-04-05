/**
 * EditorScreen - Represents a single screen with its objects
 */
export class EditorScreen {
    constructor(screenData) {
        this.data = screenData;
        this.objects = [...screenData.objects];
    }
    addObject(obj) {
        this.objects.push(obj);
        this.data.objects = this.objects;
    }
    removeObject(uuid) {
        this.objects = this.objects.filter(o => o.uuid !== uuid);
        this.data.objects = this.objects;
    }
    getObject(uuid) {
        return this.objects.find(o => o.uuid === uuid);
    }
    updateObject(uuid, updates) {
        const obj = this.getObject(uuid);
        if (obj) {
            Object.assign(obj, updates);
        }
    }
    moveObjectForward(uuid) {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index < this.objects.length - 1) {
            [this.objects[index], this.objects[index + 1]] = [this.objects[index + 1], this.objects[index]];
            this.updateZIndices();
        }
    }
    moveObjectBackward(uuid) {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index > 0) {
            [this.objects[index], this.objects[index - 1]] = [this.objects[index - 1], this.objects[index]];
            this.updateZIndices();
        }
    }
    moveObjectToFront(uuid) {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index >= 0) {
            const [obj] = this.objects.splice(index, 1);
            this.objects.push(obj);
            this.updateZIndices();
        }
    }
    moveObjectToBack(uuid) {
        const index = this.objects.findIndex(o => o.uuid === uuid);
        if (index >= 0) {
            const [obj] = this.objects.splice(index, 1);
            this.objects.unshift(obj);
            this.updateZIndices();
        }
    }
    updateZIndices() {
        this.objects.forEach((obj, index) => {
            obj.zIndex = index;
        });
        this.data.objects = this.objects;
    }
}
//# sourceMappingURL=editor_screen.js.map