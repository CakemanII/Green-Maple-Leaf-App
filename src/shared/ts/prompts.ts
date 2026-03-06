// #region Base Prompt Classes

import { FileMetadata, MediaFileMetadata, StatusCollectionFileMetadata } from "./types";

/**
 * Base class for prompts
 */
export abstract class FullscreenPrompt {
    private promptTitle!: string;

    private onConfirm: (...args: any[]) => void;
    private onCancel: () => void;
    
    private escapeKeyListener!: (e: KeyboardEvent) => void;

    protected overlay!: HTMLDivElement;
    protected dialog!: HTMLDivElement;

    protected confirmButton!: HTMLButtonElement;
    protected cancelButton!: HTMLButtonElement;

    private promptWidth: number;
    private promptHeight?: number;

    constructor(
        promptTitle: string, 
        onConfirm: (...args: any[]) => void,
        onCancel: () => void = () => {},
        promptWidth: number = 550,
        promptHeight?: number
    ) {
        // Store callbacks
        this.promptTitle = promptTitle;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.promptWidth = promptWidth;
        this.promptHeight = promptHeight;
        // Initialize base DOM structure (overlay, dialog, title, buttons)
        this.initializeBaseDOM();
    }

    private initializeBaseDOM(): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        this.overlay = overlay;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 24px;
            width: ${this.promptWidth}px;
            min-width: ${this.promptWidth}px;
            max-width: ${this.promptWidth}px;
            ${this.promptHeight !== undefined ? `height: ${this.promptHeight}px; max-height: ${this.promptHeight}px;` : ''}
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        `;
        this.dialog = dialog;

        // Create title
        const titleEl = document.createElement('h3');
        titleEl.textContent = this.promptTitle;
        titleEl.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
            font-size: 20px;
            font-weight: 600;
        `;

        // Right side button container (for cancel and save)
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            flex-shrink: 0;
            margin-top: auto;
            padding-top: 16px;
        `;

        // Create Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'N/A';
        cancelButton.style.cssText = `
            padding: 10px 24px;
            background-color: #3a3a3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        cancelButton.onmouseover = () => { cancelButton.style.backgroundColor = '#4a4a4a'; };
        cancelButton.onmouseout = () => { cancelButton.style.backgroundColor = '#3a3a3a'; };
        this.cancelButton = cancelButton;

        // Create Confirm button
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'N/A';
        confirmButton.style.cssText = `
            padding: 10px 24px;
            background-color: #6ba3ff;
            color: #181a1b;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        confirmButton.onmouseover = () => { confirmButton.style.backgroundColor = '#5a92ee'; };
        confirmButton.onmouseout = () => { confirmButton.style.backgroundColor = '#6ba3ff'; };
        this.confirmButton = confirmButton;

        // Assemble dialog
        buttonContainer.appendChild(this.cancelButton);
        buttonContainer.appendChild(this.confirmButton);
        dialog.appendChild(titleEl);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);

        // Event handlers
        this.escapeKeyListener = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (this.onCancel) this.onCancel();
            }
        };

        cancelButton.addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
        });

        confirmButton.addEventListener('click', () => {
            this.confirm();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (this.onCancel) this.onCancel();
            }
        });

        document.addEventListener('keydown', this.escapeKeyListener);

        // Add to DOM
        document.body.appendChild(overlay);
    }

    /**
     * Utility method for subclasses to add their specific elements into the dialog, above the buttons
     */
    protected insertElementIntoDialog(element: HTMLElement): void {
        // Insert the element into the dialog, above the buttons
        this.dialog.insertBefore(element, this.confirmButton.parentElement!);
    }

    protected insertButtonIntoButtonContainer(button: HTMLButtonElement, index: number): void {
        const buttonContainer = this.confirmButton.parentElement!;
        if (index < 0 || index >= buttonContainer.children.length - 1) {
            // If index is out of bounds, append to the end (before the last element, which is the button container itself)
            buttonContainer.appendChild(button);
        } else {
            // Insert at the specified index (before the last element, which is the button container itself)
            buttonContainer.insertBefore(button, buttonContainer.children[index]);
        }
    }

    protected confirm(...args: any[]): void {
        this.onConfirm(...args);
    }

    protected cancel(): void {
        this.onCancel();
    }

    protected closePrompt(): void {
        // Clean up DOM elements and event listeners
        document.body.removeChild(this.overlay);
        document.removeEventListener('keydown', this.escapeKeyListener);
    }

    protected abstract initializePrimaryDOM(): void;
}

export abstract class PopoutMenuPrompt {
    protected promptContainer!: HTMLDivElement;
    protected promptContentContainer!: HTMLDivElement;

    private escapeKeyListener!: (e: KeyboardEvent) => void;
    private clickOffListener!: (e: MouseEvent) => void;

    protected onConfirm: (...args: any[]) => void;
    protected onCancel: () => void;
    private rightSidePreferred!: boolean;
    private minHorizontalGapFromClick!: number;

    constructor(
        OnConfirm: (...args: any[]) => void, 
        onCancel: () => void, 
        rightSidePreferred: boolean = true,
        minHorizontalGapFromClick: number = 20
    ) {
        // Store callbacks
        this.onConfirm = OnConfirm;
        this.onCancel = onCancel;
        this.rightSidePreferred = rightSidePreferred;
        this.minHorizontalGapFromClick = minHorizontalGapFromClick;
        // Create basic prompt structure
        this.initializeBaseDOM();
    }

    private initializeBaseDOM(): void {
        // Create modal container
        this.promptContainer = document.createElement('div');
        this.promptContainer.className = 'popup-prompt active';  // Add 'active' to enable display: block

        // Create content
        this.promptContentContainer = document.createElement('div');
        this.promptContentContainer.className = 'popup-prompt-content';
        // Start with position fixed at 0,0 and opacity 0 (invisible but allows layout calculation)
        // This is CRITICAL - positioning off-screen prevents browser from calculating dimensions
        this.promptContentContainer.style.position = 'fixed';
        this.promptContentContainer.style.left = '0px';
        this.promptContentContainer.style.top = '0px';
        this.promptContentContainer.style.opacity = '0';
        this.promptContentContainer.style.pointerEvents = 'none';
        this.promptContainer.appendChild(this.promptContentContainer);

        // Add to document
        document.body.appendChild(this.promptContainer);

        // Setup escape key listener
        this.escapeKeyListener = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.onCancel();
                this.closePrompt();
            }
        };
        document.addEventListener('keydown', this.escapeKeyListener);

        this.clickOffListener = (e: MouseEvent) => {
            if (this.promptContentContainer && !this.promptContentContainer.contains(e.target as Node)) {
                this.onCancel();
                this.closePrompt();
            }
        };
        setTimeout(() => {
            document.addEventListener('click', this.clickOffListener);
        }, 0);
    }

    /**
     * Method for closing and removing the prompt from the DOM.
     */
    protected closePrompt(): void {
        console.log('Closing prompt');
        console.trace('closePrompt called from:');

        // Clean up DOM elements and event listeners
        document.removeEventListener('keydown', this.escapeKeyListener);
        document.removeEventListener('click', this.clickOffListener);

        // Remove the prompt container from the DOM if it exists
        if (this.promptContainer.parentElement) {
            this.promptContainer.parentElement.removeChild(this.promptContainer);
        }
    }

    /**
     * Method for positioning the prompt according to the click event that triggered it, ensuring it stays within the viewport and doesn't intersect with the footer bar. 
     */
    protected positionPrompt(clickEvent: MouseEvent): void {
        console.log('Positioning prompt at click coordinates:', clickEvent.clientX, clickEvent.clientY);
        
        // Position top based on click event
        if (clickEvent) {
            // Force a layout recalculation by reading offsetHeight
            // This ensures the browser has calculated dimensions
            const forceLayoutW = this.promptContentContainer.offsetWidth;
            const forceLayoutH = this.promptContentContainer.offsetHeight;
            console.log('Forced layout, width:', forceLayoutW, 'height:', forceLayoutH);
            
            const contentRect = this.promptContentContainer.getBoundingClientRect();
            console.log('Content rect:', contentRect);
            
            // If rect is still zero, wait one more frame and try again
            if (contentRect.width === 0 || contentRect.height === 0) {
                console.warn('Content rect has zero dimensions after first check. Retrying in next frame...');
                requestAnimationFrame(() => {
                    const retryRect = this.promptContentContainer.getBoundingClientRect();
                    console.log('Retry content rect:', retryRect);
                    
                    if (retryRect.width === 0 || retryRect.height === 0) {
                        console.error('Content rect STILL has zero dimensions. Using basic positioning.');
                        // Just position at click location as fallback and make visible
                        this.promptContentContainer.style.top = clickEvent.clientY + 'px';
                        this.promptContentContainer.style.left = clickEvent.clientX + 'px';
                        this.promptContentContainer.style.opacity = '1';
                        this.promptContentContainer.style.pointerEvents = 'auto';
                        return;
                    }
                    
                    // Now we have dimensions, position properly
                    this.positionWithDimensions(clickEvent, retryRect);
                });
                return;
            }
            
            // We have dimensions, position properly
            this.positionWithDimensions(clickEvent, contentRect);
        }
    }
    
    private positionWithDimensions(clickEvent: MouseEvent, contentRect: DOMRect): void {
        // Get footer bar height to prevent intersection
        const footerBar = document.querySelector('.map-info');
        const footerHeight = footerBar ? footerBar.getBoundingClientRect().height : 0;
        
        // Position vertically based on click, ensure it doesn't intersect footer or go below viewport
        let top = clickEvent.clientY;
        const maxTop = window.innerHeight - contentRect.height - footerHeight - 10;
        top = Math.min(Math.max(10, top), maxTop);
        
        // Position horizontally based on side preference, ensure it stays within viewport
        let left: number;
        if (this.rightSidePreferred) {
            // Left edge of prompt starts at click X + gap → extends to the right
            left = clickEvent.clientX + this.minHorizontalGapFromClick;
            const maxLeft = window.innerWidth - contentRect.width - 10;
            left = Math.min(Math.max(10, left), maxLeft);
        } else {
            // Right edge of prompt ends at click X - gap → extends to the left
            left = clickEvent.clientX - contentRect.width - this.minHorizontalGapFromClick;
            left = Math.min(Math.max(10, left), window.innerWidth - contentRect.width - 10);
        }
        
        // Now set the final position and make visible
        this.promptContentContainer.style.position = 'fixed';
        this.promptContentContainer.style.top = top + 'px';
        this.promptContentContainer.style.left = left + 'px';
        this.promptContentContainer.style.opacity = '1';
        this.promptContentContainer.style.pointerEvents = 'auto';
        
        console.log('Positioned at:', top, left, 'with dimensions:', contentRect.width, 'x', contentRect.height);
    }

    public forceCancelAndClose(): void {
        this.onCancel();
        this.closePrompt();
    }
}
// #endregion

/**
 * Simple confirmation prompt with customizable text and confirm/cancel callbacks
 */
export class ConfirmationPrompt extends FullscreenPrompt {
    private promptHTML!: string;

    private confirmButtonText!: string;
    private cancelButtonText!: string;

    constructor(
        promptTitle: string,
        promptHTML: string, 
        confirmButtonText: string,
        cancelButtonText: string,
        onConfirm: () => void, onCancel: () => void = () => {}
    ) {
            
        // Call base class constructor
        super(
            promptTitle,
            () => {
                onConfirm();
                this.closePrompt();
            }, 
            () => {
                onCancel();
                this.closePrompt();
            }
        );

        // Set button text variables
        this.promptHTML = promptHTML;
        this.confirmButtonText = confirmButtonText;
        this.cancelButtonText = cancelButtonText;
        // Initialize the DOM structure for the specific prompt.
        this.initializePrimaryDOM();
    }

    protected initializePrimaryDOM(): void {
        // Set confirmation button text
        this.confirmButton.textContent = this.confirmButtonText;
        
        // Set cancel button text
        this.cancelButton.textContent = this.cancelButtonText;

        // Create prompt message element
        const messageEl = document.createElement('p');
        messageEl.innerHTML = this.promptHTML;
        messageEl.style.cssText = `
            margin: 0 0 20px 0;
            color: #cccccc;
            font-size: 14px;
            line-height: 1.5;
        `;

        // Insert message into the dialog, above the buttons
        this.insertElementIntoDialog(messageEl);
    }
}

// #region Popout Menu Prompts
export class ColorPickerPrompt extends PopoutMenuPrompt {
    private onChange!: ((color: string) => void) | null
    private initialColor!: string;

    // Color DOM elements
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private hueSlider!: HTMLInputElement;

    private currentHue!: number;
    private currentColorDisplay!: HTMLDivElement;
    private currentLightness!: number;
    private currentSaturation!: number;
    private gradientCache!: ImageData | null;

    private hexInput!: HTMLInputElement;
    private confirmBtn!: HTMLButtonElement;

    private isDragging: boolean = false;

    constructor(
        initialColor: string,
        clickEvent: MouseEvent,
        onConfirm: (color: string) => void, 
        onChange: ((color: string) => void) | null, 
        onCancel: () => void,
        rightSidePreferred: boolean = true,
        minHorizontalGapFromClick: number = 20,
    ) {        
        // Call base class constructor
        super(onConfirm, onCancel);

        // Validate and set initial color (default to white if invalid)
        if (!initialColor || !/^#[0-9A-Fa-f]{6}$/.test(initialColor)) {
            this.initialColor = '#ffffff';
        } else {
            this.initialColor = initialColor;
        }
        this.onChange = onChange;

        // Parse initial color to set current hue, saturation, and lightness
        this.parseHexColor(this.initialColor);

        // Initialize the DOM structure for the color picker prompt
        this.initializePrimaryDOM();

        // Setup event listeners for the color picker interactions
        this.setupEventListeners();

        // Draw initial color square and selector
        this.drawColorSquare();
        this.drawSelector();

        // Position the prompt AFTER the browser has calculated layout
        // requestAnimationFrame ensures the DOM has been rendered and sized
        requestAnimationFrame(() => {
            this.positionPrompt(clickEvent);
        });
    }

    private initializePrimaryDOM(): void {
        console.log('initializePrimaryDOM: Starting DOM construction');
        
        // Create canvas for color square
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'color-picker-canvas';

        // Calculate canvas size based on current font size for responsive scaling
        const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const canvasSize = Math.floor(17.5 * baseFontSize);
        console.log('Canvas size calculated:', canvasSize, 'baseFontSize:', baseFontSize);
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

        // Create color comparison box
        const colorCompareBox = document.createElement('div');
        colorCompareBox.className = 'color-picker-compare-box';
        
        const previousColor = document.createElement('div');
        previousColor.className = 'color-picker-previous-color';
        previousColor.style.backgroundColor = this.initialColor;
        
        this.currentColorDisplay = document.createElement('div');
        this.currentColorDisplay.className = 'color-picker-current-color';
        this.currentColorDisplay.style.backgroundColor = this.initialColor;
        
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
        this.hexInput.value = this.initialColor;

        // Create confirm button
        this.confirmBtn = document.createElement('button');
        this.confirmBtn.className = 'color-picker-confirm-btn';
        this.confirmBtn.textContent = 'Confirm';

        // Create controls column (color compare + hex/confirm stacked)
        const controlsColumn = document.createElement('div');
        controlsColumn.className = 'color-picker-controls-column';

        // Create hue slider wrapper — clips the rotated slider so it never overflows the prompt
        const hueSliderWrapper = document.createElement('div');
        hueSliderWrapper.className = 'color-picker-hue-wrapper';
        const barThickness = 18;
        hueSliderWrapper.style.width = barThickness + 'px';
        hueSliderWrapper.style.height = canvasSize + 'px';

        // Rotate the slider -90deg and offset so it fills the wrapper exactly
        const offset = (canvasSize - barThickness) / 2;
        this.hueSlider.style.width = canvasSize + 'px';
        this.hueSlider.style.height = barThickness + 'px';
        this.hueSlider.style.position = 'absolute';
        this.hueSlider.style.top = offset + 'px';
        this.hueSlider.style.left = (-offset) + 'px';
        this.hueSlider.style.transform = 'rotate(-90deg)';
        this.hueSlider.style.transformOrigin = 'center';
        this.hueSlider.style.margin = '0';
        hueSliderWrapper.appendChild(this.hueSlider);

        // Assemble elements
        bottomControls.appendChild(this.hexInput);
        bottomControls.appendChild(this.confirmBtn);
        controlsColumn.appendChild(colorCompareBox);
        controlsColumn.appendChild(bottomControls);
        rightContainer.appendChild(controlsColumn);
        rightContainer.appendChild(hueSliderWrapper);
        this.promptContentContainer.appendChild(this.canvas);
        this.promptContentContainer.appendChild(rightContainer);
        
        console.log('initializePrimaryDOM: DOM construction complete');
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        console.log('promptContentContainer children:', this.promptContentContainer.children.length);
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
            if (this.onChange) {
                this.onChange(hexColor);
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
                if (this.onChange) {
                    this.onChange(hexValue);
                }
                
                this.drawColorSquare();
                this.drawSelector();
            }
        });

        // Confirm button
        this.confirmBtn.addEventListener('click', () => {
            this.onConfirm(this.hexInput.value);
            this.closePrompt();
        });
    }

    // #region Utility methods
    private parseHexColor(hex: string): void {
        // Validate hex format
        if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            hex = '#ffffff'; // Default to white
        }
        
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
        if (this.onChange) {
            this.onChange(hexColor);
        }
        
        // Only update hex input when requested (on mouse up or initial click)
        if (updateHex) {
            this.hexInput.value = hexColor;
        }

        // Only redraw the selector, not the entire gradient
        this.drawSelector();
    }    
    // #endregion
}
// #endregion

/**
 * Input prompt with customizable text, confirm/cancel callbacks, and input validation
 */
export abstract class InputPrompt extends FullscreenPrompt {
    private promptHTML!: string;

    private confirmButtonText!: string;
    private cancelButtonText!: string;

    constructor(
        promptTitle: string,
        promptHTML: string, 
        confirmButtonText: string,
        cancelButtonText: string,
        onConfirm: (...args: any[]) => void,
        onCancel: () => void = () => {},
        promptWidth?: number,
        promptHeight?: number
    ) {
            
        // Call base class constructor
        super(
            promptTitle,
            (...args: any[]) => {
                onConfirm(...args);
                this.closePrompt();
            }, 
            () => {
                onCancel();
                this.closePrompt();
            },
            promptWidth,
            promptHeight
        );

        // Set button text variables
        this.promptHTML = promptHTML;
        this.confirmButtonText = confirmButtonText;
        this.cancelButtonText = cancelButtonText;
        // Initialize the DOM structure for the specific prompt.
        this.initializePrimaryDOM();
    }

    protected initializePrimaryDOM(): void {
        // Set confirmation button text
        this.confirmButton.textContent = this.confirmButtonText;
        
        // Set cancel button text
        this.cancelButton.textContent = this.cancelButtonText;

        // Create prompt message element
        const messageEl = document.createElement('p');
        messageEl.innerHTML = this.promptHTML;
        messageEl.style.cssText = `
            margin: 0 0 20px 0;
            color: #cccccc;
            font-size: 14px;
            line-height: 1.5;
        `;

        // Insert message into the dialog, above the buttons
        this.insertElementIntoDialog(messageEl);
    }

    protected abstract initializeAdditionalDOM(): void;
    
    protected abstract collectInput(): any[];
}

/**
 * A simple single-text-field input prompt.
 */
export class SingleTextInputPrompt extends InputPrompt {
    private textInput!: HTMLInputElement;
    private readonly defaultValue: string;

    constructor(
        promptTitle: string,
        labelHTML: string,
        defaultValue: string = '',
        confirmButtonText: string = 'Confirm',
        cancelButtonText: string = 'Cancel',
        onConfirm: (value: string) => void,
        onCancel: () => void = () => {},
        promptWidth: number = 440
    ) {
        super(promptTitle, labelHTML, confirmButtonText, cancelButtonText,
              (v: string) => onConfirm(v), onCancel, promptWidth);
        this.defaultValue = defaultValue;
        this.initializeAdditionalDOM();
    }

    protected initializeAdditionalDOM(): void {
        this.textInput = document.createElement('input');
        this.textInput.type = 'text';
        this.textInput.value = this.defaultValue;
        this.textInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            color: #e0e0e0;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
            margin-bottom: 16px;
            transition: border-color 0.15s;
        `;
        this.textInput.addEventListener('focus', () => { this.textInput.style.borderColor = '#6ba3ff'; });
        this.textInput.addEventListener('blur',  () => { this.textInput.style.borderColor = '#3a3a3a'; });
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirm();
        });
        this.insertElementIntoDialog(this.textInput);
        setTimeout(() => { this.textInput.focus(); this.textInput.select(); }, 50);
    }

    protected override confirm(): void {
        super.confirm(this.textInput.value);
    }

    protected collectInput(): any[] {
        return [this.textInput.value];
    }
}

// #region File List Viewer Prompts
export enum FileSortType {
    ALPHA,
    DATE,
    NUMBER,
    NONE
}

export abstract class FileListViewerPrompt extends InputPrompt {
    private fileMetadatasGetPath!: string;
    
    private filesFetched: boolean = false;
    private populated: boolean = false;

    protected fileMetadatas: Array<FileMetadata> = [];
    private columnLabels: {[name: string]: FileSortType};
    private sortColumn: string | null = null;
    private sortAscending: boolean = true;
    private sortArrows: Map<string, HTMLSpanElement> = new Map();

    protected selectedRow!: HTMLTableRowElement | null;
    private _selectedFileMetadata: FileMetadata | null = null;
    protected get selectedFileMetadata(): FileMetadata | null { return this._selectedFileMetadata; }
    protected set selectedFileMetadata(v: FileMetadata | null) {
        this._selectedFileMetadata = v;
        if (this.deleteBtn) this.deleteBtn.disabled = v === null;
    }
    protected tBody!: HTMLTableSectionElement;
    protected fileCountElement!: HTMLSpanElement;
    protected emptyStateElement!: HTMLDivElement;

    private showUploadButton: boolean = false;
    private uploadPath: string | null = null;
    private uploadAcceptTypes: string = '';

    private showDeleteButton: boolean = false;
    private deleteEndpoint: string | null = null;
    private deleteBtn: HTMLButtonElement | null = null;

    protected override confirm(): void {
        if (this.selectedFileMetadata) super.confirm(this.selectedFileMetadata);
    }

    constructor(
        promptTitle: string, 
        confirmButtonText: string, 
        cancelButtonText: string, 
        onConfirm: (fileMetadata: FileMetadata) => void,
        onCancel: () => void = () => {},
        fileMetadatasGetPath: string,
        columnLabels: {[name: string]: FileSortType} = {
            'Name': FileSortType.ALPHA, 
            'Date Modified': FileSortType.DATE, 
            'File Size': FileSortType.NUMBER
        },
        promptWidth: number = 820,
        promptHeight: number = 580,
        showUploadButton: boolean = false,
        uploadPath: string | null = null,
        uploadAcceptTypes: string = '',
        showDeleteButton: boolean = false,
        deleteEndpoint: string | null = null
    ) {
        // Call base class constructor
        super(promptTitle, "", confirmButtonText, cancelButtonText, onConfirm, onCancel, promptWidth, promptHeight);

        // Store column labels
        this.columnLabels = columnLabels;

        // Set file metadata endpoint
        this.fileMetadatasGetPath = fileMetadatasGetPath;

        // Upload button settings
        this.showUploadButton = showUploadButton;
        this.uploadPath = uploadPath;
        this.uploadAcceptTypes = uploadAcceptTypes;

        // Delete button settings
        this.showDeleteButton = showDeleteButton;
        this.deleteEndpoint = deleteEndpoint;

        // Initialize the DOM structure for the specific prompt.
        this.initializePrimaryDOM();

        // Fetch file metadata and populate the file list and then populate the file list in the DOM
        this.fetchFileMetadatas().then((fileMetadatas) => {
            console.log('Fetched file metadatas:', fileMetadatas);
            // Set flag to true
            this.filesFetched = true;
            this.fileMetadatas = fileMetadatas;

            // Now that we have the file metadata, we can populate the file list in the DOM
            this.populateFileListInDOM();
        });
    }

    private async fetchFileMetadatas(): Promise<Array<FileMetadata>> {
        try {
            const response = await fetch(this.fileMetadatasGetPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch file metadatas: ${response.statusText}`);
            }
            const data = await response.json();
            return data.metadatas || [];
        } catch (error) {
            console.error('Error fetching file metadatas:', error);
            return [];
        }
    }

    private populateFileListInDOM(): void {
        // Clear existing rows before re-rendering
        while (this.tBody.firstChild) this.tBody.removeChild(this.tBody.firstChild);

        for (const metadata of this.fileMetadatas.reverse()) {
            this.initializeFileItemDOM(metadata.name, metadata.lastModified, metadata.fileSize, metadata.UUID, metadata);
        }
        const count = this.fileMetadatas.length;
        this.updateFileCount(count, count);
        if (this.emptyStateElement) {
            this.emptyStateElement.style.display = count === 0 ? 'flex' : 'none';
            if (count === 0) this.emptyStateElement.textContent = 'No files found.';
        }
    }

    private updateFileCount(visible: number, total: number): void {
        if (this.fileCountElement) {
            this.fileCountElement.textContent = visible === total
                ? `${total} file${total !== 1 ? 's' : ''}`
                : `${visible} of ${total} file${total !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Returns the sort key for a given column label. Override in subclasses for custom mappings.
     */
    protected getSortKey(metadata: FileMetadata, columnLabel: string): string | number {
        const label = columnLabel.toLowerCase();
        if (label.includes('name'))                          return metadata.name.toLowerCase();
        if (label.includes('date') || label.includes('modified')) return new Date(metadata.lastModified).getTime();
        if (label.includes('size'))                          return metadata.fileSize;
        if (label.includes('uuid'))                          return metadata.UUID.toLowerCase();
        return metadata.name.toLowerCase();
    }

    private sortAndRender(column: string): void {
        if (this.sortColumn === column) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortColumn = column;
            this.sortAscending = true;
        }

        // Update arrow visuals on all header arrows
        for (const [label, arrow] of this.sortArrows) {
            if (label === this.sortColumn) {
                arrow.textContent = this.sortAscending ? '↑' : '↓';
                arrow.style.color = '#6ba3ff';
                arrow.style.opacity = '1';
            } else {
                arrow.textContent = '↕';
                arrow.style.color = '#555';
                arrow.style.opacity = '0.5';
            }
        }

        // Sort fileMetadatas in-place
        if (this.sortColumn !== null) {
            const col = this.sortColumn;
            const asc = this.sortAscending;
            this.fileMetadatas.sort((a, b) => {
                const ka = this.getSortKey(a, col);
                const kb = this.getSortKey(b, col);
                if (ka < kb) return asc ? -1 : 1;
                if (ka > kb) return asc ? 1 : -1;
                return 0;
            });
        }

        // Deselect current selection (row indices changed)
        if (this.selectedRow) {
            this.selectedRow.style.background = '';
            this.selectedRow.style.color = '';
        }
        this.selectedRow = null;
        this.selectedFileMetadata = null;
        this.confirmButton.disabled = true;

        // Re-render rows
        this.populateFileListInDOM();
    }

    protected initializeAdditionalDOM(): void {
        // Outer wrapper - fills remaining dialog space between title and buttons
        const outerWrapper = document.createElement('div');
        outerWrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            flex: 1 1 0;
            min-height: 0;
            overflow: hidden;
            border-radius: 6px;
            border: 1px solid #333;
            margin-bottom: 4px;
            background: #1e1e1e;
        `;

        // Toolbar: search input + file count
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            background: #252525;
            border-bottom: 1px solid #333;
            flex-shrink: 0;
        `;

        const searchIcon = document.createElement('span');
        searchIcon.textContent = '⌕';
        searchIcon.style.cssText = `color: #666; font-size: 16px; line-height: 1; flex-shrink: 0;`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search files...';
        searchInput.style.cssText = `
            flex: 1;
            padding: 6px 10px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            color: #e0e0e0;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
        `;
        searchInput.addEventListener('focus', () => { searchInput.style.borderColor = '#6ba3ff'; });
        searchInput.addEventListener('blur',  () => { searchInput.style.borderColor = '#3a3a3a'; });

        this.fileCountElement = document.createElement('span');
        this.fileCountElement.style.cssText = `
            font-size: 11px;
            color: #666;
            white-space: nowrap;
            flex-shrink: 0;
            font-variant-numeric: tabular-nums;
        `;
        this.fileCountElement.textContent = 'Loading...';

        toolbar.appendChild(searchIcon);
        toolbar.appendChild(searchInput);
        toolbar.appendChild(this.fileCountElement);

        // Delete button (shown when showDeleteButton is true and deleteEndpoint is set)
        if (this.showDeleteButton && this.deleteEndpoint) {
            const deleteEndpoint = this.deleteEndpoint;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑 Delete';
            deleteBtn.disabled = true;
            deleteBtn.style.cssText = `
                padding: 5px 12px;
                background: #4a2e2e;
                border: 1px solid #6b3d3d;
                border-radius: 4px;
                color: #c87f7f;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: background 0.15s, border-color 0.15s, opacity 0.15s;
            `;
            deleteBtn.onmouseenter = () => {
                if (!deleteBtn.disabled) {
                    deleteBtn.style.background = '#6b3d3d';
                    deleteBtn.style.borderColor = '#9e5a5a';
                }
            };
            deleteBtn.onmouseleave = () => {
                deleteBtn.style.background = '#4a2e2e';
                deleteBtn.style.borderColor = '#6b3d3d';
            };

            // Style disabled state via observer so CSS :disabled can't fight us
            const applyDisabledStyle = () => {
                deleteBtn.style.opacity = deleteBtn.disabled ? '0.4' : '1';
                deleteBtn.style.cursor  = deleteBtn.disabled ? 'not-allowed' : 'pointer';
            };
            new MutationObserver(applyDisabledStyle).observe(deleteBtn, { attributes: true, attributeFilter: ['disabled'] });
            applyDisabledStyle();

            deleteBtn.addEventListener('click', () => {
                const metadata = this.selectedFileMetadata;
                if (!metadata) return;

                new ConfirmationPrompt(
                    'Delete File',
                    `Are you sure you want to permanently delete <strong>${metadata.name}</strong>? This cannot be undone.`,
                    'Delete',
                    'Cancel',
                    async () => {
                        const prevText = deleteBtn.textContent ?? '🗑 Delete';
                        deleteBtn.disabled = true;
                        deleteBtn.textContent = '⏳ Deleting...';

                        try {
                            const resp = await fetch(deleteEndpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(this.buildDeleteBody(metadata)),
                            });

                            if (!resp.ok) throw new Error(await resp.text());

                            // Deselect and refresh list
                            this.selectedRow = null;
                            this.selectedFileMetadata = null;
                            this.confirmButton.disabled = true;
                            this.fileMetadatas = await this.fetchFileMetadatas();
                            this.populateFileListInDOM();
                        } catch (err) {
                            console.error('Delete failed:', err);
                        } finally {
                            deleteBtn.textContent = prevText;
                        }
                    }
                );
            });

            this.deleteBtn = deleteBtn;
            toolbar.appendChild(deleteBtn);
        }

        // Upload button (shown when showUploadButton is true and uploadPath is set)
        if (this.showUploadButton && this.uploadPath) {
            const uploadPath = this.uploadPath;
            const uploadAcceptTypes = this.uploadAcceptTypes;

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = '⬆ Upload';
            uploadBtn.style.cssText = `
                padding: 5px 12px;
                background: #2e4a2e;
                border: 1px solid #3d6b3d;
                border-radius: 4px;
                color: #7fc87f;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: background 0.15s, border-color 0.15s;
            `;
            uploadBtn.onmouseenter = () => {
                uploadBtn.style.background = '#3d6b3d';
                uploadBtn.style.borderColor = '#5a9e5a';
            };
            uploadBtn.onmouseleave = () => {
                uploadBtn.style.background = '#2e4a2e';
                uploadBtn.style.borderColor = '#3d6b3d';
            };

            uploadBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                if (uploadAcceptTypes) fileInput.accept = uploadAcceptTypes;
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                fileInput.addEventListener('change', () => {
                    const file = fileInput.files?.[0];
                    document.body.removeChild(fileInput);
                    if (!file) return;

                    const defaultName = file.name.replace(/\.[^/.]+$/, '');

                    new SingleTextInputPrompt(
                        'Name Your File',
                        'Enter a display name for the uploaded file:',
                        defaultName,
                        'Upload',
                        'Cancel',
                        async (name: string) => {
                            const trimmed = name.trim();
                            if (!trimmed) return;

                            const prevText = uploadBtn.textContent ?? '⬆ Upload';
                            uploadBtn.disabled = true;
                            uploadBtn.textContent = '⏳ Uploading...';

                            try {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('name', trimmed);

                                const resp = await fetch(uploadPath, {
                                    method: 'POST',
                                    body: formData,
                                });

                                if (!resp.ok) throw new Error(await resp.text());

                                // Refresh the file list
                                this.fileMetadatas = await this.fetchFileMetadatas();
                                this.populateFileListInDOM();
                            } catch (err) {
                                console.error('Upload failed:', err);
                            } finally {
                                uploadBtn.disabled = false;
                                uploadBtn.textContent = prevText;
                            }
                        }
                    );
                });

                fileInput.click();
            });

            toolbar.appendChild(uploadBtn);
        }

        // Scrollable table area
        const scrollArea = document.createElement('div');
        scrollArea.style.cssText = `
            flex: 1 1 0;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
        `;
        (scrollArea.style as any).scrollbarWidth = 'thin';
        (scrollArea.style as any).scrollbarColor = '#3a3a3a #1a1a1a';

        // Table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            color: #ddd;
            font-size: 13px;
            table-layout: fixed;
        `;

        // Sticky header — built dynamically from columnLabels
        const thead = document.createElement('thead');
        thead.style.cssText = `position: sticky; top: 0; z-index: 1;`;
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#252525';

        for (const [label, sortType] of Object.entries(this.columnLabels)) {
            const th = document.createElement('th');
            th.style.cssText = `
                padding: 9px 14px;
                font-weight: 600;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #888;
                border-bottom: 1px solid #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                user-select: none;
            `;

            const labelSpan = document.createElement('span');
            labelSpan.textContent = label;

            th.appendChild(labelSpan);

            if (sortType !== FileSortType.NONE) {
                th.style.cursor = 'pointer';

                const arrow = document.createElement('span');
                arrow.textContent = '↕';
                arrow.style.cssText = `
                    margin-left: 5px;
                    font-size: 11px;
                    color: #555;
                    opacity: 0.5;
                    transition: color 0.15s, opacity 0.15s;
                `;
                th.appendChild(arrow);
                this.sortArrows.set(label, arrow);

                th.addEventListener('mouseenter', () => {
                    if (this.sortColumn !== label) arrow.style.opacity = '1';
                    th.style.color = '#aaa';
                    th.style.background = '#2e2e2e';
                });
                th.addEventListener('mouseleave', () => {
                    if (this.sortColumn !== label) arrow.style.opacity = '0.5';
                    th.style.color = '';
                    th.style.background = '';
                });
                th.addEventListener('click', () => this.sortAndRender(label));
            }

            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        this.tBody = document.createElement('tbody');
        table.appendChild(this.tBody);
        scrollArea.appendChild(table);

        // Empty / loading state
        this.emptyStateElement = document.createElement('div');
        this.emptyStateElement.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            color: #555;
            font-size: 13px;
            font-style: italic;
        `;
        this.emptyStateElement.textContent = 'Loading files...';
        scrollArea.appendChild(this.emptyStateElement);

        outerWrapper.appendChild(toolbar);
        outerWrapper.appendChild(scrollArea);
        this.insertElementIntoDialog(outerWrapper);

        // Search filtering
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            let visible = 0;
            const total = this.tBody.rows.length;
            for (const row of Array.from(this.tBody.rows)) {
                const match = (row.textContent ?? '').toLowerCase().includes(term);
                row.style.display = match ? '' : 'none';
                if (match) visible++;
            }
            // Deselect row if now hidden
            if (this.selectedRow && this.selectedRow.style.display === 'none') {
                this.selectedRow.style.background = '';
                this.selectedRow.style.color = '';
                this.selectedRow = null;
                this.selectedFileMetadata = null;
                this.confirmButton.disabled = true;
            }
            this.updateFileCount(visible, total);
            this.emptyStateElement.style.display = visible === 0 ? 'flex' : 'none';
            this.emptyStateElement.textContent = term ? 'No files match your search.' : 'No files found.';
        });
    }

    protected collectInput(): any[] {
        return [];
    }

    /**
     * Override in subclasses to customise the JSON body sent to the delete endpoint.
     * By default sends `{ UUID }` of the selected file.
     */
    protected buildDeleteBody(metadata: FileMetadata): object {
        return { UUID: metadata.UUID };
    }

    protected abstract initializeFileItemDOM(...metadata: any[]): void;
}

export class GeoeditFileListViewerPrompt extends FileListViewerPrompt {
    constructor(onConfirm: (fileMetadata: FileMetadata) => void, onCancel: () => void = () => {})
    {
        // Call base class constructor
        super(
            'Load Geoedit File',
            'Load',
            'Cancel',
            onConfirm,
            onCancel,
            "/geofence/list_metadatas",
            {
                'Name':          FileSortType.ALPHA,
                'Date Modified': FileSortType.DATE,
                'Size':          FileSortType.NUMBER,
                'UUID':          FileSortType.NONE,
            },
            820,
            580,
            true,
            '/geofence/upload',
            '.geoedit',
            true,
            '/geofence/delete'
        );

        this.initializeAdditionalDOM();
    }

    protected initializeFileItemDOM(...metadata: any[]): void {
        const [name, lastModified, fileSize, UUID, fullMetadata] = metadata;
        const tr = document.createElement('tr');
        tr.style.cssText = `cursor: pointer; color: #ddd; border-bottom: 1px solid #2a2a2a;`;
        tr.tabIndex = 0;

        const cellStyle = `padding: 9px 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;

        const tdName = document.createElement('td');
        tdName.style.cssText = cellStyle + ' font-weight: 500;';
        tdName.textContent = name;
        tdName.title = name;

        const tdDate = document.createElement('td');
        tdDate.style.cssText = cellStyle + ' color: #aaa;';
        tdDate.textContent = new Date(lastModified).toLocaleString();

        const tdSize = document.createElement('td');
        tdSize.style.cssText = cellStyle + ' text-align: right; color: #aaa; font-variant-numeric: tabular-nums;';
        tdSize.textContent = (fileSize / 1024).toFixed(1) + ' KB';

        const tdUUID = document.createElement('td');
        tdUUID.style.cssText = cellStyle + ' font-family: monospace; font-size: 11px; color: #666;';
        tdUUID.textContent = UUID;
        tdUUID.title = UUID;

        tr.appendChild(tdName);
        tr.appendChild(tdDate);
        tr.appendChild(tdSize);
        tr.appendChild(tdUUID);

        tr.onmouseenter = () => { if (tr !== this.selectedRow) tr.style.background = '#2c2c2c'; };
        tr.onmouseleave = () => { if (tr !== this.selectedRow) tr.style.background = ''; };
        tr.onclick = () => {
            if (this.selectedRow) {
                this.selectedRow.style.background = '';
                this.selectedRow.style.color = '#ddd';
                this.selectedRow.querySelectorAll('td').forEach(td => (td as HTMLElement).style.color = '');
            }
            this.selectedRow = tr;
            this.selectedFileMetadata = fullMetadata;
            tr.style.background = '#1c3557';
            tr.style.color = '#e8f1ff';
            tdDate.style.color = '#b0c8f0';
            tdSize.style.color = '#b0c8f0';
            tdUUID.style.color = '#7a9cc8';
            this.confirmButton.disabled = false;
        };

        this.tBody.appendChild(tr);
    }
}

export class StatusCollectionFileListViewerPrompt extends FileListViewerPrompt {
    constructor(
        onConfirm: (fileMetadata: StatusCollectionFileMetadata) => void,
        onCancel: () => void = () => {}
    ) {
        super(
            'Status Collections',
            'Load',
            'Cancel',
            onConfirm as (fileMetadata: FileMetadata) => void,
            onCancel,
            '/status_collection/list_metadatas',
            {
                'Name':          FileSortType.ALPHA,
                'Description':   FileSortType.NONE,
                'Date Modified': FileSortType.DATE,
                'Size':          FileSortType.NUMBER,
                'UUID':          FileSortType.NONE,
            },
            940,
            580,
            true,
            '/status_collection/upload',
            '.scollection',
            true,
            '/status_collection/delete'
        );
        this.initializeAdditionalDOM();
    }

    protected initializeFileItemDOM(...metadata: any[]): void {
        const [name, lastModified, fileSize, UUID, fullMetadata] = metadata as [string, string, number, string, StatusCollectionFileMetadata];
        const description: string = (fullMetadata as any).description ?? '';

        const tr = document.createElement('tr');
        tr.style.cssText = `cursor: pointer; color: #ddd; border-bottom: 1px solid #2a2a2a;`;
        tr.tabIndex = 0;

        const cellStyle = `padding: 9px 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;

        const tdName = document.createElement('td');
        tdName.style.cssText = cellStyle + ' font-weight: 500;';
        tdName.textContent = name;
        tdName.title = name;

        const tdDesc = document.createElement('td');
        tdDesc.style.cssText = cellStyle + ' color: #888; font-style: italic;';
        tdDesc.textContent = description || '—';
        tdDesc.title = description;

        const tdDate = document.createElement('td');
        tdDate.style.cssText = cellStyle + ' color: #aaa;';
        tdDate.textContent = new Date(lastModified).toLocaleString();

        const tdSize = document.createElement('td');
        tdSize.style.cssText = cellStyle + ' text-align: right; color: #aaa; font-variant-numeric: tabular-nums;';
        tdSize.textContent = (fileSize / 1024).toFixed(1) + ' KB';

        const tdUUID = document.createElement('td');
        tdUUID.style.cssText = cellStyle + ' font-family: monospace; font-size: 11px; color: #666;';
        tdUUID.textContent = UUID;
        tdUUID.title = UUID;

        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdDate);
        tr.appendChild(tdSize);
        tr.appendChild(tdUUID);

        tr.onmouseenter = () => { if (tr !== this.selectedRow) tr.style.background = '#2c2c2c'; };
        tr.onmouseleave = () => { if (tr !== this.selectedRow) tr.style.background = ''; };
        tr.onclick = () => {
            if (this.selectedRow) {
                this.selectedRow.style.background = '';
                this.selectedRow.style.color = '#ddd';
                this.selectedRow.querySelectorAll('td').forEach(td => (td as HTMLElement).style.color = '');
            }
            this.selectedRow = tr;
            this.selectedFileMetadata = fullMetadata;
            tr.style.background = '#1c3557';
            tr.style.color = '#e8f1ff';
            tdDesc.style.color = '#b0c8f0';
            tdDate.style.color = '#b0c8f0';
            tdSize.style.color = '#b0c8f0';
            tdUUID.style.color = '#7a9cc8';
            this.confirmButton.disabled = false;
        };

        this.tBody.appendChild(tr);
    }

    protected override getSortKey(metadata: FileMetadata, columnLabel: string): string | number {
        const label = columnLabel.toLowerCase();
        if (label.includes('description')) return ((metadata as any).description ?? '').toLowerCase();
        return super.getSortKey(metadata, columnLabel);
    }
}

export class MediaFileListViewerPrompt extends FileListViewerPrompt {
    private mediaType: 'image' | 'audio';
    private activeAudio: HTMLAudioElement | null = null;
    private activePlayBtn: HTMLButtonElement | null = null;

    protected override buildDeleteBody(metadata: FileMetadata): object {
        const m = metadata as MediaFileMetadata;
        return { UUID: m.UUID, media_type: this.mediaType };
    }

    constructor(
        mediaType: 'image' | 'audio',
        onConfirm: (fileMetadata: MediaFileMetadata) => void,
        onCancel: () => void = () => {}
    ) {
        const title = mediaType === 'image' ? 'Select Image' : 'Select Audio File';
        super(
            title,
            'Select',
            'Cancel',
            onConfirm as (fileMetadata: FileMetadata) => void,
            onCancel,
            `/media/${mediaType}/list_metadatas`,
            {
                'Preview':       FileSortType.NONE,
                'Name':          FileSortType.ALPHA,
                'Date Modified': FileSortType.DATE,
                'Size':          FileSortType.NUMBER,
            },
            860,
            580,
            true,
            `/media/${mediaType}/upload`,
            mediaType === 'image' ? 'image/*' : 'audio/*',
            true,
            `/media/${mediaType}/delete`,
        );
        this.mediaType = mediaType;
        this.initializeAdditionalDOM();
    }

    protected initializeFileItemDOM(...args: any[]): void {
        const [name, lastModified, fileSize, _uuid, fullMetadata] = args as [string, string, number, string, MediaFileMetadata];

        const tr = document.createElement('tr');
        tr.style.cssText = `cursor: pointer; color: #ddd; border-bottom: 1px solid #2a2a2a;`;
        tr.tabIndex = 0;

        const cellStyle = `padding: 9px 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;

        // Thumbnail preview cell
        const tdPreview = document.createElement('td');
        tdPreview.style.cssText = `padding: 4px 10px; width: 52px; text-align: center; vertical-align: middle;`;
        if (this.mediaType === 'image') {
            const img = document.createElement('img');
            img.src = `/media/${this.mediaType}/fetch?uuid=${encodeURIComponent(_uuid)}`;
            img.style.cssText = `width: 36px; height: 36px; object-fit: cover; border-radius: 4px; display: block; margin: auto;`;
            img.onerror = () => { img.style.display = 'none'; };
            tdPreview.appendChild(img);
        } else {
            const audioUrl = `/media/${this.mediaType}/fetch?uuid=${encodeURIComponent(_uuid)}`;
            const playBtn = document.createElement('button');
            playBtn.textContent = '▶';
            playBtn.title = 'Preview audio';
            playBtn.style.cssText = `
                background: #2e2e2e;
                border: 1px solid #444;
                border-radius: 50%;
                color: #aaa;
                cursor: pointer;
                width: 30px;
                height: 30px;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: auto;
                flex-shrink: 0;
                transition: background 0.15s, color 0.15s;
            `;
            playBtn.onmouseenter = () => { playBtn.style.background = '#3a3a3a'; playBtn.style.color = '#fff'; };
            playBtn.onmouseleave = () => { playBtn.style.background = '#2e2e2e'; playBtn.style.color = '#aaa'; };

            const stopCurrent = () => {
                if (this.activeAudio) {
                    this.activeAudio.pause();
                    this.activeAudio.currentTime = 0;
                    this.activeAudio = null;
                }
                if (this.activePlayBtn) {
                    this.activePlayBtn.textContent = '▶';
                    this.activePlayBtn.title = 'Preview audio';
                    this.activePlayBtn.style.borderColor = '#444';
                    this.activePlayBtn.style.color = '#aaa';
                    this.activePlayBtn = null;
                }
            };

            playBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // don't trigger row selection

                // If this button is already playing, stop it
                if (this.activeAudio && this.activePlayBtn === playBtn) {
                    stopCurrent();
                    return;
                }

                // Stop whatever else is playing
                stopCurrent();

                // Start new audio
                const audio = new Audio(audioUrl);
                this.activeAudio = audio;
                this.activePlayBtn = playBtn;
                playBtn.textContent = '⏹';
                playBtn.title = 'Stop preview';
                playBtn.style.borderColor = '#6ba3ff';
                playBtn.style.color = '#6ba3ff';

                audio.play().catch(() => {
                    playBtn.textContent = '▶';
                    playBtn.style.borderColor = '#444';
                    playBtn.style.color = '#aaa';
                    this.activeAudio = null;
                    this.activePlayBtn = null;
                });

                audio.addEventListener('ended', () => {
                    if (this.activePlayBtn === playBtn) {
                        playBtn.textContent = '▶';
                        playBtn.title = 'Preview audio';
                        playBtn.style.borderColor = '#444';
                        playBtn.style.color = '#aaa';
                        this.activeAudio = null;
                        this.activePlayBtn = null;
                    }
                });
            });

            tdPreview.appendChild(playBtn);
        }

        const tdName = document.createElement('td');
        tdName.style.cssText = cellStyle + ' font-weight: 500;';
        tdName.textContent = name;
        tdName.title = name;

        const tdDate = document.createElement('td');
        tdDate.style.cssText = cellStyle + ' color: #aaa;';
        tdDate.textContent = new Date(lastModified).toLocaleString();

        const tdSize = document.createElement('td');
        tdSize.style.cssText = cellStyle + ' text-align: right; color: #aaa; font-variant-numeric: tabular-nums;';
        tdSize.textContent = (fileSize / 1024).toFixed(1) + ' KB';

        tr.appendChild(tdPreview);
        tr.appendChild(tdName);
        tr.appendChild(tdDate);
        tr.appendChild(tdSize);

        tr.onmouseenter = () => { if (tr !== this.selectedRow) tr.style.background = '#2c2c2c'; };
        tr.onmouseleave = () => { if (tr !== this.selectedRow) tr.style.background = ''; };
        tr.onclick = () => {
            if (this.selectedRow) {
                this.selectedRow.style.background = '';
                this.selectedRow.style.color = '#ddd';
                this.selectedRow.querySelectorAll('td').forEach(td => (td as HTMLElement).style.color = '');
            }
            this.selectedRow = tr;
            this.selectedFileMetadata = fullMetadata;
            tr.style.background = '#1c3557';
            tr.style.color = '#e8f1ff';
            tdDate.style.color = '#b0c8f0';
            tdSize.style.color = '#b0c8f0';
            this.confirmButton.disabled = false;
        };

        this.tBody.appendChild(tr);
    }

    protected override closePrompt(): void {
        if (this.activeAudio) {
            this.activeAudio.pause();
            this.activeAudio = null;
        }
        this.activePlayBtn = null;
        super.closePrompt();
    }
}
// #endregion