import { weaponCategories, type WeaponCategory } from "../../systems/weapons";

export const LAYOUT = {
    PADDING: 30,
    BODY: {
        WIDTH: 1920,
        HEIGHT: 1080,
    },
    HEADER: {
        HEIGHT: 100,
        INNER_HEIGHT: function() { return this.HEIGHT - (LAYOUT.PADDING * 2 ); },
    },
    NAVIGATION: {
        HEADER: {
            HEIGHT: function() { return LAYOUT.HEADER.HEIGHT; },
            /**
             * Returns the navigation header height minus the padding
             */
            INNER_HEIGHT: function() { return LAYOUT.HEADER.HEIGHT - (LAYOUT.PADDING * 2 ); },
            /**
             * Returns the navigation header width minus the padding
             */
            INNER_WIDTH: function() { return LAYOUT.NAVIGATION.WIDTH - (LAYOUT.PADDING * 2 ); },
            WIDTH: function() { return LAYOUT.NAVIGATION.WIDTH; },
        },
        WIDTH: 300,
        HEIGHT: function() { return LAYOUT.BODY.HEIGHT; },
        INNER_WIDTH: function() { return LAYOUT.NAVIGATION.WIDTH - (LAYOUT.PADDING * 2 ); },
        INNER_HEIGHT: function() { return LAYOUT.BODY.HEIGHT - (LAYOUT.PADDING * 2 ); },
    },
    MAIN: {
        HEADER: {
            HEIGHT: function() { return LAYOUT.HEADER.HEIGHT; },
            INNER_HEIGHT: function() { return LAYOUT.HEADER.HEIGHT - (LAYOUT.PADDING * 2 ); },
            INNER_WIDTH: function() { return LAYOUT.MAIN.WIDTH - (LAYOUT.PADDING * 2 ); },
            WIDTH: function() { return LAYOUT.MAIN.WIDTH; },
        },
        CONTENT: {
            Y: function() { return LAYOUT.NAVIGATION.HEADER.HEIGHT();  },
            WIDTH: function() { return LAYOUT.MAIN.WIDTH; },
            HEIGHT: function() { return LAYOUT.BODY.HEIGHT - LAYOUT.HEADER.HEIGHT; },
            INNER_HEIGHT: function() { return LAYOUT.BODY.HEIGHT - LAYOUT.HEADER.HEIGHT - (LAYOUT.PADDING); },
            INNER_WIDTH: function() { return LAYOUT.MAIN.WIDTH - (LAYOUT.PADDING * 2 ); },
        },
        WIDTH: 1180,
        HEIGHT: function() { return LAYOUT.BODY.HEIGHT; },
        X: function() { return LAYOUT.NAVIGATION.WIDTH; },
    },
} as const;

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
    mainWrapper: () => createWidgetName("mainWrapper"),
    mainHeader: () => createWidgetName("mainHeader"),
    mainHeaderText: () => createWidgetName("mainHeaderText"),
    mainContentContainer: () => createWidgetName("mainContentContainer"),
    mainContentInnerContainer: () => createWidgetName("mainContentInnerContainer"),
    weapon: (weapon_id: string) => createWidgetName("weapon", weapon_id),
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

export function parseWeaponWidgetName(widgetName: string): string | null {
    const prefix = `${createWidgetName("weapon")}_`;
    if(!widgetName.startsWith(prefix)) return null;

    return widgetName.substring(prefix.length);
}