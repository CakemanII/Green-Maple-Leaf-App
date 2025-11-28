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
    private static readonly addHandlesButtonID: string = "btn-tool-add-handles";
    private static readonly convertToFreeformButtonID: string = "btn-convert-to-freeform";
    private static readonly stopEditingButtonID: string = "btn-stop-editing";
    private static readonly deleteRegionButtonID: string = "btn-delete-region";

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

        // Create canvas for color square
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'color-picker-canvas';
        // Calculate canvas size based on current font size for responsive scaling
        const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const canvasSize = Math.floor(17.5 * baseFontSize);
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
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
        // Set height to match canvas
        rightContainer.style.height = canvasSize + 'px';

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

        // Position top based on click event
        if (clickEvent) {
            const contentRect = content.getBoundingClientRect();
            
            // Get footer bar height to prevent intersection
            const footerBar = document.querySelector('.map-info');
            const footerHeight = footerBar ? footerBar.getBoundingClientRect().height : 0;
            
            // Position vertically based on click, ensure it doesn't intersect footer or go below viewport
            let top = clickEvent.clientY;
            const maxTop = window.innerHeight - contentRect.height - footerHeight - 10;
            top = Math.min(Math.max(10, top), maxTop);
            
            content.style.position = 'fixed';
            content.style.top = top + 'px';
        }

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
        // Fill color swatch click
        this.regionInfoFillColorSwatch.addEventListener('click', (e) => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const originalColor = activeRegion.RegionData.Style.FillColor;
                new MapEditorUIColorPicker(
                    originalColor,
                    (selectedColor) => {
                        // On confirm
                        if (!this.isValidHexColor(selectedColor)) return;
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = selectedColor;

                        this.updateRegionDataInManager(newRegionData);
                    },
                    e,
                    (color) => {
                        // On change (real-time update)
                        if (!this.isValidHexColor(color)) return;
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = color;

                        this.updateRegionDataInManager(newRegionData);
                    },
                    () => {
                        // On cancel (revert)
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.FillColor = originalColor;

                        this.updateRegionDataInManager(newRegionData);
                    }
                );
            }
        });

        // Border color swatch click
        this.regionInfoBorderColorSwatch.addEventListener('click', (e) => {
            const activeRegion = MapRegionRegionManager.INSTANCE.ActiveEditingRegion;
            if (activeRegion) {
                const originalColor = activeRegion.RegionData.Style.StrokeColor;
                new MapEditorUIColorPicker(
                    originalColor,
                    (selectedColor) => {
                        // On confirm
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.StrokeColor = selectedColor;

                        this.updateRegionDataInManager(newRegionData);
                    },
                    e,
                    (color) => {
                        // On change (real-time update)
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.StrokeColor = color;

                        this.updateRegionDataInManager(newRegionData);
                    },
                    () => {
                        // On cancel (revert)
                        const newRegionData: RegionData = activeRegion.RegionData;
                        newRegionData.Style.StrokeColor = originalColor;

                        this.updateRegionDataInManager(newRegionData);
                    }
                );
            }
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
}

/**
 * Handles highlighting regions on the map when hovering over UI elements.
 */
class MapRegionHightlightingHandler {
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

class MapEditorUILayerManager {
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

/**
 * Simple confirmation dialog utility class
 */
class MapEditorUIConfirmDialog {
    /**
     * Show a confirmation dialog
     * @param title - Dialog title
     * @param message - Dialog message
     * @param onConfirm - Callback when user confirms
     * @param confirmButtonColor - Optional color for the confirm button (default: red '#dc3545')
     */
    public static show(title: string, message: string, onConfirm: () => void, confirmButtonColor: string = '#dc3545'): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 24px;
            min-width: 400px;
            max-width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        `;

        // Create title
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 16px 0;
            color: white;
            font-size: 18px;
            font-weight: 600;
        `;

        // Create message
        const messageEl = document.createElement('p');
        messageEl.innerHTML = message;
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            color: #cccccc;
            font-size: 14px;
            line-height: 1.5;
        `;

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 12px;
        `;

        // Create No button
        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.style.cssText = `
            padding: 8px 20px;
            background-color: #3a3a3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        noButton.onmouseover = () => { noButton.style.backgroundColor = '#4a4a4a'; };
        noButton.onmouseout = () => { noButton.style.backgroundColor = '#3a3a3a'; };

        // Create Yes button
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        
        // Calculate hover color (slightly darker than base color)
        const hoverColor = this.darkenColor(confirmButtonColor, 10);
        
        yesButton.style.cssText = `
            padding: 8px 20px;
            background-color: ${confirmButtonColor};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        yesButton.onmouseover = () => { yesButton.style.backgroundColor = hoverColor; };
        yesButton.onmouseout = () => { yesButton.style.backgroundColor = confirmButtonColor; };

        // Assemble dialog
        buttonContainer.appendChild(noButton);
        buttonContainer.appendChild(yesButton);
        dialog.appendChild(titleEl);
        dialog.appendChild(messageEl);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);

        // Close function
        const closeDialog = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escapeHandler);
        };

        // Event handlers
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDialog();
            }
        };

        noButton.addEventListener('click', closeDialog);
        yesButton.addEventListener('click', () => {
            closeDialog();
            onConfirm();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(overlay);
    }

    /**
     * Darkens a hex color by a given percentage
     * @param color - Hex color string (e.g., '#dc3545')
     * @param percent - Percentage to darken (0-100)
     * @returns Darkened hex color
     */
    private static darkenColor(color: string, percent: number): string {
        // Remove # if present
        const hex = color.replace('#', '');
        
        // Parse RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Darken
        const factor = (100 - percent) / 100;
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        // Convert back to hex
        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
}