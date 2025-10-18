# Audit: Partitioning the Two Longest Files in CollabCanvas

## Scope

This audit targets the two longest files in the repository and proposes practical, incremental partitioning while keeping behavior unchanged and improving navigability, testability, and performance.

- Files analyzed:
  - `collabcanvas/src/components/Canvas/Canvas.tsx` (~3558 LOC)
  - `collabcanvas/src/contexts/CanvasContext.tsx` (~1848 LOC)

---

## Findings (High-Level)

- Monolithic files couple rendering, event handling, and state orchestration, increasing cognitive load and change risk.
- Several concerns are already extracted (e.g., `SmartGuides`, `GridOverlay`, shapes), but `Canvas.tsx` still centralizes Stage orchestration and most event plumbing. `CanvasContext.tsx` centralizes many unrelated domains (shapes CRUD, selection, viewport, snapping, connectors, persistence).
- Partitioning along domain seams and UI layers will reduce cross-file noise and improve semantic discoverability.

---

## Proposal A: Split `components/Canvas/Canvas.tsx`

Goal: Reduce to a thin orchestration component (<250 LOC) that composes layers, hooks, and event handlers.

### Proposed structure

```text
collabcanvas/src/components/Canvas/
  Canvas.tsx                       # Thin orchestrator (Stage + Providers + layout)
  stage/
    CanvasStage.tsx                # Konva Stage setup and sizing
    Layers.tsx                     # Composes the ordered Konva layers
  layers/
    ShapesLayer.tsx                # Renders shapes (delegates to per-shape components)
    GuidesLayer.tsx                # Smart guides + snapping visuals
    GridLayer.tsx                  # Grid rendering
    BadgesLayer.tsx                # Comment badges layer (wraps existing CommentBadge)
    AnchorsLayer.tsx               # Anchor point rendering, drag handles
    CursorsLayer.tsx               # Presence cursors
  events/
    useKeyboardShortcuts.ts        # Keybindings, including arrow move & space-to-pan
    useMouseEvents.ts              # Stage mouse down/up/move, selection box
    useWheelZoom.ts                # Zoom and viewport clamping
    useDragHandlers.ts             # Drag start/move/end for shapes & connectors
    useContextMenu.ts              # Context menu open/close plumbing
  layout/
    CanvasLayout.tsx               # Arranges side panels, toolbars, overlays
```

### Responsibility mapping

- `Canvas.tsx`: mounts `CanvasStage`, composes `Layers`, and binds hook outputs; no low-level listeners inline.
- `stage/CanvasStage.tsx`: encapsulates Stage ref, dimensions, DPR handling, pointer events enabling.
- `layers/*`: visual-only, props-in/JSX-out; no app logic beyond layer-specific layout.
- `events/*`: all event listeners as focused hooks; expose callbacks and state necessary for layers.
- `layout/CanvasLayout.tsx`: composes `ComponentLibrary`, `PropertyPanel`, `CommentsPanel`, `AlignmentTools`, `AIInput`, `ContextMenu` (already separate). Keeps layout concerns out of Stage.

### Benefits

- Clear seams for testing (unit-test hooks and layers separately).
- Easier async/event reasoning; smaller files (each <300 LOC target).
- Safer changes (e.g., zoom or drag logic) without touching rendering.

---

## Proposal B: Split `contexts/CanvasContext.tsx`

Goal: Decouple domains and keep provider thin; isolate persistence from UI state. Reuse existing services where possible (`services/canvas.ts`, `services/connections.ts`, `services/comments.ts`).

### Proposed structure

```text
collabcanvas/src/contexts/canvas/
  CanvasProvider.tsx               # Thin provider composing domain hooks and memoized context value
  index.ts                         # Barrel export for provider + typed hook
  state/
    useShapesState.ts              # Shapes CRUD, optimistic updates, Firestore sync bridge
    useSelectionState.ts           # Selected IDs, multi-select, group selection
    useViewportState.ts            # Pan/zoom, bounds, view transforms
    useConnectionsState.ts         # Connector paths, arrows, anchor linking
    useSnappingState.ts            # Smart guide candidates & grid toggles
    useEditingState.ts             # Inline text editing status & commit coordination
```

Additionally, move cross-cutting types to a dedicated module to avoid cycles:

```text
collabcanvas/src/types/canvas.ts   # Canvas-specific types & context interfaces
```

### Responsibility mapping

- `CanvasProvider.tsx`: imports all `use*State` hooks, composes the context value (stable references), and exposes `useCanvasContext`.
- `useShapesState.ts`: owns shape list, add/update/remove, last-modified metadata, batching to history, calls `services/canvas.ts`.
- `useSelectionState.ts`: owns selection set and helpers; no Firestore coupling.
- `useViewportState.ts`: pan/zoom state and clamping; arrow-key scroll prevention.
- `useConnectionsState.ts`: arrowStart/arrowEnd toggles, path recomputation (delegates geometry to `utils/anchor-snapping.ts`).
- `useSnappingState.ts`: grid and guide toggles and computed guides (delegates math to `utils/snapping.ts`).
- `useEditingState.ts`: inline text editor lifecycle and save hooks.

### Benefits

- Domain boundaries prevent accidental imports and circular deps.
- Each file is small and grep/semantic-search friendly.
- Provider remains readable (<200 LOC) and easier to maintain.

---

## Cross-Cutting Recommendations

- Types: consolidate canvas-specific types in `src/types/canvas.ts`; keep shared enums/interfaces colocated with logic only when truly private.
- Constants: keep feature flags (e.g., grid toggle keybind) in `utils/constants.ts` or `contexts/canvas/constants.ts`.
- Avoid cycles: ensure `layers/*` consume context only through hooks; `events/*` call context setters but do not import layers.
- Performance: memoize heavy derived values with `useMemo`; wrap layer props with stable selectors to minimize re-renders.
- Testing: add focused tests for `events/*` hooks (keyboard, wheel, drag) and `state/*` reducers.

---

## Incremental Migration Plan (No Behavior Changes)

1. Extract `stage/CanvasStage.tsx` and `layers/*` using existing JSX from `Canvas.tsx` (mechanical move).
2. Extract `events/useWheelZoom.ts` and `events/useKeyboardShortcuts.ts` from current handlers; wire into `Canvas.tsx`.
3. Create `contexts/canvas/CanvasProvider.tsx` and move logic from `CanvasContext.tsx` progressively into `state/*` hooks.
4. Replace imports of the old context with `contexts/canvas` barrel exports; keep API compatibility on names.
5. Split remaining `Canvas.tsx` handlers into `events/*` until file <250 LOC.
6. Remove dead code and re-run lints/tests; verify multiplayer and AI agent flows.

---

## Acceptance Criteria

- `Canvas.tsx` <= 250 LOC; `CanvasContext.tsx` replaced by `contexts/canvas/*` with each file < 500 LOC.
- No UI/behavior regressions (panning, zoom, selection, snapping, arrow keys, comments, AI, presence).
- All existing unit tests pass; add new tests for extracted hooks.

---

## Risks & Mitigations

- Risk: circular imports between state and events. Mitigation: events depend only on context API, not concrete state modules.
- Risk: subtle history/persistence coupling. Mitigation: keep persistence in services and drive via `useShapesState` and `useConnectionsState` with explicit effects.
- Risk: multiplayer edge cases. Mitigation: test with 2+ clients for presence/cursors and shape updates.