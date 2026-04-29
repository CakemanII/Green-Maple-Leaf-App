import { FileMetadata, MediaFileMetadata, StatusCollectionFileMetadata } from "./types";
/**
 * Base class for prompts
 */
export declare abstract class FullscreenPrompt {
    private promptTitle;
    private onConfirm;
    private onCancel;
    private escapeKeyListener;
    protected overlay: HTMLDivElement;
    protected dialog: HTMLDivElement;
    protected confirmButton: HTMLButtonElement;
    protected cancelButton: HTMLButtonElement;
    private promptWidth;
    private promptHeight?;
    constructor(promptTitle: string, onConfirm: (...args: any[]) => void, onCancel?: (() => void) | null, promptWidth?: number, promptHeight?: number);
    private initializeBaseDOM;
    /**
     * Utility method for subclasses to add their specific elements into the dialog, above the buttons
     */
    protected insertElementIntoDialog(element: HTMLElement): void;
    protected insertButtonIntoButtonContainer(button: HTMLButtonElement, index: number): void;
    protected confirm(...args: any[]): void;
    protected cancel(): void;
    protected closePrompt(): void;
    protected abstract initializePrimaryDOM(): void;
}
export declare abstract class PopoutMenuPrompt {
    protected promptContainer: HTMLDivElement;
    protected promptContentContainer: HTMLDivElement;
    private escapeKeyListener;
    private clickOffListener;
    protected onConfirm: (...args: any[]) => void;
    protected onCancel: () => void;
    private rightSidePreferred;
    private minHorizontalGapFromClick;
    constructor(OnConfirm: (...args: any[]) => void, onCancel: () => void, rightSidePreferred?: boolean, minHorizontalGapFromClick?: number);
    private initializeBaseDOM;
    /**
     * Method for closing and removing the prompt from the DOM.
     */
    protected closePrompt(): void;
    /**
     * Method for positioning the prompt according to the click event that triggered it, ensuring it stays within the viewport and doesn't intersect with the footer bar.
     */
    protected positionPrompt(clickEvent: MouseEvent): void;
    private positionWithDimensions;
    forceCancelAndClose(): void;
}
/**
 * Simple confirmation prompt with customizable text and confirm/cancel callbacks
 */
export declare class ConfirmationPrompt extends FullscreenPrompt {
    private promptHTML;
    private confirmButtonText;
    private cancelButtonText;
    constructor(promptTitle: string, promptHTML: string, confirmButtonText: string, cancelButtonText: string | null, onConfirm: () => void, onCancel?: () => void);
    protected initializePrimaryDOM(): void;
}
export declare class ColorPickerPrompt extends PopoutMenuPrompt {
    private onChange;
    private initialColor;
    private canvas;
    private ctx;
    private hueSlider;
    private currentHue;
    private currentColorDisplay;
    private currentLightness;
    private currentSaturation;
    private gradientCache;
    private hexInput;
    private confirmBtn;
    private isDragging;
    constructor(initialColor: string, clickEvent: MouseEvent, onConfirm: (color: string) => void, onChange: ((color: string) => void) | null, onCancel: () => void, rightSidePreferred?: boolean, minHorizontalGapFromClick?: number);
    private initializePrimaryDOM;
    private setupEventListeners;
    private parseHexColor;
    private hslToHex;
    private drawColorSquare;
    private drawSelector;
    private updateColorFromCanvas;
}
export declare class TelemetryLabelSelectorPrompt extends PopoutMenuPrompt {
    private telemetryDict;
    private numericalOnly;
    private categorySelect;
    private typeSelect;
    private unitSelect;
    private observerSelect;
    private cascadeRow;
    private addBtn;
    private loadingEl;
    constructor(clickEvent: MouseEvent, onConfirm: (key: string) => void, onCancel?: () => void, numericalOnly?: boolean);
    private initializePrimaryDOM;
    private fetchTelemetryTypes;
    private populateCategorySelect;
    private repopulateTypes;
    private isNumericType;
    private populateObserver;
    private repopulateUnits;
    private attachCascadeListeners;
}
/**
 * Input prompt with customizable text, confirm/cancel callbacks, and input validation
 */
export declare abstract class InputPrompt extends FullscreenPrompt {
    private promptHTML;
    private confirmButtonText;
    private cancelButtonText;
    constructor(promptTitle: string, promptHTML: string, confirmButtonText: string, cancelButtonText: string, onConfirm: (...args: any[]) => void, onCancel?: () => void, promptWidth?: number, promptHeight?: number);
    protected initializePrimaryDOM(): void;
    protected abstract initializeAdditionalDOM(): void;
    protected abstract collectInput(): any[];
}
/**
 * A simple single-text-field input prompt.
 */
export declare class SingleTextInputPrompt extends InputPrompt {
    private textInput;
    private readonly defaultValue;
    constructor(promptTitle: string, labelHTML: string, defaultValue: string | undefined, confirmButtonText: string | undefined, cancelButtonText: string | undefined, onConfirm: (value: string) => void, onCancel?: () => void, promptWidth?: number);
    protected initializeAdditionalDOM(): void;
    protected confirm(): void;
    protected collectInput(): any[];
}
export declare enum FileSortType {
    ALPHA = 0,
    DATE = 1,
    NUMBER = 2,
    NONE = 3
}
export declare abstract class FileListViewerPrompt extends InputPrompt {
    private fileMetadatasGetPath;
    private filesFetched;
    private populated;
    protected fileMetadatas: Array<FileMetadata>;
    private columnLabels;
    private sortColumn;
    private sortAscending;
    private sortArrows;
    protected selectedRow: HTMLTableRowElement | null;
    private _selectedFileMetadata;
    protected get selectedFileMetadata(): FileMetadata | null;
    protected set selectedFileMetadata(v: FileMetadata | null);
    protected tBody: HTMLTableSectionElement;
    protected fileCountElement: HTMLSpanElement;
    protected emptyStateElement: HTMLDivElement;
    private showUploadButton;
    private uploadPath;
    private uploadAcceptTypes;
    private showDeleteButton;
    private deleteEndpoint;
    private deleteBtn;
    protected confirm(): void;
    constructor(promptTitle: string, confirmButtonText: string, cancelButtonText: string, onConfirm: (fileMetadata: FileMetadata) => void, onCancel: (() => void) | undefined, fileMetadatasGetPath: string, columnLabels?: {
        [name: string]: FileSortType;
    }, promptWidth?: number, promptHeight?: number, showUploadButton?: boolean, uploadPath?: string | null, uploadAcceptTypes?: string, showDeleteButton?: boolean, deleteEndpoint?: string | null);
    private fetchFileMetadatas;
    private populateFileListInDOM;
    private updateFileCount;
    /**
     * Returns the sort key for a given column label. Override in subclasses for custom mappings.
     */
    protected getSortKey(metadata: FileMetadata, columnLabel: string): string | number;
    private sortAndRender;
    protected initializeAdditionalDOM(): void;
    protected collectInput(): any[];
    /**
     * Override in subclasses to customise the JSON body sent to the delete endpoint.
     * By default sends `{ UUID }` of the selected file.
     */
    protected buildDeleteBody(metadata: FileMetadata): object;
    protected abstract initializeFileItemDOM(...metadata: any[]): void;
}
export declare class GeoeditFileListViewerPrompt extends FileListViewerPrompt {
    constructor(onConfirm: (fileMetadata: FileMetadata) => void, onCancel?: () => void);
    protected initializeFileItemDOM(...metadata: any[]): void;
}
export declare class StatusCollectionFileListViewerPrompt extends FileListViewerPrompt {
    constructor(onConfirm: (fileMetadata: StatusCollectionFileMetadata) => void, onCancel?: () => void);
    protected initializeFileItemDOM(...metadata: any[]): void;
    protected getSortKey(metadata: FileMetadata, columnLabel: string): string | number;
}
export declare class InterfaceCollectionFileListViewerPrompt extends FileListViewerPrompt {
    constructor(onConfirm: (fileMetadata: FileMetadata) => void, onCancel?: () => void);
    protected initializeFileItemDOM(...metadata: any[]): void;
}
export declare class MediaFileListViewerPrompt extends FileListViewerPrompt {
    private mediaType;
    private activeAudio;
    private activePlayBtn;
    protected buildDeleteBody(metadata: FileMetadata): object;
    constructor(mediaType: 'image' | 'audio', onConfirm: (fileMetadata: MediaFileMetadata) => void, onCancel?: () => void);
    protected initializeFileItemDOM(...args: any[]): void;
    protected closePrompt(): void;
}
