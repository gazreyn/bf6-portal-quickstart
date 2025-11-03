import { ParseUI } from "../../lib/parse-ui";
import { PlayerState } from "../player";
import { stackLayout, type StackItem, type StackFrame } from "../../lib/stack-layout";
import { weaponCategories, weaponCategoryLabels, type WeaponCategory } from "../weapons";
import { COLOR } from "../../lib/colors";
import { parseNavButtonCategory, CatalogWidgetName } from "./utils";
import { s } from "../../lib/string-macro";

type NavButton = {
    category: WeaponCategory;
    container: mod.UIWidget;
    button: mod.UIWidget;
    outline: mod.UIWidget;
    label: mod.UIWidget;
};

export class WeaponCatalog {
    private _playerState: PlayerState;
    private _isOpen: boolean = false;

    // Widgets
    private _catalogRootWidget: mod.UIWidget | undefined;
    private _navigationHeaderTextWidget: mod.UIWidget | undefined;
    private _navigationButtons: Partial<Record<WeaponCategory, NavButton>> = {};

    // State
    private _selectedCategory: WeaponCategory = "assault";

    constructor(playerState: PlayerState) {
        this._playerState = playerState;

        this._createCatalogUI();

        this.selectCategory("assault"); // Default selected category
    }

    private _createCatalogUI() {
        const catalogRoot = ParseUI({
            type: "Container",
            name: CatalogWidgetName.body(),
            size: [1920, 1080],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [0, 0, 0],
            bgAlpha: 0.0,
            bgFill: mod.UIBgFill.Solid,
            visible: false,
            depth: mod.UIDepth.AboveGameUI,
            playerId: this._playerState.player,
        });

        if(catalogRoot) {
            this._catalogRootWidget = catalogRoot;
        }

        this._createCatalogBackground();
        this._createVerticalNavigationMenu();
    }

    private _createCatalogBackground() {
        if(!this._catalogRootWidget) return;

        // Dimmed Background - We probably don't need to store these in a variable
        ParseUI({
            type: "Container",
            name: "wc_mainBG",
            parent: this._catalogRootWidget,
            size: [1920, 1080],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [0, 0, 0],
            bgAlpha: 0.9,
            bgFill: mod.UIBgFill.Solid,
        });

        // Blur Background - We probably don't need to store these in a variable
        ParseUI({
            type: "Container",
            name: "wc_blurBG",
            parent: this._catalogRootWidget,
            size: [1920, 1080],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            bgFill: mod.UIBgFill.Blur,
        });
    }

    private _createVerticalNavigationMenu() {
        if(!this._catalogRootWidget) return;

        const NAVIGATION_WIDTH = 300;
        const NAVIGATION_HEADER_HEIGHT = 100;
        const NAVIGATION_INNER_WIDTH = 240; // NAVIGATION_WIDTH / Button Width - padding (30px on each side)

        // Create the navigation menu container
        const navMenuWrapper = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuWrapper(),
            parent: this._catalogRootWidget,
            size: [NAVIGATION_WIDTH, 1080],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.Solid,
        });

        // Create the navigation menu header - Consider moving this to its own function
        const navMenuHeader = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuHeader(),
            parent: navMenuWrapper,
            size: [NAVIGATION_WIDTH, NAVIGATION_HEADER_HEIGHT],
            position: [0, 0],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
        });

        const navMenuHeaderText = ParseUI({
            type: "Text",
            name: CatalogWidgetName.navMenuHeaderText(),
            parent: navMenuHeader,
            size: [NAVIGATION_INNER_WIDTH, NAVIGATION_HEADER_HEIGHT],
            position: [0, -16],
            bgFill: mod.UIBgFill.None,
            anchor: mod.UIAnchor.TopCenter,
            textAnchor: mod.UIAnchor.BottomLeft,
            textLabel: s`CATEGORY`,
        });

        if(navMenuHeaderText) this._navigationHeaderTextWidget = navMenuHeaderText;

        const menuItems = Array.from(weaponCategories, (_category): StackItem => {
            return {
                size: { width: 240, height: 65 },
            };
        });

        // Calculate stack height and spacing
        const verticalLayout = stackLayout(menuItems, {
            direction: "vertical",
            roundPixels: true,
            gap: 8,
            wrap: "nowrap",
            containerHeight: "auto",
            containerWidth: "auto"
        });

        const navMenuContainer = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuContainer(),
            parent: navMenuWrapper,
            anchor: mod.UIAnchor.TopCenter,
            size: [verticalLayout.container.width, verticalLayout.container.height],
            position: [0, NAVIGATION_HEADER_HEIGHT],
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.Solid,
        });

        if(!navMenuContainer) return; // Was unable to create nav menu container?

        weaponCategories.forEach((category, index) => {
            const frame = verticalLayout.frames[index];
            this._createNavButton(navMenuContainer, category, weaponCategoryLabels[category], frame);
        });
    }

    private _createNavButton(parent: mod.UIWidget, category: WeaponCategory, textLabel: string | mod.Message, frame: StackFrame) {
        const container = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navButtonContainer(category),
            parent,
            position: [frame.x, frame.y],
            size: [frame.width, frame.height],
            bgFill: mod.UIBgFill.None,
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            anchor: mod.UIAnchor.TopLeft,
        });

        const button = ParseUI({
            type: "Button",
            name: CatalogWidgetName.navButton(category),
            parent: container,
            position: [0, 0],
            size: [frame.width, frame.height],
            bgFill: mod.UIBgFill.Solid,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            buttonColorBase: COLOR.normalized("neutral-800"),
            buttonAlphaBase: 0.7,
            buttonColorHover: COLOR.normalized("neutral-600"),
            buttonAlphaHover: 0.7,
            buttonColorFocused: COLOR.normalized("neutral-700"),
            buttonAlphaFocused: 0.7,
            anchor: mod.UIAnchor.TopLeft,
        });

        const label = ParseUI({
            type: "Text",
            name: CatalogWidgetName.navButtonLabel(category),
            parent: container,
            padding: 24,
            position: [0, 0],
            size: [frame.width, frame.height],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.CenterLeft,
            textLabel,
        });

        const outline = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navButtonOutline(category),
            parent: container,
            position: [0, 0],
            size: [frame.width, frame.height],
            bgFill: mod.UIBgFill.OutlineThin,
            bgColor: COLOR.normalized("neutral-200"),
            bgAlpha: 1,
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
        });

        if(!container || !button || !outline || !label) return; // Something within the button didn't create properly

        this._navigationButtons[category] = { category, container, button, outline, label };
    }

    public selectCategory(category: WeaponCategory) {
        // Maybe we don't need this check, but it could prevent unnecessary UI updates
        // if (this._selectedCategory === category) return;

        const previousCategory = this._selectedCategory;
        const previousButton = this._navigationButtons[previousCategory];

        if(previousButton) {
            this._setNavButtonSelected(previousButton, false);
        }

        const nextButton = this._navigationButtons[category];
        if(!nextButton) return;
        this._setNavButtonSelected(nextButton, true);
        this._selectedCategory = category;
    }

    private _setNavButtonSelected(button: NavButton, selected: boolean) {
        if(selected) {
            mod.SetUIWidgetVisible(button.outline, true);
            mod.SetUIButtonColorBase(button.button, COLOR.vector("neutral-600"));
        } else {
            mod.SetUIWidgetVisible(button.outline, false);
            mod.SetUIButtonColorBase(button.button, COLOR.vector("neutral-800"));
        }
    }

    public open() {
        if(!this._catalogRootWidget) return;

        mod.EnableUIInputMode(true, this._playerState.player);
        mod.SetUIWidgetVisible(this._catalogRootWidget, true);
        this._isOpen = true;
        // Logic to display the weapon catalog UI
    }

    public close() {
        this._isOpen = false;
        if(!this._catalogRootWidget) return;

        mod.EnableUIInputMode(false, this._playerState.player);
        mod.SetUIWidgetVisible(this._catalogRootWidget, false);
    }

    public destroy() {
        // Logic to clean up and remove the weapon catalog UI
        this.close();
    }

    public onUIButtonEvent(widget: mod.UIWidget, event: mod.UIButtonEvent) {
        console.log(`Catalog received UIButtonEvent from player`);
        // Handle button events from the UI
        const widgetName = mod.GetUIWidgetName(widget);

        console.log(`Catalog received UIButtonEvent from player: ${widgetName}`);

        const category = parseNavButtonCategory(widgetName);
        if(category) {
            this.selectCategory(category);
        }
    }
}