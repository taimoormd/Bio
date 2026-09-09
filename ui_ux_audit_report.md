# UI/UX Comparative Audit & Modernization Blueprint

**Target Project:** OpenBioFigure  
**Audited Reference Repositories:**
1. `dromara/yft-design` (Open-source Canva / Gaoding equivalent; Vue 3 + Fabric.js)
2. `nihaojob/vue-fabric-editor` (Specialized Fabric.js web graphics editor; Vue 3 + Fabric.js 5/6)
3. `excalidraw/excalidraw` (Gold standard infinite canvas ergonomics & tactile HUD; React + Canvas)

---

## 1. Architectural Comparison Matrix

| Dimension | OpenBioFigure (Pre-Overhaul) | `yft-design` | `vue-fabric-editor` | `excalidraw` | OpenBioFigure (Modernized Standard) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Workspace Model** | Fixed center view with competing panels | Fixed/infinite stage with smooth wheel zoom | Centered artboard with zoom plugins | Unbounded infinite canvas with tactile physics | Unbounded `#F1F3F5` infinite stage with physical white artboard |
| **Top Ribbon** | Dense raw coordinates (`X, Y, W, H, Angle`) + duplicate color buttons | Contextual switch based on active element; clean popovers | Modular attribute bars driven by active element type | Floating minimalist mode bar (tools + status) | Contextual Top Ribbon: High-level styles + dropdown popovers (`Color`, `Border`, `Position`) |
| **Property Controls** | Triplicated across Ribbon, Pill, and Right Sidebar | Single right sidebar with accordion sections (`ElementStroke`, etc.) | Right attribute drawer with synced numeric steppers & select presets | Floating HUD docked to selection with compact popover triggers | Consolidated: Contextual Top Ribbon (Primary), Floating Pill (Micro-actions), Collapsible Right Panel (Deep Inspection) |
| **Stroke & Border** | Basic stroke color & width inputs; missing corner radius / line styles | `el-slider` + `el-select` for line cap/join + popover color | `strokeUniform: true`, 8 dash presets (`strokeDashArray`), synced rx/ry | 3 stroke styles (Solid, Dashed, Dotted), 3 stroke widths, hand-drawn roughness | `BorderPopover`: 3 style pills (Solid, Dashed, Dotted), `strokeUniform: true`, weight slider, corner radius slider |
| **Color Picker** | Basic `<input type="color">` with minimal palette | `ColorButton` trigger (28px swatch) opening popover with gradients/grid | ColorPicker with alpha channel support | `TopPicks` row, swatch grid, custom hex input, hotkeys | `ColorPopover`: Graphic Colors, Document Colors, Scientific publication palettes, EyeDropper |
| **Floating Action Bar** | Heavy duplicate bar with redundant colors and layer buttons | Contextual quick-align icons above viewport | Contextual alignment plugin with canvas overlay | Compact HUD with 4–5 micro-actions anchored to bounding box | Minimalist 4-button pill: `Duplicate`, `Lock/Unlock`, `Layer`, `Delete` (spring transition) |
| **Sidebar State** | Expanded by default, occupying 280px artboard space | Collapsible drawer tabs (`Material`, `Layer`, `Settings`) | Fixed right dock with tab switching | Hidden by default; floating HUD handles 90% of tasks | Collapsible right sidebar (collapsed by default); toggled via header pill |

---

## 2. Code-Level Findings & Triplication Elimination

### 2.1 The "Triplication Problem"
In the prior OpenBioFigure layout, a user modifying a simple rectangle encountered identical controls across three conflicting screen locations:
1. **Top Ribbon:** Displayed Fill color, Stroke color, Stroke width, Raw X/Y/W/H/Angle coordinates.
2. **Floating Canvas Pill:** Displayed Fill color dot, Stroke color dot, Layer Up/Down, Duplicate, Delete, Lock.
3. **Right Properties Panel:** Displayed the exact same Fill color, Stroke color, Stroke width, Opacity, Dimensions, Alignment, and Layer controls.

**Resolution:**
- **Top Ribbon:** Became the single source of truth for high-frequency object styling (Fill Popover, Border Popover, Opacity, Position Popover).
- **Floating Pill:** Trimmed to 4 pure micro-actions (`Duplicate`, `Lock`, `Layer Order`, `Delete`) with zero redundant styling or color swatches.
- **Right Sidebar:** Collapsed by default. Serves as deep secondary inspector (Typography font family, SVG layer hierarchy, vector point data) without stealing viewport width.

---

## 3. Best-in-Class Patterns Ingested from Benchmarks

### 3.1 From `vue-fabric-editor`: `strokeUniform: true` & Preset Dash Arrays
- **Critical Insight:** When scaling shapes in Fabric.js, borders distort into non-uniform ellipsoidal paths unless `strokeUniform: true` is explicitly configured.
- **Implementation:** All stroke mutations in `BorderPopover` and `CanvasEngine` enforce `strokeUniform: true`. Stroke styles map cleanly:
  - Solid: `strokeDashArray: null`
  - Dashed: `strokeDashArray: [8, 6]`
  - Dotted: `strokeDashArray: [2, 4]`, `strokeLineCap: 'round'`

### 3.2 From `yft-design`: Dynamic Swatch Triggers & Palette Ingestion
- **Critical Insight:** `yft-design` separates color selection into a 28px tactile swatch button (`ColorButton.vue`) that launches an aligned popover containing:
  1. Colors extracted from the currently selected graphic.
  2. Global document color history.
  3. Pre-curated design themes.
- **Implementation:** `ColorPopover.tsx` extracts all active object colors dynamically, pairs them with `documentColors` from `CanvasEngine`, and presents scientific publication palettes (Nature, Cell, Vibrant Bio, Monochromatic).

### 3.3 From `excalidraw`: Fluid Micro-Interactions & Tactile HUD
- **Critical Insight:** Excalidraw avoids heavy drawer opening/closing by prioritizing instant keyboard shortcuts and floating HUD micro-actions with spring motion physics.
- **Implementation:** 
  - Floating pill micro-actions enter with `scale(0.96) -> scale(1.0)` and `opacity: 0 -> 1` (`ease-out`, 120ms).
  - Drawers use spring transition curves: `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Tooltips render with dark shortcut keys (`⌘D`, `⌫`, `L`) with delayed entrance (350ms) to avoid visual noise.

---

## 4. Verification & Status

- [x] Reference repositories cloned and codebases audited (`yft-design`, `vue-fabric-editor`, `excalidraw`).
- [x] Floating canvas pill pruned of duplicate color dots and layer buttons.
- [x] Top Ribbon modernized with Canva-style contextual Popovers (`ColorPopover`, `BorderPopover`, `PositionPopover`).
- [x] Raw coordinate dump (`X, Y, W, H, Angle`) moved inside the Position popover.
- [x] Right Properties panel collapsed by default with smooth spring transitions.
- [x] `strokeUniform: true` applied across shape borders.
- [x] Build passing cleanly with exit code 0 (`npm.cmd run build`).
