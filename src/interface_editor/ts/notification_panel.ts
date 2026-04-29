/**
 * NotificationPanel - Manages notification configurations in the interface editor.
 * Notifications appear in the live interface when a status flag changes.
 */

import type { NotificationConfig, ScreenCollection } from './types.js';
import { ColorPickerPrompt } from '../../shared/compiled_js/prompts.js';

export class NotificationPanel {
    private container: HTMLDivElement;
    private collection: ScreenCollection | null = null;
    private onChanged: () => void;

    constructor(container: HTMLDivElement, onChanged: () => void) {
        this.container = container;
        this.onChanged = onChanged;
    }

    public loadCollection(collection: ScreenCollection): void {
        this.collection = collection;
        if (!this.collection.notifications) {
            this.collection.notifications = [];
        }
        this.render();
    }

    public clear(): void {
        this.collection = null;
        this.container.innerHTML = '<p class="hint-text">Load a collection to manage notifications.</p>';
    }

    private render(): void {
        if (!this.collection) return;

        const notifications = this.collection.notifications;

        let html = '<div class="notification-panel-list">';

        if (notifications.length === 0) {
            html += '<p class="hint-text" style="padding:8px 0;">No notifications configured. Click below to add one.</p>';
        }

        html += '</div>';
        html += '<button class="prop-add-label-btn" id="notif-add-btn">+ Add Notification</button>';

        this.container.innerHTML = html;

        const list = this.container.querySelector<HTMLDivElement>('.notification-panel-list')!;
        notifications.forEach((notif, index) => this.renderNotificationRow(list, notif, index));

        document.getElementById('notif-add-btn')?.addEventListener('click', () => {
            this.addNotification();
        });
    }

    private renderNotificationRow(container: HTMLDivElement, notif: NotificationConfig, index: number): void {
        const card = document.createElement('div');
        card.className = 'notif-card';
        card.style.cssText = `
            border: 1px solid #333;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 8px;
            background: #1e1e1e;
            border-left: 4px solid ${notif.color};
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

        const swatch = document.createElement('div');
        swatch.style.cssText = `width:14px;height:14px;border-radius:3px;background:${notif.color};cursor:pointer;flex-shrink:0;`;
        swatch.title = 'Click to change color';
        swatch.addEventListener('click', (e: MouseEvent) => {
            new ColorPickerPrompt(
                notif.color, e,
                (c: string) => { notif.color = c; this.onChanged(); this.render(); },
                (c: string) => { swatch.style.backgroundColor = c; card.style.borderLeftColor = c; },
                () => {}
            );
        });

        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'flex:1;color:#ddd;font-size:13px;font-weight:500;';
        labelSpan.textContent = notif.label || '(untitled)';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'prop-label-remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            this.collection!.notifications.splice(index, 1);
            this.onChanged();
            this.render();
        });

        header.appendChild(swatch);
        header.appendChild(labelSpan);
        header.appendChild(removeBtn);

        // Form fields
        const fields = document.createElement('div');
        fields.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

        const textInput = (label: string, value: string, onChange: (v: string) => void) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
            const lbl = document.createElement('label');
            lbl.style.cssText = 'color:#888;font-size:11px;';
            lbl.textContent = label;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'property-input';
            input.value = value;
            input.addEventListener('input', () => { onChange(input.value); this.onChanged(); if (label === 'Label') { labelSpan.textContent = input.value || '(untitled)'; } });
            wrap.appendChild(lbl);
            wrap.appendChild(input);
            return wrap;
        };

        const checkInput = (label: string, value: boolean, onChange: (v: boolean) => void) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = value;
            cb.addEventListener('change', () => { onChange(cb.checked); this.onChanged(); });
            const lbl = document.createElement('label');
            lbl.style.cssText = 'color:#888;font-size:11px;';
            lbl.textContent = label;
            wrap.appendChild(cb);
            wrap.appendChild(lbl);
            return wrap;
        };

        fields.appendChild(textInput('Label', notif.label, v => notif.label = v));
        fields.appendChild(textInput('Title', notif.title, v => notif.title = v));
        fields.appendChild(textInput('Message Text', notif.text, v => notif.text = v));
        fields.appendChild(textInput('Status Collection UUID', notif.statusCollectionUUID, v => notif.statusCollectionUUID = v));
        fields.appendChild(textInput('Status UUID', notif.statusUUID, v => notif.statusUUID = v));
        fields.appendChild(textInput('Flag UUID', notif.flagUUID, v => notif.flagUUID = v));
        fields.appendChild(checkInput('Flashing', notif.flashing, v => notif.flashing = v));
        fields.appendChild(checkInput('Display Status Image', notif.displayStatusImage, v => notif.displayStatusImage = v));
        fields.appendChild(checkInput('Play Audio', notif.playFlagAudio, v => notif.playFlagAudio = v));

        card.appendChild(header);
        card.appendChild(fields);
        container.appendChild(card);
    }

    private addNotification(): void {
        if (!this.collection) return;
        const newNotif: NotificationConfig = {
            uuid: crypto.randomUUID(),
            label: 'New Notification',
            color: '#6ba3ff',
            flashing: false,
            title: 'Alert',
            text: '',
            displayStatusImage: true,
            playFlagAudio: false,
            statusCollectionUUID: '',
            statusUUID: '',
            flagUUID: ''
        };
        this.collection.notifications.push(newNotif);
        this.onChanged();
        this.render();
    }
}
