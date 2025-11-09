import { ParseUI } from "../../../lib/parse-ui";
import { CatalogWidgetName, LAYOUT } from "../utils";
import { COLOR } from "../../../lib/colors";
import { s } from "../../../lib/string-macro";
import { stackLayout, type StackFrame, type StackItem, type StackLayoutResult } from "../../../lib/stack-layout";
import type { WeaponCategory } from "../../weapons";

type NavigationMenuItem = { id: WeaponCategory; label: string }

type NavButton = {
    id: WeaponCategory;
    container: mod.UIWidget;
    button: mod.UIWidget;
    outline: mod.UIWidget;
    label: mod.UIWidget;
};

export class NavMenu {
    private static readonly NAVIGATION_HEADER_INNER_WIDTH = LAYOUT.NAVIGATION.HEADER.INNER_WIDTH();
    private static readonly NAVIGATION_HEADER_INNER_HEIGHT = LAYOUT.NAVIGATION.HEADER.INNER_HEIGHT();
    private static readonly NAVIGATION_INNER_WIDTH = LAYOUT.NAVIGATION.INNER_WIDTH();
    // private static readonly NAVIGATION_INNER_HEIGHT = LAYOUT.NAVIGATION.INNER_HEIGHT();

    public items: Partial<Record<WeaponCategory, NavButton>> = {};
    public selectedItemId: WeaponCategory = 'assault';

    constructor(parent: mod.UIWidget, items: NavigationMenuItem[]) {
        this.createNavHeader(parent); 
        this.createMenu(parent, items);
        this.createCloseButton(parent, NavMenu.NAVIGATION_INNER_WIDTH);
    }

    private createNavHeader(parent: mod.UIWidget) {
        const navMenuHeader = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuHeader(),
            parent,
            size: [NavMenu.NAVIGATION_HEADER_INNER_WIDTH, NavMenu.NAVIGATION_HEADER_INNER_HEIGHT],
            position: [LAYOUT.PADDING, LAYOUT.PADDING],
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.None,
        });

        ParseUI({
            type: "Text",
            name: CatalogWidgetName.navMenuHeaderText(),
            parent: navMenuHeader,
            size: [NavMenu.NAVIGATION_HEADER_INNER_WIDTH, NavMenu.NAVIGATION_HEADER_INNER_HEIGHT],
            padding: 0,
            position: [0, 0],
            anchor: mod.UIAnchor.Center,
            textAnchor: mod.UIAnchor.BottomLeft,
            textLabel: s`CATEGORY`,
            bgFill: mod.UIBgFill.None,
        });   
    }

    private calculateMenuItemLayout(itemsCount: number) {
        const items = Array.from({ length: itemsCount }, (): StackItem => {
            return {
                size: { width: NavMenu.NAVIGATION_INNER_WIDTH, height: 65 },
            };
        });

        return stackLayout(items, {
            direction: "vertical",
            roundPixels: true,
            gap: 8,
            wrap: "nowrap",
            containerHeight: "auto",
            containerWidth: "auto"
        });
    }

    private createMenu(parent: mod.UIWidget, items: NavigationMenuItem[]) {
        const layout = this.calculateMenuItemLayout(items.length);
        const wrapper = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navMenuContainer(),
            parent,
            anchor: mod.UIAnchor.TopCenter,
            size: [layout.container.width, layout.container.height],
            position: [0, LAYOUT.NAVIGATION.HEADER.HEIGHT()],
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.Solid,
        });

        if(!wrapper) return;

        this.createMenuItems(wrapper, items, layout);
    }

    private createMenuItems(parent: mod.UIWidget, items: NavigationMenuItem[], layout: StackLayoutResult) {
        items.forEach((item, index) => {
            const frame = layout.frames[index];
            this.createMenuItem(parent, item.id, item.label, frame);
        });
    }

    private createMenuItem(parent: mod.UIWidget, id: WeaponCategory, label: string, frame: StackFrame) {
        const container = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navButtonContainer(id),
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
            name: CatalogWidgetName.navButton(id),
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

        const textLabel = ParseUI({
            type: "Text",
            name: CatalogWidgetName.navButtonLabel(id),
            parent: container,
            padding: 24,
            position: [0, 0],
            size: [frame.width, frame.height],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.CenterLeft,
            textLabel: label,
        });

        const outline = ParseUI({
            type: "Container",
            name: CatalogWidgetName.navButtonOutline(id),
            parent: container,
            position: [0, 0],
            size: [frame.width, frame.height],
            bgFill: mod.UIBgFill.OutlineThin,
            bgColor: COLOR.normalized("neutral-200"),
            bgAlpha: 1,
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
        });

        if (!container || !button || !outline || !textLabel) return; // Something within the button didn't create properly

        this.items[id] = { id, container, button, outline, label: textLabel };
    }

    private createCloseButton(parent: mod.UIWidget, width: number) {
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

    public selectItem(id: WeaponCategory) {
        const previousSelectedItem = this.selectedItemId;
        const previousButton = this.items[previousSelectedItem];

        if (previousButton) {
            // this._setNavButtonSelected(previousButton, false);
            this.updateItem(previousButton, false);
        }

        const nextButton = this.items[id];
        if (!nextButton) return;
        this.updateItem(nextButton, true);
        this.selectedItemId = id;
    }

    private updateItem(item: NavButton, selected: boolean) {
        if (selected) {
            mod.SetUIWidgetVisible(item.outline, true);
            mod.SetUIButtonColorBase(item.button, COLOR.vector("neutral-600"));
        } else {
            mod.SetUIWidgetVisible(item.outline, false);
            mod.SetUIButtonColorBase(item.button, COLOR.vector("neutral-800"));
        }
    }
}