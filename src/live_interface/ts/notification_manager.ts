/**
 * NotificationManager - Displays live notifications when status flags change.
 * Listens for status updates and shows timed notification cards in the bottom-right corner.
 */

import { StatusesReference } from '../../shared/compiled_js/global_statuses_reference.js';
import type { Flag } from '../../shared/compiled_js/types.js';

type NotificationConfig = {
    uuid: string;
    label: string;
    color: string;
    flashing: boolean;
    title: string;
    text: string;
    displayStatusImage: boolean;
    playFlagAudio: boolean;
    statusCollectionUUID: string;
    statusUUID: string;
    flagUUID: string;
};

const AUTO_DISMISS_MS = 20_000;

class NotificationManager {
    private static instance: NotificationManager;
    public static get INSTANCE(): NotificationManager { return NotificationManager.instance; }

    private notifications: NotificationConfig[] = [];
    private container!: HTMLDivElement;

    constructor() {
        if (NotificationManager.instance) {
            throw new Error('NotificationManager is a singleton');
        }
        NotificationManager.instance = this;

        this.createContainer();
        this.listenForCollectionLoads();
        this.listenForStatusUpdates();
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'live-notifications-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            display: flex;
            flex-direction: column-reverse;
            gap: 8px;
            z-index: 9999;
            pointer-events: none;
            max-width: 360px;
        `;
        document.body.appendChild(this.container);
    }

    private listenForCollectionLoads(): void {
        window.addEventListener('message', (e: MessageEvent) => {
            if (e.data?.type === 'loadCollection' && Array.isArray(e.data?.notifications)) {
                this.notifications = e.data.notifications as NotificationConfig[];
            }
        });
    }

    private listenForStatusUpdates(): void {
        StatusesReference.INSTANCE.setOnStatusUpdateCallback((statusUUID: string, flag: Flag) => {
            const matches = this.notifications.filter(n =>
                n.statusUUID === statusUUID && n.flagUUID === flag.UUID
            );
            matches.forEach(n => this.showNotification(n, flag));
        });
    }

    private showNotification(config: NotificationConfig, flag: Flag): void {
        const card = document.createElement('div');
        card.style.cssText = `
            background: #1e1e1e;
            border: 1px solid ${config.color};
            border-left: 4px solid ${config.color};
            border-radius: 8px;
            padding: 12px 14px;
            color: #eee;
            font-size: 13px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            pointer-events: all;
            position: relative;
            animation: notif-slide-in 0.25s ease;
        `;

        if (config.flashing) {
            card.style.animation += ', notif-flash 1s ease-in-out infinite';
        }

        const title = document.createElement('div');
        title.style.cssText = `font-weight: 600; font-size: 14px; color: ${config.color}; margin-bottom: 4px;`;
        title.textContent = config.title || flag.name;

        const body = document.createElement('div');
        body.style.cssText = 'color: #ccc; line-height: 1.4;';
        body.textContent = config.text || flag.name;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 10px;
            background: none;
            border: none;
            color: #888;
            font-size: 16px;
            cursor: pointer;
            line-height: 1;
        `;
        closeBtn.addEventListener('click', () => dismiss());

        if (config.displayStatusImage && flag.imageUUID) {
            const img = document.createElement('img');
            img.src = `/serve_image/${encodeURI((flag.imageUUID ?? '').replace(/\\/g, '/'))}`;
            img.alt = flag.name;
            img.style.cssText = 'max-height:40px;max-width:80px;object-fit:contain;display:block;margin-top:6px;';
            card.appendChild(img);
        }

        card.appendChild(title);
        card.appendChild(body);
        card.appendChild(closeBtn);
        this.container.appendChild(card);

        if (config.playFlagAudio) {
            this.tryPlayAudio(flag.imageUUID ?? null);
        }

        const timer = setTimeout(dismiss, AUTO_DISMISS_MS);

        function dismiss(): void {
            clearTimeout(timer);
            card.style.opacity = '0';
            card.style.transition = 'opacity 0.3s';
            setTimeout(() => card.remove(), 300);
        }
    }

    private tryPlayAudio(audioUUID: string | null): void {
        if (!audioUUID) return;
        const audio = document.createElement('audio');
        audio.src = `/serve_image/${encodeURI(audioUUID.replace(/\\/g, '/'))}`;
        audio.play().catch(() => {});
    }
}

// Inject keyframes
const style = document.createElement('style');
style.textContent = `
@keyframes notif-slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
}
@keyframes notif-flash {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
}
`;
document.head.appendChild(style);

new NotificationManager();
