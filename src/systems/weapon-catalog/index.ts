import { ParseUI } from "../../lib/parse-ui";
import { PlayerState } from "../player";
import { stackLayout, type StackItem, type StackFrame } from "../../lib/stack-layout";
import { weaponCategories, weaponCategoryLabels, type WeaponCategory, type WeaponDefinition } from "../weapons";
import { COLOR } from "../../lib/colors";
import { parseCloseButton, parseNavButtonCategory, CatalogWidgetName, LAYOUT, parseWeaponWidgetName } from "./utils";
import { s } from "../../lib/string-macro";
import { MainHeader } from "./main-header";

const DEBUG_LAYOUT = false;

let SHOULD_SHOW_BACK_BUTTON = false;

const DEBUG_BG = (color: [number, number, number] = [1, 0, 0]) => {
    return DEBUG_LAYOUT ? {
        bgFill: mod.UIBgFill.Solid,
        bgColor: color,
        bgAlpha: 0.3,
    } : {
        bgFill: mod.UIBgFill.None,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
    };
}

type NavButton = {
    category: WeaponCategory;
    container: mod.UIWidget;
    button: mod.UIWidget;
    outline: mod.UIWidget;
    label: mod.UIWidget;
};

type WeaponButton = {
    id: string;
    container: mod.UIWidget;
    button: mod.UIWidget;
    border: mod.UIWidget;
    label: mod.UIWidget;
};

export class WeaponCatalog {
    private _playerState: PlayerState;
    private _isOpen: boolean = false;

    // Widgets
    private _catalogRootWidget: mod.UIWidget | undefined;
    // private _navigationHeaderTextWidget: mod.UIWidget | undefined;
    private _navigationButtons: Partial<Record<WeaponCategory, NavButton>> = {};
    // private _mainHeader: Partial<{ container: mod.UIWidget; text: mod.UIWidget }> = {};
    private _mainHeader: MainHeader | undefined;
    private _mainPageContentContainer: mod.UIWidget | undefined;

    // Weapon Buttons
    private _weaponButtons: Partial<Record<string, WeaponButton>> = {};

    // State
    private _currentView: "weaponList" | "attachmentSlots" | "attachments" = "weaponList";
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

        if (!catalogRoot) return;

        this._catalogRootWidget = catalogRoot;
        this._createCatalogBackground(catalogRoot);
        this._createVerticalNavigationMenu(catalogRoot);
        this._createMainContainer(catalogRoot);
    }

    private _createCatalogBackground(catalogRoot: mod.UIWidget) {
        // Dimmed Background - We probably don't need to store these in a variable
        ParseUI({
            type: "Container",
            name: "wc_mainBG",
            parent: catalogRoot,
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
            parent: catalogRoot,
            size: [1920, 1080],
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            bgFill: mod.UIBgFill.Blur,
        });
    }

    private _createVerticalNavigationMenu(catalogRoot: mod.UIWidget) {
        const NAVIGATION_WIDTH = LAYOUT.NAVIGATION.WIDTH;
        const NAVIGATION_HEIGHT = LAYOUT.NAVIGATION.HEIGHT()
        const NAVIGATION_INNER_WIDTH = LAYOUT.NAVIGATION.INNER_WIDTH();
        const NAVIGATION_HEADER_INNER_HEIGHT = LAYOUT.NAVIGATION.HEADER.INNER_HEIGHT();
        const NAVIGATION_HEADER_INNER_WIDTH = LAYOUT.NAVIGATION.HEADER.INNER_WIDTH();

        // Create the navigation menu container
        const navMenuWrapper = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuWrapper(),
            parent: catalogRoot,
            size: [NAVIGATION_WIDTH, NAVIGATION_HEIGHT],
            position: [0, 0],
            padding: 0,
            anchor: mod.UIAnchor.TopLeft,
            ...DEBUG_BG(),
        });

        if (!navMenuWrapper) return; // Was unable to create nav menu wrapper?

        // Create the navigation menu header - Consider moving this to its own function
        const navMenuHeader = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuHeader(),
            parent: navMenuWrapper,
            size: [NAVIGATION_HEADER_INNER_WIDTH, NAVIGATION_HEADER_INNER_HEIGHT],
            position: [LAYOUT.PADDING, LAYOUT.PADDING],
            anchor: mod.UIAnchor.TopLeft,
            ...DEBUG_BG(),
        });

        ParseUI({
            type: "Text",
            name: CatalogWidgetName.navMenuHeaderText(),
            parent: navMenuHeader,
            size: [NAVIGATION_HEADER_INNER_WIDTH, NAVIGATION_HEADER_INNER_HEIGHT],
            padding: 0,
            position: [0, 0],
            anchor: mod.UIAnchor.Center,
            textAnchor: mod.UIAnchor.BottomLeft,
            textLabel: s`CATEGORY`,
            ...DEBUG_BG(),
        });

        // if(navMenuHeaderText) this._navigationHeaderTextWidget = navMenuHeaderText;

        const menuItems = Array.from(weaponCategories, (): StackItem => {
            return {
                size: { width: NAVIGATION_INNER_WIDTH, height: 65 },
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
            position: [0, LAYOUT.NAVIGATION.HEADER.HEIGHT()],
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.Solid,
        });

        if (!navMenuContainer) return; // Was unable to create nav menu container?

        weaponCategories.forEach((category, index) => {
            const frame = verticalLayout.frames[index];
            this._createNavButton(navMenuContainer, category, weaponCategoryLabels[category], frame);
        });

        this._createCloseButton(navMenuWrapper, NAVIGATION_INNER_WIDTH);
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

        if (!container || !button || !outline || !label) return; // Something within the button didn't create properly

        this._navigationButtons[category] = { category, container, button, outline, label };
    }

    private _createMainContainer(catalogRoot: mod.UIWidget) {
        const MAIN_WIDTH = LAYOUT.MAIN.WIDTH;
        const MAIN_HEIGHT = LAYOUT.MAIN.HEIGHT();
        const MAIN_HEADER_HEIGHT = LAYOUT.MAIN.HEADER.HEIGHT();
        // const MAIN_HEADER_WIDTH = LAYOUT.MAIN.HEADER.WIDTH();

        const mainWrapper = ParseUI({
            type: "Container",
            name: CatalogWidgetName.mainWrapper(),
            parent: catalogRoot,
            size: [MAIN_WIDTH, MAIN_HEIGHT],
            position: [LAYOUT.MAIN.X(), 0],
            anchor: mod.UIAnchor.TopLeft,
            ...DEBUG_BG([0, 0, 1]),
        });

        if (!mainWrapper) return; // Was unable to create nav menu wrapper?

        // Create the navigation menu header
        this._mainHeader = new MainHeader(mainWrapper, "weaponList");

        // TODO: Might want to store this on a class variable for later use
        const mainContentContainer = this._createMainContentArea(mainWrapper);

        if(!mainContentContainer) return;

        this._createWeaponCategoryViews(mainContentContainer);
    }

    private _createMainContentArea(parent: mod.UIWidget) {
        return ParseUI({
            type: "Container",
            name: CatalogWidgetName.mainContentContainer(),
            parent: parent,
            anchor: mod.UIAnchor.TopCenter,
            size: [LAYOUT.MAIN.CONTENT.WIDTH(), LAYOUT.MAIN.CONTENT.HEIGHT()],
            position: [0, LAYOUT.MAIN.CONTENT.Y()],
            ...DEBUG_BG([0, 1, 0]),
        });
        // this._mainPageContentContainer = mainContentInnerContainer;
    }

    private _createWeaponCategoryViews(parent: mod.UIWidget) {
        weaponCategories.forEach((category) => {
            this._createViewForWeaponCategory(parent, category);
        });
    }

    private _createViewForWeaponCategory(parent: mod.UIWidget, category: WeaponCategory) {
       // The below container is essentially the page. 
        const viewContainer = ParseUI({
            type: "Container",
            name: CatalogWidgetName.mainContentInnerContainer(),
            parent,
            anchor: mod.UIAnchor.TopCenter,
            size: [LAYOUT.MAIN.CONTENT.INNER_WIDTH(), LAYOUT.MAIN.CONTENT.INNER_HEIGHT()],
            position: [0, 0],
            visible: category === "assault", // TEMP. Sort this out after
            ...DEBUG_BG([0, 1, 0]),
        });

        if(!viewContainer) return;

        // TODO: 1. Fetch weapons for this category

        // TODO: 2. Create an array of StackItems for the weapons in this category
        const weaponItems = Array.from({ length: 40 }, (): StackItem => {
            return {
                size: { width: 200, height: 200 },
            };
        });

        // 3. Create the stack layout for the weapon items
        const gridLayout = stackLayout(weaponItems, {
            direction: "horizontal",
            wrap: "wrap",
            roundPixels: true,
            gap: 16,
            crossGap: 16,
            containerHeight: LAYOUT.MAIN.CONTENT.INNER_HEIGHT(),
            containerWidth: LAYOUT.MAIN.CONTENT.INNER_WIDTH(),
        });        

        // TODO: 4. Calculate if we need pagination controls by checking if weapons.length > horizontalLayout.maxItemsFit
        // If so, create pagination buttons (Next, Previous) and logic to handle page changes.

        // TODO: 5. Create weapon buttons based on the layout frames

        const fakeWeapons: WeaponDefinition[] = Array.from({ length: 40 }, (_, i) => ({
            id: `test_weapon_${i + 1}`,
            weapon: mod.Weapons.AssaultRifle_B36A4,
            name: s`B36A4`,
            category: category,
        }));

        const itemCountPerPage = fakeWeapons.length > gridLayout.maxItemsFit ? gridLayout.maxItemsFit : fakeWeapons.length;

        for(let i = 0; i < itemCountPerPage; i++) {
            const weapon = fakeWeapons[i];
            const frame = gridLayout.frames[i];
            this._createWeaponButton(viewContainer, weapon, frame);
        }
    }

    private _createWeaponButton(parent: mod.UIWidget, weapon: WeaponDefinition, stackFrame: StackFrame) {
        const weaponItemButtonContainer = ParseUI({
            type: "Container",
            parent: parent,
            position: [stackFrame.x, stackFrame.y],
            size: [stackFrame.width, stackFrame.height],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.Solid,
            bgColor: COLOR.vector("neutral-950"),
            bgAlpha: 1,
        });

        if(!weaponItemButtonContainer) return;

        const weaponItemButton = ParseUI({
            type: "Button",
            name: CatalogWidgetName.weapon(weapon.id),
            parent: weaponItemButtonContainer,
            position: [0, 0],
            size: [stackFrame.width, stackFrame.height],
            bgFill: mod.UIBgFill.GradientBottom,
            bgColor: [1, 1, 1],
            bgAlpha: 1,
            buttonColorBase: COLOR.vector("neutral-900"),
            buttonAlphaBase: 1,
            buttonColorHover: COLOR.vector("sky-900"),
            buttonAlphaHover: 1,
            buttonColorFocused: COLOR.vector("neutral-800"),
            buttonAlphaFocused: 1,
        });

        const weaponItemButtonBorder = ParseUI({
            type: "Container",
            parent: weaponItemButtonContainer,
            position: [0, 0],
            size: [stackFrame.width, stackFrame.height],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.OutlineThin,
            bgColor: COLOR.vector("neutral-950"),
            bgAlpha: 1,
        });

        const weaponItemButtonText = ParseUI({
            type: "Text",
            parent: weaponItemButtonContainer,
            position: [0, 0],
            size: [stackFrame.width, 40],
            anchor: mod.UIAnchor.BottomCenter,
            padding: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: weapon.name,
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 24,
            textAnchor: mod.UIAnchor.TopCenter,
        });

        mod.AddUIWeaponImage(weapon.name, mod.CreateVector(0, 0, 0), mod.CreateVector(148, 180, 0), mod.UIAnchor.TopCenter, weapon.weapon, weaponItemButtonContainer);

        if(!weaponItemButton || !weaponItemButtonBorder || !weaponItemButtonText) return;

        this._weaponButtons[weapon.id] = { id: weapon.id, container: weaponItemButtonContainer, button: weaponItemButton, border: weaponItemButtonBorder, label: weaponItemButtonText };
    }

    private _createCloseButton(parent: mod.UIWidget, width: number) {
        ParseUI({
            type: "Container",
            name: CatalogWidgetName.closeButtonContainer(),
            parent,
            position: [0, LAYOUT.PADDING],
            size: [width, 65],
            bgFill: mod.UIBgFill.None,
            anchor: mod.UIAnchor.BottomCenter,
            children: [
                {
                    type: "Button",
                    name: CatalogWidgetName.closeButton(),
                    parent,
                    anchor: mod.UIAnchor.TopLeft,
                    position: [0, 0],
                    size: [width, 65],
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [1, 1, 1],
                    bgAlpha: 1,
                    buttonColorBase: COLOR.normalized("neutral-600"),
                    buttonAlphaBase: 1,
                    buttonColorHover: COLOR.normalized("neutral-400"),
                    buttonAlphaHover: 1,
                    buttonColorFocused: COLOR.normalized("neutral-500"),
                    buttonAlphaFocused: 1,
                },
                {
                    type: "Container",
                    name: "closeButtonOutline",
                    parent,
                    anchor: mod.UIAnchor.TopLeft,
                    position: [0, 0],
                    size: [width, 65],
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: COLOR.normalized("neutral-200"),
                    bgAlpha: 1,
                },
                {
                    type: "Text",
                    name: CatalogWidgetName.closeButtonText(),
                    parent,
                    anchor: mod.UIAnchor.TopLeft,
                    position: [0, 0],
                    size: [width, 65],
                    textLabel: s`CLOSE`,
                    textAnchor: mod.UIAnchor.CenterLeft,
                    padding: 24,
                }
            ]
        });
    }

    public selectCategory(category: WeaponCategory) {
        // Maybe we don't need this check, but it could prevent unnecessary UI updates
        // if (this._selectedCategory === category) return;

        const previousCategory = this._selectedCategory;
        const previousButton = this._navigationButtons[previousCategory];

        if (previousButton) {
            this._setNavButtonSelected(previousButton, false);
        }

        const nextButton = this._navigationButtons[category];
        if (!nextButton) return;
        this._setNavButtonSelected(nextButton, true);
        this._selectedCategory = category;
    }

    private _setNavButtonSelected(button: NavButton, selected: boolean) {
        if (selected) {
            mod.SetUIWidgetVisible(button.outline, true);
            mod.SetUIButtonColorBase(button.button, COLOR.vector("neutral-600"));
        } else {
            mod.SetUIWidgetVisible(button.outline, false);
            mod.SetUIButtonColorBase(button.button, COLOR.vector("neutral-800"));
        }
    }

    private onSelectWeapon(weaponId: string) {
        console.log(`Selected weapon: ${weaponId}`);
    }

    public open() {
        if (!this._catalogRootWidget) return;

        mod.EnableUIInputMode(true, this._playerState.player);
        mod.SetUIWidgetVisible(this._catalogRootWidget, true);
        this._isOpen = true;
        // Logic to display the weapon catalog UI
    }

    public close() {
        this._isOpen = false;
        if (!this._catalogRootWidget) return;

        mod.EnableUIInputMode(false, this._playerState.player);
        mod.SetUIWidgetVisible(this._catalogRootWidget, false);
    }

    public destroy() {
        // Logic to clean up and remove the weapon catalog UI
        this.close();
    }

    public onUIButtonEvent(widget: mod.UIWidget, _event: mod.UIButtonEvent) {
        const widgetName = mod.GetUIWidgetName(widget);

        if (parseCloseButton(widgetName)) {
            this.close();
            return;
        }

        const category = parseNavButtonCategory(widgetName);
        if (category) {
            this.selectCategory(category);
            return;
        }

        const weapon = parseWeaponWidgetName(widgetName);
        if (weapon) {
            this.onSelectWeapon(weapon);
            // REMOVE ME
            SHOULD_SHOW_BACK_BUTTON = !SHOULD_SHOW_BACK_BUTTON;
            this._mainHeader?.showBackButton(SHOULD_SHOW_BACK_BUTTON);
            return;
        }
    }
}