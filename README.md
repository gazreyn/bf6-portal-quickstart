# BF6 Portal Quickstart

A TypeScript-based development environment for creating Battlefield 6 Portal scripts with modern tooling, string localization, and helpful VS Code snippets.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Either npm or pnpm package manager

### Installation

Install dependencies using your preferred package manager:

```bash
# Using npm
npm install

# Using pnpm  
pnpm install
```

### Building

Build your Portal script for deployment:

```bash
# Using npm
npm run build

# Using pnpm
pnpm build
```

### Build Output

The build process creates a `dist/` folder containing two files ready for the Battlefield 6 Portal editor:

- **`Script.js`** - Your TypeScript code bundled into a single Typescript file
- **`Strings.json`** - Localized strings extracted from your code using the string macro system

Simply copy these files into the Battlefield 6 Portal editor website to use your custom game mode logic.

## 📝 String Localization System

This project includes a useful string macro system that automatically extracts and manages localized strings.

### How it Works

1. **Import the macro**: `import { s } from "./lib/string-macro.ts"`
2. **Use template literals**: Wrap your strings with `s` followed by backticks
3. **Automatic extraction**: During build, strings are extracted and replaced with references
4. **Localization ready**: All strings are collected in `Strings.json` for easy translation

### Usage Example

```typescript
import { s } from "./lib/string-macro";

export class ExampleClass {
    public static greet(player: mod.Player): void {
        const message = mod.Message(s`Hello, {}!`, s`World`);
        mod.DisplayNotificationMessage(message, player);
    }
}
```

### What Happens During Build

Anything wrapped in the `s` macro is processed during the build and replaced with string keys. These string keys correspond to the generated entries in the `Strings.json` file.

```typescript
const message = mod.Message(s`Hello, {}!`, s`World`);

// Becomes

const message = mod.Message(mod.stringkeys.string_a1b2c3d4e5f6, mod.stringkeys.string_f6e5d4c3b2a1);
```

### String Deduplication

The system automatically deduplicates identical strings - if you use the same text in multiple places, it will generate the same string key and only appear once in `Strings.json`.

## 🎯 VS Code Event Snippets

This project includes a comprehensive set of VS Code snippets for all supported Battlefield Portal events. These snippets help you quickly insert properly typed event handlers.

### Using Snippets

1. Open any TypeScript file in VS Code
2. Start typing an event name (e.g., "OnPlayer...")
3. Select the desired event from the autocomplete menu
4. The snippet will insert a complete function signature with proper typing

### Available Events

The snippets cover all major Portal events including:

- **Player Events**: `OnPlayerDeployed`, `OnPlayerDied`, `OnPlayerDamaged`, etc.
- **Game Mode Events**: `OnGameModeStarted`, `OnGameModeEnding`, `OnTimeLimitReached`
- **Vehicle Events**: `OnPlayerEnterVehicle`, `OnVehicleDestroyed`, `OnVehicleSpawned`
- **Capture Point Events**: `OnCapturePointCaptured`, `OnPlayerEnterCapturePoint`
- **AI Events**: `OnAIMoveToSucceeded`, `OnAIWaypointIdleRunning`
- **And many more!**

Each snippet includes:
- Proper function signature with `export`
- Correctly typed parameters
- JSDoc description of when the event is triggered
- Cursor placement for immediate coding

## 📁 Project Structure

```
src/
├── main.ts              # Entry point - define your event handlers here
├── example-class.ts     # Example class showing string macro usage
└── lib/
    └── string-macro.ts  # String localization macro (build-time only)

.vscode/
└── events.code-snippets # VS Code snippets for Portal events

dist/                    # Build output (generated)
├── Script.js           # Compiled script for Portal
└── Strings.json        # Extracted localized strings
```

## 🛠 Development Tips

1. **Start with `main.ts`**: Define your main event handlers in the `main.ts` file
2. **Use the string macro**: Wrap all user-facing text with `s\`...\`` for localization
3. **Leverage snippets**: Use the provided VS Code snippets for quick event handler creation
4. **Build frequently**: Run the build command to check for errors and see your generated output
5. **Organize code**: Create additional TypeScript files in `src/` for better organization

## 🔧 Configuration

- **Build Script**: Customize the build process in `scripts/build.ts`
- **Excluded Files**: The build process automatically excludes utility files like `string-macro.ts`

## 📦 Dependencies

- **TypeScript**: For type-safe development
- **ts-morph**: For advanced TypeScript AST manipulation during build
- **tsx**: For running TypeScript scripts directly

## 🎮 Portal Integration

Once built, copy the contents of the `dist/` folder to your Battlefield 6 Portal workspace:

1. Open the Battlefield 6 Portal editor
2. Navigate to your game mode's logic/scripts editor
3. Paste the contents of `Script.ts`
4. Paste the contents of `Strings.json`
5. Test your game mode!