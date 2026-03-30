import { TabHandler } from "../../shared/compiled_js/main/tab_handler.js";
const TAB_IDS = {
    liveInterface: { tabId: 'live_interface_tab', buttonId: 'live_interface_tab_button' },
    preferences: { tabId: 'preferences_tab', buttonId: 'preferences_tab_button' },
};
new TabHandler(TAB_IDS);
TabHandler.INSTANCE.setTabEnabled('liveInterface', true);
TabHandler.INSTANCE.setTabEnabled('preferences', true);
//# sourceMappingURL=gcs_tab_handler.js.map