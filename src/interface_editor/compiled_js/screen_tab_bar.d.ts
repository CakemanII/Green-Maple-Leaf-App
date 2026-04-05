/**
 * ScreenTabBar - Manages screen tabs at bottom of editor
 */
import type { Screen } from './types.js';
type EventCallback = (...args: any[]) => void;
export declare class ScreenTabBar {
    private container;
    private screens;
    private activeScreenUuid;
    private eventListeners;
    constructor(container: HTMLDivElement);
    private initializeEventListeners;
    setScreens(screens: Screen[]): void;
    setActiveScreen(uuid: string): void;
    private render;
    private showContextMenu;
    on(event: string, callback: EventCallback): void;
    private emit;
}
export {};
