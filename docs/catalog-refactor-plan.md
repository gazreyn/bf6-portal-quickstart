# Catalog Module Refactor Plan

## Objectives
- Improve readability and maintainability of `src/systems/catalog.ts`.
- Remove repetitive widget configuration and string-based identifiers.
- Prepare the codebase for additional catalog panels without increasing complexity.

## Guiding Principles
- Keep public API of `Catalog` stable during the first pass.
- Extract reusable utilities before introducing new behavior.
- Prefer descriptive names and small, focused helpers over inline literals.
- Maintain alignment with existing patterns in `src/lib` (e.g., layout helpers, color utilities).

## Proposed Changes

### 1. Widget Naming Utilities
- ✅ `createWidgetName` and `CatalogWidgetName` now centralize all catalog widget identifiers.
- ✅ `parseNavButtonCategory` removes manual slicing in event handlers when mapping widget names back to categories.
- Follow-up: export the helper once other modules need access (for now it remains local to `weapon-catalog.ts`).

### 2. UI Factory Helpers
- Add lightweight factory functions for common `ParseUI` payload patterns:
  - `createContainer(props)` for containers sharing anchor/color defaults.
  - `createButton(props)` for navigation buttons.
  - Optional: expose these from a new module under `src/lib/ui-factories.ts` or a local utility section within the Catalog file.
- Refactor background creation to use the container factory so properties like `bgAlpha`, `bgFill`, and `anchor` stay consistent.

### 3. Color Constants
- Define named constants for colors currently derived via `calculateGameColorFromRGB`, e.g.,
  ```ts
  const CATALOG_COLOR = {
      buttonBase: calculateGameColorFromRGB(32, 33, 34),
      buttonSelected: calculateGameColorFromRGB(61, 65, 68),
      outline: calculateGameColorFromRGB(121, 122, 124),
  };
  ```
- Consume these constants in `_createNavButton` and `selectCategory` to avoid recomputing values and clarify intent.

### 4. Navigation Button Model
- ✅ `_navigationButtons` now stores a `NavButton` per `WeaponCategory`, carrying the associated widgets.
- Follow-up: once step 2’s naming helper lands, eliminate the remaining `replace`/`includes` guard in `onUIButtonEvent`.
- Optional: initialize the default selection immediately after menu creation so the stored `_selectedCategory` matches visual state.

### 5. Selection State Helpers
- ✅ `_setNavButtonSelected` now centralizes outline visibility and color updates.
- Consider extending the helper to support disabled/hover states if navigation behavior expands.

### 6. Layout Preparation Wrapper
- Wrap the `stackLayout` preparation into a helper:
  ```ts
  function createNavLayout(categories: WeaponCategory[]): { frames: StackFrame[]; size: [number, number]; }
  ```
- Use the helper to drive `_createVerticalNavigationMenu`, allowing future menus to reuse the same layout logic.

### 7. Lifecycle Guards
- Introduce small guard helpers like `ensureRoot()` that throw or early-return with a clear message when `_catalogRootWidget` is missing.
- Optional: encapsulate visibility toggling in `setCatalogVisible(isVisible)` to consolidate `EnableUIInputMode` and `SetUIWidgetVisible` calls.

## Implementation Steps (Suggested Order)
1. Add color constants and replace inline `calculateGameColorFromRGB` calls.
2. Implement widget naming utility and update button creation + event handling.
3. Refactor `_navigationButtons` to the typed model and update selection logic with helpers.
4. Introduce UI factory helpers and apply them to background/nav button creation.
5. Extract layout preparation helper and simplify `_createVerticalNavigationMenu` accordingly.
6. Add lifecycle guard/helper for visibility management.
7. Run existing tests or manual UI verification to ensure no behavior regression.

## Notes & Follow-Up
- After structural refactor, consider splitting catalog item rendering into separate modules once additional UI components are introduced.
- Evaluate moving catalog-specific helpers into `src/systems/catalog/` subdirectory if the module continues to grow.
- Document new utilities with concise comments to aid future contributors.
