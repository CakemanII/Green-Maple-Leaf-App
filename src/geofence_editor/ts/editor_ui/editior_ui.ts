class MapEditorUI {
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

    private static readonly regionListContainerID: string = "layers-container";

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

    private regionListContainer!: HTMLDivElement;
    public get RegionListContainer(): HTMLDivElement { return this.regionListContainer; }

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

        // Initialize elements        
        this.sidebarCreateRegionContainer = document.getElementById(MapEditorUI.sidebarCreateRegionContainerID) as HTMLDivElement;
        this.sidebarRegionToolsContainer = document.getElementById(MapEditorUI.sidebarRegionToolsContainerID) as HTMLDivElement;
        this.sidebarRegionLayersContainer = document.getElementById(MapEditorUI.sidebarRegionLayersContainerID) as HTMLDivElement;
        this.sidebarRegionEditInfoContainer = document.getElementById(MapEditorUI.sidebarRegionEditInfoContainerID) as HTMLDivElement;

        this.createRectangleRegionButton = document.getElementById(MapEditorUI.createRectangleRegionButtonID) as HTMLButtonElement;
        this.createCircleRegionButton = document.getElementById(MapEditorUI.createCircleRegionButtonID) as HTMLButtonElement;
        this.createfreeformRegionButton = document.getElementById(MapEditorUI.createfreeformRegionButtonID) as HTMLButtonElement;
        
        this.regionListContainer = document.getElementById(MapEditorUI.regionListContainerID) as HTMLDivElement;

        // Get footer elements
        this.mapCoordsFooter = document.getElementById(MapEditorUI.mapCoordsFooterElementID) as HTMLElement;
        this.mapZoomFooter = document.getElementById(MapEditorUI.mapZoomFooterElementID) as HTMLElement;
        this.mapModeFooter = document.getElementById(MapEditorUI.mapModeFooterElementID) as HTMLElement;

        // Iterate through tool buttons
        this.initalizeToolButtons();
        // Initialize create region buttons
        this.initializeCreateRegionButtons();
        // Initialize footer
        this.initalizeFooter();

        // Hide add anchor button initially
        this.addAnchorButton.style.display = 'none';

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
        const toolButtonMap: { [key in ToolType]: HTMLButtonElement } = {
            [ToolType.Move]: this.moveToolButton,
            [ToolType.Rotate]: this.rotateToolButton,
            [ToolType.Scale]: this.scaleToolButton,
            [ToolType.AddAnchor]: this.addAnchorButton
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
     * Updates the map layers list in the UI.
     */
    public updateMapLayersList(): void {
        // Clear existing layers
        this.regionListContainer.innerHTML = '';

        // Iterate through regions and create UI layers
        MapRegionRegionManager.INSTANCE.getAllRegions().forEach(region => { new MapEditorUILayer(region); });
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
        this.updateAddAnchorButtonState();

        // Update info panel
        if (isActivelyEditing) {
            const regionData = MapRegionRegionManager.INSTANCE.ActiveEditingRegion!.RegionData;
            MapEditorUIRegionInfoManager.INSTANCE.updateRegionInfoPanel(regionData);
        }
    }

    /**
     * Updates the Add Anchor button state based on the active editing region.
     */
    private updateAddAnchorButtonState(): void {
        // Hide if active region is not freeform
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (!activeRegion || activeRegion.regionType !== RegionType.Freeform) {
            this.addAnchorButton.style.display = 'none';
        } else {
            this.addAnchorButton.style.display = 'inline-block';
        }

        // Update Add Anchor button state
        if (MapRegionEditor.INSTANCE.IsAddAnchorToolActive) {
            this.addAnchorButton.classList.add('active-tool');
        } else {
            this.addAnchorButton.classList.remove('active-tool');
        }
    }
}

class MapEditorUIRegionInfoManager {
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
    private regionInfoNameField!: HTMLSpanElement
    private regionInfoTypeField!: HTMLSpanElement
    private regionInfoRestrictionField!: HTMLSpanElement
    private regionInfoVisibilityField!: HTMLSpanElement;
    private regionInfoFillColorTextField!: HTMLSpanElement;
    private regionInfoFillColorSwatch!: HTMLSpanElement;
    private regionInfoBorderColorTextField!: HTMLSpanElement;
    private regionInfoBorderColorSwatch!: HTMLSpanElement;
    private regionInfoFillOpacityField!: HTMLSpanElement;
    private regionInfoBorderOpacityField!: HTMLSpanElement;

    constructor() {
        // Ensure singleton instance
        if (MapEditorUIRegionInfoManager.instance) {
            console.error("MapEditorUIRegionInfoManager instance already exists!");
            return;
        }
        MapEditorUIRegionInfoManager.instance = this;

        // Initialize elements
        this.regionInfoNameField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoNameFieldID) as HTMLSpanElement;
        this.regionInfoTypeField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoTypeFieldID) as HTMLSpanElement;
        this.regionInfoRestrictionField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoRestrictionFieldID) as HTMLSpanElement;
        this.regionInfoVisibilityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoVisibilityFieldID) as HTMLSpanElement;
        this.regionInfoFillColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorTextFieldID) as HTMLSpanElement;
        this.regionInfoFillColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillColorSwatchID) as HTMLSpanElement;
        this.regionInfoBorderColorTextField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorTextFieldID) as HTMLSpanElement;
        this.regionInfoBorderColorSwatch = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderColorSwatchID) as HTMLSpanElement;
        this.regionInfoFillOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoFillOpacityFieldID) as HTMLSpanElement;
        this.regionInfoBorderOpacityField = document.getElementById(MapEditorUIRegionInfoManager.regionInfoBorderOpacityFieldID) as HTMLSpanElement;
    }

    /**
     * Updates the region information on the sidebar info panel.
     */
    public updateRegionInfoPanel(regionData: RegionData): void {
        // Update text fields
        this.regionInfoNameField.textContent = regionData.General.Name || "Unnamed";
        this.regionInfoTypeField.textContent = RegionType[regionData.RegionType];
        this.regionInfoRestrictionField.textContent = regionData.General.IsRestricted ? "Restricted" : "Unrestricted";
        this.regionInfoVisibilityField.textContent = regionData.General.IsVisible ? "Visible" : "Hidden";

        // Update fill color
        this.regionInfoFillColorTextField.textContent = regionData.Style.FillColor;
        this.regionInfoFillColorSwatch.style.backgroundColor = regionData.Style.FillColor;

        // Update border color
        this.regionInfoBorderColorTextField.textContent = regionData.Style.BorderColor;
        this.regionInfoBorderColorSwatch.style.backgroundColor = regionData.Style.BorderColor;

        // Update opacities
        this.regionInfoFillOpacityField.textContent = regionData.Style.FillOpacity.toString();
        this.regionInfoBorderOpacityField.textContent = regionData.Style.BorderOpacity.toString();
    }
}

class MapEditorUILayer {
    // Local ELement ID references
    private static readonly layerEditRegionButtonID: string = "btn-layer-edit-region";
    private static readonly layerHideRegionButtonID: string = "btn-layer-toggle-visibility-region";
    private static readonly layerConfigureRegionButtonID: string = "btn-layer-configure-region";
    private static readonly layerDeleteRegionButtonID: string = "btn-layer-delete-region";
    private static readonly layerDragHandleRegionButtonID: string = "btn-layer-drag-handle-region";

    private layer!: HTMLDivElement;

    private editRegionButton!: HTMLButtonElement;
    private hideRegionButton!: HTMLButtonElement;
    private configureRegionButton!: HTMLButtonElement;
    private deleteRegionButton!: HTMLButtonElement;
    private dragHandleRegionButton!: HTMLButtonElement;

    constructor(regionData: any) {
        // Initialize HTML elements
        this.initalizeLayer();

        // Set region name
        const layerNameElement = this.layer.querySelector('.layer-name') as HTMLDivElement;
        layerNameElement.textContent = regionData.Name;

        // Set region visibility
        if (!regionData.IsVisible) {
            this.updateVisibilityButtonState(false);
        }
    }

    /**
     * Initializes the layer HTML elements and appends them to the region list container.
     */
    private initalizeLayer(): void {
        // Create new layer item element
        this.layer = document.createElement('div');
        this.layer.className = 'layer-item';
        this.layer.innerHTML = `
            <div class="layer-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div class="layer-content">
                <div class="layer-name">Search Grid 3</div>
                <div class="layer-actions">
                    <button class="layer-action-btn edit" id="${MapEditorUILayer.layerEditRegionButtonID}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="layer-action-btn eye" id="${MapEditorUILayer.layerHideRegionButtonID}" title="Toggle Visibility"><i class="fas fa-eye"></i></button>
                    <button class="layer-action-btn settings" id="${MapEditorUILayer.layerConfigureRegionButtonID}" title="Settings"><i class="fas fa-cog"></i></button>
                    <button class="layer-action-btn delete" id="${MapEditorUILayer.layerDeleteRegionButtonID}" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        
        // Add to the region list container
        MapEditorUI.INSTANCE.RegionListContainer.appendChild(this.layer);
        
        // Initialize button references
        this.editRegionButton = document.getElementById(MapEditorUILayer.layerEditRegionButtonID) as HTMLButtonElement;
        this.hideRegionButton = document.getElementById(MapEditorUILayer.layerHideRegionButtonID) as HTMLButtonElement;
        this.configureRegionButton = document.getElementById(MapEditorUILayer.layerConfigureRegionButtonID) as HTMLButtonElement;
        this.deleteRegionButton = document.getElementById(MapEditorUILayer.layerDeleteRegionButtonID) as HTMLButtonElement;

        // Initialize button handlers
        this.assignButtonEvents();
    }

    /**
     * Assigns event listeners to the layer action buttons.
     */
    private assignButtonEvents(): void {
        // Edit Region Button
        this.editRegionButton.addEventListener('click', () => {
            console.log('Edit Region button clicked');
            // Implement edit functionality here
        });

        this.hideRegionButton.addEventListener('click', () => {
            console.log('Hide Region button clicked');
            // Implement hide functionality here
        });

        this.configureRegionButton.addEventListener('click', () => {
            console.log('Configure Region button clicked');
            // Implement configure functionality here
        });

        this.deleteRegionButton.addEventListener('click', () => {
            console.log('Delete Region button clicked');
            // Implement delete functionality here
        });
    }

    /**
     * Initializes the drag handle for reordering layers.
     */
    private initializeDragHandle(): void {

    }

    // #region UI Button
    private updateVisibilityButtonState(isVisible: boolean): void {
        if (isVisible) {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye"></i>`;
            this.hideRegionButton.title = "Hide Region";
        } else {
            this.hideRegionButton.innerHTML = `<i class="fas fa-eye-slash"></i>`;
            this.hideRegionButton.title = "Show Region";
        }
    }
    // #endregion
}