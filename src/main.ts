import { isValidAI } from "./lib/ai";
import { PlayerState } from "./systems/player";

const vendingMachineID: number = 100;

export async function OnPlayerJoinGame(eventPlayer: mod.Player) {
    if(isValidAI(eventPlayer)) {
        console.log(`(AI) Player ${mod.GetObjId(eventPlayer)} joined the game`);
        return;
    }
    PlayerState.findOrCreate(eventPlayer);
}

export function OnPlayerInteract(eventPlayer: mod.Player, interactPoint: mod.InteractPoint) {
    let playerState = PlayerState.findOrCreate(eventPlayer);

    if(!playerState) return;

    if (mod.GetObjId(interactPoint) === vendingMachineID) {
        playerState.weaponCatalog?.open();
    }
}

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) {
    const playerState = PlayerState.findOrCreate(player);

    if(!playerState) return; // Can happen if eventPlayer id is invalid or an AI

    playerState.weaponCatalog?.onUIButtonEvent(widget, event);
}

export function OnPlayerLeaveGame(playerId: number): void {
    console.log(`Player ${playerId} left the game`);
    PlayerState.remove(playerId);
}