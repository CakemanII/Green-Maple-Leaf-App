/**
 * Prompt Types:
 * File List Viewer
 * Input & Confirmation Dialog
 */

// #region Base Prompt Classes
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
    
}

export class ColorSelectorPrompt {
    
}

// #endregion



/**
 * Large file list dialog for displaying geoedit files with metadata
 */
export class MapEditorUIFileListDialog {
    /**
     * Show a large file list dialog
     * @param files - Array of file metadata objects
     * @param onSelect - Callback when a file is selected (clicked)
     */
    public static show(
        files: Array<{ name: string, lastModified: string, fileSize: number, UUID: string }>,
        onConfirmSelection: (uuid: string) => void,
        onCancel?: () => void
    ): void {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        // Dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a1a;
            border-radius: 12px;
            padding: 0;
            min-width: 720px;
            max-width: 1100px;
            min-height: 540px;
            max-height: 700px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 40px rgba(0,0,0,0.7);
            border: 1px solid #333333;
        `;

        // Title
        const title = document.createElement('div');
        title.textContent = 'Load Geoedit File';
        title.style.cssText = `
            color: #6ba3ff;
            font-size: 2.1rem;
            font-weight: 700;
            background: #1a1a1a;
            padding: 28px 40px 18px 40px;
            border-radius: 18px 4px 0 0 / 8px 18px 0 0; /* Beveled corners */
            border-bottom: 1px solid #333333;
            letter-spacing: 0.02em;
        `;
        dialog.appendChild(title);

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
        const tbody = document.createElement('tbody');
        files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        let selectedRow: HTMLTableRowElement | null = null;
        let selectedUUID: string | null = null;
        for (const file of files) {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.tabIndex = 0;
            tr.style.color = '#fff';
            tr.onmouseenter = () => {
                if (tr !== selectedRow) tr.style.background = '#3a3a3a';
            };
            tr.onmouseleave = () => {
                if (tr !== selectedRow) tr.style.background = '';
            };
            tr.onclick = () => {
                if (selectedRow) {
                    selectedRow.style.background = '';
                    selectedRow.style.color = '#fff';
                }
                selectedRow = tr;
                selectedUUID = file.UUID;
                tr.style.background = '#6ba3ff'; // Sidebar accent color for selection
                tr.style.color = '#181a1b';
                confirmBtn.disabled = false;
            };
            tr.innerHTML = `
                <td style="padding: 0.6rem 1rem; font-weight:600;">${file.name}</td>
                <td style="padding: 0.6rem 1rem;">${new Date(file.lastModified).toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align:right;">${(file.fileSize/1024).toFixed(1)} KB</td>
                <td style="padding: 0.6rem 1rem; font-family:monospace;">${file.UUID}</td>
            `;
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        listContainer.appendChild(table);
        dialog.appendChild(listContainer);

        // Footer (confirm and close buttons)
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 18px 40px 28px 40px;
            background: #1a1a1a;
            border-radius: 0 0 12px 12px;
        `;

        // Confirm button (bottom left)
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.disabled = true;
        confirmBtn.style.cssText = `
            padding: 0.85rem 2.5rem;
            background: #6ba3ff;
            color: #181a1b;
            border: none;
            border-radius: 6px;
            font-size: 1.15rem;
            font-weight: 700;
            cursor: pointer;
            opacity: 1;
            transition: background 0.2s;
        `;
        confirmBtn.onclick = () => {
            if (selectedUUID) {
                document.body.removeChild(overlay);
                onConfirmSelection(selectedUUID);
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        // Close button (bottom right)
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 0.85rem 2.5rem;
            background: #3a3a3a;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 1.15rem;
            font-weight: 700;
            cursor: pointer;
        `;
        closeBtn.onclick = () => { document.body.removeChild(overlay); document.removeEventListener('keydown', escapeHandler); if (onCancel) onCancel(); };

        footer.appendChild(confirmBtn);
        footer.appendChild(closeBtn);
        dialog.appendChild(footer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Escape key closes dialog
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escapeHandler);
                if (onCancel) onCancel();
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}

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