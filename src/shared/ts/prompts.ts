// #region Base Prompt Classes

import { FileMetadata } from "./types";

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

    constructor(promptTitle: string, onConfirm: (...args: any[]) => void, onCancel: () => void = () => {}) {
        // Store callbacks
        this.promptTitle = promptTitle;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
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
            min-width: 450px;
            max-width: 550px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
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
            this.onConfirm();
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

    protected confirm(): void {
        this.onConfirm();
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
        onConfirm: (...args: any[]) => void, onCancel: () => void = () => {}
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

    protected abstract intializeAdditionalDOM(): void;
    
    protected abstract collectInput(): any[];
}

/**
 * File list viewer prompt for displaying a list of files with metadata and allowing selection
 */
/*export abstract class FileListViewerPrompt extends InputPrompt {
    constructor(promptTitle: string, onConfirm: () => void, onCancel: () => void = () => {}) {
        // Call base class constructor
        super(promptTitle, onConfirm, onCancel);
    }

    protected abstract initializePrimaryDOM(): void;

    protected abstract loadFileList(): Array<{ name: string, lastModified: string, fileSize: number, UUID: string }>;
}*/
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
                this.onConfirm();
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


export abstract class FileListViewerPrompt extends InputPrompt {
    private fileMetadatasGetPath!: string;
    
    private filesFetched: boolean = false;
    private populated: boolean = false;

    private fileMetadatas: Array<FileMetadata> = [];

    protected selectedRow!: HTMLTableRowElement | null;
    protected tBody!: HTMLTableSectionElement;

    constructor(
        promptTitle: string, 
        confirmButtonText: string, 
        cancelButtonText: string, 
        onConfirm: (fileMetadata: FileMetadata) => void, onCancel: () => void = () => {},
        fileMetadatasGetPath: string,
        columnLabels: string[] = ['Name', 'Date Modified', 'Size'],
    ) {
        const 

        // Call base class constructor
        super(promptTitle, "", confirmButtonText, cancelButtonText, onConfirm, onCancel);

        // Set file metadata endpoint
        this.fileMetadatasGetPath = fileMetadatasGetPath;

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
        for (const metadata of this.fileMetadatas) {
            this.initializeFileItemDOM(metadata.name, metadata.lastModified, metadata.fileSize, metadata.UUID);
        }
    }

    protected intializeAdditionalDOM(): void {
        // Initialize the table in the DOM
        // File list container (static height, scrollable)
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
            flex: 1 1 auto;
            overflow-y: auto;
            background: #242424;
            padding: 0 40px;
            max-height: 350px;
            min-height: 350px;
            border-bottom: 1px solid #333333;
        `;

        // Custom scrollbar
        listContainer.style.scrollbarWidth = 'thin';
        listContainer.style.scrollbarColor = '#3a3a3a #0d0d0d';
        listContainer.style.setProperty('scrollbar-width', 'thin');

        // Table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            color: #fff;
            font-size: 1.08rem;
        `;

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background:#1a1a1a;">
                <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">Name</th>
                <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">Date Modified</th>
                <th style="padding: 0.75rem 1rem; text-align:right; font-weight:700;">Size</th>
                <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">UUID</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        this.tBody = document.createElement('tbody');

        table.appendChild(this.tBody);
        listContainer.appendChild(table);
        this.insertElementIntoDialog(listContainer);
    }

    protected collectInput(): any[] {
        return [];
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
            "/geofence/list_metadatas"
        );

        this.intializeAdditionalDOM();
    }

    protected initializeFileItemDOM(...metadata: any[]): void {
        const [name, lastModified, fileSize, UUID] = metadata;
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.tabIndex = 0;
        tr.style.color = '#fff';
        tr.onmouseenter = () => {
            if (tr !==this.selectedRow) tr.style.background = '#3a3a3a';
        };
        tr.onmouseleave = () => {
            if (tr !==this.selectedRow) tr.style.background = '';
        };
        tr.onclick = () => {
            if (this.selectedRow) {
               this.selectedRow.style.background = '';
               this.selectedRow.style.color = '#fff';
            }
           this.selectedRow = tr;
            tr.style.background = '#6ba3ff'; // Sidebar accent color for selection
            tr.style.color = '#181a1b';
            this.confirmButton.disabled = false;
        };
        tr.innerHTML = `
            <td style="padding: 0.6rem 1rem; font-weight:600;">${name}</td>
            <td style="padding: 0.6rem 1rem;">${new Date(lastModified).toLocaleString()}</td>
            <td style="padding: 0.6rem 1rem; text-align:right;">${(fileSize/1024).toFixed(1)} KB</td>
            <td style="padding: 0.6rem 1rem; font-family:monospace;">${UUID}</td>
        `;
        this.tBody.appendChild(tr);
    }
}


/**
 * Large file list dialog for displaying geoedit files with metadata
 */
// export class MapEditorUIFileListDialog {
//     /**
//      * Show a large file list dialog
//      * @param files - Array of file metadata objects
//      * @param onSelect - Callback when a file is selected (clicked)
//      */
//     public static show(
//         files: Array<{ name: string, lastModified: string, fileSize: number, UUID: string }>,
//         onConfirmSelection: (uuid: string) => void,
//         onCancel?: () => void
//     ): void {
//         // Overlay
//         const overlay = document.createElement('div');
//         overlay.style.cssText = `
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100vw;
//             height: 100vh;
//             background: rgba(0,0,0,0.7);
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             z-index: 10001;
//         `;

//         // Dialog
//         const dialog = document.createElement('div');
//         dialog.style.cssText = `
//             background: #1a1a1a;
//             border-radius: 12px;
//             padding: 0;
//             min-width: 720px;
//             max-width: 1100px;
//             min-height: 540px;
//             max-height: 700px;
//             display: flex;
//             flex-direction: column;
//             box-shadow: 0 8px 40px rgba(0,0,0,0.7);
//             border: 1px solid #333333;
//         `;

//         // Title
//         const title = document.createElement('div');
//         title.textContent = 'Load Geoedit File';
//         title.style.cssText = `
//             color: #6ba3ff;
//             font-size: 2.1rem;
//             font-weight: 700;
//             background: #1a1a1a;
//             padding: 28px 40px 18px 40px;
//             border-radius: 18px 4px 0 0 / 8px 18px 0 0; /* Beveled corners */
//             border-bottom: 1px solid #333333;
//             letter-spacing: 0.02em;
//         `;
//         dialog.appendChild(title);

//         // File list container (static height, scrollable)
//         const listContainer = document.createElement('div');
//         listContainer.style.cssText = `
//             flex: 1 1 auto;
//             overflow-y: auto;
//             background: #242424;
//             padding: 0 40px;
//             max-height: 350px;
//             min-height: 350px;
//             border-bottom: 1px solid #333333;
//         `;
//         // Custom scrollbar
//         listContainer.style.scrollbarWidth = 'thin';
//         listContainer.style.scrollbarColor = '#3a3a3a #0d0d0d';
//         listContainer.style.setProperty('scrollbar-width', 'thin');


//         // Table
//         const table = document.createElement('table');
//         table.style.cssText = `
//             width: 100%;
//             border-collapse: collapse;
//             color: #fff;
//             font-size: 1.08rem;
//         `;

//         // Table header
//         const thead = document.createElement('thead');
//         thead.innerHTML = `
//             <tr style="background:#1a1a1a;">
//                 <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">Name</th>
//                 <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">Date Modified</th>
//                 <th style="padding: 0.75rem 1rem; text-align:right; font-weight:700;">Size</th>
//                 <th style="padding: 0.75rem 1rem; text-align:left; font-weight:700;">UUID</th>
//             </tr>
//         `;
//         table.appendChild(thead);

//         // Table body
//         const tbody = document.createElement('tbody');
//         files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
//         let selectedRow: HTMLTableRowElement | null = null;
//         let selectedUUID: string | null = null;
//         for (const file of files) {
//             const tr = document.createElement('tr');
//             tr.style.cursor = 'pointer';
//             tr.tabIndex = 0;
//             tr.style.color = '#fff';
//             tr.onmouseenter = () => {
//                 if (tr !== selectedRow) tr.style.background = '#3a3a3a';
//             };
//             tr.onmouseleave = () => {
//                 if (tr !==selectedRow) tr.style.background = '';
//             };
//             tr.onclick = () => {
//                 if (selectedRow) {
//                    selectedRow.style.background = '';
//                    selectedRow.style.color = '#fff';
//                 }
//                selectedRow = tr;
//                 selectedUUID = file.UUID;
//                 tr.style.background = '#6ba3ff'; // Sidebar accent color for selection
//                 tr.style.color = '#181a1b';
//                 confirmBtn.disabled = false;
//             };
//             tr.innerHTML = `
//                 <td style="padding: 0.6rem 1rem; font-weight:600;">${file.name}</td>
//                 <td style="padding: 0.6rem 1rem;">${new Date(file.lastModified).toLocaleString()}</td>
//                 <td style="padding: 0.6rem 1rem; text-align:right;">${(file.fileSize/1024).toFixed(1)} KB</td>
//                 <td style="padding: 0.6rem 1rem; font-family:monospace;">${file.UUID}</td>
//             `;
//             tbody.appendChild(tr);
//         }
//         table.appendChild(tbody);
//         listContainer.appendChild(table);
//         dialog.appendChild(listContainer);

//         // Footer (confirm and close buttons)
//         const footer = document.createElement('div');
//         footer.style.cssText = `
//             display: flex;
//             flex-direction: row;
//             align-items: center;
//             justify-content: space-between;
//             padding: 18px 40px 28px 40px;
//             background: #1a1a1a;
//             border-radius: 0 0 12px 12px;
//         `;

//         // Confirm button (bottom left)
//         const confirmBtn = document.createElement('button');
//         confirmBtn.textContent = 'Confirm';
//         confirmBtn.disabled = true;
//         confirmBtn.style.cssText = `
//             padding: 0.85rem 2.5rem;
//             background: #6ba3ff;
//             color: #181a1b;
//             border: none;
//             border-radius: 6px;
//             font-size: 1.15rem;
//             font-weight: 700;
//             cursor: pointer;
//             opacity: 1;
//             transition: background 0.2s;
//         `;
//         confirmBtn.onclick = () => {
//             if (selectedUUID) {
//                 document.body.removeChild(overlay);
//                 onConfirmSelection(selectedUUID);
//                 document.removeEventListener('keydown', escapeHandler);
//             }
//         };

//         // Close button (bottom right)
//         const closeBtn = document.createElement('button');
//         closeBtn.textContent = 'Close';
//         closeBtn.style.cssText = `
//             padding: 0.85rem 2.5rem;
//             background: #3a3a3a;
//             color: #fff;
//             border: none;
//             border-radius: 6px;
//             font-size: 1.15rem;
//             font-weight: 700;
//             cursor: pointer;
//         `;
//         closeBtn.onclick = () => { document.body.removeChild(overlay); document.removeEventListener('keydown', escapeHandler); if (onCancel) onCancel(); };

//         footer.appendChild(confirmBtn);
//         footer.appendChild(closeBtn);
//         dialog.appendChild(footer);

//         overlay.appendChild(dialog);
//         document.body.appendChild(overlay);

//         // Escape key closes dialog
//         const escapeHandler = (e: KeyboardEvent) => {
//             if (e.key === 'Escape') {
//                 document.body.removeChild(overlay);
//                 document.removeEventListener('keydown', escapeHandler);
//                 if (onCancel) onCancel();
//             }
//         };
//         document.addEventListener('keydown', escapeHandler);
//     }
// }





/**
 * Simple confirmation dialog utility class
 */
export class MapEditorUITextInputDialog {
    /**
     * Show a confirmation dialog
     */
    public static show(
        title: string, 
        message: string, 
        onConfirm: (inputValue: string) => void, 
        verifyInput: (inputValue: string) => string | true,
        confirmButtonColor: string = '#dc3545'
    ): void {
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

        // Create input field container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 12px;
        `;

        // Create input field
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.placeholder = 'Enter text here...';
        inputField.style.cssText = `
            padding: 8px 12px;
            border: 1px solid #555555;
            border-radius: 4px;
            background-color: #3a3a3a;
            color: white;
            font-size: 14px;
            width: 100%;
        `;
        inputField.oninput = () => {
            attemptVerifyInput();
        };

        // Feedback message
        const feedbackMessage = document.createElement('div');
        feedbackMessage.style.cssText = `
            margin-top: 8px;
            color: #ff6666;
            font-size: 12px;
            min-height: 16px;
        `;

        // Verification function
        const attemptVerifyInput = (): boolean => {
            const result = verifyInput(inputField.value);
            if (result === true) {
                feedbackMessage.textContent = '';
                return true;
            }
            else
            {
                const message = result as string;
                feedbackMessage.textContent = message;
                return false;
            }
        }

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
        inputContainer.appendChild(inputField);
        dialog.appendChild(inputContainer); // <-- Fix: add input field to dialog
        dialog.appendChild(feedbackMessage);
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
            if (attemptVerifyInput() === true) {
                closeDialog();
                onConfirm(inputField.value);
            }
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