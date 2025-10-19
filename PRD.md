<!-- @fileoverview CollabCanvas clean rebuild product requirements document -->
# CollabCanvas Clean Rebuild PRD

### Executive Summary
CollabCanvas is a real-time collaborative design canvas infused with AI assistance. The clean rebuild delivers a maintainable, modular React + Firebase application that replicates existing capabilities—multiplayer editing, workflow shapes, AI-driven commands—while enforcing modern code hygiene (files <500 LOC, `@fileoverview` headers, split responsibilities). The goal is to re-create the current production behavior with improved architecture, leaving room for future multi-project support and advanced features.

---

### Product Goals
- **Parity with current experience**: reproduce all existing functionality (collaborative canvas, shape library, AI agent, presence, comments, exports).
- **Maintainable architecture**: modular file layout, scoped contexts/hooks, reusable services, test coverage, and enforced lint rules to keep files under 500 lines.
- **AI-first workflows**: maintain natural-language creation, manipulation, layout, and complex commands with automatic connector fallback.
- **Scalable collaboration**: sub-100 ms shape sync, sub-50 ms cursor updates, lock handling, offline queues, optimized performance at 500+ shapes and 5+ users.

---

### Success Metrics
- **Performance**: 60 FPS interactions at 500 shapes; sync latency <100 ms (shapes), <50 ms (cursors).
- **Reliability**: 0 critical errors during manual multi-user smoke tests; 90%+ AI command success rate.
- **Maintainability**: 100% of files <500 lines; ESLint/Prettier pass; Vitest suites covering utilities, contexts, key components.
- **Developer Experience**: clean git history, lint-staged hooks, CI pipeline running lint/type/test/build.
- **Availability**: deployed on Firebase Hosting (and optionally Vercel) with working authentication and security rules.

---

### Target Users & Personas
1. **Product Designers** – need a responsive, collaborative canvas to sketch flows and UI with real-time teammates.
2. **Product Managers** – leverage AI commands to bootstrap diagrams quickly, annotate with comments, export for stakeholders.
3. **Developers** – use clean architecture for rapid iteration, test improvements, and future expansions (multi-project system, templates).

---

### Core Use Cases
| Scenario | Description | Success Criteria |
| --- | --- | --- |
| Multiplayer editing | Two users edit shapes concurrently, see live updates, cursor positions, presence list. | Locks prevent collisions; last-write-wins; no divergence after refresh. |
| Shape creation & styling | Users create 22 shape types, apply fills, strokes, text, form properties. | Shapes render correctly, respect snapping, can be grouped, aligned, duplicated. |
| Workflow design | Users draw process flows using workflow shapes and connectors with arrow toggles. | Connectors snap to anchors, update with movement, can be toggled start/end/both. |
| AI-assisted design | User types “Create a login form” or “Arrange these in a grid”. | AI executes command swiftly (<2s), creates shapes, auto-connects workflow steps, shows summary toast. |
| Collaboration annotations | Add, reply, resolve comments; see comment badges on shapes. | Comments sync real-time, unresolved counts display, state persists after refresh. |
| Export | Export selected shapes, viewport, or entire canvas to PNG (2× scale). | Exports remove temporary overlays; file downloads automatically. |
| Undo/Redo & history | Users undo/redo actions, including grouped operations. | History stacks per user, arrow-key moves grouped on keyup, no state corruption. |
| Offline resilience | User loses connection, continues editing; changes sync on reconnect. | Offline banner shown, queued mutations flush successfully, no data loss. |

---

### Functional Requirements

#### Authentication & Access
- Email/password and Google sign-in via Firebase Auth.
- Auth gating: unauthenticated users see login/signup only.
- Auth context provides `currentUser`, loading state, auth actions.
- Security rules restrict Firestore/RTDB access to authenticated users.

#### Canvas Rendering
- Konva-based stage with spacebar panning, wheel zoom (0.1x–3x).
- Grid overlay (20px), grid toggle persisted locally, smart guides with nearest alignment priority.
- Lasso (L key) and box selection, multi-select, select-all-of-type via context menu.
- 1px arrow-key movement without snapping; shift+arrow for 10px.
- Stage layers: grid, guides, shapes, connectors, comment badges, cursors, selection overlays.

#### Shape System (22 components)
- Basic: rectangle, circle, text, line.
- Workflow: process box, decision diamond, start/end oval, document shape, database shape.
- Geometric: triangle, right triangle, hexagon, octagon, ellipse.
- Form/UI: button, text input, textarea, dropdown, checkbox, radio, toggle, slider.
- All shapes use `Konva.Group`, support locking, selection, transformation (except fixed-size form elements), inline text editing where applicable.

#### Connectors & Anchors
- Connectors with independent start/end arrows, orthogonal routing option, label support.
- Anchor points on shapes with snapping, visual indicators, connectors update when shapes move.
- Connection selection, property panel editing, auto cleanup when shapes deleted.

#### Advanced Editing
- Grouping (create, duplicate, ungroup), nested groups, dotted outlines.
- Alignment/distribution tools (left/right/center, top/middle/bottom, horizontal/vertical distribution).
- Clipboard operations (copy, cut, paste, duplicate) with 20px offset increments.
- Z-order management (bring/send, front/back) with optional layer panel.
- Undo/redo history capturing create/update/delete/group actions; arrow-key moves batched by keyup.

#### AI Integration
- OpenAI function calling using GPT-4o-mini (or latest low-latency model).
- Tools: `createShape`, `updateShape`, `deleteShape`, `createConnection`, `alignShapes`, `distributeShapes`, `spaceElementsEvenly`, `createForm`, `createNavbar`, `getCanvasState`.
- AI commands handle creation, manipulation, layout, complex workflows (login form, nav bar, card layout) with fallback to auto-connect workflows.
- AI responses rendered as markdown, summary toast grouping shapes by type/color, concurrency-safe queue.

#### Collaboration & Presence
- RTDB-backed cursors at ~30 FPS, presence list with avatars/colors, join/leave toasts.
- Lock system: first-to-drag wins, 5-second timeout, visual lock indicators.
- Connection status banner (offline/online), offline queue using Firestore persistence, flush with success toast.

#### Comments
- Comments panel with threads, replies, resolve/unresolve, timestamps, author names.
- Comment badges on shapes showing unresolved counts; hide when zero.
- Hotkey `M` toggles panel.

#### Export
- PNG exports: full canvas (5000x5000), visible viewport, selection with padding.
- 2× resolution, remove selection/guide visuals during export, restore afterward.

#### Testing & CI
- Vitest + Testing Library unit/component tests.
- Firebase emulator tests for Firestore/RTDB security rules.
- Performance tests (optional) verifying 500 shape rendering.
- GitHub Actions pipeline running lint, type-check, tests, build on PRs.

---

### Non-Functional Requirements
- **Performance**: maintain 60 FPS interactions, minimal re-renders via memoization and selective subscriptions.
- **Scalability**: support 500+ shapes and 5+ concurrent users with stable sync.
- **Maintainability**: all files <500 lines, `@fileoverview` headers, decomposed contexts/hooks, custom ESLint rule enforcement.
- **Accessibility**: keyboard shortcuts, focus management for modals/panels, ARIA labels for forms and toolbars.
- **Security**: Firebase security rules linted and tested; environment secrets not committed.
- **Resilience**: offline queue, reconnection handling, error toasts for failed operations.

---

### Technical Architecture Overview
- **Frontend**: React 19 (Vite), TypeScript, Tailwind, Konva.
- **State**: React Contexts + lightweight store (Zustand/Jotai) for canvas state; custom hooks for Firestore/RTDB subscriptions.
- **Backend**: Firebase Auth, Firestore (canvas, groups, connections, comments, components), Realtime Database (cursors, presence), Firebase Hosting.
- **AI**: OpenAI client with function calling; ensures compliance with command rubric.
- **Tooling**: ESLint, Prettier, Vitest, Husky, lint-staged, optional Storybook (future).
- **Deployment**: Firebase Hosting primary; Vercel optional; `firebase deploy --only hosting,firestore,database`.

---

### Implementation Phases (Summary)
1. **Tooling & Config** – project scaffold, lint/test setup, Firebase configs, environment management.
2. **Domain & Utilities** – constants, types, helper libs (snapping, selection, history, clipboard, AI prompts).
3. **Services Layer** – Firebase initialization, canvas/group/component/comment/connections services, presence/cursor services, auth, AI execution, cleanup script.
4. **Contexts & Hooks** – modular context architecture, per-responsibility hooks (selection, commands, exports).
5. **Core UI Shell** – App layout, navigation, authentication views, provider wiring.
6. **Canvas Foundation** – stage composition, interaction hooks, layered rendering, toolbar/panels.
7. **Shape & Connector Library** – implement all shapes, anchor visuals, connectors, shared wrapper.
8. **Editing Mechanics** – grouping, aligning, clipboard, history, exports, z-order.
9. **Collaboration** – cursors, presence, locking, offline handling, status banners.
10. **AI UX** – AI input, command executor, fallback logic, concurrency safeguards.
11. **Testing & CI** – unit/integration/performance tests, rule validation, GitHub Actions.
12. **Documentation & Deployment** – README, setup guides, AI log, troubleshooting, deployment scripts, final QA checklist.

---

### Dependencies & Risks
- **OpenAI API availability**: requires valid API key; provide mocks for tests.
- **Firebase quotas**: ensure usage within Spark plan limits (documented presence cleanup).
- **Latency**: maintain sub-2 s AI responses; degrade gracefully with toasts if exceeded.
- **Rocketing complexity**: mitigating by splitting contexts/hooks, layered canvas modules.
- **Future expansions**: multi-project system, templates, advanced exports; current architecture should accommodate without rewrites.

---

### Acceptance Criteria
- Feature parity demo validated against existing app (multi-user session, AI commands, comment flow, exports).
- Automated lint/type/test/build pipelines pass.
- Manual verification checklist signed off (presence sync, locking, offline queue, AI commands, export quality).
- Documentation complete: setup, deployment, AI usage, troubleshooting, architecture diagram, AI development log.
- Codebase adheres to size and header constraints; no TODOs in code (use GitHub issues instead).

---

### Rollout Plan
1. Internal QA using Firebase emulators and live staging environment.
2. Invite-only beta to existing CollabCanvas contributors for regression comparison.
3. Production deploy via Firebase Hosting after QA sign-off.
4. Monitor analytics/logs (if implemented) and gather feedback; prepare follow-up plan for multi-project feature.

---

### Future Extensions (Out of Scope)
- Multi-project dashboard with roles/permissions.
- Templates library, version history, frame/tooling enhancements.
- Advanced export formats (SVG, PDF), storybook integration.
- In-app chat, @mentions, assignments.
- Mobile/touch optimization.

---

### Change Log & Approvals
- PRD version 1.0 — generated October 19, 2025.
- Stakeholders: Courtney Blaskovich (Product/Engineering), Design Lead (TBD), QA Lead (TBD).
- Approval required before initiating Phase 1 implementation.

---

This PRD encapsulates all required functionality, architectural considerations, and quality gates needed to rebuild CollabCanvas cleanly while maintaining feature parity and ensuring long-term maintainability.
