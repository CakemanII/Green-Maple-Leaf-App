/**
 * ScreenTabBar - Manages screen tabs at bottom of editor
 */
import { SingleTextInputPrompt } from '../../shared/compiled_js/prompts.js';
export class ScreenTabBar {
    constructor(container) {
        this.screens = [];
        this.activeScreenUuid = null;
        this.eventListeners = new Map();
        this.container = container;
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        const addBtn = document.getElementById('add-screen-btn');
        addBtn === null || addBtn === void 0 ? void 0 : addBtn.addEventListener('click', () => {
            new SingleTextInputPrompt('New Screen', 'Enter a name for the new screen:', `Screen ${this.screens.length + 1}`, 'Create', 'Cancel', (name) => { if (name.trim())
                this.emit('screenAdded', name.trim()); });
        });
        // Context menu handling
        this.container.addEventListener('contextmenu', (e) => {
            const target = e.target;
            if (target.classList.contains('screen-tab')) {
                e.preventDefault();
                this.showContextMenu(e, target.dataset.uuid);
            }
        });
    }
    setScreens(screens) {
        this.screens = screens;
        this.render();
    }
    setActiveScreen(uuid) {
        this.activeScreenUuid = uuid;
        this.render();
    }
    render() {
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
    showContextMenu(e, uuid) {
        const menu = document.getElementById('screen-tab-context-menu');
        if (!menu)
            return;
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        // Clear previous listeners
        const renameBtn = document.getElementById('context-rename-screen');
        const duplicateBtn = document.getElementById('context-duplicate-screen');
        const deleteBtn = document.getElementById('context-delete-screen');
        const newRenameBtn = renameBtn === null || renameBtn === void 0 ? void 0 : renameBtn.cloneNode(true);
        const newDuplicateBtn = duplicateBtn === null || duplicateBtn === void 0 ? void 0 : duplicateBtn.cloneNode(true);
        const newDeleteBtn = deleteBtn === null || deleteBtn === void 0 ? void 0 : deleteBtn.cloneNode(true);
        renameBtn === null || renameBtn === void 0 ? void 0 : renameBtn.replaceWith(newRenameBtn);
        duplicateBtn === null || duplicateBtn === void 0 ? void 0 : duplicateBtn.replaceWith(newDuplicateBtn);
        deleteBtn === null || deleteBtn === void 0 ? void 0 : deleteBtn.replaceWith(newDeleteBtn);
        newRenameBtn === null || newRenameBtn === void 0 ? void 0 : newRenameBtn.addEventListener('click', () => {
            var _a;
            const screen = this.screens.find(s => s.uuid === uuid);
            menu.style.display = 'none';
            new SingleTextInputPrompt('Rename Screen', 'Enter a new name for the screen:', (_a = screen === null || screen === void 0 ? void 0 : screen.name) !== null && _a !== void 0 ? _a : '', 'Rename', 'Cancel', (newName) => { if (newName.trim())
                this.emit('screenRenamed', uuid, newName.trim()); });
        });
        newDuplicateBtn === null || newDuplicateBtn === void 0 ? void 0 : newDuplicateBtn.addEventListener('click', () => {
            this.emit('screenDuplicated', uuid);
            menu.style.display = 'none';
        });
        newDeleteBtn === null || newDeleteBtn === void 0 ? void 0 : newDeleteBtn.addEventListener('click', () => {
            this.emit('screenDeleted', uuid);
            menu.style.display = 'none';
        });
        // Hide menu on click outside
        const hideMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.style.display = 'none';
                document.removeEventListener('click', hideMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 0);
    }
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    emit(event, ...args) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }
}
//# sourceMappingURL=screen_tab_bar.js.map