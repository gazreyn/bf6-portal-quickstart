import { ParseUI } from "../../lib/parse-ui";
import { PlayerState } from "../player";
import { stackLayout, type StackItem, type StackFrame } from "../../lib/stack-layout";
import { weaponCategories, weaponCategoryLabels, type WeaponCategory, type WeaponDefinition } from "../weapons";
import { COLOR } from "../../lib/colors";
import { parseCloseButton, parseNavButtonCategory, CatalogWidgetName, LAYOUT, parseWeaponWidgetName } from "./utils";
import { s } from "../../lib/string-macro";
//
import { MainHeader } from "./components/main-header";
import { NavMenu } from "./components/nav-menu";

const DEBUG_LAYOUT = false;

let SHOULD_SHOW_BACK_BUTTON = false;
let SHOULD_SHOW_PAGINATION = false;

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

// type NavButton = {
//     category: WeaponCategory;
//     container: mod.UIWidget;
//     button: mod.UIWidget;
//     outline: mod.UIWidget;
//     label: mod.UIWidget;
// };

type WeaponButton = {
    id: string;
    container: mod.UIWidget;
    button: mod.UIWidget;
    border: mod.UIWidget;
    label: mod.UIWidget;
};

export class WeaponCatalog {
    private playerState: PlayerState;
    private isOpen: boolean = false;

    // Widgets
    private catalogRootWidget: mod.UIWidget | undefined;
    // private _navigationHeaderTextWidget: mod.UIWidget | undefined;
    // private navigationButtons: Partial<Record<WeaponCategory, NavButton>> = {};
    // private _mainHeader: Partial<{ container: mod.UIWidget; text: mod.UIWidget }> = {};
    private navMenu: NavMenu | undefined;
    private mainHeader: MainHeader | undefined;
    private mainPageContentContainer: mod.UIWidget | undefined;

    // Weapon Buttons
    private weaponButtons: Partial<Record<string, WeaponButton>> = {};

    // State
    private currentView: "weaponList" | "attachmentSlots" | "attachments" = "weaponList";

    constructor(playerState: PlayerState) {
        this.playerState = playerState;
        this.createCatalogUI();
        this.selectCategory("assault"); // Default selected category
    }

    private createCatalogUI() {
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
            playerId: this.playerState.player,
        });

        if (!catalogRoot) return;

        this.catalogRootWidget = catalogRoot;
        this.createCatalogBackground(catalogRoot);
        this.createVerticalNavigationMenu(catalogRoot);
        this.createMainContainer(catalogRoot);
    }

    private createCatalogBackground(catalogRoot: mod.UIWidget) {
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

    private createVerticalNavigationMenu(catalogRoot: mod.UIWidget) {
        const NAVIGATION_WIDTH = LAYOUT.NAVIGATION.WIDTH;
        const NAVIGATION_HEIGHT = LAYOUT.NAVIGATION.HEIGHT()

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

        // Create the navigation menu
        this.navMenu = new NavMenu(navMenuWrapper, weaponCategories.map((category) => ({
            id: category,
            label: weaponCategoryLabels[category],
        })));
    }

    private createMainContainer(catalogRoot: mod.UIWidget) {
        const MAIN_WIDTH = LAYOUT.MAIN.WIDTH;
        const MAIN_HEIGHT = LAYOUT.MAIN.HEIGHT();
        // const MAIN_HEADER_HEIGHT = LAYOUT.MAIN.HEADER.HEIGHT();
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
        this.mainHeader = new MainHeader(mainWrapper, "weaponList");

        // TODO: Might want to store this on a class variable for later use
        const mainContentContainer = this.createMainContentArea(mainWrapper);

        if(!mainContentContainer) return;

        this.createWeaponCategoryViews(mainContentContainer);
    }

    private createMainContentArea(parent: mod.UIWidget) {
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

    private createWeaponCategoryViews(parent: mod.UIWidget) {
        weaponCategories.forEach((category) => {
            this.createViewForWeaponCategory(parent, category);
        });
    }

    private createViewForWeaponCategory(parent: mod.UIWidget, category: WeaponCategory) {
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
            this.createWeaponButton(viewContainer, weapon, frame);
        }
    }

    private createWeaponButton(parent: mod.UIWidget, weapon: WeaponDefinition, stackFrame: StackFrame) {
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

        this.weaponButtons[weapon.id] = { id: weapon.id, container: weaponItemButtonContainer, button: weaponItemButton, border: weaponItemButtonBorder, label: weaponItemButtonText };
    }

    public selectCategory(category: WeaponCategory) {
        if(!this.navMenu) return;
        this.navMenu.selectItem(category);
    }

    private selectWeapon(weaponId: string) {
        console.log(`Selected weapon: ${weaponId}`);
    }

    public open() {
        if (!this.catalogRootWidget) return;

        mod.EnableUIInputMode(true, this.playerState.player);
        mod.SetUIWidgetVisible(this.catalogRootWidget, true);
        this.isOpen = true;
        // Logic to display the weapon catalog UI
    }

    public close() {
        this.isOpen = false;
        if (!this.catalogRootWidget) return;

        mod.EnableUIInputMode(false, this.playerState.player);
        mod.SetUIWidgetVisible(this.catalogRootWidget, false);
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
            this.selectWeapon(weapon);
            // REMOVE ME
            // SHOULD_SHOW_BACK_BUTTON = !SHOULD_SHOW_BACK_BUTTON;
            // SHOULD_SHOW_PAGINATION = !SHOULD_SHOW_PAGINATION;
            // this._mainHeader?.setBackButtonVisibility(SHOULD_SHOW_BACK_BUTTON);
            // this._mainHeader?.setPaginationVisibility(SHOULD_SHOW_PAGINATION);
            return;
        }
    }
}