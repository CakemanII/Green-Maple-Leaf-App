import { ColorPickerPrompt, GeoeditFileListViewerPrompt } from "../../../shared/compiled_js/prompts.js";
import { TabMenu } from "../../../shared/compiled_js/tabmenu.js";
import { GeoeditFileManager } from "../geofence_filing.js";
import { InteractiveMap } from "../interactable_map/map.js";
import { ToolType, MapRegionEditorAddHandlesTool, MapRegionEditorConvertToFreeformTool, MapRegionEditorDeleteTool } from "../interactable_map/map_region_editor_tools.js";
import { MapRegionEditor, MapRegionRegionManager, MapRegionEditorKeyStates, MapRegionDataManager } from "../interactable_map/map_region_editor.js";
import { RegionType, RegionData, MapRegion } from "../interactable_map/region.js";

export class MapEditorUI {
    private static instance: MapEditorUI;
    public static get INSTANCE(): MapEditorUI { return MapEditorUI.instance; }

    // Absolute Element ID references
    private static readonly sidebarCreateRegionContainerID: string = "sidebar-create-region-container";
    private static readonly sidebarRegionToolsContainerID: string = "sidebar-region-tools-container";
    private static readonly sidebarRegionLayersContainerID: string = "sidebar-region-layers-container";
    private static readonly sidebarRegionEditInfoContainerID: string = "sidebar-region-info-container";

    private static readonly createRectangleRegionButtonID: string = "btn-create-rectangle-region";
    private static readonly createCircleRegionButtonID: string = "btn-create-circle-region"
    private static readonly createfreeformRegionButtonID: string = "btn-create-freeform-region";

    private static readonly moveToolButtonID: string = "btn-tool-move";
    private static readonly scaleToolButtonID: string = "btn-tool-scale";
    private static readonly rotateToolButtonID: string = "btn-tool-rotate";
    private static readonly addAnchorButtonID: string = "btn-tool-add-anchor";
    private static readonly addHandlesButtonID: string = "btn-tool-add-handles";
    private static readonly convertToFreeformButtonID: string = "btn-convert-to-freeform";
    private static readonly stopEditingButtonID: string = "btn-stop-editing";
    private static readonly deleteRegionButtonID: string = "btn-delete-region";

    private static readonly saveGeoeditButtonID: string = "btn-save-geoedit-data";
    private static readonly saveAsGeoeditButtonID: string = "btn-save-as-geoedit-data";
    private static readonly loadGeoeditButtonID: string = "btn-load-geoedit-data";

    private static readonly mapCoordsFooterElementID = "map-coords";
    private static readonly mapZoomFooterElementID = "map-zoom";
    private static readonly mapModeFooterElementID = "map-mode";

    // Direct Element References (initialized in constructor)
    private sidebarCreateRegionContainer!: HTMLDivElement;
    private sidebarRegionToolsContainer!: HTMLDivElement
    private sidebarRegionLayersContainer!: HTMLDivElement;
    private sidebarRegionEditInfoContainer!: HTMLDivElement;

    private createRectangleRegionButton!: HTMLButtonElement;
    private createCircleRegionButton!: HTMLButtonElement;
    private createfreeformRegionButton!: HTMLButtonElement;

    private moveToolButton!: HTMLButtonElement;
    private scaleToolButton!: HTMLButtonElement;
    private rotateToolButton!: HTMLButtonElement;

    private addAnchorButton!: HTMLButtonElement;
    private addHandlesButton!: HTMLButtonElement;
    private convertToFreeformButton!: HTMLButtonElement;
    private stopEditingButton!: HTMLButtonElement;
    private deleteRegionButton!: HTMLButtonElement;

    private saveGeoeditButton!: HTMLButtonElement;
    private saveAsGeoeditButtonID!: HTMLButtonElement;
    private loadGeoeditButton!: HTMLButtonElement;

    private mapCoordsFooter!: HTMLElement;
    private mapZoomFooter!: HTMLElement;
    private mapModeFooter!: HTMLElement;

    constructor()
    {
        // Ensure singleton instance
        if (MapEditorUI.instance)
        {
            console.error("MapEditorUI instance already exists!");
        }
        MapEditorUI.instance = this;

        // Initialize MapEditorUIRegionInfoManager
        new MapEditorUIRegionInfoManager();
        new MapRegionHightlightingHandler();
        new MapEditorUILayerManager();

        // Initialize elements        
        this.sidebarCreateRegionContainer = document.getElementById(MapEditorUI.sidebarCreateRegionContainerID) as HTMLDivElement;
        this.sidebarRegionToolsContainer = document.getElementById(MapEditorUI.sidebarRegionToolsContainerID) as HTMLDivElement;
        this.sidebarRegionLayersContainer = document.getElementById(MapEditorUI.sidebarRegionLayersContainerID) as HTMLDivElement;
        this.sidebarRegionEditInfoContainer = document.getElementById(MapEditorUI.sidebarRegionEditInfoContainerID) as HTMLDivElement;

        this.createRectangleRegionButton = document.getElementById(MapEditorUI.createRectangleRegionButtonID) as HTMLButtonElement;
        this.createCircleRegionButton = document.getElementById(MapEditorUI.createCircleRegionButtonID) as HTMLButtonElement;
        this.createfreeformRegionButton = document.getElementById(MapEditorUI.createfreeformRegionButtonID) as HTMLButtonElement;

        // Get footer elements
        this.mapCoordsFooter = document.getElementById(MapEditorUI.mapCoordsFooterElementID) as HTMLElement;
        this.mapZoomFooter = document.getElementById(MapEditorUI.mapZoomFooterElementID) as HTMLElement;
        this.mapModeFooter = document.getElementById(MapEditorUI.mapModeFooterElementID) as HTMLElement;

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
    private initalizeToolButtons(): void {
        this.moveToolButton = document.getElementById(MapEditorUI.moveToolButtonID) as HTMLButtonElement;
        this.scaleToolButton = document.getElementById(MapEditorUI.scaleToolButtonID) as HTMLButtonElement;
        this.rotateToolButton = document.getElementById(MapEditorUI.rotateToolButtonID) as HTMLButtonElement;
        this.addAnchorButton = document.getElementById(MapEditorUI.addAnchorButtonID) as HTMLButtonElement;
        this.addHandlesButton = document.getElementById(MapEditorUI.addHandlesButtonID) as HTMLButtonElement;
        this.convertToFreeformButton = document.getElementById(MapEditorUI.convertToFreeformButtonID) as HTMLButtonElement;
        this.stopEditingButton = document.getElementById(MapEditorUI.stopEditingButtonID) as HTMLButtonElement;
        this.deleteRegionButton = document.getElementById(MapEditorUI.deleteRegionButtonID) as HTMLButtonElement;

        // Primary Tool Buttons
        const primaryToolButtons = [this.moveToolButton, this.rotateToolButton, this.scaleToolButton];
        primaryToolButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    const tool = button.querySelector('span')?.textContent;
                    if (tool) {
                        let mapTool: ToolType;
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

    private initalizeFooter(): void {
        InteractiveMap.mapInstance.on('mousemove', (e) => {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            this.mapCoordsFooter.textContent = `Lat: ${lat}, Lng: ${lng}`;
        });

        InteractiveMap.mapInstance.on('zoom', () => {
            this.mapZoomFooter.textContent = `Zoom: ${InteractiveMap.mapInstance.getZoom()}`;
        });
    }

    private initializeCreateRegionButtons(): void {
        this.createRectangleRegionButton = document.getElementById(MapEditorUI.createRectangleRegionButtonID) as HTMLButtonElement;
        this.createCircleRegionButton = document.getElementById(MapEditorUI.createCircleRegionButtonID) as HTMLButtonElement;
        this.createfreeformRegionButton = document.getElementById(MapEditorUI.createfreeformRegionButtonID) as HTMLButtonElement;

        const regionButtons: Array<[HTMLButtonElement, RegionType]> = [
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

    private initializeTabMenu(): void {
        // Initialize the tab menu
        new TabMenu(
            {
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

                    new GeoeditFileListViewerPrompt(
                        async (fileMetadata) => {
                            await GeoeditFileManager.Instance.loadGeoeditFile(fileMetadata.UUID);
                            finished = true; decision = true;
                        },
                        () => { finished = true; }
                    )

                    // Wait for finished to be true 
                    while (!finished) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    return decision; // Close menu after selection
                },
            }
        );
    }
    // #endregion

    // #region Sidebar main visibility methods
    private setCreateRegionSidebarVisibility(isVisible: boolean): void {
        this.sidebarCreateRegionContainer.style.display = isVisible ? 'block' : 'none';
    }
    private setRegionToolsSidebarVisibility(isVisible: boolean): void {
        this.sidebarRegionToolsContainer.style.display = isVisible ? 'block' : 'none';
    }
    private setRegionLayersSidebarVisibility(isVisible: boolean): void {
        this.sidebarRegionLayersContainer.style.display = isVisible ? 'block' : 'none';
    }
    private setRegionEditInfoSidebarVisibility(isVisible: boolean): void {
        this.sidebarRegionEditInfoContainer.style.display = isVisible ? 'block' : 'none';
    }

    // #endregion

    /**
     * Updates the visual selection state of the create region buttons.
     */
    public setCreateRegionButtonSelection(regionType: RegionType | null, isActive: boolean): void {
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
        if (!isActive) { return;}

        // Highlight the selected button
        if (regionType !== null) {
            let selectedButton: HTMLButtonElement | null = null;
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
    public updateActiveToolDisplay(): void {
        // Get the current active tool name
        const activeToolType: ToolType | null = MapRegionEditor.INSTANCE.ActivePrimaryTool ? MapRegionEditor.INSTANCE.ActivePrimaryTool.ToolType : null;
        if (activeToolType === null || activeToolType === undefined) {
            this.mapModeFooter.textContent = `Active Tool: None`;
            return;
        }

        const activeToolName: string = ToolType[activeToolType].toLowerCase().replace('tool', '').trim();

        // Visually unhighlight all PRIMARY tool buttons (not add anchor button)
        const primaryToolButtons = [this.moveToolButton, this.rotateToolButton, this.scaleToolButton];
        primaryToolButtons.forEach(button => {
            button.classList.remove('active-tool');
        });

        // Highlight the active PRIMARY tool button
        const toolButtonMap: { [key in ToolType]?: HTMLButtonElement } = {
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
        } else {
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
    public onActiveEditingRegionChanged(): void {
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
            const regionData = MapRegionRegionManager.INSTANCE.ActiveEditingRegion!.RegionData;
            MapEditorUIRegionInfoManager.INSTANCE.updateRegionInfoPanel(regionData);
        }
    }

    /**
     * Updates button displays the are dependent on the active region type.
     */
    private updateRegionDependentButtons(): void {
        // Hide if active region is not freeform
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (!activeRegion || activeRegion.regionType !== RegionType.Freeform) {
            this.addAnchorButton.style.display = 'none';
            this.addHandlesButton.style.display = 'none';
        } else {
            this.addAnchorButton.style.display = 'inline-block';
            this.addHandlesButton.style.display = 'inline-block';
        }

        // Update Add Anchor button state
        if (MapRegionEditor.INSTANCE.IsAddAnchorToolActive) {
            this.addAnchorButton.classList.add('active-tool');
        } else {
            this.addAnchorButton.classList.remove('active-tool');
        }

        // Update Convert to Freeform button visibility
        // Show only for rectangle and circle regions
        if (!activeRegion) {
            this.convertToFreeformButton.style.display = 'none';
        } else if (activeRegion.regionType === RegionType.Rectangle || activeRegion.regionType === RegionType.Circle) {
            this.convertToFreeformButton.style.display = 'inline-block';
        } else {
            this.convertToFreeformButton.style.display = 'none';
        }
    }
}

export class MapEditorUIRegionInfoManager {
    private static instance: MapEditorUIRegionInfoManager;
    public static get INSTANCE(): MapEditorUIRegionInfoManager { return MapEditorUIRegionInfoManager.instance; }

    // Absolute Element ID references
    private static readonly regionInfoNameFieldID: string = "region-info-name";
    private static readonly regionInfoTypeFieldID: string = "region-info-type";
    private static readonly regionInfoRestrictionFieldID: string = "region-info-restriction";
    private static readonly regionInfoVisibilityFieldID: string = "region-info-visibility";

    private static readonly regionInfoFillColorTextFieldID: string = "region-info-fill-color-text";
    private static readonly regionInfoFillColorSwatchID: string = "region-info-fill-color-swatch";

    private static readonly regionInfoBorderColorTextFieldID: string = "region-info-border-color-text";
    private static readonly regionInfoBorderColorSwatchID: string = "region-info-border-color-swatch";

    private static readonly regionInfoFillOpacityFieldID: string = "region-info-fill-opacity";
    private static readonly regionInfoBorderOpacityFieldID: string = "region-info-border-opacity";

    // Direct Element References (initialized in constructor)
    private regionInfoNameField!: HTMLInputElement;
    private regionInfoTypeField!: HTMLSpanElement;
    private regionInfoRestrictionField!: HTMLSelectElement;
    private regionInfoVisibilityField!: HTMLSelectElement;
    private regionInfoFillColorTextField!: HTMLSpanElement;
    private regionInfoFillColorSwatch!: HTMLSpanElement;
    private regionInfoBorderColorTextField!: HTMLSpanElement;
    private regionInfoBorderColorSwatch!: HTMLSpanElement;
    private regionInfoFillOpacityField!: HTMLInputElement;
    private regionInfoBorderOpacityField!: HTMLInputElement;

    private currentColorSelectorPrompt: ColorPickerPrompt | null = null;

    constructor() {
        // Ensure singleton instance
        if (MapEditorUIRegionInfoManager.instance) {
            console.error("MapEditorUIRegionInfoManager instance already exists!");
            return;
        }
        MapEditorUIRegionInfoManager.instance = this;

        // Initialize elements
        this.regionInfoNameField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoNameFieldID) as HTMLInputElement;
        this.regionInfoTypeField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoTypeFieldID) as HTMLSpanElement;
        this.regionInfoRestrictionField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoRestrictionFieldID) as HTMLSelectElement;
        this.regionInfoVisibilityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoVisibilityFieldID) as HTMLSelectElement;
        this.regionInfoFillColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorTextFieldID) as HTMLSpanElement;
        this.regionInfoFillColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorSwatchID) as HTMLSpanElement;
        this.regionInfoBorderColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorTextFieldID) as HTMLSpanElement;
        this.regionInfoBorderColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorSwatchID) as HTMLSpanElement;
        this.regionInfoFillOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillOpacityFieldID) as HTMLInputElement;
        this.regionInfoBorderOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderOpacityFieldID) as HTMLInputElement;

        // Setup event listeners for editable fields
        this.setupEventListeners();
        this.setupColorSwatchListeners();
    }

    /**
     * Sets up event listeners for editable fields to update region data.
     */
    private setupEventListeners(): void {
        let activeRegion;
        let regionData;
        // Name field
        this.regionInfoNameField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

            const nameCut = this.regionInfoNameField.value.substring(0, 100); // Limit to 50 chars
            regionData.General.Name = nameCut;
            this.updateRegionDataInManager(regionData);
        });

        // Restriction field
        this.regionInfoRestrictionField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

            regionData.General.IsRestricted = this.regionInfoRestrictionField.value === 'restricted';
            this.updateRegionDataInManager(regionData);
        });

        // Visibility field
        this.regionInfoVisibilityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

            regionData.General.IsVisible = this.regionInfoVisibilityField.value === 'visible';
            this.updateRegionDataInManager(regionData);
        });

        // Fill Opacity field
        this.regionInfoFillOpacityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

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
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

            const value = parseFloat(this.regionInfoBorderOpacityField.value);
            if (!isNaN(value)) {
                const valueClamped = Math.max(0, Math.min(1, value));
                regionData.Style.StrokeOpacity = valueClamped;
            }

            this.updateRegionDataInManager(regionData);
        });
    }

    private updateRegionDataInManager(RegionData: RegionData): void
    {
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (activeRegion && activeRegion.GetSetUUID !== "") {
            MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, RegionData, true, true);
        }
    }

    /**
     * Sets up event listeners for color swatch clicks.
     */
    private setupColorSwatchListeners(): void {
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
            
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion!;
            if (activeRegion)
                this.openNewColorSelector(e, activeRegion, true);
        });
    }

    /**
     * Validates hex color format.
     */
    private isValidHexColor(hex: string): boolean {
        return /^#[0-9A-Fa-f]{6}$/.test(hex);
    }

    /**
     * Updates the region information on the sidebar info panel.
     */
    public updateRegionInfoPanel(regionData: RegionData): void {
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

    private openNewColorSelector(e: MouseEvent, activeRegion: MapRegion, isStroke: boolean): void {
        // Remove old color selector if it exists
        if (this.currentColorSelectorPrompt) {
            this.currentColorSelectorPrompt.forceCancelAndClose();
            this.currentColorSelectorPrompt = null;
        }

        // Open color picker dialog
        const currentColor = isStroke ? activeRegion.RegionData.Style.StrokeColor : activeRegion.RegionData.Style.FillColor;
        this.currentColorSelectorPrompt = new ColorPickerPrompt(
            currentColor,
            e,
            (selectedColor) => {
                this.currentColorSelectorPrompt = null;
                // On confirm
                if (!this.isValidHexColor(selectedColor)) return;
                const newRegionData: RegionData = activeRegion.RegionData;
                if (isStroke)
                    newRegionData.Style.StrokeColor = selectedColor;
                else
                    newRegionData.Style.FillColor = selectedColor;

                this.updateRegionDataInManager(newRegionData);
            },
            (color) => {
                // On change (real-time update)
                if (!this.isValidHexColor(color)) return;
                const newRegionData: RegionData = activeRegion.RegionData;
                if (isStroke)
                    newRegionData.Style.StrokeColor = color;
                else
                    newRegionData.Style.FillColor = color;

                this.updateRegionDataInManager(newRegionData);
            },
            () => {
                this.currentColorSelectorPrompt = null;
                // On cancel (revert)
                const newRegionData: RegionData = activeRegion.RegionData;
                if (isStroke)
                    newRegionData.Style.StrokeColor = currentColor;
                else
                    newRegionData.Style.FillColor = currentColor;

                this.updateRegionDataInManager(newRegionData);
            }
        );
    }
}

/**
 * Handles highlighting regions on the map when hovering over UI elements.
 */
export class MapRegionHightlightingHandler {
    private static instance: MapRegionHightlightingHandler;
    public static get INSTANCE(): MapRegionHightlightingHandler { return MapRegionHightlightingHandler.instance; }

    private static readonly highlightDelayDuration: number = 700; // ms
    private static readonly gracePeriodDuration: number = 200; // ms

    private highlightTimeout: number | null = null;
    private clearHighlightTimeout: number | null = null;

    private isInGracePeriod: boolean = false;
    private targetHighlightUUID: string | null = null;
    public get TargetHighlightUUID(): string | null { return this.targetHighlightUUID; }

    constructor() 
    {
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
    public highlightRegionSequence(UUID: string): void {
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
        if (this.isInGracePeriod)
        {
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
    public clearHighlightSequence(): void {
        // Unhighlight the region immediately
        if (this.targetHighlightUUID === null) { return; }
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

    private highlightRegion(): void {
        MapRegionRegionManager.INSTANCE.getRegionByUUID(this.targetHighlightUUID!)?.highlightRegion();
    }
    private unhighlightRegion(): void {
        if (this.targetHighlightUUID === null) { return; }
        MapRegionRegionManager.INSTANCE.getRegionByUUID(this.targetHighlightUUID!)?.unhighlightRegion();
        this.targetHighlightUUID = null;
    }
}

export class MapEditorUILayerManager {
    private static instance: MapEditorUILayerManager;
    public static get INSTANCE(): MapEditorUILayerManager { return MapEditorUILayerManager.instance; }

    private static readonly regionListContainerID: string = "layers-container";

    private regionListContainer!: HTMLElement;
    public get RegionListContainer(): HTMLElement { return this.regionListContainer; }

    private allLayers: MapEditorUILayer[] = [];

    constructor() {
        // Ensure singleton instance
        if (MapEditorUILayerManager.instance) {
            console.error("MapEditorUILayerManager instance already exists!");
            return;
        }
        MapEditorUILayerManager.instance = this;

        // Initialize parent container
        this.regionListContainer = document.getElementById(MapEditorUILayerManager.regionListContainerID)!;
    }

    /**
     * Updates the map layers list in the UI.
     */
    public updateMapLayersListAndIndicies(): void {
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
            const maxIndex = Math.max(...regionsWithIndex.map(r => r.LayerIndex!));
            regionsWithoutIndex.forEach((region, idx) => {
                region.LayerIndex = maxIndex + idx - 1;
            });
        }
        
        // Sort regions with index (higher index = first in list)
        regionsWithIndex.sort((a, b) => (b.LayerIndex ?? 0) - (a.LayerIndex ?? 0));
        
        // Combine: regions with index first, then regions without index
        const sortedRegions = [...regionsWithIndex, ...regionsWithoutIndex];

        // Create UI layers in sorted order
        sortedRegions.forEach((regionData: RegionData) => { 
            new MapEditorUILayer(regionData); 
        });
    }

    /**
     * Update LayerIndex values based on current DOM order.
     */
    public updateLayerIndicesFromDOM(container: HTMLElement): void {
        // Get all layer items in their current DOM order
        const layerElements = [...container.querySelectorAll('.layer-item')] as HTMLElement[];
        
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
            else
            {
                console.warn("Could not find layer instance for element during LayerIndex update.");
            }
        });
        
        // Don't refresh UI - the drag already updated the DOM order
    }

    /**
     * Creates and adds a new layer UI element for the given region data.
     */
    public updateAllEditButtonStates(): void {
        this.allLayers.forEach((layer: MapEditorUILayer) => layer.updateEditButtonState());
    }

    private clearAllLayers(): void {
        this.regionListContainer.innerHTML = '';
        this.allLayers = [];
    }

    public addLayer(layer: MapEditorUILayer): void {
        this.regionListContainer.appendChild(layer.layer);
        this.allLayers.push(layer);
    }
}

class MapEditorUILayer {    
    public UUID: string;
    public layer!: HTMLDivElement;

    // Element references
    private editRegionButton!: HTMLButtonElement;
    private hideRegionButton!: HTMLButtonElement;
    private deleteRegionButton!: HTMLButtonElement;

    // Dyanmic region data reference
    private regionData: RegionData;

    constructor(regionData: RegionData) {
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
        const layerNameElement = this.layer.querySelector('.layer-name') as HTMLDivElement;
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
    private initalizeLayer(): void {
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
        this.editRegionButton = this.layer.querySelector('.layer-action-btn.edit') as HTMLButtonElement;
        this.hideRegionButton = this.layer.querySelector('.layer-action-btn.eye') as HTMLButtonElement;
        this.deleteRegionButton = this.layer.querySelector('.layer-action-btn.delete') as HTMLButtonElement;

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
    private assignButtonEvents(): void {
        // Edit Region Button
        this.editRegionButton.addEventListener('click', () => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            const isThisRegionBeingEdited = activeRegion && activeRegion.GetSetUUID === this.UUID;
            
            if (isThisRegionBeingEdited) {
                // If this region is being edited, stop editing
                MapRegionRegionManager.INSTANCE.stopEditingRegion();
                MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
                console.log('Stop editing region');
            } else if (!activeRegion) {
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
    private assignHoverEvents(): void {
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
    private assignDragEvents(): void {
        let isDragging = false;
        let startY = 0;
        let startX = 0;
        let dragThreshold = 5; // Pixels to move before drag starts
        let hasDragStarted = false;
        let currentAfterElement: HTMLElement | null = null;

        let simulatedContainer: HTMLElement;

        const onMouseDown = (e: MouseEvent) => {
            // Only allow dragging from non-button areas
            const target = e.target as HTMLElement;
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

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

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
                    const children = [...container.children] as HTMLElement[];
                    children.forEach(child => {
                        if (child === this.placeholder) {
                            // Append this layer in place of the placeholder
                            simulatedContainer.appendChild(this.layer.cloneNode(true));
                        } else  if (child === this.layer) {
                            // Do not include the actual layer. Skit it.
                        } else {
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

    private placeholder: HTMLDivElement | null = null;

    private createPlaceholder(): void {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'layer-placeholder';
        this.layer.parentNode?.insertBefore(this.placeholder, this.layer);
    }

    private updatePlaceholderPosition(container: HTMLElement, afterElement: HTMLElement | null): void {
        if (!this.placeholder) return;
        
        if (afterElement == null) {
            container.appendChild(this.placeholder);
        } else {
            container.insertBefore(this.placeholder, afterElement);
        }
    }

    private getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
        const draggableElements = [...container.querySelectorAll('.layer-item:not(.dragging)')] as HTMLElement[];

        return draggableElements.reduce<{ offset: number; element: HTMLElement | null }>((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    // #region UI Update Methods
    private updateVisibilityButtonState(isVisible: boolean): void {
        if (isVisible) {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye"></i>`;
            this.hideRegionButton.title = "Hide Region";
        } else {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye-slash"></i>`;
            this.hideRegionButton.title = "Show Region";
        }
    }

    public updateEditButtonState(): void {
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        const isThisRegionBeingEdited = activeRegion && activeRegion.GetSetUUID === this.UUID;
        const isAnotherRegionBeingEdited = activeRegion && activeRegion.GetSetUUID !== this.UUID;

        if (isAnotherRegionBeingEdited) {
            // Disable the edit button
            this.editRegionButton.classList.add('disabled');
            this.editRegionButton.classList.remove('active');
            this.editRegionButton.disabled = true;
            this.editRegionButton.title = "Another region is being edited";
        } else if (isThisRegionBeingEdited) {
            // This region is being edited - show as active
            this.editRegionButton.classList.remove('disabled');
            this.editRegionButton.classList.add('active');
            this.editRegionButton.disabled = false;
            this.editRegionButton.title = "Stop Editing";
        } else {
            // Enable the edit button
            this.editRegionButton.classList.remove('disabled');
            this.editRegionButton.classList.remove('active');
            this.editRegionButton.disabled = false;
            this.editRegionButton.title = "Edit";
        }
    }
    // #endregion
}