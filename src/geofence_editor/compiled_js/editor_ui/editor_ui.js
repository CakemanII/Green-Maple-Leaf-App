import { ColorPickerPrompt, GeoeditFileListViewerPrompt } from "../../../shared/compiled_js/prompts.js";
import { TabMenu } from "../../../shared/compiled_js/tabmenu.js";
import { GeoeditFileManager } from "../geofence_filing.js";
import { InteractiveMap } from "../interactable_map/map.js";
import { ToolType, MapRegionEditorAddHandlesTool, MapRegionEditorConvertToFreeformTool, MapRegionEditorDeleteTool } from "../interactable_map/map_region_editor_tools.js";
import { MapRegionEditor, MapRegionRegionManager, MapRegionDataManager } from "../interactable_map/map_region_editor.js";
import { RegionType } from "../interactable_map/region.js";
export class MapEditorUI {
    static get INSTANCE() { return MapEditorUI.instance; }
    constructor() {
        // Ensure singleton instance
        if (MapEditorUI.instance) {
            console.error("MapEditorUI instance already exists!");
        }
        MapEditorUI.instance = this;
        // Initialize MapEditorUIRegionInfoManager
        new MapEditorUIRegionInfoManager();
        new MapRegionHightlightingHandler();
        new MapEditorUILayerManager();
        // Initialize elements        
        this.sidebarCreateRegionContainer = document.getElementById(MapEditorUI.sidebarCreateRegionContainerID);
        this.sidebarRegionToolsContainer = document.getElementById(MapEditorUI.sidebarRegionToolsContainerID);
        this.sidebarRegionLayersContainer = document.getElementById(MapEditorUI.sidebarRegionLayersContainerID);
        this.sidebarRegionEditInfoContainer = document.getElementById(MapEditorUI.sidebarRegionEditInfoContainerID);
        this.createRectangleRegionButton = document.getElementById(MapEditorUI.createRectangleRegionButtonID);
        this.createCircleRegionButton = document.getElementById(MapEditorUI.createCircleRegionButtonID);
        this.createfreeformRegionButton = document.getElementById(MapEditorUI.createfreeformRegionButtonID);
        // Get footer elements
        this.mapCoordsFooter = document.getElementById(MapEditorUI.mapCoordsFooterElementID);
        this.mapZoomFooter = document.getElementById(MapEditorUI.mapZoomFooterElementID);
        this.mapModeFooter = document.getElementById(MapEditorUI.mapModeFooterElementID);
        // Iterate through tool buttons
        this.initalizeToolButtons();
        // Initialize create region buttons
        this.initializeCreateRegionButtons();
        // Initialize save/load geoedit buttons
        this.initializeTabMenu();
        // Initialize footer
        this.initalizeFooter();
        // Hide add anchor, add handles, and convert to freeform buttons initially
        this.addAnchorButton.style.display = 'none';
        this.addHandlesButton.style.display = 'none';
        this.convertToFreeformButton.style.display = 'none';
        // Setup Initial UI sidebar visibiliy
        this.setCreateRegionSidebarVisibility(true);
        this.setRegionLayersSidebarVisibility(true);
        this.setRegionToolsSidebarVisibility(false);
        this.setRegionEditInfoSidebarVisibility(false);
    }
    // #region Initialization Methods
    initalizeToolButtons() {
        this.moveToolButton = document.getElementById(MapEditorUI.moveToolButtonID);
        this.scaleToolButton = document.getElementById(MapEditorUI.scaleToolButtonID);
        this.rotateToolButton = document.getElementById(MapEditorUI.rotateToolButtonID);
        this.addAnchorButton = document.getElementById(MapEditorUI.addAnchorButtonID);
        this.addHandlesButton = document.getElementById(MapEditorUI.addHandlesButtonID);
        this.convertToFreeformButton = document.getElementById(MapEditorUI.convertToFreeformButtonID);
        this.stopEditingButton = document.getElementById(MapEditorUI.stopEditingButtonID);
        this.deleteRegionButton = document.getElementById(MapEditorUI.deleteRegionButtonID);
        // Primary Tool Buttons
        const primaryToolButtons = [this.moveToolButton, this.rotateToolButton, this.scaleToolButton];
        primaryToolButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    var _a;
                    const tool = (_a = button.querySelector('span')) === null || _a === void 0 ? void 0 : _a.textContent;
                    if (tool) {
                        let mapTool;
                        switch (tool) {
                            case "Move":
                                mapTool = ToolType.Move;
                                break;
                            case "Rotate":
                                mapTool = ToolType.Rotate;
                                break;
                            case "Scale":
                                mapTool = ToolType.Scale;
                                break;
                            default:
                                console.error(`Unknown tool: ${tool}`);
                                return;
                        }
                        MapRegionEditor.INSTANCE.setActivePrimaryTool(mapTool);
                    }
                });
            }
        });
        // Add Anchor Button
        this.addAnchorButton.addEventListener('click', () => {
            MapRegionEditor.INSTANCE.setActiveAddAnchorTool(!MapRegionEditor.INSTANCE.IsAddAnchorToolActive);
        });
        // Add Handles Button
        this.addHandlesButton.addEventListener('click', () => {
            const tool = new MapRegionEditorAddHandlesTool();
            tool.execute();
            tool.removeTool();
        });
        // Convert to Freeform Button
        this.convertToFreeformButton.addEventListener('click', () => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const convertTool = new MapRegionEditorConvertToFreeformTool(activeRegion.GetSetUUID);
                convertTool.execute();
                convertTool.removeTool();
            }
        });
        // Stop Editing Button
        this.stopEditingButton.addEventListener('click', () => {
            MapRegionRegionManager.INSTANCE.stopEditingRegion();
            MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
        });
        // Delete Region Button
        this.deleteRegionButton.addEventListener('click', () => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const deleteTool = new MapRegionEditorDeleteTool(activeRegion.GetSetUUID);
                deleteTool.execute();
                deleteTool.removeTool();
            }
        });
    }
    initalizeFooter() {
        InteractiveMap.mapInstance.on('mousemove', (e) => {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            this.mapCoordsFooter.textContent = `Lat: ${lat}, Lng: ${lng}`;
        });
        InteractiveMap.mapInstance.on('zoom', () => {
            this.mapZoomFooter.textContent = `Zoom: ${InteractiveMap.mapInstance.getZoom()}`;
        });
    }
    initializeCreateRegionButtons() {
        this.createRectangleRegionButton = document.getElementById(MapEditorUI.createRectangleRegionButtonID);
        this.createCircleRegionButton = document.getElementById(MapEditorUI.createCircleRegionButtonID);
        this.createfreeformRegionButton = document.getElementById(MapEditorUI.createfreeformRegionButtonID);
        const regionButtons = [
            [this.createRectangleRegionButton, RegionType.Rectangle],
            [this.createCircleRegionButton, RegionType.Circle],
            [this.createfreeformRegionButton, RegionType.Freeform]
        ];
        regionButtons.forEach(([button, type]) => {
            button.addEventListener('click', () => {
                MapRegionRegionManager.INSTANCE.createRegionFromEditorTriggered(type);
            });
        });
    }
    initializeTabMenu() {
        // Initialize the tab menu
        new TabMenu({
            "save": async () => {
                await GeoeditFileManager.Instance.attemptSaveCurrentToGeoeditFile(false);
                return true; // Close menu after selection
            },
            "save-as": async () => {
                await GeoeditFileManager.Instance.attemptSaveCurrentToGeoeditFile(true);
                return true; // Close menu after selection
            },
            "load": async () => {
                // Show the prompt dialog for selecting a geoedit file
                let finished = false;
                let decision = false;
                new GeoeditFileListViewerPrompt(async (fileMetadata) => {
                    await GeoeditFileManager.Instance.loadGeoeditFile(fileMetadata);
                    finished = true;
                    decision = true;
                }, () => { finished = true; });
                // Wait for finished to be true 
                while (!finished) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return decision; // Close menu after selection
            },
        });
    }
    // #endregion
    // #region Sidebar main visibility methods
    setCreateRegionSidebarVisibility(isVisible) {
        this.sidebarCreateRegionContainer.style.display = isVisible ? 'block' : 'none';
    }
    setRegionToolsSidebarVisibility(isVisible) {
        this.sidebarRegionToolsContainer.style.display = isVisible ? 'block' : 'none';
    }
    setRegionLayersSidebarVisibility(isVisible) {
        this.sidebarRegionLayersContainer.style.display = isVisible ? 'block' : 'none';
    }
    setRegionEditInfoSidebarVisibility(isVisible) {
        this.sidebarRegionEditInfoContainer.style.display = isVisible ? 'block' : 'none';
    }
    // #endregion
    /**
     * Updates the visual selection state of the create region buttons.
     */
    setCreateRegionButtonSelection(regionType, isActive) {
        // Reset all buttons
        const buttons = [
            this.createRectangleRegionButton,
            this.createCircleRegionButton,
            this.createfreeformRegionButton
        ];
        buttons.forEach(button => {
            button.classList.remove('active-tool');
        });
        // Stop if not active
        if (!isActive) {
            return;
        }
        // Highlight the selected button
        if (regionType !== null) {
            let selectedButton = null;
            switch (regionType) {
                case RegionType.Rectangle:
                    selectedButton = this.createRectangleRegionButton;
                    break;
                case RegionType.Circle:
                    selectedButton = this.createCircleRegionButton;
                    break;
                case RegionType.Freeform:
                    selectedButton = this.createfreeformRegionButton;
                    break;
            }
            // Set the selected button as active
            if (selectedButton) {
                selectedButton.classList.add('active-tool');
            }
        }
    }
    /**
     * Updates the active tool display in the UI.
     */
    updateActiveToolDisplay() {
        // Get the current active tool name
        const activeToolType = MapRegionEditor.INSTANCE.ActivePrimaryTool ? MapRegionEditor.INSTANCE.ActivePrimaryTool.ToolType : null;
        if (activeToolType === null || activeToolType === undefined) {
            this.mapModeFooter.textContent = `Active Tool: None`;
            return;
        }
        const activeToolName = ToolType[activeToolType].toLowerCase().replace('tool', '').trim();
        // Visually unhighlight all PRIMARY tool buttons (not add anchor button)
        const primaryToolButtons = [this.moveToolButton, this.rotateToolButton, this.scaleToolButton];
        primaryToolButtons.forEach(button => {
            button.classList.remove('active-tool');
        });
        // Highlight the active PRIMARY tool button
        const toolButtonMap = {
            [ToolType.Move]: this.moveToolButton,
            [ToolType.Rotate]: this.rotateToolButton,
            [ToolType.Scale]: this.scaleToolButton,
            [ToolType.AddAnchor]: this.addAnchorButton,
            [ToolType.Delete]: this.deleteRegionButton,
            [ToolType.ConvertToFreeform]: this.convertToFreeformButton
        };
        const activeButton = toolButtonMap[activeToolType];
        if (activeButton) {
            activeButton.classList.add('active-tool');
        }
        // Handle add anchor button state separately (it's independent of primary tools)
        if (MapRegionEditor.INSTANCE.IsAddAnchorToolActive) {
            this.addAnchorButton.classList.add('active-tool');
        }
        else {
            this.addAnchorButton.classList.remove('active-tool');
        }
        // Convert to title case for display
        const displayName = activeToolName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        // Update the footer display
        this.mapModeFooter.textContent = `Active Tool: ${displayName}`;
    }
    /**
     * Called when the active editing region changes.
     */
    onActiveEditingRegionChanged() {
        // Change the sidebar UI to show region editing info and tools OR hide them if no active region
        const isActivelyEditing = MapRegionRegionManager.INSTANCE.ActiveEditingRegion !== null;
        this.setCreateRegionSidebarVisibility(isActivelyEditing ? false : true);
        this.setRegionToolsSidebarVisibility(isActivelyEditing ? true : false);
        this.setRegionEditInfoSidebarVisibility(isActivelyEditing ? true : false);
        // Update Add Anchor button state
        this.updateRegionDependentButtons();
        // Update all layer edit button states
        MapEditorUILayerManager.INSTANCE.updateAllEditButtonStates();
        // Update info panel
        if (isActivelyEditing) {
            const regionData = MapRegionRegionManager.INSTANCE.ActiveEditingRegion.RegionData;
            MapEditorUIRegionInfoManager.INSTANCE.updateRegionInfoPanel(regionData);
        }
    }
    /**
     * Updates button displays the are dependent on the active region type.
     */
    updateRegionDependentButtons() {
        // Hide if active region is not freeform
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (!activeRegion || activeRegion.regionType !== RegionType.Freeform) {
            this.addAnchorButton.style.display = 'none';
            this.addHandlesButton.style.display = 'none';
        }
        else {
            this.addAnchorButton.style.display = 'inline-block';
            this.addHandlesButton.style.display = 'inline-block';
        }
        // Update Add Anchor button state
        if (MapRegionEditor.INSTANCE.IsAddAnchorToolActive) {
            this.addAnchorButton.classList.add('active-tool');
        }
        else {
            this.addAnchorButton.classList.remove('active-tool');
        }
        // Update Convert to Freeform button visibility
        // Show only for rectangle and circle regions
        if (!activeRegion) {
            this.convertToFreeformButton.style.display = 'none';
        }
        else if (activeRegion.regionType === RegionType.Rectangle || activeRegion.regionType === RegionType.Circle) {
            this.convertToFreeformButton.style.display = 'inline-block';
        }
        else {
            this.convertToFreeformButton.style.display = 'none';
        }
    }
}
// Absolute Element ID references
MapEditorUI.sidebarCreateRegionContainerID = "sidebar-create-region-container";
MapEditorUI.sidebarRegionToolsContainerID = "sidebar-region-tools-container";
MapEditorUI.sidebarRegionLayersContainerID = "sidebar-region-layers-container";
MapEditorUI.sidebarRegionEditInfoContainerID = "sidebar-region-info-container";
MapEditorUI.createRectangleRegionButtonID = "btn-create-rectangle-region";
MapEditorUI.createCircleRegionButtonID = "btn-create-circle-region";
MapEditorUI.createfreeformRegionButtonID = "btn-create-freeform-region";
MapEditorUI.moveToolButtonID = "btn-tool-move";
MapEditorUI.scaleToolButtonID = "btn-tool-scale";
MapEditorUI.rotateToolButtonID = "btn-tool-rotate";
MapEditorUI.addAnchorButtonID = "btn-tool-add-anchor";
MapEditorUI.addHandlesButtonID = "btn-tool-add-handles";
MapEditorUI.convertToFreeformButtonID = "btn-convert-to-freeform";
MapEditorUI.stopEditingButtonID = "btn-stop-editing";
MapEditorUI.deleteRegionButtonID = "btn-delete-region";
MapEditorUI.saveGeoeditButtonID = "btn-save-geoedit-data";
MapEditorUI.saveAsGeoeditButtonID = "btn-save-as-geoedit-data";
MapEditorUI.loadGeoeditButtonID = "btn-load-geoedit-data";
MapEditorUI.mapCoordsFooterElementID = "map-coords";
MapEditorUI.mapZoomFooterElementID = "map-zoom";
MapEditorUI.mapModeFooterElementID = "map-mode";
export class MapEditorUIRegionInfoManager {
    static get INSTANCE() { return MapEditorUIRegionInfoManager.instance; }
    constructor() {
        this.currentColorSelectorPrompt = null;
        // Ensure singleton instance
        if (MapEditorUIRegionInfoManager.instance) {
            console.error("MapEditorUIRegionInfoManager instance already exists!");
            return;
        }
        MapEditorUIRegionInfoManager.instance = this;
        // Initialize elements
        this.regionInfoNameField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoNameFieldID);
        this.regionInfoTypeField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoTypeFieldID);
        this.regionInfoRestrictionField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoRestrictionFieldID);
        this.regionInfoVisibilityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoVisibilityFieldID);
        this.regionInfoFillColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorTextFieldID);
        this.regionInfoFillColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorSwatchID);
        this.regionInfoBorderColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorTextFieldID);
        this.regionInfoBorderColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorSwatchID);
        this.regionInfoFillOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillOpacityFieldID);
        this.regionInfoBorderOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderOpacityFieldID);
        // Setup event listeners for editable fields
        this.setupEventListeners();
        this.setupColorSwatchListeners();
    }
    /**
     * Sets up event listeners for editable fields to update region data.
     */
    setupEventListeners() {
        let activeRegion;
        let regionData;
        // Name field
        this.regionInfoNameField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) {
                return;
            }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) {
                return;
            }
            const nameCut = this.regionInfoNameField.value.substring(0, 100); // Limit to 50 chars
            regionData.General.Name = nameCut;
            this.updateRegionDataInManager(regionData);
        });
        // Restriction field
        this.regionInfoRestrictionField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) {
                return;
            }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) {
                return;
            }
            regionData.General.IsRestricted = this.regionInfoRestrictionField.value === 'restricted';
            this.updateRegionDataInManager(regionData);
        });
        // Visibility field
        this.regionInfoVisibilityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) {
                return;
            }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) {
                return;
            }
            regionData.General.IsVisible = this.regionInfoVisibilityField.value === 'visible';
            this.updateRegionDataInManager(regionData);
        });
        // Fill Opacity field
        this.regionInfoFillOpacityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) {
                return;
            }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) {
                return;
            }
            const value = parseFloat(this.regionInfoFillOpacityField.value);
            if (!isNaN(value)) {
                const valueClamped = Math.max(0, Math.min(1, value));
                regionData.Style.FillOpacity = valueClamped;
            }
            this.updateRegionDataInManager(regionData);
        });
        // Border Opacity field
        this.regionInfoBorderOpacityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) {
                return;
            }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) {
                return;
            }
            const value = parseFloat(this.regionInfoBorderOpacityField.value);
            if (!isNaN(value)) {
                const valueClamped = Math.max(0, Math.min(1, value));
                regionData.Style.StrokeOpacity = valueClamped;
            }
            this.updateRegionDataInManager(regionData);
        });
    }
    updateRegionDataInManager(RegionData) {
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (activeRegion && activeRegion.GetSetUUID !== "") {
            MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, RegionData, true, true);
        }
    }
    /**
     * Sets up event listeners for color swatch clicks.
     */
    setupColorSwatchListeners() {
        console.log('Setting up color swatch listeners');
        // Track if a color picker is already open to prevent duplicates
        let colorPickerOpen = false;
        // Fill color swatch click
        this.regionInfoFillColorSwatch.addEventListener('click', (e) => {
            console.log('Fill color swatch clicked, colorPickerOpen:', colorPickerOpen);
            if (colorPickerOpen) {
                console.warn('Color picker already open, ignoring click');
                return;
            }
            e.stopPropagation(); // Prevent event bubbling
            e.preventDefault(); // Prevent default action
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                this.openNewColorSelector(e, activeRegion, false);
            }
        });
        // Border color swatch click
        this.regionInfoBorderColorSwatch.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            e.preventDefault(); // Prevent default action
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion)
                this.openNewColorSelector(e, activeRegion, true);
        });
    }
    /**
     * Validates hex color format.
     */
    isValidHexColor(hex) {
        return /^#[0-9A-Fa-f]{6}$/.test(hex);
    }
    /**
     * Updates the region information on the sidebar info panel.
     */
    updateRegionInfoPanel(regionData) {
        // Update text fields
        this.regionInfoNameField.value = regionData.General.Name || "";
        this.regionInfoTypeField.textContent = RegionType[regionData.RegionType];
        this.regionInfoRestrictionField.value = regionData.General.IsRestricted ? "restricted" : "unrestricted";
        this.regionInfoVisibilityField.value = regionData.General.IsVisible ? "visible" : "hidden";
        // Update fill color
        this.regionInfoFillColorTextField.textContent = regionData.Style.FillColor;
        this.regionInfoFillColorSwatch.style.backgroundColor = regionData.Style.FillColor;
        // Update border color
        this.regionInfoBorderColorTextField.textContent = regionData.Style.StrokeColor;
        this.regionInfoBorderColorSwatch.style.backgroundColor = regionData.Style.StrokeColor;
        // Update opacities
        this.regionInfoFillOpacityField.value = regionData.Style.FillOpacity.toString();
        this.regionInfoBorderOpacityField.value = regionData.Style.StrokeOpacity.toString();
    }
    openNewColorSelector(e, activeRegion, isStroke) {
        // Remove old color selector if it exists
        if (this.currentColorSelectorPrompt) {
            this.currentColorSelectorPrompt.forceCancelAndClose();
            this.currentColorSelectorPrompt = null;
        }
        // Open color picker dialog
        const currentColor = isStroke ? activeRegion.RegionData.Style.StrokeColor : activeRegion.RegionData.Style.FillColor;
        this.currentColorSelectorPrompt = new ColorPickerPrompt(currentColor, e, (selectedColor) => {
            this.currentColorSelectorPrompt = null;
            // On confirm
            if (!this.isValidHexColor(selectedColor))
                return;
            const newRegionData = activeRegion.RegionData;
            if (isStroke)
                newRegionData.Style.StrokeColor = selectedColor;
            else
                newRegionData.Style.FillColor = selectedColor;
            this.updateRegionDataInManager(newRegionData);
        }, (color) => {
            // On change (real-time update)
            if (!this.isValidHexColor(color))
                return;
            const newRegionData = activeRegion.RegionData;
            if (isStroke)
                newRegionData.Style.StrokeColor = color;
            else
                newRegionData.Style.FillColor = color;
            this.updateRegionDataInManager(newRegionData);
        }, () => {
            this.currentColorSelectorPrompt = null;
            // On cancel (revert)
            const newRegionData = activeRegion.RegionData;
            if (isStroke)
                newRegionData.Style.StrokeColor = currentColor;
            else
                newRegionData.Style.FillColor = currentColor;
            this.updateRegionDataInManager(newRegionData);
        });
    }
}
// Absolute Element ID references
MapEditorUIRegionInfoManager.regionInfoNameFieldID = "region-info-name";
MapEditorUIRegionInfoManager.regionInfoTypeFieldID = "region-info-type";
MapEditorUIRegionInfoManager.regionInfoRestrictionFieldID = "region-info-restriction";
MapEditorUIRegionInfoManager.regionInfoVisibilityFieldID = "region-info-visibility";
MapEditorUIRegionInfoManager.regionInfoFillColorTextFieldID = "region-info-fill-color-text";
MapEditorUIRegionInfoManager.regionInfoFillColorSwatchID = "region-info-fill-color-swatch";
MapEditorUIRegionInfoManager.regionInfoBorderColorTextFieldID = "region-info-border-color-text";
MapEditorUIRegionInfoManager.regionInfoBorderColorSwatchID = "region-info-border-color-swatch";
MapEditorUIRegionInfoManager.regionInfoFillOpacityFieldID = "region-info-fill-opacity";
MapEditorUIRegionInfoManager.regionInfoBorderOpacityFieldID = "region-info-border-opacity";
/**
 * Handles highlighting regions on the map when hovering over UI elements.
 */
export class MapRegionHightlightingHandler {
    static get INSTANCE() { return MapRegionHightlightingHandler.instance; }
    get TargetHighlightUUID() { return this.targetHighlightUUID; }
    constructor() {
        this.highlightTimeout = null;
        this.clearHighlightTimeout = null;
        this.isInGracePeriod = false;
        this.targetHighlightUUID = null;
        // Ensure singleton instance
        if (MapRegionHightlightingHandler.instance) {
            console.error("MapRegionHightlightingHandler instance already exists!");
            return;
        }
        MapRegionHightlightingHandler.instance = this;
    }
    /**
     * Highlights a region on the map after a delay.
     */
    highlightRegionSequence(UUID) {
        // Don't highlight if this region is being edited
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (activeRegion && activeRegion.GetSetUUID === UUID) {
            return;
        }
        // Ensure the region is visible
        const regionToHighlight = MapRegionRegionManager.INSTANCE.getRegionByUUID(UUID);
        if (!regionToHighlight || !regionToHighlight.RegionData.General.IsVisible) {
            return;
        }
        // Clear other highlight if any
        this.unhighlightRegion();
        // Set target UUID
        this.targetHighlightUUID = UUID;
        // Clear any pending unhighlight timeout
        if (this.clearHighlightTimeout !== null) {
            clearTimeout(this.clearHighlightTimeout);
            this.clearHighlightTimeout = null;
        }
        // Clear any pending highlight timeout
        if (this.highlightTimeout !== null) {
            clearTimeout(this.highlightTimeout);
            this.highlightTimeout = null;
        }
        // If we're in grace period or a region is currently highlighted, highlight instantly
        if (this.isInGracePeriod) {
            this.highlightRegion();
            return;
        }
        // If we're not in the grace period, set a timeout to highlight after the delay
        console.log("Setting highlight timeout for region UUID:", UUID);
        this.highlightTimeout = window.setTimeout(() => {
            // Only highlight if enough time has passed since last hover.
            // This timeout will be automatically terminated if the user hovers overs a different region or leaves the region layer entirely.
            // Highlight the region
            this.highlightRegion();
        }, MapRegionHightlightingHandler.highlightDelayDuration);
    }
    /**
     * Clears any highlighted region on the map.
     */
    clearHighlightSequence() {
        // Unhighlight the region immediately
        if (this.targetHighlightUUID === null) {
            return;
        }
        this.unhighlightRegion();
        // Clear any pending highlight timeout
        if (this.highlightTimeout !== null) {
            clearTimeout(this.highlightTimeout);
            this.highlightTimeout = null;
        }
        // Start grace period to prevent immediate re-highlighting
        this.isInGracePeriod = true;
        this.clearHighlightTimeout = window.setTimeout(() => {
            this.isInGracePeriod = false;
        }, MapRegionHightlightingHandler.gracePeriodDuration);
    }
    highlightRegion() {
        var _a;
        (_a = MapRegionRegionManager.INSTANCE.getRegionByUUID(this.targetHighlightUUID)) === null || _a === void 0 ? void 0 : _a.highlightRegion();
    }
    unhighlightRegion() {
        var _a;
        if (this.targetHighlightUUID === null) {
            return;
        }
        (_a = MapRegionRegionManager.INSTANCE.getRegionByUUID(this.targetHighlightUUID)) === null || _a === void 0 ? void 0 : _a.unhighlightRegion();
        this.targetHighlightUUID = null;
    }
}
MapRegionHightlightingHandler.highlightDelayDuration = 700; // ms
MapRegionHightlightingHandler.gracePeriodDuration = 200; // ms
export class MapEditorUILayerManager {
    static get INSTANCE() { return MapEditorUILayerManager.instance; }
    get RegionListContainer() { return this.regionListContainer; }
    constructor() {
        this.allLayers = [];
        // Ensure singleton instance
        if (MapEditorUILayerManager.instance) {
            console.error("MapEditorUILayerManager instance already exists!");
            return;
        }
        MapEditorUILayerManager.instance = this;
        // Initialize parent container
        this.regionListContainer = document.getElementById(MapEditorUILayerManager.regionListContainerID);
    }
    /**
     * Updates the map layers list in the UI.
     */
    updateMapLayersListAndIndicies() {
        // Clear existing layers
        this.clearAllLayers();
        // Clear highlights to be safe.
        MapRegionHightlightingHandler.INSTANCE.clearHighlightSequence();
        // Get all region datas and sort by LayerIndex
        const allRegions = MapRegionDataManager.INSTANCE.getAllRegionDatas();
        // Separate regions with and without LayerIndex
        const regionsWithIndex = allRegions.filter(r => r.LayerIndex !== undefined);
        const regionsWithoutIndex = allRegions.filter(r => r.LayerIndex === undefined);
        // Assign the regions without indexes a layer index greater than the greatest indexed region.
        if (regionsWithIndex.length > 0) {
            const maxIndex = Math.max(...regionsWithIndex.map(r => r.LayerIndex));
            regionsWithoutIndex.forEach((region, idx) => {
                region.LayerIndex = maxIndex + idx - 1;
            });
        }
        // Sort regions with index (higher index = first in list)
        regionsWithIndex.sort((a, b) => { var _a, _b; return ((_a = b.LayerIndex) !== null && _a !== void 0 ? _a : 0) - ((_b = a.LayerIndex) !== null && _b !== void 0 ? _b : 0); });
        // Combine: regions with index first, then regions without index
        const sortedRegions = [...regionsWithIndex, ...regionsWithoutIndex];
        // Create UI layers in sorted order
        sortedRegions.forEach((regionData) => {
            new MapEditorUILayer(regionData);
        });
    }
    /**
     * Update LayerIndex values based on current DOM order.
     */
    updateLayerIndicesFromDOM(container) {
        // Get all layer items in their current DOM order
        const layerElements = [...container.querySelectorAll('.layer-item')];
        // Update LayerIndex for each region (highest index = first in list)
        layerElements.forEach((layerEl, index) => {
            const layerInstance = this.allLayers.find(layer => layer.UUID === layerEl.getAttribute('UUID'));
            if (layerInstance) {
                const regionData = MapRegionDataManager.INSTANCE.getRegionDataByUUID(layerInstance.UUID);
                if (regionData) {
                    // Higher index = first position (top of list)
                    regionData.LayerIndex = layerElements.length - index;
                    MapRegionDataManager.INSTANCE.setRegionDataWithUUID(layerInstance.UUID, regionData, true, false);
                }
            }
            else {
                console.warn("Could not find layer instance for element during LayerIndex update.");
            }
        });
        // Don't refresh UI - the drag already updated the DOM order
    }
    /**
     * Creates and adds a new layer UI element for the given region data.
     */
    updateAllEditButtonStates() {
        this.allLayers.forEach((layer) => layer.updateEditButtonState());
    }
    clearAllLayers() {
        this.regionListContainer.innerHTML = '';
        this.allLayers = [];
    }
    addLayer(layer) {
        this.regionListContainer.appendChild(layer.layer);
        this.allLayers.push(layer);
    }
}
MapEditorUILayerManager.regionListContainerID = "layers-container";
class MapEditorUILayer {
    constructor(regionData) {
        this.placeholder = null;
        if (!regionData) {
            throw new Error("Invalid region data provided to MapEditorUILayer constructor.");
        }
        if (!regionData.UUID) {
            throw new Error("Region data must have a valid UUID.");
        }
        this.UUID = regionData.UUID;
        this.regionData = regionData;
        // Initialize HTML elements
        this.initalizeLayer();
        // Set region name
        const layerNameElement = this.layer.querySelector('.layer-name');
        layerNameElement.textContent = regionData.General.Name;
        // Set region visibility
        if (!regionData.General.IsVisible) {
            this.updateVisibilityButtonState(false);
        }
        // Update edit button state based on whether this region is being edited
        this.updateEditButtonState();
    }
    /**
     * Initializes the layer HTML elements and appends them to the region list container.
     */
    initalizeLayer() {
        // Determine icon based on region type
        let iconClass = 'fa-draw-polygon'; // Default for freeform
        switch (this.regionData.RegionType) {
            case RegionType.Rectangle:
                iconClass = 'fa-square';
                break;
            case RegionType.Circle:
                iconClass = 'fa-circle';
                break;
            case RegionType.Freeform:
                iconClass = 'fa-draw-polygon';
                break;
        }
        // Create new layer item element
        this.layer = document.createElement('div');
        this.layer.setAttribute('UUID', this.UUID);
        this.layer.className = 'layer-item';
        this.layer.innerHTML = `
            <div class="layer-icon"><i class="fas ${iconClass}"></i></div>
            <div class="layer-content">
                <div class="layer-name">Search Grid 3</div>
                <div class="layer-actions">
                    <button class="layer-action-btn edit" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="layer-action-btn eye" title="Toggle Visibility"><i class="fas fa-eye"></i></button>
                    <button class="layer-action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        // Add to the region list container
        MapEditorUILayerManager.INSTANCE.addLayer(this);
        // Initialize button references using querySelector within this layer
        this.editRegionButton = this.layer.querySelector('.layer-action-btn.edit');
        this.hideRegionButton = this.layer.querySelector('.layer-action-btn.eye');
        this.deleteRegionButton = this.layer.querySelector('.layer-action-btn.delete');
        // Initialize button handlers
        this.assignButtonEvents();
        // Initialize hover handlers
        this.assignHoverEvents();
        // Initialize drag and drop handlers
        this.assignDragEvents();
    }
    /**
     * Assigns event listeners to the layer action buttons.
     */
    assignButtonEvents() {
        // Edit Region Button
        this.editRegionButton.addEventListener('click', () => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            const isThisRegionBeingEdited = activeRegion && activeRegion.GetSetUUID === this.UUID;
            if (isThisRegionBeingEdited) {
                // If this region is being edited, stop editing
                MapRegionRegionManager.INSTANCE.stopEditingRegion();
                MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
                console.log('Stop editing region');
            }
            else if (!activeRegion) {
                // If no region is being edited, start editing this one
                MapRegionRegionManager.INSTANCE.attemptStartEditingRegion(this.UUID);
                console.log('Start editing region');
            }
            // If another region is being edited, do nothing (button is disabled)
        });
        this.hideRegionButton.addEventListener('click', () => {
            MapRegionRegionManager.INSTANCE.toggleRegionVisibility(this.UUID);
            console.log('Hide Region button clicked');
            // Implement hide functionality here
        });
        this.deleteRegionButton.addEventListener('click', () => {
            const deleteTool = new MapRegionEditorDeleteTool(this.UUID);
            deleteTool.execute();
            deleteTool.removeTool();
        });
    }
    /**
     * Assigns hover event listeners for region highlighting.
     */
    assignHoverEvents() {
        this.layer.addEventListener('mouseenter', () => {
            MapRegionHightlightingHandler.INSTANCE.highlightRegionSequence(this.UUID);
        });
        this.layer.addEventListener('mouseleave', () => {
            MapRegionHightlightingHandler.INSTANCE.clearHighlightSequence();
        });
    }
    /**
     * Assigns drag and drop event listeners for reordering layers.
     */
    assignDragEvents() {
        let isDragging = false;
        let startY = 0;
        let startX = 0;
        let dragThreshold = 5; // Pixels to move before drag starts
        let hasDragStarted = false;
        let currentAfterElement = null;
        let simulatedContainer;
        const onMouseDown = (e) => {
            // Only allow dragging from non-button areas
            const target = e.target;
            if (target.closest('.layer-action-btn')) {
                return;
            }
            isDragging = true;
            hasDragStarted = false;
            startY = e.clientY;
            startX = e.clientX;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        };
        const onMouseMove = (e) => {
            if (!isDragging)
                return;
            const deltaY = Math.abs(e.clientY - startY);
            const deltaX = Math.abs(e.clientX - startX);
            // Start drag only after threshold is exceeded
            if (!hasDragStarted && (deltaY > dragThreshold || deltaX > dragThreshold)) {
                hasDragStarted = true;
                this.layer.classList.add('dragging');
                this.createPlaceholder();
            }
            if (hasDragStarted) {
                // Find the layer item under the cursor
                const container = MapEditorUILayerManager.INSTANCE.RegionListContainer;
                const afterElement = this.getDragAfterElement(container, e.clientY);
                // Only update if position changed
                if (afterElement !== currentAfterElement) {
                    currentAfterElement = afterElement;
                    this.updatePlaceholderPosition(container, afterElement);
                    // Create simulated container for visual feedback on the map.
                    // Make a copy of the current order with the placeholder in the new position.
                    simulatedContainer = document.createElement('div');
                    const children = [...container.children];
                    children.forEach(child => {
                        if (child === this.placeholder) {
                            // Append this layer in place of the placeholder
                            simulatedContainer.appendChild(this.layer.cloneNode(true));
                        }
                        else if (child === this.layer) {
                            // Do not include the actual layer. Skit it.
                        }
                        else {
                            simulatedContainer.appendChild(child.cloneNode(true));
                        }
                    });
                    console.log("Simulated container children count: " + simulatedContainer.children.length);
                    // Update the map layer order visually based on simulated container
                    MapEditorUILayerManager.INSTANCE.updateLayerIndicesFromDOM(simulatedContainer);
                }
            }
        };
        const onMouseUp = () => {
            if (hasDragStarted) {
                this.layer.classList.remove('dragging');
                // Insert the actual layer where the placeholder is
                const container = MapEditorUILayerManager.INSTANCE.RegionListContainer;
                if (this.placeholder && this.placeholder.parentNode) {
                    container.insertBefore(this.layer, this.placeholder);
                    this.placeholder.remove();
                    // Update LayerIndex values based on new order
                    MapEditorUILayerManager.INSTANCE.updateLayerIndicesFromDOM(container);
                }
                this.placeholder = null;
                currentAfterElement = null;
            }
            isDragging = false;
            hasDragStarted = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        this.layer.addEventListener('mousedown', onMouseDown);
    }
    createPlaceholder() {
        var _a;
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'layer-placeholder';
        (_a = this.layer.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(this.placeholder, this.layer);
    }
    updatePlaceholderPosition(container, afterElement) {
        if (!this.placeholder)
            return;
        if (afterElement == null) {
            container.appendChild(this.placeholder);
        }
        else {
            container.insertBefore(this.placeholder, afterElement);
        }
    }
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.layer-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            }
            else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }
    // #region UI Update Methods
    updateVisibilityButtonState(isVisible) {
        if (isVisible) {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye"></i>`;
            this.hideRegionButton.title = "Hide Region";
        }
        else {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye-slash"></i>`;
            this.hideRegionButton.title = "Show Region";
        }
    }
    updateEditButtonState() {
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        const isThisRegionBeingEdited = activeRegion && activeRegion.GetSetUUID === this.UUID;
        const isAnotherRegionBeingEdited = activeRegion && activeRegion.GetSetUUID !== this.UUID;
        if (isAnotherRegionBeingEdited) {
            // Disable the edit button
            this.editRegionButton.classList.add('disabled');
            this.editRegionButton.classList.remove('active');
            this.editRegionButton.disabled = true;
            this.editRegionButton.title = "Another region is being edited";
        }
        else if (isThisRegionBeingEdited) {
            // This region is being edited - show as active
            this.editRegionButton.classList.remove('disabled');
            this.editRegionButton.classList.add('active');
            this.editRegionButton.disabled = false;
            this.editRegionButton.title = "Stop Editing";
        }
        else {
            // Enable the edit button
            this.editRegionButton.classList.remove('disabled');
            this.editRegionButton.classList.remove('active');
            this.editRegionButton.disabled = false;
            this.editRegionButton.title = "Edit";
        }
    }
}
//# sourceMappingURL=editor_ui.js.map