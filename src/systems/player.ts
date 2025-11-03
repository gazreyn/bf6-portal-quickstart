import { WeaponCatalog } from "./weapon-catalog";
import { isAI } from "../lib/ai";

export class PlayerState {
    public readonly player: mod.Player;
    public static playerInstances: mod.Player[] = [];
    private static _allPlayerStates: { [key: number]: PlayerState } = {};
    public weaponCatalog: WeaponCatalog | undefined;
    
    constructor(player: mod.Player) {
        this.player = player;
        PlayerState.playerInstances.push(this.player);

        // Extra check to prevent AI from getting a weapon catalog, but we check this 
        if (isAI(player)) return;

        this.weaponCatalog = new WeaponCatalog(this);
    }

    static findOrCreate(player: mod.Player) {
        const playerId = mod.GetObjId(player);
        if (playerId < 0) return undefined; // Invalid player
        
        return PlayerState._allPlayerStates[playerId] ??= new PlayerState(player);
    }

    static remove(playerId: number) {
        // Remove only the specific player; keep opportunistic cleanup separate
        for (let i = PlayerState.playerInstances.length - 1; i >= 0; i--) {
            const id = mod.GetObjId(PlayerState.playerInstances[i]);
            if (id === playerId) {
                PlayerState.playerInstances.splice(i, 1);
                break;
            }
        }

        // Destroy any UI's and remove from allPlayerStates
        PlayerState._allPlayerStates[playerId]?.destroyUI();
        delete PlayerState._allPlayerStates[playerId];
    }

    // Optional: call this periodically (e.g., on join, tick) to prune stale entries
    static pruneInvalidPlayers() {
        for (let i = PlayerState.playerInstances.length - 1; i >= 0; i--) {
            const id = mod.GetObjId(PlayerState.playerInstances[i]);
            if (id < 0) {
                PlayerState.playerInstances.splice(i, 1);
            }
        }
    }

    destroyUI() {
        if(!this.weaponCatalog) return;
        this.weaponCatalog.destroy();
        this.weaponCatalog = undefined;
    }
}