type UIVector = mod.Vector | number[];
type UIRestriction = mod.Team | mod.Player;

// Base properties shared by all UI widgets
interface UIBaseParams {
    name?: string;
    position?: UIVector;
    size?: UIVector;
    anchor?: mod.UIAnchor;
    parent?: mod.UIWidget;
    visible?: boolean;
    padding?: number;
    bgColor?: UIVector;
    bgAlpha?: number;
    bgFill?: mod.UIBgFill;
    teamId?: mod.Team;
    playerId?: mod.Player;
    depth?: mod.UIDepth;
}

// Text-specific properties
interface UITextParams extends UIBaseParams {
    type: "Text";
    textLabel?: string | mod.Message;
    textColor?: UIVector;
    textAlpha?: number;
    textSize?: number;
    textAnchor?: mod.UIAnchor;
}

// Image-specific properties
interface UIImageParams extends UIBaseParams {
    type: "Image";
    imageType?: mod.UIImageType;
    imageColor?: UIVector;
    imageAlpha?: number;
}

// Button-specific properties
interface UIButtonParams extends UIBaseParams {
    type: "Button";
    buttonEnabled?: boolean;
    buttonColorBase?: UIVector;
    buttonAlphaBase?: number;
    buttonColorDisabled?: UIVector;
    buttonAlphaDisabled?: number;
    buttonColorPressed?: UIVector;
    buttonAlphaPressed?: number;
    buttonColorHover?: UIVector;
    buttonAlphaHover?: number;
    buttonColorFocused?: UIVector;
    buttonAlphaFocused?: number;
}

// Container-specific properties
interface UIContainerParams extends UIBaseParams {
    type: "Container";
    children?: UIParams[];
}

// Union type for all UI widget configurations
type UIParams = UITextParams | UIImageParams | UIButtonParams | UIContainerParams;

// Constants
const UNIQUE_NAME_PLACEHOLDER = "----uniquename----";

// Default values
const DEFAULTS = {
    name: "",
    position: () => mod.CreateVector(0, 0, 0),
    size: () => mod.CreateVector(100, 100, 0),
    anchor: mod.UIAnchor.TopLeft,
    visible: true,
    paddingWidget: 8,
    paddingContainer: 0,
    bgColor: () => mod.CreateVector(0, 0, 0),
    bgAlpha: 0.5,
    bgFill: mod.UIBgFill.Solid,
    textLabel: "",
    textSize: 0,
    textColor: () => mod.CreateVector(1, 1, 1),
    textAlpha: 1,
    textAnchor: mod.UIAnchor.CenterLeft,
    imageType: mod.UIImageType.None,
    imageColor: () => mod.CreateVector(1, 1, 1),
    imageAlpha: 1,
    buttonEnabled: true,
    buttonColorBase: () => mod.CreateVector(0.7, 0.7, 0.7),
    buttonAlphaBase: 1,
    buttonColorDisabled: () => mod.CreateVector(0.2, 0.2, 0.2),
    buttonAlphaDisabled: 0.5,
    buttonColorPressed: () => mod.CreateVector(0.25, 0.25, 0.25),
    buttonAlphaPressed: 1,
    buttonColorHover: () => mod.CreateVector(1, 1, 1),
    buttonAlphaHover: 1,
    buttonColorFocused: () => mod.CreateVector(1, 1, 1),
    buttonAlphaFocused: 1,
    depth: mod.UIDepth.AboveGameUI,
} as const;

// Helper functions
function asModVector(param: UIVector): mod.Vector {
    if (Array.isArray(param)) {
        const z = param.length >= 3 ? param[2] : 0;
        return mod.CreateVector(param[0], param[1], z);
    }
    return param;
}

function asModMessage(param: string | mod.Message): mod.Message {
    return typeof param === "string" ? mod.Message(param) : param;
}

function getRestriction(params: UIBaseParams): UIRestriction | undefined {
    return params.teamId ?? params.playerId;
}

function getParent(params: UIBaseParams): mod.UIWidget {
    return params.parent ?? mod.GetUIRoot();
}

function setWidgetName(uniqueName: string, desiredName: string): mod.UIWidget {
    const widget = mod.FindUIWidgetWithName(uniqueName);
    mod.SetUIWidgetName(widget, desiredName);
    return widget;
}

// Container widget creation
function createContainer(params: UIContainerParams): mod.UIWidget {
    const position = asModVector(params.position ?? DEFAULTS.position());
    const size = asModVector(params.size ?? DEFAULTS.size());
    const anchor = params.anchor ?? DEFAULTS.anchor;
    const parent = getParent(params);
    const visible = params.visible ?? DEFAULTS.visible;
    const padding = params.padding ?? DEFAULTS.paddingContainer;
    const bgColor = asModVector(params.bgColor ?? DEFAULTS.bgColor());
    const bgAlpha = params.bgAlpha ?? DEFAULTS.bgAlpha;
    const bgFill = params.bgFill ?? DEFAULTS.bgFill;
    const depth = params.depth ?? DEFAULTS.depth;
    const restriction = getRestriction(params);

    if (restriction) {
        mod.AddUIContainer(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            depth,
            restriction
        );
    } else {
        mod.AddUIContainer(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            depth
        );
    }

    const widget = setWidgetName(UNIQUE_NAME_PLACEHOLDER, params.name ?? DEFAULTS.name);

    // Create child widgets recursively
    if (params.children) {
        params.children.forEach((childParams) => {
            createWidget({ ...childParams, parent: widget });
        });
    }

    return widget;
}

// Text widget creation
function createText(params: UITextParams): mod.UIWidget {
    const position = asModVector(params.position ?? DEFAULTS.position());
    const size = asModVector(params.size ?? DEFAULTS.size());
    const anchor = params.anchor ?? DEFAULTS.anchor;
    const parent = getParent(params);
    const visible = params.visible ?? DEFAULTS.visible;
    const padding = params.padding ?? DEFAULTS.paddingWidget;
    const bgColor = asModVector(params.bgColor ?? DEFAULTS.bgColor());
    const bgAlpha = params.bgAlpha ?? DEFAULTS.bgAlpha;
    const bgFill = params.bgFill ?? DEFAULTS.bgFill;
    const textLabel = asModMessage(params.textLabel ?? DEFAULTS.textLabel);
    const textSize = params.textSize ?? DEFAULTS.textSize;
    const textColor = asModVector(params.textColor ?? DEFAULTS.textColor());
    const textAlpha = params.textAlpha ?? DEFAULTS.textAlpha;
    const textAnchor = params.textAnchor ?? DEFAULTS.textAnchor;
    const depth = params.depth ?? DEFAULTS.depth;
    const restriction = getRestriction(params);

    if (restriction) {
        mod.AddUIText(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            textLabel,
            textSize,
            textColor,
            textAlpha,
            textAnchor,
            depth,
            restriction
        );
    } else {
        mod.AddUIText(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            textLabel,
            textSize,
            textColor,
            textAlpha,
            textAnchor,
            depth
        );
    }

    return setWidgetName(UNIQUE_NAME_PLACEHOLDER, params.name ?? DEFAULTS.name);
}

// Image widget creation
function createImage(params: UIImageParams): mod.UIWidget {
    const position = asModVector(params.position ?? DEFAULTS.position());
    const size = asModVector(params.size ?? DEFAULTS.size());
    const anchor = params.anchor ?? DEFAULTS.anchor;
    const parent = getParent(params);
    const visible = params.visible ?? DEFAULTS.visible;
    const padding = params.padding ?? DEFAULTS.paddingWidget;
    const bgColor = asModVector(params.bgColor ?? DEFAULTS.bgColor());
    const bgAlpha = params.bgAlpha ?? DEFAULTS.bgAlpha;
    const bgFill = params.bgFill ?? DEFAULTS.bgFill;
    const imageType = params.imageType ?? DEFAULTS.imageType;
    const imageColor = asModVector(params.imageColor ?? DEFAULTS.imageColor());
    const imageAlpha = params.imageAlpha ?? DEFAULTS.imageAlpha;
    const depth = params.depth ?? DEFAULTS.depth;
    const restriction = getRestriction(params);

    if (restriction) {
        mod.AddUIImage(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            imageType,
            imageColor,
            imageAlpha,
            depth,
            restriction
        );
    } else {
        mod.AddUIImage(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            imageType,
            imageColor,
            imageAlpha,
            depth
        );
    }

    return setWidgetName(UNIQUE_NAME_PLACEHOLDER, params.name ?? DEFAULTS.name);
}

// Button widget creation
function createButton(params: UIButtonParams): mod.UIWidget {
    const position = asModVector(params.position ?? DEFAULTS.position());
    const size = asModVector(params.size ?? DEFAULTS.size());
    const anchor = params.anchor ?? DEFAULTS.anchor;
    const parent = getParent(params);
    const visible = params.visible ?? DEFAULTS.visible;
    const padding = params.padding ?? DEFAULTS.paddingWidget;
    const bgColor = asModVector(params.bgColor ?? DEFAULTS.bgColor());
    const bgAlpha = params.bgAlpha ?? DEFAULTS.bgAlpha;
    const bgFill = params.bgFill ?? DEFAULTS.bgFill;
    const buttonEnabled = params.buttonEnabled ?? DEFAULTS.buttonEnabled;
    const buttonColorBase = asModVector(params.buttonColorBase ?? DEFAULTS.buttonColorBase());
    const buttonAlphaBase = params.buttonAlphaBase ?? DEFAULTS.buttonAlphaBase;
    const buttonColorDisabled = asModVector(params.buttonColorDisabled ?? DEFAULTS.buttonColorDisabled());
    const buttonAlphaDisabled = params.buttonAlphaDisabled ?? DEFAULTS.buttonAlphaDisabled;
    const buttonColorPressed = asModVector(params.buttonColorPressed ?? DEFAULTS.buttonColorPressed());
    const buttonAlphaPressed = params.buttonAlphaPressed ?? DEFAULTS.buttonAlphaPressed;
    const buttonColorHover = asModVector(params.buttonColorHover ?? DEFAULTS.buttonColorHover());
    const buttonAlphaHover = params.buttonAlphaHover ?? DEFAULTS.buttonAlphaHover;
    const buttonColorFocused = asModVector(params.buttonColorFocused ?? DEFAULTS.buttonColorFocused());
    const buttonAlphaFocused = params.buttonAlphaFocused ?? DEFAULTS.buttonAlphaFocused;
    const depth = params.depth ?? DEFAULTS.depth;
    const restriction = getRestriction(params);

    if (restriction) {
        mod.AddUIButton(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            buttonEnabled,
            buttonColorBase,
            buttonAlphaBase,
            buttonColorDisabled,
            buttonAlphaDisabled,
            buttonColorPressed,
            buttonAlphaPressed,
            buttonColorHover,
            buttonAlphaHover,
            buttonColorFocused,
            buttonAlphaFocused,
            depth,
            restriction
        );
    } else {
        mod.AddUIButton(
            UNIQUE_NAME_PLACEHOLDER,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            buttonEnabled,
            buttonColorBase,
            buttonAlphaBase,
            buttonColorDisabled,
            buttonAlphaDisabled,
            buttonColorPressed,
            buttonAlphaPressed,
            buttonColorHover,
            buttonAlphaHover,
            buttonColorFocused,
            buttonAlphaFocused,
            depth
        );
    }

    return setWidgetName(UNIQUE_NAME_PLACEHOLDER, params.name ?? DEFAULTS.name);
}

// Main widget creation dispatcher
function createWidget(params: UIParams): mod.UIWidget {
    switch (params.type) {
        case "Container":
            return createContainer(params);
        case "Text":
            return createText(params);
        case "Image":
            return createImage(params);
        case "Button":
            return createButton(params);
        default:
            // TypeScript will ensure this is never reached with proper types
            throw new Error(`Unknown widget type: ${(params as any).type}`);
    }
}

export function ParseUI(config: UIParams): mod.UIWidget | undefined {
    if (!config) {
        return undefined;
    }
    return createWidget(config);
}