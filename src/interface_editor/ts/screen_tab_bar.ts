/**
 * ScreenTabBar - Manages screen tabs at bottom of editor
 */

import type { Screen } from './types.js';
import { SingleTextInputPrompt } from '../../shared/compiled_js/prompts.js';

type EventCallback = (...args: any[]) => void;

export class ScreenTabBar {
    private container: HTMLDivElement;
    private screens: Screen[] = [];
    private activeScreenUuid: string | null = null;
    private eventListeners: Map<string, EventCallback[]> = new Map();

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        const addBtn = document.getElementById('add-screen-btn');
        addBtn?.addEventListener('click', () => {
            new SingleTextInputPrompt(
                'New Screen',
                'Enter a name for the new screen:',
                `Screen ${this.screens.length + 1}`,
                'Create',
                'Cancel',
                (name: string) => { if (name.trim()) this.emit('screenAdded', name.trim()); }
            );
        });

        // Context menu handling
        this.container.addEventListener('contextmenu', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('screen-tab')) {
                e.preventDefault();
                this.showContextMenu(e, target.dataset.uuid!);
            }
        });
    }

    public setScreens(screens: Screen[]): void {
        this.screens = screens;
        this.render();
    }

    public setActiveScreen(uuid: string): void {
        this.activeScreenUuid = uuid;
        this.render();
    }

    private render(): void {
        const addBtn = this.container.querySelector('#add-screen-btn');
        this.container.innerHTML = '';

        this.screens.forEach(screen => {
            const tab = document.createElement('button');
            tab.className = 'screen-tab';
            tab.textContent = screen.name;
            tab.dataset.uuid = screen.uuid;

            if (screen.uuid === this.activeScreenUuid) {
                tab.classList.add('active');
            }

            tab.addEventListener('click', () => {
                this.emit('screenChanged', screen.uuid);
            });

            this.container.appendChild(tab);
        });

        if (addBtn) {
            this.container.appendChild(addBtn);
        }
    }

    private showContextMenu(e: MouseEvent, uuid: string): void {
        const menu = document.getElementById('screen-tab-context-menu');
        if (!menu) return;

        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        // Clear previous listeners
        const renameBtn = document.getElementById('context-rename-screen');
        const duplicateBtn = document.getElementById('context-duplicate-screen');
        const deleteBtn = document.getElementById('context-delete-screen');

        const newRenameBtn = renameBtn?.cloneNode(true) as HTMLElement;
        const newDuplicateBtn = duplicateBtn?.cloneNode(true) as HTMLElement;
        const newDeleteBtn = deleteBtn?.cloneNode(true) as HTMLElement;

        renameBtn?.replaceWith(newRenameBtn);
        duplicateBtn?.replaceWith(newDuplicateBtn);
        deleteBtn?.replaceWith(newDeleteBtn);

        newRenameBtn?.addEventListener('click', () => {
            const screen = this.screens.find(s => s.uuid === uuid);
            menu.style.display = 'none';
            new SingleTextInputPrompt(
                'Rename Screen',
                'Enter a new name for the screen:',
                screen?.name ?? '',
                'Rename',
                'Cancel',
                (newName: string) => { if (newName.trim()) this.emit('screenRenamed', uuid, newName.trim()); }
            );
        });

        newDuplicateBtn?.addEventListener('click', () => {
            this.emit('screenDuplicated', uuid);
            menu.style.display = 'none';
        });

        newDeleteBtn?.addEventListener('click', () => {
            this.emit('screenDeleted', uuid);
            menu.style.display = 'none';
        });

        // Hide menu on click outside
        const hideMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                menu.style.display = 'none';
                document.removeEventListener('click', hideMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 0);
    }

    public on(event: string, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    private emit(event: string, ...args: any[]): void {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }
}
