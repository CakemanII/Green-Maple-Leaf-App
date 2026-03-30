import { TabHandler } from "../../shared/compiled_js/main/tab_handler.js";
const TAB_IDS = {
    interfaceEditor: { tabId: 'interface_editor_tab', buttonId: 'interface_editor_tab_button' },
    statusEditor: { tabId: 'status_editor_tab', buttonId: 'status_editor_tab_button' },
    geofenceEditor: { tabId: 'geofence_editor_tab', buttonId: 'geofence_editor_tab_button' },
    preferences: { tabId: 'preferences_tab', buttonId: 'preferences_tab_button' },
    settings: { tabId: 'settings_tab', buttonId: 'settings_tab_button' },
};
new TabHandler(TAB_IDS);
TabHandler.INSTANCE.setTabEnabled('interfaceEditor', true);
TabHandler.INSTANCE.setTabEnabled('statusEditor', true);
TabHandler.INSTANCE.setTabEnabled('geofenceEditor', true);
TabHandler.INSTANCE.setTabEnabled('preferences', true);
TabHandler.INSTANCE.setTabEnabled('settings', true);
//# sourceMappingURL=editor_tab_handler.js.map