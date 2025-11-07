import { s } from "../../lib/string-macro";
import { ParseUI } from "../../lib/parse-ui";
import { CatalogWidgetName, LAYOUT } from "./utils";
import { COLOR } from "../../lib/colors";
import { stackLayout } from "../../lib/stack-layout";

export type WeaponCatalogViewId = "weaponList" | "attachmentSlots" | "attachments";

type HeaderPaginationState = {
    current: number;
    total: number;
    visible?: boolean;
    disablePrevious?: boolean;
    disableNext?: boolean;
};

const HEADER_BACK_CONTAINER = `${CatalogWidgetName.mainHeader()}_backContainer`;
const HEADER_BACK_BUTTON = `${CatalogWidgetName.mainHeader()}_backButton`;
const HEADER_BACK_LABEL = `${CatalogWidgetName.mainHeader()}_backLabel`;
const HEADER_PAGINATION_CONTAINER = `${CatalogWidgetName.mainHeader()}_paginationContainer`;
const HEADER_PAGINATION_PREV = `${CatalogWidgetName.mainHeader()}_paginationPrev`;
const HEADER_PAGINATION_NEXT = `${CatalogWidgetName.mainHeader()}_paginationNext`;
const HEADER_PAGINATION_LABEL = `${CatalogWidgetName.mainHeader()}_paginationLabel`;
//
const BACK_BUTTON_SIZE = LAYOUT.MAIN.HEADER.INNER_HEIGHT();

export class MainHeader {
    private _container: mod.UIWidget;
    private _contentContainer: mod.UIWidget;
    private _title: mod.UIWidget;
    private _backButtonContainer?: mod.UIWidget;
    private _backButton?: mod.UIWidget;
    private _backButtonLabel?: mod.UIWidget;
    private _paginationContainer?: mod.UIWidget;
    private _paginationPrev?: mod.UIWidget;
    private _paginationNext?: mod.UIWidget;
    private _paginationLabel?: mod.UIWidget;
    private _viewId: WeaponCatalogViewId;
    private _showBackButton: boolean = false;
    private _showPagination: boolean = false;

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
            bgFill: mod.UIBgFill.Solid,
            bgColor: [0, 0, 1],
            bgAlpha: 0.3,
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
            textLabel: s`WEAPON`,
            bgFill: mod.UIBgFill.Solid,
            bgColor: [1, 0, 0],
            bgAlpha: 0.3,
        });

        if (!header || !headerContentContainer || !title) {
            throw new Error("Failed to create main header container");
        }

        this._container = header;
        this._contentContainer = headerContentContainer;
        this._title = title;
        this._viewId = view;

        this._createBackButton();
        this._createPagination();
    }

    public get container(): mod.UIWidget {
        return this._container;
    }

    public get viewId(): WeaponCatalogViewId {
        return this._viewId;
    }

    public setView(view: WeaponCatalogViewId): void {
        this._viewId = view;
    }

    public setTitle(label: string): void {
        if (!this._title) return;
        mod.SetUITextLabel(this._title, mod.Message(label));
    }

    public showBackButton(show: boolean = true): void {
        this._showBackButton = show;
        this._recalculateLayout();
    }

    public configurePagination(state: HeaderPaginationState | undefined): void {
        if (!this._paginationContainer || !this._paginationLabel || !this._paginationPrev || !this._paginationNext) return;

        const visible = state?.visible ?? (state ? true : false);
        mod.SetUIWidgetVisible(this._paginationContainer, visible);

        if (!state) return;

        const current = Math.max(1, Math.min(state.total, state.current));
        const total = Math.max(1, state.total);
        const label = `${current} / ${total}`;
        mod.SetUITextLabel(this._paginationLabel, mod.Message(label));

        const disablePrev = state.disablePrevious ?? current <= 1;
        const disableNext = state.disableNext ?? current >= total;

        mod.SetUIButtonEnabled(this._paginationPrev, !disablePrev);
        mod.SetUIButtonEnabled(this._paginationNext, !disableNext);
    }

    private _createBackButton(): void {
        const container = ParseUI({
            type: "Container",
            name: HEADER_BACK_CONTAINER,
            parent: this._contentContainer,
            size: [BACK_BUTTON_SIZE, BACK_BUTTON_SIZE],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: [1, 0, 0],
            visible: false,
        });

        if (!container) return;

        const button = ParseUI({
            type: "Button",
            name: HEADER_BACK_BUTTON,
            parent: container,
            position: [0, 0],
            size: [BACK_BUTTON_SIZE, BACK_BUTTON_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            buttonColorBase: COLOR.vector("neutral-800"),
            buttonAlphaBase: 0,
            buttonColorHover: COLOR.vector("neutral-800"),
            buttonAlphaHover: 1,
            buttonColorFocused: COLOR.vector("neutral-700"),
            buttonAlphaFocused: 1,
        });

        const label = ParseUI({
            type: "Text",
            name: HEADER_BACK_LABEL,
            parent: container,
            position: [0, 0],
            size: [BACK_BUTTON_SIZE, BACK_BUTTON_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.Center,
            textLabel: s`<`,
            textSize: 24,
            bgFill: mod.UIBgFill.None,
        });

        if (!button || !label) return;

        this._backButtonContainer = container;
        this._backButton = button;
        this._backButtonLabel = label;
    }

    private _createPagination(): void {
        const container = ParseUI({
            type: "Container",
            name: HEADER_PAGINATION_CONTAINER,
            parent: this._contentContainer,
            size: [(LAYOUT.MAIN.HEADER.INNER_HEIGHT() * 2) + 12, LAYOUT.MAIN.HEADER.INNER_HEIGHT()], // Width for two buttons + gap
            position: [0, 0], // Will be positioned later during layout recalculation
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.None,
            visible: false,
        });

        if (!container) return;

        const prevButton = ParseUI({
            type: "Button",
            name: HEADER_PAGINATION_PREV,
            parent: container,
            position: [0, 0],
            size: [70, LAYOUT.MAIN.HEADER.INNER_HEIGHT()],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: COLOR.normalized("neutral-800"),
            bgAlpha: 1,
            buttonColorBase: COLOR.vector("neutral-800"),
            buttonAlphaBase: 1,
            buttonColorHover: COLOR.vector("neutral-600"),
            buttonAlphaHover: 1,
            buttonColorFocused: COLOR.vector("neutral-700"),
            buttonAlphaFocused: 1,
        });

        const label = ParseUI({
            type: "Text",
            name: HEADER_PAGINATION_LABEL,
            parent: container,
            position: [70, 0],
            size: [120, LAYOUT.MAIN.HEADER.INNER_HEIGHT()],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.Center,
            textLabel: s`1 / 1`,
            bgFill: mod.UIBgFill.None,
        });

        const nextButton = ParseUI({
            type: "Button",
            name: HEADER_PAGINATION_NEXT,
            parent: container,
            position: [190, 0],
            size: [70, LAYOUT.MAIN.HEADER.INNER_HEIGHT()],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: COLOR.normalized("neutral-800"),
            bgAlpha: 1,
            buttonColorBase: COLOR.vector("neutral-800"),
            buttonAlphaBase: 1,
            buttonColorHover: COLOR.vector("neutral-600"),
            buttonAlphaHover: 1,
            buttonColorFocused: COLOR.vector("neutral-700"),
            buttonAlphaFocused: 1,
        });

        if (!prevButton || !label || !nextButton) return;

        this._paginationContainer = container;
        this._paginationPrev = prevButton;
        this._paginationLabel = label;
        this._paginationNext = nextButton;
    }

    private _recalculateLayout(): void {
        // The expected layout elements's don't exist
        if (!this._backButtonContainer || !this._title || !this._paginationContainer) return;

        // We'll use our stack layout utility to arrange the back button and title
        const items = [
            ...this._showBackButton ? [{ id: "backButton", size: { width: BACK_BUTTON_SIZE, height: LAYOUT.MAIN.HEADER.INNER_HEIGHT() } }] : [],
            { id: "title", size: { width: 0, height: LAYOUT.MAIN.HEADER.INNER_HEIGHT() }, grow: 1 }, // Width 0 with grow means it takes all remaining space
            ...this._showPagination ? [{ id: "pagination", size: { width: 80, height: LAYOUT.MAIN.HEADER.INNER_HEIGHT() } }] : []
        ];

        // Now we can use our layout utility to arrange the items
        const layout = stackLayout(items, {
            direction: "horizontal",
            gap: 12,
            containerWidth: LAYOUT.MAIN.HEADER.INNER_WIDTH(),
        });

        console.log(`Layout: ${JSON.stringify(layout)}`);

        for (const frame of layout.frames) {
            if (frame.id === "backButton") {
                mod.SetUIWidgetPosition(this._backButtonContainer, mod.CreateVector(frame.x, frame.y, 0));
                mod.SetUIWidgetSize(this._backButtonContainer, mod.CreateVector(frame.width, frame.height, 0));
            } else if (frame.id === "title") {
                mod.SetUIWidgetPosition(this._title, mod.CreateVector(frame.x, frame.y, 0));
                mod.SetUIWidgetSize(this._title, mod.CreateVector(frame.width, frame.height, 0));
            } else if (frame.id === "pagination" && this._paginationContainer) {
                mod.SetUIWidgetPosition(this._paginationContainer, mod.CreateVector(frame.x, frame.y, 0));
                mod.SetUIWidgetSize(this._paginationContainer, mod.CreateVector(frame.width, frame.height, 0));
            }
        }

        mod.SetUIWidgetVisible(this._backButtonContainer, this._showBackButton);
        mod.SetUIWidgetVisible(this._paginationContainer, this._showPagination);
    }
}