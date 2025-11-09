import { s } from "../../../lib/string-macro";
import { ParseUI } from "../../../lib/parse-ui";
import { CatalogWidgetName, LAYOUT } from "../utils";
import { COLOR } from "../../../lib/colors";
import { stackLayout, type StackFrame } from "../../../lib/stack-layout";

export type WeaponCatalogViewId = "weaponList" | "attachmentSlots" | "attachments";

type HeaderPaginationState = {
    currentPage: number;
    totalPages: number;
};

const BUTTON_SIZE = LAYOUT.MAIN.HEADER.INNER_HEIGHT();

export class MainHeader {
    private container: mod.UIWidget;
    private contentContainer: mod.UIWidget;
    private title: mod.UIWidget;
    private backButtonContainer?: mod.UIWidget;
    private paginationContainer?: mod.UIWidget;
    private paginationNextButton?: mod.UIWidget;
    private paginationPrevButton?: mod.UIWidget
    private viewId: WeaponCatalogViewId;
    private isBackButtonVisible: boolean = false;
    private isPaginationVisible: boolean = false;
    // ID's
    public static readonly IDS = {
        BACK_CONTAINER: `${CatalogWidgetName.mainHeader()}_backContainer`,
        BACK_BUTTON: `${CatalogWidgetName.mainHeader()}_backButton`,
        BACK_BUTTON_LABEL: `${CatalogWidgetName.mainHeader()}_backButtonLabel`,
        PAGINATION_CONTAINER: `${CatalogWidgetName.mainHeader()}_paginationContainer`,
        PAGINATION_PREV_CONTAINER: `${CatalogWidgetName.mainHeader()}_paginationPrevContainer`,
        PAGINATION_NEXT_CONTAINER: `${CatalogWidgetName.mainHeader()}_paginationNextContainer`,
        PAGINATION_PREV_BUTTON: `${CatalogWidgetName.mainHeader()}_paginationPrev`,
        PAGINATION_NEXT_BUTTON: `${CatalogWidgetName.mainHeader()}_paginationNext`,
        PAGINATION_PREV_BUTTON_LABEL: `${CatalogWidgetName.mainHeader()}_paginationPrevLabel`,
        PAGINATION_NEXT_BUTTON_LABEL: `${CatalogWidgetName.mainHeader()}_paginationNextLabel`,
    }
    private static readonly BUTTON_SIZE = LAYOUT.MAIN.HEADER.INNER_HEIGHT();

    constructor(parent: mod.UIWidget, view: WeaponCatalogViewId) {
        const header = ParseUI({
            type: "Container",
            name: CatalogWidgetName.mainHeader(),
            parent,
            size: [LAYOUT.MAIN.HEADER.WIDTH(), LAYOUT.MAIN.HEADER.HEIGHT()],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.None,
        });

        const headerContentContainer = ParseUI({
            type: "Container",
            parent: header,
            size: [LAYOUT.MAIN.HEADER.INNER_WIDTH(), LAYOUT.MAIN.HEADER.INNER_HEIGHT()],
            position: [0, 0],
            anchor: mod.UIAnchor.Center,
            bgFill: mod.UIBgFill.None,
            // bgColor: [0, 0, 1],
            // bgAlpha: 0.3,
        });

        const title = ParseUI({
            type: "Text",
            name: CatalogWidgetName.mainHeaderText(),
            parent: headerContentContainer,
            size: [LAYOUT.MAIN.HEADER.INNER_WIDTH(), LAYOUT.MAIN.HEADER.INNER_HEIGHT()],
            position: [0, 0],
            padding: 0,
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.CenterLeft,
            textLabel: s`ASSAULT`,
            bgFill: mod.UIBgFill.None,
            // bgColor: [1, 0, 0],
            // bgAlpha: 0.3,
        });

        if (!header || !headerContentContainer || !title) {
            throw new Error("Failed to create main header container");
        }

        this.container = header;
        this.contentContainer = headerContentContainer;
        this.title = title;
        this.viewId = view;

        this.createBackButton();
        this.createPagination();   
    }

    public getRootContainer(): mod.UIWidget {
        return this.container;
    }

    public getViewId(): WeaponCatalogViewId {
        return this.viewId;
    }

    public setView(view: WeaponCatalogViewId): void {
        this.viewId = view;
    }

    public setTitle(label: string): void {
        if (!this.title) return;
        mod.SetUITextLabel(this.title, mod.Message(label));
    }

    public setBackButtonVisibility(show: boolean = true): void {
        this.isBackButtonVisible = show;
        this.recalculateLayout();
    }

    public setPaginationVisibility(show: boolean = true): void {
        this.isPaginationVisible = show;
        this.recalculateLayout();
    }

    public configurePagination(state: HeaderPaginationState): void {
        if(!this.paginationContainer || !this.paginationPrevButton || !this.paginationNextButton) {
            console.warn("MainHeader: Unable to configure pagination, elements are missing.");
            return;
        }

        if(state.totalPages > 1) {
            this.setPaginationVisibility(true);
        } else {
            this.setPaginationVisibility(false);
        }

        const disablePrev = state.currentPage <= 1;
        const disableNext = state.currentPage >= state.totalPages;

        mod.SetUIButtonEnabled(this.paginationNextButton, !disableNext);
        mod.SetUIButtonEnabled(this.paginationPrevButton, !disablePrev);
    }  

    private createBackButton(): void {
        const button = this.createButton({
            id: MainHeader.IDS.BACK_BUTTON,
            label: s`<`,
            visible: false,
            variant: "ghost",
        }, this.contentContainer);

        this.backButtonContainer = button.container;
    }

    private createPagination(): void {
        const container = ParseUI({
            type: "Container",
            name: MainHeader.IDS.PAGINATION_CONTAINER,
            parent: this.contentContainer,
            size: [(MainHeader.BUTTON_SIZE * 2) + 12, MainHeader.BUTTON_SIZE],
            position: [0, 0], // Will be positioned later during layout recalculation
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.None,
            visible: false,
        });
        
        if (!container) {
            console.warn("MainHeader: Failed to create pagination container.");
            return;
        }

        const prevButton = this.createButton({
            id: MainHeader.IDS.PAGINATION_PREV_BUTTON,
            label: s`<`,
        }, container);

        const nextButton = this.createButton({
            id: MainHeader.IDS.PAGINATION_NEXT_BUTTON,
            label: s`>`,
            anchor: mod.UIAnchor.TopRight,
        }, container);

        this.paginationContainer = container;
        this.paginationPrevButton = prevButton.button;
        this.paginationNextButton = nextButton.button;
    }

    private recalculateLayout(): void {
        // The expected layout elements's don't exist
        if (!this.backButtonContainer || !this.title || !this.paginationContainer) {
            console.warn("MainHeader: Cannot recalculate layout, some elements are missing.");
            return;
        }

        const GAP = 12;

        // We'll use our stack layout utility to arrange the back button and title
        const items = [
            ...this.isBackButtonVisible ? [{ id: "backButton", size: { width: BUTTON_SIZE, height: BUTTON_SIZE } }] : [],
            { id: "title", size: { width: 0, height: LAYOUT.MAIN.HEADER.INNER_HEIGHT() }, grow: 1 }, // Width 0 with grow means it takes all remaining space
            ...this.isPaginationVisible ? [{ id: "pagination", size: { width: (BUTTON_SIZE * 2) + GAP, height: BUTTON_SIZE } }] : []
        ];

        // Now we can use our layout utility to arrange the items
        const layout = stackLayout(items, {
            direction: "horizontal",
            gap: GAP,
            containerWidth: LAYOUT.MAIN.HEADER.INNER_WIDTH(),
        });

        const updateWidget = (widget: mod.UIWidget, frame: StackFrame) => {
            mod.SetUIWidgetPosition(widget, mod.CreateVector(frame.x, frame.y, 0));
            mod.SetUIWidgetSize(widget, mod.CreateVector(frame.width, frame.height, 0));
        };

        for (const frame of layout.frames) {
            if (frame.id === "backButton") {
                updateWidget(this.backButtonContainer, frame);
            } else if (frame.id === "title") {
                updateWidget(this.title, frame);
            } else if (frame.id === "pagination" && this.paginationContainer) {
                updateWidget(this.paginationContainer, frame);
            }
        }

        mod.SetUIWidgetVisible(this.backButtonContainer, this.isBackButtonVisible);
        mod.SetUIWidgetVisible(this.paginationContainer, this.isPaginationVisible);
    }

    private createButton({id, label, anchor = mod.UIAnchor.TopLeft, position = [0, 0], variant = "normal", visible = true}: {id: string, label: string, anchor?: mod.UIAnchor, position?: [number, number], variant?: "normal" | "ghost", visible?: boolean}, parent: mod.UIWidget): {container: mod.UIWidget | undefined, outline: mod.UIWidget | undefined, button: mod.UIWidget | undefined, textLabel: mod.UIWidget | undefined} {
        const container = ParseUI({
            type: "Container",
            // name: MainHeader.IDS.BACK_CONTAINER, // Maybe this doesn't need a name because we're storing the reference directly
            parent,
            size: [BUTTON_SIZE, BUTTON_SIZE],
            position,
            anchor,
            bgFill: mod.UIBgFill.None,
            visible,
        });

        const button = ParseUI({
            type: "Button",
            name: id,
            parent: container,
            position: [0, 0],
            size: [BUTTON_SIZE, BUTTON_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            buttonColorBase: COLOR.vector("neutral-800"),
            buttonAlphaBase: variant === "ghost" ? 0 : 0.7,
            buttonColorHover: COLOR.vector("neutral-600"),
            buttonAlphaHover: 0.7,
            buttonColorFocused: COLOR.vector("neutral-700"),
            buttonAlphaFocused: 0.7,
        });

        
        const outline = ParseUI({
            type: "Container",
            parent: container,
            size: [BUTTON_SIZE, BUTTON_SIZE],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: variant === "ghost" ?  mod.UIBgFill.None : mod.UIBgFill.OutlineThin,
            bgColor: COLOR.vector("neutral-600"),
            bgAlpha: 1,
        });

        const textLabel = ParseUI({
            type: "Text",
            // name: "",
            parent: container,
            position: [0, 0],
            size: [BUTTON_SIZE, BUTTON_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.Center,
            textLabel: label,
            textSize: 16,
            bgFill: mod.UIBgFill.None,
        });

        return { container, outline, button, textLabel };
    }
}