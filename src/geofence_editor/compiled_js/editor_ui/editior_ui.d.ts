import { RegionType, RegionData } from "../interactable_map/region.js";
export declare class MapEditorUI {
    private static instance;
    static get INSTANCE(): MapEditorUI;
    private static readonly sidebarCreateRegionContainerID;
    private static readonly sidebarRegionToolsContainerID;
    private static readonly sidebarRegionLayersContainerID;
    private static readonly sidebarRegionEditInfoContainerID;
    private static readonly createRectangleRegionButtonID;
    private static readonly createCircleRegionButtonID;
    private static readonly createfreeformRegionButtonID;
    private static readonly moveToolButtonID;
    private static readonly scaleToolButtonID;
    private static readonly rotateToolButtonID;
    private static readonly addAnchorButtonID;
    private static readonly addHandlesButtonID;
    private static readonly convertToFreeformButtonID;
    private static readonly stopEditingButtonID;
    private static readonly deleteRegionButtonID;
    private static readonly saveGeoeditButtonID;
    private static readonly saveAsGeoeditButtonID;
    private static readonly loadGeoeditButtonID;
    private static readonly mapCoordsFooterElementID;
    private static readonly mapZoomFooterElementID;
    private static readonly mapModeFooterElementID;
    private sidebarCreateRegionContainer;
    private sidebarRegionToolsContainer;
    private sidebarRegionLayersContainer;
    private sidebarRegionEditInfoContainer;
    private createRectangleRegionButton;
    private createCircleRegionButton;
    private createfreeformRegionButton;
    private moveToolButton;
    private scaleToolButton;
    private rotateToolButton;
    private addAnchorButton;
    private addHandlesButton;
    private convertToFreeformButton;
    private stopEditingButton;
    private deleteRegionButton;
    private saveGeoeditButton;
    private saveAsGeoeditButtonID;
    private loadGeoeditButton;
    private mapCoordsFooter;
    private mapZoomFooter;
    private mapModeFooter;
    constructor();
    private initalizeToolButtons;
    private initalizeFooter;
    private initializeCreateRegionButtons;
    private initializeTabMenu;
    private setCreateRegionSidebarVisibility;
    private setRegionToolsSidebarVisibility;
    private setRegionLayersSidebarVisibility;
    private setRegionEditInfoSidebarVisibility;
    /**
     * Updates the visual selection state of the create region buttons.
     */
    setCreateRegionButtonSelection(regionType: RegionType | null, isActive: boolean): void;
    /**
     * Updates the active tool display in the UI.
     */
    updateActiveToolDisplay(): void;
    /**
     * Called when the active editing region changes.
     */
    onActiveEditingRegionChanged(): void;
    /**
     * Updates button displays the are dependent on the active region type.
     */
    private updateRegionDependentButtons;
}
/**
 * Custom color picker with gradient square and hue slider
 */
export declare class MapEditorUIColorPicker {
    private modal;
    private canvas;
    private ctx;
    private hueSlider;
    private hexInput;
    private confirmBtn;
    private currentColorDisplay;
    private onConfirmCallback;
    private onChangeCallback?;
    private originalColor;
    private onCancelCallback?;
    private escapeHandler;
    private outsideClickHandler;
    private currentHue;
    private currentSaturation;
    private currentLightness;
    private isDragging;
    private gradientCache;
    constructor(initialColor: string, onConfirm: (color: string) => void, clickEvent?: MouseEvent, onChange?: (color: string) => void, onCancel?: () => void);
    private parseHexColor;
    private hslToHex;
    private drawColorSquare;
    private drawSelector;
    private updateColorFromCanvas;
    private setupEventListeners;
    /**
     * Removes the color picker modal from the DOM
     */
    remove(): void;
    /**
     * Removes the color picker without calling the callback (cancel action)
     */
    private removeWithoutCallback;
    /**
     * Cleanup listeners
     */
    private cleanup;
}
export declare class MapEditorUIRegionInfoManager {
    private static instance;
    static get INSTANCE(): MapEditorUIRegionInfoManager;
    private static readonly regionInfoNameFieldID;
    private static readonly regionInfoTypeFieldID;
    private static readonly regionInfoRestrictionFieldID;
    private static readonly regionInfoVisibilityFieldID;
    private static readonly regionInfoFillColorTextFieldID;
    private static readonly regionInfoFillColorSwatchID;
    private static readonly regionInfoBorderColorTextFieldID;
    private static readonly regionInfoBorderColorSwatchID;
    private static readonly regionInfoFillOpacityFieldID;
    private static readonly regionInfoBorderOpacityFieldID;
    private regionInfoNameField;
    private regionInfoTypeField;
    private regionInfoRestrictionField;
    private regionInfoVisibilityField;
    private regionInfoFillColorTextField;
    private regionInfoFillColorSwatch;
    private regionInfoBorderColorTextField;
    private regionInfoBorderColorSwatch;
    private regionInfoFillOpacityField;
    private regionInfoBorderOpacityField;
    constructor();
    /**
     * Sets up event listeners for editable fields to update region data.
     */
    private setupEventListeners;
    private updateRegionDataInManager;
    /**
     * Sets up event listeners for color swatch clicks.
     */
    private setupColorSwatchListeners;
    /**
     * Validates hex color format.
     */
    private isValidHexColor;
    /**
     * Updates the region information on the sidebar info panel.
     */
    updateRegionInfoPanel(regionData: RegionData): void;
}
/**
 * Handles highlighting regions on the map when hovering over UI elements.
 */
export declare class MapRegionHightlightingHandler {
    private static instance;
    static get INSTANCE(): MapRegionHightlightingHandler;
    private static readonly highlightDelayDuration;
    private static readonly gracePeriodDuration;
    private highlightTimeout;
    private clearHighlightTimeout;
    private isInGracePeriod;
    private targetHighlightUUID;
    get TargetHighlightUUID(): string | null;
    constructor();
    /**
     * Highlights a region on the map after a delay.
     */
    highlightRegionSequence(UUID: string): void;
    /**
     * Clears any highlighted region on the map.
     */
    clearHighlightSequence(): void;
    private highlightRegion;
    private unhighlightRegion;
}
export declare class MapEditorUILayerManager {
    private static instance;
    static get INSTANCE(): MapEditorUILayerManager;
    private static readonly regionListContainerID;
    private regionListContainer;
    get RegionListContainer(): HTMLElement;
    private allLayers;
    constructor();
    /**
     * Updates the map layers list in the UI.
     */
    updateMapLayersListAndIndicies(): void;
    /**
     * Update LayerIndex values based on current DOM order.
     */
    updateLayerIndicesFromDOM(container: HTMLElement): void;
    /**
     * Creates and adds a new layer UI element for the given region data.
     */
    updateAllEditButtonStates(): void;
    private clearAllLayers;
    addLayer(layer: MapEditorUILayer): void;
}
declare class MapEditorUILayer {
    UUID: string;
    layer: HTMLDivElement;
    private editRegionButton;
    private hideRegionButton;
    private deleteRegionButton;
    private regionData;
    constructor(regionData: RegionData);
    /**
     * Initializes the layer HTML elements and appends them to the region list container.
     */
    private initalizeLayer;
    /**
     * Assigns event listeners to the layer action buttons.
     */
    private assignButtonEvents;
    /**
     * Assigns hover event listeners for region highlighting.
     */
    private assignHoverEvents;
    /**
     * Assigns drag and drop event listeners for reordering layers.
     */
    private assignDragEvents;
    private placeholder;
    private createPlaceholder;
    private updatePlaceholderPosition;
    private getDragAfterElement;
    private updateVisibilityButtonState;
    updateEditButtonState(): void;
}
export {};
