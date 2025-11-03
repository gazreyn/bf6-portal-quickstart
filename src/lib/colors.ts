const normalizeChannel = (channel: number) => Math.min(1, channel / 188);

export function normalizeRGB(red: number, green: number, blue: number): [number, number, number] {
    return [normalizeChannel(red), normalizeChannel(green), normalizeChannel(blue)];
}

const PALETTE = {
    "neutral-50": [250, 250, 250],
    "neutral-100": [245, 245, 245],
    "neutral-200": [229, 229, 229],
    "neutral-300": [212, 212, 212],
    "neutral-400": [163, 163, 163],
    "neutral-500": [115, 115, 115],
    "neutral-600": [82, 82, 82],
    "neutral-700": [64, 64, 64],
    "neutral-800": [38, 38, 38],
    "neutral-900": [23, 23, 23],
    "neutral-950": [10, 10, 10],
    "zinc-50": [250, 250, 250],
    "zinc-100": [244, 244, 245],
    "zinc-200": [228, 228, 231],
    "zinc-300": [212, 212, 216],
    "zinc-400": [161, 161, 170],
    "zinc-500": [113, 113, 122],
    "zinc-600": [82, 82, 91],
    "zinc-700": [64, 64, 70],
    "zinc-800": [39, 39, 42],
    "zinc-900": [24, 24, 27],
    "zinc-950": [9, 9, 11],
} as const;

export const COLOR = {
    normalized: (colorName: keyof typeof PALETTE) => {
        const rgb = PALETTE[colorName];
        return normalizeRGB(rgb[0], rgb[1], rgb[2]);
    },
    vector: (colorName: keyof typeof PALETTE) => {
        const rgb = PALETTE[colorName];
        const gameColor = normalizeRGB(rgb[0], rgb[1], rgb[2]);
        return mod.CreateVector(gameColor[0], gameColor[1], gameColor[2]);
    }
}