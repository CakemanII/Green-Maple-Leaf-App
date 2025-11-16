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
    private static readonly stopEditingButtonID: string = "btn-stop-editing";

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
    private stopEditingButton!: HTMLButtonElement;

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
        this.stopEditingButton = document.getElementById(MapEditorUI.stopEditingButtonID) as HTMLButtonElement;

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

        // Stop Editing Button
        this.stopEditingButton.addEventListener('click', () => {
            MapRegionRegionManager.INSTANCE.stopEditingRegion();
            MapEditorUI.INSTANCE.onActiveEditingRegionChanged();
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

/**
 * Custom color picker with gradient square and hue slider
 */
class MapEditorUIColorPicker {
    private modal: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private hueSlider: HTMLInputElement;
    private hexInput: HTMLInputElement;
    private confirmBtn: HTMLButtonElement;
    private currentColorDisplay: HTMLDivElement;
    private onConfirmCallback: (color: string) => void;
    private onChangeCallback?: (color: string) => void;
    private originalColor: string;
    private onCancelCallback?: () => void;
    private escapeHandler!: () => void;
    private outsideClickHandler!: (e: MouseEvent) => void;
    
    private currentHue: number = 0;
    private currentSaturation: number = 100;
    private currentLightness: number = 50;
    
    private isDragging: boolean = false;
    private gradientCache: ImageData | null = null;

    constructor(initialColor: string, onConfirm: (color: string) => void, clickEvent?: MouseEvent, onChange?: (color: string) => void, onCancel?: () => void) {
        this.onConfirmCallback = onConfirm;
        this.onChangeCallback = onChange;
        this.onCancelCallback = onCancel;
        this.originalColor = initialColor;

        // Parse initial color
        this.parseHexColor(initialColor);

        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'color-picker-modal active';

        // Create content
        const content = document.createElement('div');
        content.className = 'color-picker-content';
        
        // Position at click location, but ensure it's to the right of sidebar (300px)
        if (clickEvent) {
            const left = Math.max(300, clickEvent.clientX);
            content.style.position = 'fixed';
            content.style.left = left + 'px';
            content.style.top = clickEvent.clientY + 'px';
        }

        // Create canvas for color square
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'color-picker-canvas';
        this.canvas.width = 280;
        this.canvas.height = 280;
        this.ctx = this.canvas.getContext('2d')!;

        // Create hue slider
        this.hueSlider = document.createElement('input');
        this.hueSlider.type = 'range';
        this.hueSlider.className = 'color-picker-hue-slider';
        this.hueSlider.min = '0';
        this.hueSlider.max = '360';
        this.hueSlider.value = this.currentHue.toString();

        // Create right side container for inputs
        const rightContainer = document.createElement('div');
        rightContainer.className = 'color-picker-right';

        // Create color comparison box
        const colorCompareBox = document.createElement('div');
        colorCompareBox.className = 'color-picker-compare-box';
        
        const previousColor = document.createElement('div');
        previousColor.className = 'color-picker-previous-color';
        previousColor.style.backgroundColor = initialColor;
        
        this.currentColorDisplay = document.createElement('div');
        this.currentColorDisplay.className = 'color-picker-current-color';
        this.currentColorDisplay.style.backgroundColor = initialColor;
        
        colorCompareBox.appendChild(previousColor);
        colorCompareBox.appendChild(this.currentColorDisplay);

        // Create bottom controls container
        const bottomControls = document.createElement('div');
        bottomControls.className = 'color-picker-bottom-controls';

        // Create hex input
        this.hexInput = document.createElement('input');
        this.hexInput.type = 'text';
        this.hexInput.className = 'color-picker-hex-input';
        this.hexInput.placeholder = '#000000';
        this.hexInput.value = initialColor;

        // Create confirm button
        this.confirmBtn = document.createElement('button');
        this.confirmBtn.className = 'color-picker-confirm-btn';
        this.confirmBtn.textContent = 'Confirm';

        // Assemble elements
        bottomControls.appendChild(this.hexInput);
        bottomControls.appendChild(this.confirmBtn);
        rightContainer.appendChild(colorCompareBox);
        rightContainer.appendChild(bottomControls);
        content.appendChild(this.canvas);
        content.appendChild(this.hueSlider);
        content.appendChild(rightContainer);
        this.modal.appendChild(content);

        // Add to document
        document.body.appendChild(this.modal);

        // Draw initial color square
        this.drawColorSquare();
        this.drawSelector();

        // Setup event listeners
        this.setupEventListeners();

        // ESC key handler using MapRegionEditorKeyStates
        this.escapeHandler = () => {
            this.removeWithoutCallback();
        };
        MapRegionEditorKeyStates.INSTANCE.escapePressedDownListeners.push(this.escapeHandler);
    }

    private parseHexColor(hex: string): void {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        // Calculate lightness
        this.currentLightness = ((max + min) / 2) * 100;

        // Calculate saturation
        if (delta === 0) {
            this.currentSaturation = 0;
        } else {
            this.currentSaturation = (delta / (1 - Math.abs(2 * (this.currentLightness / 100) - 1))) * 100;
        }

        // Calculate hue
        if (delta === 0) {
            this.currentHue = 0;
        } else if (max === r) {
            this.currentHue = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
            this.currentHue = 60 * (((b - r) / delta) + 2);
        } else {
            this.currentHue = 60 * (((r - g) / delta) + 4);
        }

        if (this.currentHue < 0) this.currentHue += 360;
    }

    private hslToHex(h: number, s: number, l: number): string {
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        const red = Math.round((r + m) * 255);
        const green = Math.round((g + m) * 255);
        const blue = Math.round((b + m) * 255);

        return '#' + [red, green, blue].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    private drawColorSquare(): void {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Draw saturation gradient (left to right)
        for (let x = 0; x < width; x++) {
            const saturation = (x / width) * 100;
            for (let y = 0; y < height; y++) {
                const lightness = 100 - (y / height) * 100;
                const color = this.hslToHex(this.currentHue, saturation, lightness);
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Cache the gradient for efficient redraws
        this.gradientCache = this.ctx.getImageData(0, 0, width, height);
    }

    private drawSelector(): void {
        // Restore the cached gradient to clear previous selector
        if (this.gradientCache) {
            this.ctx.putImageData(this.gradientCache, 0, 0);
        }
        
        const x = (this.currentSaturation / 100) * this.canvas.width;
        const y = (1 - this.currentLightness / 100) * this.canvas.height;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 9, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    private updateColorFromCanvas(x: number, y: number, updateHex: boolean = false): void {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = Math.max(0, Math.min(this.canvas.width, x - rect.left));
        const canvasY = Math.max(0, Math.min(this.canvas.height, y - rect.top));

        this.currentSaturation = (canvasX / this.canvas.width) * 100;
        this.currentLightness = 100 - (canvasY / this.canvas.height) * 100;

        // Update current color display in real-time
        const hexColor = this.hslToHex(this.currentHue, this.currentSaturation, this.currentLightness);
        this.currentColorDisplay.style.backgroundColor = hexColor;
        
        // Call onChange callback for real-time updates
        if (this.onChangeCallback) {
            this.onChangeCallback(hexColor);
        }
        
        // Only update hex input when requested (on mouse up or initial click)
        if (updateHex) {
            this.hexInput.value = hexColor;
        }

        // Only redraw the selector, not the entire gradient
        this.drawSelector();
    }

    private setupEventListeners(): void {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.updateColorFromCanvas(e.clientX, e.clientY, false);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.updateColorFromCanvas(e.clientX, e.clientY, false);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.updateColorFromCanvas(e.clientX, e.clientY, true);
                this.isDragging = false;
            }
        });

        // Hue slider with debouncing
        let hueUpdateTimeout: number | null = null;
        this.hueSlider.addEventListener('input', () => {
            this.currentHue = parseInt(this.hueSlider.value);
            this.gradientCache = null; // Invalidate cache when hue changes
            this.drawColorSquare();
            this.drawSelector();
            
            // Update current color display immediately
            const hexColor = this.hslToHex(this.currentHue, this.currentSaturation, this.currentLightness);
            this.currentColorDisplay.style.backgroundColor = hexColor;
            
            // Call onChange callback for real-time updates
            if (this.onChangeCallback) {
                this.onChangeCallback(hexColor);
            }
            
            // Debounce hex input update
            if (hueUpdateTimeout !== null) {
                clearTimeout(hueUpdateTimeout);
            }
            hueUpdateTimeout = window.setTimeout(() => {
                this.hexInput.value = hexColor;
                hueUpdateTimeout = null;
            }, 100);
        });

        // Hex input
        this.hexInput.addEventListener('input', () => {
            const hexValue = this.hexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
                this.parseHexColor(hexValue);
                this.hueSlider.value = this.currentHue.toString();
                this.currentColorDisplay.style.backgroundColor = hexValue;
                
                // Call onChange callback for real-time updates
                if (this.onChangeCallback) {
                    this.onChangeCallback(hexValue);
                }
                
                this.drawColorSquare();
                this.drawSelector();
            }
        });

        // Confirm button
        this.confirmBtn.addEventListener('click', () => {
            this.onConfirmCallback(this.hexInput.value);
            this.remove();
        });

        // Click outside to close (use setTimeout to avoid immediate trigger)
        setTimeout(() => {
            this.outsideClickHandler = (e: MouseEvent) => {
                const content = this.modal.querySelector('.color-picker-content');
                if (content && !content.contains(e.target as Node)) {
                    this.removeWithoutCallback();
                }
            };
            document.addEventListener('click', this.outsideClickHandler);
        }, 0);
    }

    /**
     * Removes the color picker modal from the DOM
     */
    public remove(): void {
        this.cleanup();
        this.modal.remove();
    }

    /**
     * Removes the color picker without calling the callback (cancel action)
     */
    private removeWithoutCallback(): void {
        // Revert to original color
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.cleanup();
        this.modal.remove();
    }

    /**
     * Cleanup listeners
     */
    private cleanup(): void {
        // Remove escape listener
        const index = MapRegionEditorKeyStates.INSTANCE.escapePressedDownListeners.indexOf(this.escapeHandler);
        if (index > -1) {
            MapRegionEditorKeyStates.INSTANCE.escapePressedDownListeners.splice(index, 1);
        }
        // Remove click listener
        document.removeEventListener('click', this.outsideClickHandler);
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

            regionData.General.Name = this.regionInfoNameField.value;
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

            activeRegion.RegionData.General.IsVisible = this.regionInfoVisibilityField.value === 'visible';
            this.updateRegionDataInManager(regionData);
        });

        // Fill Opacity field
        this.regionInfoFillOpacityField.addEventListener('change', () => {
            activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (!activeRegion) { return; }
            regionData = activeRegion ? activeRegion.RegionData : null;
            if (!regionData) { return; }

            const value = parseFloat(this.regionInfoFillOpacityField.value);
            if (!isNaN(value) && value >= 0 && value <= 1) {
                regionData.Style.FillOpacity = value;
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
            if (!isNaN(value) && value >= 0 && value <= 1) {
                regionData.Style.BorderOpacity = value;
            }

            this.updateRegionDataInManager(regionData);
        });
    }

    private updateRegionDataInManager(RegionData: RegionData): void
    {
        const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
        if (activeRegion && activeRegion.GetSetUUID !== "") {
            MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, RegionData, true);
            this.updateRegionInfoPanel(MapRegionDataManager.INSTANCE.getRegionDataByUUID(activeRegion.GetSetUUID)!);
        }
    }

    /**
     * Sets up event listeners for color swatch clicks.
     */
    private setupColorSwatchListeners(): void {
        // Fill color swatch click
        this.regionInfoFillColorSwatch.addEventListener('click', (e) => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const originalColor = activeRegion.RegionData.Style.FillColor;
                new MapEditorUIColorPicker(
                    originalColor,
                    (selectedColor) => {
                        // On confirm
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = selectedColor;

                        this.regionInfoFillColorTextField.textContent = selectedColor;
                        this.regionInfoFillColorSwatch.style.backgroundColor = selectedColor;

                        MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, newRegionData, true);
                    },
                    e,
                    (color) => {
                        // On change (real-time update)
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = color;

                        this.regionInfoFillColorTextField.textContent = color;
                        this.regionInfoFillColorSwatch.style.backgroundColor = color;

                        MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, newRegionData, true);
                    },
                    () => {
                        // On cancel (revert)
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = originalColor;

                        this.regionInfoFillColorTextField.textContent = originalColor;
                        this.regionInfoFillColorSwatch.style.backgroundColor = originalColor;

                        MapRegionDataManager.INSTANCE.setRegionDataWithUUID(activeRegion.GetSetUUID, newRegionData, true);
                    }
                );
            }
        });

        // Border color swatch click
        this.regionInfoBorderColorSwatch.addEventListener('click', (e) => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const originalColor = activeRegion.RegionData.Style.BorderColor;
                new MapEditorUIColorPicker(
                    originalColor,
                    (selectedColor) => {
                        // On confirm
                        activeRegion.RegionData.Style.BorderColor = selectedColor;
                        this.regionInfoBorderColorTextField.textContent = selectedColor;
                        this.regionInfoBorderColorSwatch.style.backgroundColor = selectedColor;
                        activeRegion.update();
                    },
                    e,
                    (color) => {
                        // On change (real-time update)
                        activeRegion.RegionData.Style.BorderColor = color;
                        this.regionInfoBorderColorTextField.textContent = color;
                        this.regionInfoBorderColorSwatch.style.backgroundColor = color;
                        activeRegion.update();
                    },
                    () => {
                        // On cancel (revert)
                        activeRegion.RegionData.Style.BorderColor = originalColor;
                        this.regionInfoBorderColorTextField.textContent = originalColor;
                        this.regionInfoBorderColorSwatch.style.backgroundColor = originalColor;
                        activeRegion.update();
                    }
                );
            }
        });
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
        this.regionInfoBorderColorTextField.textContent = regionData.Style.BorderColor;
        this.regionInfoBorderColorSwatch.style.backgroundColor = regionData.Style.BorderColor;

        // Update opacities
        this.regionInfoFillOpacityField.value = regionData.Style.FillOpacity.toString();
        this.regionInfoBorderOpacityField.value = regionData.Style.BorderOpacity.toString();
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