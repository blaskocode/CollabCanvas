# CollabCanvas Phase 2 - System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────── React Application ─────────────────┐ │
│  │                                                                          │ │
│  │  ┌─ UI Layer ──────────────────────────────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  ┌─ Auth Components ─┐  ┌─ Canvas Components ──────────────┐  │  │ │
│  │  │  │ • Login           │  │ • Canvas (Stage)                 │  │  │ │
│  │  │  │ • Signup          │  │ • Shape Renderer Factory         │  │  │ │
│  │  │  │ • Profile         │  │ • PropertyPanel (styling)        │  │  │ │
│  │  │  └───────────────────┘  │ • CanvasControls (zoom/pan)     │  │  │ │
│  │  │                          │ • AlignmentTools (multi-select)  │  │  │ │
│  │  │  ┌─ Collaboration ──┐    │ • AIInput & AIResponse          │  │  │ │
│  │  │  │ • Cursor         │    │ • ExportDialog & ImportDialog   │  │  │ │
│  │  │  │ • PresenceList   │    └──────────────────────────────────┘  │  │ │
│  │  │  │ • Navbar         │                                           │  │ │
│  │  │  │ • HelpModal      │    ┌─ Shape Components ──────────────┐   │  │ │
│  │  │  └───────────────────┘    │ • Rectangle.tsx                 │   │  │ │
│  │  │                           │ • Circle.tsx (NEW)              │   │  │ │
│  │  │  ┌─ UI Primitives ──┐    │ • Text.tsx (NEW)                │   │  │ │
│  │  │  │ • Toast          │    │ • Line.tsx (NEW)                │   │  │ │
│  │  │  │ • ColorPicker    │    │ • Transformer (resize/rotate)   │   │  │ │
│  │  │  │ • Spinner        │    └──────────────────────────────────┘   │  │ │
│  │  │  └───────────────────┘                                           │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌─ State Management (React Context) ──────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  • AuthContext: User, login, logout                             │  │ │
│  │  │  • CanvasContext: Shapes[], selectedIds[], canvas operations    │  │ │
│  │  │  • HistoryContext: Undo/redo stack (NEW)                        │  │ │
│  │  │  • ToastContext: Notifications                                  │  │ │
│  │  │                                                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌─ Custom Hooks ──────────────────────────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  Data & State:                     Real-Time:                   │  │ │
│  │  │  • useAuth()                       • useCursors()               │  │ │
│  │  │  • useCanvas()                     • usePresence()              │  │ │
│  │  │  • useHistory() (NEW)              • useToast()                 │  │ │
│  │  │                                                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌─ Services Layer ────────────────────────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  • firebase.ts         - Firebase initialization                │  │ │
│  │  │  • auth.ts             - Auth operations                        │  │ │
│  │  │  • canvas.ts           - CRUD + locking + grouping (NEW)       │  │ │
│  │  │  • cursors.ts          - Cursor tracking (RTDB)                │  │ │
│  │  │  • presence.ts         - User online status                     │  │ │
│  │  │  • export.ts           - JSON/PNG/SVG export (NEW)             │  │ │
│  │  │  • ai.ts               - Claude API integration (NEW)          │  │ │
│  │  │  • grouping.ts         - Shape grouping operations (NEW)       │  │ │
│  │  │                                                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌─ Utilities ─────────────────────────────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  • types.ts         - TypeScript interfaces                     │  │ │
│  │  │  • constants.ts     - Config values                             │  │ │
│  │  │  • helpers.ts       - Utility functions                         │  │ │
│  │  │  • history.ts       - History action types (NEW)                │  │ │
│  │  │  • ai-prompts.ts    - Claude system prompts (NEW)               │  │ │
│  │  │                                                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌─ Rendering Engine ──────────────────────────────────────────────┐  │ │
│  │  │                                                                  │  │ │
│  │  │  Konva.js:                                                       │  │ │
│  │  │  • Stage (canvas viewport)                                      │  │ │
│  │  │  • Layer (rendering layer)                                      │  │ │
│  │  │  • Shape Groups: Rect, Circle, Text, Line, Transformer        │  │ │
│  │  │  • Caching for performance                                      │  │ │
│  │  │  • 60 FPS target maintained                                     │  │ │
│  │  │                                                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND & EXTERNAL SERVICES                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ Firebase Authentication ───────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  • Email/Password provider                                         │   │
│  │  • Google OAuth provider                                           │   │
│  │  • User session management                                         │   │
│  │  • Token refresh                                                   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ Cloud Firestore (Persistent State) ────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Collection: canvas                                                │   │
│  │  ├─ Document: global-canvas-v1                                    │   │
│  │  │  ├─ shapes: Shape[]                                            │   │
│  │  │  │  ├─ id, type (rectangle|circle|text|line)                 │   │
│  │  │  │  ├─ x, y, width, height, rotation, scaleX, scaleY         │   │
│  │  │  │  ├─ fill, stroke, strokeWidth, opacity, cornerRadius      │   │
│  │  │  │  ├─ text, fontSize, fontFamily, textAlign (text only)     │   │
│  │  │  │  ├─ points (line only)                                    │   │
│  │  │  │  ├─ zIndex, groupId                                       │   │
│  │  │  │  ├─ createdBy, createdAt, lastModifiedBy, lastModifiedAt │   │
│  │  │  │  └─ isLocked, lockedBy, lockedAt                          │   │
│  │  │  ├─ groups: ShapeGroup[] (NEW)                               │   │
│  │  │  │  ├─ id, name, shapeIds[], x, y, width, height           │   │
│  │  │  │  └─ createdBy, createdAt                                 │   │
│  │  │  └─ lastUpdated: timestamp                                   │   │
│  │  │                                                               │   │
│  │  Real-Time Listener:                                            │   │
│  │  • onSnapshot() for shape changes                               │   │
│  │  • <100ms sync target                                           │   │
│  │  • Offline persistence via IndexedDB                            │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ Firebase Realtime Database (High-Frequency Updates) ──────────────┐   │
│  │                                                                      │   │
│  │  Path: /sessions/global-canvas-v1/{userId}                        │   │
│  │  │                                                                 │   │
│  │  ├─ displayName: string                                           │   │
│  │  ├─ cursorColor: string (hex)                                     │   │
│  │  ├─ cursorX, cursorY: number                                      │   │
│  │  ├─ lastSeen: timestamp                                           │   │
│  │  └─ lockedShapes: string[] (shape IDs locked by this user)       │   │
│  │                                                                      │   │
│  │  Real-Time Listener:                                              │   │
│  │  • onValue() for presence & cursor changes                        │   │
│  │  • <50ms sync target (throttled to 30 FPS)                        │   │
│  │  • Auto-cleanup with onDisconnect()                               │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ Firebase Hosting ──────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  • Hosts React SPA                                                 │   │
│  │  • Static files with CDN caching                                   │   │
│  │  • HTTPS by default                                                │   │
│  │  • URL: https://collabcanvas-mvp.web.app                          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ Claude API (External) ─────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Model: Claude 3.5 Sonnet (or latest)                             │   │
│  │                                                                      │   │
│  │  Request:                                                          │   │
│  │  • User command: "Create a login form"                            │   │
│  │  • Canvas state (shapes array)                                    │   │
│  │  • Tool schema (createShape, moveShape, styleShape, etc.)        │   │
│  │                                                                      │   │
│  │  Response:                                                         │   │
│  │  • Plan: "I will create..."                                       │   │
│  │  • Tool calls: [{type: 'createShape', params: {...}}, ...]       │   │
│  │                                                                      │   │
│  │  Latency target:                                                   │   │
│  │  • Single-step: <2 seconds                                         │   │
│  │  • Multi-step: <3 seconds                                          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW DIAGRAMS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ User Creates Rectangle ────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  1. User clicks "Add Shape" in CanvasControls                      │   │
│  │  2. Canvas context calls addShape(type, position)                  │   │
│  │  3. recordHistory() captures action                                │   │
│  │  4. Canvas service creates shape object in Firestore              │   │
│  │  5. Firestore onSnapshot triggers                                  │   │
│  │  6. Local context updates shapes[]                                │   │
│  │  7. Canvas re-renders with new shape (Konva)                      │   │
│  │  8. Other users' browsers receive update via onSnapshot            │   │
│  │  → All users see shape within <100ms                              │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ User Moves Rectangle (with Auto-Pan) ──────────────────────────────┐   │
│  │                                                                      │   │
│  │  1. User drags shape on canvas                                      │   │
│  │  2. Canvas detects onDragStart → acquires lock on shape           │   │
│  │  3. During drag: onDragMove → calls updateShape with new x, y    │   │
│  │  4. Near viewport edge? → Auto-pan triggers requestAnimationFrame │   │
│  │  5. Debounced: collect updates for 100ms before writing           │   │
│  │  6. On drag end: releaselock + final Firestore write              │   │
│  │  7. Firestore update triggers remote users' onSnapshot             │   │
│  │  → Lock prevents other users from editing during drag              │   │
│  │  → Auto-pan smooth (60 FPS)                                        │   │
│  │  → Sync <100ms after drag ends                                     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ User Moves Mouse (Cursor Tracking) ────────────────────────────────┐   │
│  │                                                                      │   │
│  │  1. Canvas detects onMouseMove                                      │   │
│  │  2. Throttle to 33ms (~30 FPS)                                      │   │
│  │  3. Convert screen coords → canvas coords (accounting pan/zoom)    │   │
│  │  4. Only update if moved >2px from last update                     │   │
│  │  5. Send to RTDB: /sessions/global-canvas-v1/{userId}             │   │
│  │  6. Other users' RTDB listeners get onValue callback               │   │
│  │  7. Render Cursor component with SVG arrow + name label            │   │
│  │  → All users see cursor within <50ms (usually <20ms)              │   │
│  │  → Smooth movement with CSS transitions (100ms ease-out)          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ AI Agent Processes "Create Login Form" ─────────────────────────────┐  │
│  │                                                                      │   │
│  │  1. User types: "Create a login form"                              │   │
│  │  2. AIInput sends to ai.ts runAIAgent()                            │   │
│  │  3. AI service calls Claude API with:                              │   │
│  │     - User command                                                 │   │
│  │     - Current canvas state (shapes[])                              │   │
│  │     - Tool schema (createShape, styleShape, alignShapes, etc.)    │   │
│  │  4. Claude responds with plan + tool calls:                        │   │
│  │     - createShape(text, "Username")                                │   │
│  │     - createShape(text, "Password")                                │   │
│  │     - createShape(rect, "Submit Button")                           │   │
│  │     - alignShapes([id1, id2, id3], 'left')                        │   │
│  │  5. Each tool call executed in sequence via canvas service         │   │
│  │  6. Each execution updates Firestore (separate writes)             │   │
│  │  7. Real-time updates trigger onSnapshot for all users             │   │
│  │  → All users see form build step-by-step                          │   │
│  │  → Entire process <3 seconds                                       │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ User Undoes Last Action ───────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  1. User presses Ctrl+Z                                            │   │
│  │  2. useHistory() undo() is called                                  │   │
│  │  3. Get action from history.stack[currentIndex]                    │   │
│  │  4. Restore "before" state from action                             │   │
│  │  5. Call updateShape/deleteShape with before state                │   │
│  │  6. Flag: skipHistory = true (don't re-record)                    │   │
│  │  7. Firestore writes restored state                                │   │
│  │  8. Decrement currentIndex (undo pointer moves back)                │   │
│  │  9. Remote users see shape revert via onSnapshot                    │   │
│  │  → Only user's own undo (doesn't affect others)                    │   │
│  │  → Redo stack clears if new action taken                           │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE TARGETS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Rendering:              Sync:                    AI:                       │
│  • 60 FPS on canvas      • <100ms shapes          • <2s single-step         │
│  • 500+ shapes           • <50ms cursors          • <3s multi-step          │
│  • Smooth pan/zoom       • <30s initial load      • <$1/month usage         │
│  • No jank               • Real-time vs batch     • Function calls via API   │
│                                                                               │
│  Cost Tracking:          Quality:                                           │
│  • Firestore <$15/mo     • 100% TypeScript                                 │
│  • Claude <$5/mo         • Unit + integration tests                         │
│  • Hosting <$3/mo        • Error handling robust                            │
│  • Total: <$25/mo        • User feedback clear                              │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Highlights for Phase 2

### New Components
- **PropertyPanel**: Right-side panel for styling shapes
- **ColorPicker**: HTML5-based color input
- **AlignmentTools**: Multi-select alignment UI
- **AIInput & AIResponse**: AI agent interface
- **HelpModal**: Keyboard shortcuts reference
- **ExportDialog & ImportDialog**: Export/import UI
- **Shape Components**: Circle.tsx, Text.tsx, Line.tsx (render-specific)

### New Services
- **ai.ts**: Claude API integration, tool execution
- **export.ts**: JSON/PNG/SVG export, import
- **grouping.ts**: Shape grouping operations (store in Firestore groups collection)

### New Utilities
- **history.ts**: History action types and constants
- **ai-prompts.ts**: Claude system prompts and examples

### Enhanced Existing Services
- **canvas.ts**: Now handles groups, alignment, distribution, transform validation
- **contexts/CanvasContext.tsx**: Multi-select, history integration, new operations

---

## API Contracts (Service Boundaries)

### Canvas Service Expanded

```typescript
// CRUD Operations
createShape(canvasId, shapeData, userId): Promise<string> // returns shapeId
updateShape(canvasId, shapeId, updates): Promise<void>
deleteShape(canvasId, shapeId): Promise<void>
getShapes(canvasId): Promise<Shape[]>

// Locking
lockShape(canvasId, shapeId, userId): Promise<void>
unlockShape(canvasId, shapeId, userId): Promise<void>

// Grouping (NEW)
createGroup(canvasId, shapeIds, userId): Promise<string> // returns groupId
deleteGroup(canvasId, groupId): Promise<void>
moveGroup(canvasId, groupId, deltaX, deltaY): Promise<void>

// Alignment (NEW)
alignShapes(canvasId, shapeIds, alignType): Promise<void>
distributeShapes(canvasId, shapeIds, direction): Promise<void>

// Layer Management (NEW)
bringForward(canvasId, shapeId): Promise<void>
sendBack(canvasId, shapeId): Promise<void>

// Transforms (NEW)
transformShape(canvasId, shapeId, rotation, scaleX, scaleY): Promise<void>

// Style Operations (NEW)
styleShape(canvasId, shapeId, styling): Promise<void>
```

### AI Service

```typescript
type ToolCall = 
  | { type: 'createShape'; params: CreateShapeParams }
  | { type: 'deleteShape'; params: { shapeId: string } }
  | { type: 'moveShape'; params: { shapeId: string; x: number; y: number } }
  | { type: 'resizeShape'; params: { shapeId: string; width: number; height: number } }
  | { type: 'rotateShape'; params: { shapeId: string; degrees: number } }
  | { type: 'styleShape'; params: { shapeId: string; fill?: string; stroke?: string } }
  | { type: 'groupShapes'; params: { shapeIds: string[] } }
  | { type: 'alignShapes'; params: { shapeIds: string[]; align: string } }
  | { type: 'distributeShapes'; params: { shapeIds: string[]; direction: string } };

runAIAgent(
  userCommand: string,
  canvasState: Shape[],
  canvasService: CanvasService
): Promise<{
  interpretation: string;
  toolCalls: ToolCall[];
  results: any[];
  errors?: string[];
}>
```

### Export Service

```typescript
exportAsJSON(shapes: Shape[], metadata?: object): string
exportAsImage(stageRef: Konva.Stage, filename: string): Promise<void>
exportAsSVG(shapes: Shape[]): string

importFromJSON(jsonString: string): Promise<Shape[]>
validateJSONFormat(jsonData: any): boolean
```

---

## Data Model Evolution

### Firestore Shape Document (Extended)

```json
{
  "id": "shape_123",
  "type": "rectangle|circle|text|line",
  "canvasId": "global-canvas-v1",
  
  // Position & Geometry
  "x": 100,
  "y": 200,
  "width": 150,
  "height": 100,
  
  // Shape-Specific Properties
  "radius": 50,                          // circles only
  "points": [100, 100, 200, 200],        // lines only: [x1, y1, x2, y2]
  "text": "Hello World",                  // text only
  "fontSize": 16,                        // text only
  "fontFamily": "Arial",                 // text only
  "textAlign": "left",                   // text only: left|center|right
  
  // Styling
  "fill": "#cccccc",
  "stroke": "#000000",
  "strokeWidth": 2,
  "opacity": 1.0,
  "cornerRadius": 5,                     // rectangles only
  
  // Transformation
  "rotation": 0,                         // degrees 0-360
  "scaleX": 1.0,
  "scaleY": 1.0,
  
  // Hierarchy
  "zIndex": 0,
  "groupId": "group_456",                // if part of a group
  
  // Ownership & Locking
  "createdBy": "user_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastModifiedBy": "user_123",
  "lastModifiedAt": "2024-01-15T10:30:05Z",
  "isLocked": false,
  "lockedBy": null,
  "lockedAt": null
}
```

### Firestore ShapeGroup Document

```json
{
  "id": "group_456",
  "canvasId": "global-canvas-v1",
  "name": "Login Form",
  "shapeIds": ["shape_123", "shape_124", "shape_125"],
  "x": 100,
  "y": 200,
  "width": 300,
  "height": 200,
  "createdBy": "user_123",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Real-Time Sync Strategy

### Firestore (Persistent State)

**Use for:**
- Shape CRUD operations
- Styling updates
- Transform updates
- Metadata (creation time, ownership)
- Groups and layer management

**Write Pattern:**
- Normal operations: 1 write per operation
- Batching (optional): Collect 5-10 updates in 100ms, write once
- Cost: ~1-2 Firestore writes per user action

**Read Pattern:**
- Real-time listener: `onSnapshot()`
- Sync target: <100ms
- Caching: Offline persistence via IndexedDB

### Realtime Database (High-Frequency)

**Use for:**
- Cursor positions (30 FPS, <50ms)
- User presence (online/offline)
- Temporary locks (with TTL)

**Write Pattern:**
- Throttled: Every 33ms (30 FPS)
- Position threshold: Only write if moved >2px
- Auto-cleanup: `onDisconnect()` clears user data

**Read Pattern:**
- Real-time listener: `onValue()`
- Sync target: <50ms
- No persistence needed (ephemeral)

### Why Split?

| Aspect | Firestore | RTDB |
|--------|-----------|------|
| **Cost** | Per write | Per connection |
| **Latency** | ~50-100ms | ~20-50ms |
| **Persistence** | Yes | No |
| **Query Power** | Good | Limited |
| **Use Case** | Shape state | Ephemeral updates |

**Cost Implication:**
- At 5 concurrent users with 50 shape operations/min:
  - Firestore: 250 writes/min = $0.015/day ≈ $0.45/month
  - RTDB: 300 cursor updates/min = included in free tier (<100 connections)
- Total: Negligible cost

---

## Conflict Resolution Strategy

### Scenario 1: Two Users Edit Same Shape Simultaneously

**Behavior:** First-come-first-served locking

1. User A drags shape → acquires lock
2. User B tries to drag same shape → sees locked indicator, drag disabled
3. User A finishes drag → releases lock
4. User B can now drag

**Implementation:**
- Lock stored in Firestore: `{ isLocked: true, lockedBy: userA_id, lockedAt: timestamp }`
- Client-side: Check `isLocked` before allowing drag
- 5-second timeout: Auto-release if user doesn't complete drag
- Firestore rule: Only allow update if current user or lock expired

### Scenario 2: Group Move Conflicts

**Behavior:** Group is locked as a unit

1. User A starts dragging group → all shapes in group locked
2. User B sees all shapes locked, cannot edit
3. User A finishes → all shapes unlocked

**Implementation:**
- Lock all shapes in `shapeIds[]` when group drag starts
- Release all when drag ends
- Prevents partial group edits

### Scenario 3: Styling Conflict

**Behavior:** Last-write-wins (acceptable for MVP+)

1. User A changes shape fill to red
2. User B changes shape fill to blue (at same time)
3. Firestore write from User B arrives after User A
4. Shape ends up blue
5. User A can undo if unhappy

**Trade-off:** Simple implementation, rare in practice (users don't style same shape simultaneously), users can undo

### Scenario 4: AI Commands Conflict

**Behavior:** Sequential execution, no conflicts

1. User A: "Create a red circle"
2. User B: "Create a blue square" (at same time)
3. AI Agent 1 executes: creates circle
4. AI Agent 2 executes: creates square
5. Both appear on canvas

**No conflict:** Each shape has unique ID, separate Firestore writes

---

## Error Handling Strategy

### Client-Side Error Recovery

| Error | Cause | Recovery |
|-------|-------|----------|
| Firestore connection lost | Network issue | Offline persistence kicks in, retry on reconnect |
| Shape not found | Race condition | Refresh from server |
| Lock timeout | Stuck on locked shape | Auto-release after 5 seconds |
| Invalid AI response | Claude API error | Show error message, allow user to retry |
| Shape exceeds bounds | User drags off-canvas | Clamp to boundary, save corrected position |
| File import fails | Corrupted JSON | Show validation error, user retries |

### Server-Side Validation (Firestore Rules)

```
- Shape type must be in allowed list
- Position must be within canvas bounds
- Colors must be valid hex
- Stroke width must be 1-10
- Only shape owner can delete
- Shape must be unlocked to update (with exceptions)
```

### User-Facing Errors

- Toasts for network issues: "Disconnected, attempting to reconnect..."
- Toasts for validation errors: "Shape color must be a valid color"
- Disabled UI for locked shapes: Gray out, show tooltip "Shape locked by John"
- Help text: Inline explanations in property panel

---

## Performance Optimization Checklist

### Rendering (Konva.js)

- [ ] Enable shape caching for static objects
- [ ] Cache only when shape stops moving
- [ ] Clear cache when shape updated
- [ ] Lazy-load offscreen shapes (stretch goal)
- [ ] Use `hitArea` for selection efficiency
- [ ] Batch Konva `draw()` calls

### State Management

- [ ] Use `React.memo()` on Shape components
- [ ] Use `useMemo()` for expensive calculations (bounding box)
- [ ] Use `useCallback()` for event handlers
- [ ] Avoid Context re-renders with multiple contexts
- [ ] Consider atoms (Recoil) if Context becomes bottleneck

### Firestore

- [ ] Create indexes for common queries
- [ ] Batch writes: Collect updates for 100ms before writing
- [ ] Debounce shape moves: Don't write every drag move
- [ ] Set up billing alerts ($10, $20/month)
- [ ] Monitor usage: Firebase Console > Firestore > Usage

### Network

- [ ] Throttle cursor updates to 30 FPS
- [ ] Compress images before export
- [ ] Use gzip for API responses
- [ ] Cache static assets with Service Worker (optional)

### Monitoring

```typescript
// Performance logging (dev only)
if (process.env.NODE_ENV === 'development') {
  console.log(`FPS: ${frameCount}`, `Firestore Writes: ${writeCount}`, `Sync Time: ${syncTime}ms`);
}
```

---

## Security Considerations

### Firebase Security Rules

**Firestore:**
```
- Authenticated users can read all shapes
- Only shape owner can delete
- All authenticated users can create shapes
- No user can exceed shape limit (10K per canvas)
```

**Realtime Database:**
```
- Authenticated users can read presence
- Users can only write their own cursor position
- onDisconnect() clears user data
```

### API Keys

**Firebase Config:** Public (safe, restricted by Firebase rules)  
**Claude API Key:** Secret (stored in `.env`, never exposed to client)

**If implementing backend:**
- Store Claude key on backend
- Frontend calls backend endpoint (not Claude directly)
- Backend validates user, calls Claude, returns results

---

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript errors resolved
- [ ] Unit tests passing
- [ ] Integration tests with 5 concurrent users passing
- [ ] 60 FPS verified with 500+ shapes
- [ ] Firestore costs <$15/month
- [ ] No console errors or warnings
- [ ] Security rules reviewed and deployed

### Deployment

- [ ] `npm run build` completes without errors
- [ ] Build output <500KB gzipped
- [ ] Firebase deploy: `firebase deploy`
- [ ] Check deployment URL is live
- [ ] Test auth (email, Google)
- [ ] Test shape creation/sync
- [ ] Test AI agent
- [ ] Monitor console for errors

### Post-Deployment

- [ ] Monitor Firestore usage for 24 hours
- [ ] Check error tracking (if configured)
- [ ] Gather user feedback
- [ ] Document any issues

---

## Scalability Path (Phase 3+)

### Current Architecture (MVP + Phase 2)

**Limitations:**
- Single global canvas (all users edit same space)
- No multi-project support
- No user roles or permissions
- Firestore scales to ~50-100 concurrent users

### Phase 3: Multi-Canvas

**Changes:**
- Add `canvasId` to all data structures
- Create canvas dashboard
- Add canvas create/delete/share
- Firestore paths: `/canvases/{canvasId}/shapes/{shapeId}`
- RTDB paths: `/canvases/{canvasId}/sessions/{userId}`

**Cost Impact:** Minimal (scales with usage, not number of canvases)

### Phase 4: Teams & Workspaces

**Changes:**
- Add teams collection
- Add permissions per user per canvas
- Add invitations and access control
- Firestore paths: `/teams/{teamId}/canvases/{canvasId}`

**Cost Impact:** Adds user management, minor Firestore reads

### Future: Horizontal Scaling

If exceeding Firestore limits:
- Shard data by `canvasId` across multiple Firestore databases
- Use Cloud Functions to coordinate cross-shard operations
- Consider migrating to PostgreSQL (via Supabase) for complex queries

---

## Monitoring & Observability

### Metrics to Track

**Performance:**
- FPS during normal use and heavy load
- Sync latency (shape updates, cursor updates)
- AI command latency (seconds)
- Bundle size (KB)

**Usage:**
- Concurrent users
- Shapes per canvas
- AI commands per day
- Export operations per day

**Cost:**
- Firestore read/write costs
- Claude API tokens
- Firebase Hosting bandwidth

### Tools

- Chrome DevTools: Performance, FPS monitoring
- Firebase Console: Firestore usage, Rules testing
- Claude API Dashboard: Token usage, costs
- Sentry (optional): Error tracking

---

End of Phase 2 Architecture