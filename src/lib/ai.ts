export function isValidAI(player: mod.Player): boolean {
    return mod.IsPlayerValid(player) && isAI(player);
}

export function isAI(player: mod.Player): boolean {
    return mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
}