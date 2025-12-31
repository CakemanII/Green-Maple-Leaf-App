type Vector3D = {
    x: number;
    y: number;
    z: number;
};

class Utilities
{
    /**
     * Generates a UUID string.
     */
    public static generateUUID(): string {
        // Generate a simple UUID (not RFC4122 compliant)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}