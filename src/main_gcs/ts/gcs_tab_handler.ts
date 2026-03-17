import { TabHandler } from "../../shared/compiled_js/tab_handler.js";

const TAB_IDS: Record<string, { tabId: string; buttonId: string }> = {
    liveInterface:   { tabId: 'live_interface_tab',   buttonId: 'live_interface_tab_button' },
    preferences:     { tabId: 'preferences_tab',      buttonId: 'preferences_tab_button' },
    settings:        { tabId: 'settings_tab',         buttonId: 'settings_tab_button' },
};


new TabHandler(TAB_IDS);