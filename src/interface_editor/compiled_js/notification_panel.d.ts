/**
 * NotificationPanel - Manages notification configurations in the interface editor.
 * Notifications appear in the live interface when a status flag changes.
 */
import type { ScreenCollection } from './types.js';
export declare class NotificationPanel {
    private container;
    private collection;
    private onChanged;
    constructor(container: HTMLDivElement, onChanged: () => void);
    loadCollection(collection: ScreenCollection): void;
    clear(): void;
    private render;
    private renderNotificationRow;
    private addNotification;
}
