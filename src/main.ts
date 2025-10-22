import { ExampleClass } from "./example-class";

export async function OnGameModeStarted(): Promise<void> {
    // Do Something here
}

export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    ExampleClass.greet(eventPlayer);
}