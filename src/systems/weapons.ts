import { s } from "../lib/string-macro";

export const weaponCategories = ['assault', 'carbine', 'sniper', 'smg', 'lmg', 'shotgun', 'pistol', 'dmr'] as const;
export type WeaponCategory = typeof weaponCategories[number];

export const weaponCategoryLabels: Record<WeaponCategory, string> = {
    assault: s`ASSAULT`,
    carbine: s`CARBINE`,
    sniper: s`SNIPER`,
    smg: s`SMG`,
    lmg: s`LMG`,
    shotgun: s`SHOTGUN`,
    pistol: s`PISTOL`,
    dmr: s`DMR`,
};