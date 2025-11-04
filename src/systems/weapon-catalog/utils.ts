import { weaponCategories, type WeaponCategory } from "../../systems/weapons";

export const LAYOUT = {
    BODY_HEIGHT: 1080,
    NAVIGATION_WIDTH: 300,
    HEADER_HEIGHT: 100,
    MAIN_WIDTH: 1180,
}

const WIDGET_PREFIX = "wc_";

function createWidgetName(type: string, id?: string | number) {
    return id === undefined ? `${WIDGET_PREFIX}${type}` : `${WIDGET_PREFIX}${type}_${id}`;
}

export const CatalogWidgetName = {
    body: () => createWidgetName("Body"),
    closeButtonContainer: () => createWidgetName("closeButtonContainer"),
    closeButtonText: () => createWidgetName("closeButtonText"),
    closeButton: () => createWidgetName("closeButton"),
    navMenuWrapper: () => createWidgetName("navMenuWrapper"),
    navMenuContainer: () => createWidgetName("navMenuContainer"),
    navMenuHeader: () => createWidgetName("navMenuHeader"),
    navMenuHeaderText: () => createWidgetName("navMenuHeaderText"),
    navButtonContainer: (category: WeaponCategory) => createWidgetName("navButtonContainer", category),
    navButton: (category: WeaponCategory) => createWidgetName("navButton", category),
    navButtonLabel: (category: WeaponCategory) => createWidgetName("navButtonLabel", category),
    navButtonOutline: (category: WeaponCategory) => createWidgetName("navButtonOutline", category),
    mainContainer: () => createWidgetName("mainContainer"),
    mainHeader: () => createWidgetName("mainHeader"),
    mainHeaderText: () => createWidgetName("mainHeaderText"),
} as const;

const NAV_BUTTON_PREFIX = `${createWidgetName("navButton")}_`;

export function parseNavButtonCategory(widgetName: string): WeaponCategory | null {
    if(!widgetName.startsWith(NAV_BUTTON_PREFIX)) return null;

    const category = widgetName.substring(NAV_BUTTON_PREFIX.length);
    return weaponCategories.includes(category as WeaponCategory) ? category as WeaponCategory : null;
}

export function parseCloseButton(widgetName: string): boolean {
    return widgetName === CatalogWidgetName.closeButton();
}