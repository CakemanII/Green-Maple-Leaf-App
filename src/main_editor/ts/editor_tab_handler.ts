import { TabHandler } from "../../shared/ts/tab_handler";

const TAB_IDS: Record<string, { tabId: string; buttonId: string }> = {
    interfaceEditor: { tabId: 'interface_editor_tab', buttonId: 'interface_editor_tab_button' },
    statusEditor:    { tabId: 'status_editor_tab',     buttonId: 'status_editor_tab_button' },
    geofenceEditor:  { tabId: 'geofence_editor_tab',  buttonId: 'geofence_editor_tab_button' },
    preferences:     { tabId: 'preferences_tab',      buttonId: 'preferences_tab_button' },
    settings:        { tabId: 'settings_tab',         buttonId: 'settings_tab_button' },
};

new TabHandler(TAB_IDS);