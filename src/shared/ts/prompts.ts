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

/**
 * Simple confirmation dialog utility class
 */
class MapEditorUITextInputDialog {
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
        dialog.appendChild(buttonContainer);
        inputContainer.appendChild(inputField);
        dialog.appendChild(feedbackMessage);
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