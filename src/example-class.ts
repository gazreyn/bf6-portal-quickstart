import { s } from "./lib/string-macro";

export class ExampleClass {
    public static greet(player: mod.Player): void {
        const message = mod.Message(s`Hello, {}!`, s`World`);
        mod.DisplayNotificationMessage(message, player);
    }
}