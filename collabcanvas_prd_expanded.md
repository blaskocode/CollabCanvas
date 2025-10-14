# CollabCanvas - Complete Product Requirements Document

**Project**: CollabCanvas - Real-Time Collaborative Design Tool  
**Goal**: Build a Figma-like collaborative canvas with AI-assisted design  
**Phases**: MVP (Complete) + Phase 2 Expansion (In Progress)

---

## Project Overview

CollabCanvas is a web-based real-time collaborative design tool that allows multiple users to create and edit simple designs simultaneously on a shared canvas. Users authenticate with email/password or Google, share a global canvas space, manipulate basic shapes, see each other's cursors and presence, and (in Phase 2) leverage AI to assist with design generation and layout.

**Key Differentiators:**
- Real-time multiplayer with <100ms sync
- Object locking to prevent simultaneous edits
- AI agent that understands natural language design commands
- Simple, focused feature set (not trying to be full Figma)

---

## Phase 1: MVP (Completed)

### MVP Features Delivered

✅ **Authentication System**
- Email/password signup and login (Firebase Auth)
- Google OAuth integration
- User display names (Google name or email prefix)
- Session persistence across refreshes

✅ **Canvas Workspace**
- 5000x5000px bounded canvas
- Pan and zoom (0.1x to 3x)
- Dynamic minimum zoom (shows entire canvas)
- Canvas centering at minimum zoom
- 60 FPS performance target maintained

✅ **Shape Creation & Manipulation**
- Rectangle creation (gray fill #cccccc)
- Shape selection (visual feedback: blue border + shadow)
- Drag to move (with auto-pan near viewport edges)
- Delete with Delete/Backspace key
- Boundary constraints (objects stay within canvas)

✅ **Real-Time Synchronization**
- Firestore for persistent shape storage
- Object locking (first-come, first-served)
- Lock timeout (5 seconds auto-release)
- Cursor refresh rate: 20-30 FPS (<50ms requirement)
- Shape sync rate: <100ms
- Offline persistence (IndexedDB cache)

✅ **Multiplayer Cursors**
- Real-time cursor position tracking
- User names near cursor pointers
- Deterministic user colors (10-color palette)
- Cursor filtering (don't show own cursor)
- Smooth CSS transitions (100ms ease-out)

✅ **User Presence**
- Online user list (up to 6 users visible)
- "+X more" for additional users
- User avatars with initials
- Join/leave notifications
- Auto-cleanup on disconnect

✅ **State Persistence**
- Firestore automatic persistence
- State loads on page refresh
- New users see complete current state
- Offline changes sync on reconnect

✅ **Deployment**
- Firebase Hosting deployed
- Public URL: https://collabcanvas-mvp.web.app
- Supports 5+ concurrent users
- Security rules configured (Firestore + RTDB)

---

## Phase 2: Feature Expansion

### Phase 2a: Enhanced Shape Support (Priority: HIGH)

#### Feature: Multiple Shape Types

**Shapes to Add:**
- **Circles/Ovals** - fully parametrized with radius or width/height
- **Lines** - with start and end points
- **Text Layers** - editable text with font size, color, alignment
- **Rectangles with Corners** - optional rounded corners (border-radius)
- **Paths/Polygons** - defined by points (future, if time)

**User Stories:**

- As a designer, I want to **create circles and text** so that I can build more complex designs
- As a designer, I want to **style shapes individually** (colors, borders) so that my designs look intentional
- As a designer, I want to **edit text layers** so that I can add labels and content

**Implementation Details:**

1. **Shape Type Enum**
   - Update Shape type in `src/utils/types.ts`
   - Add `type: 'rectangle' | 'circle' | 'text' | 'line'`
   - Parametrize based on shape type

2. **Circle Rendering**
   - Use Konva Circle for perfect circles
   - Properties: `x, y, radius, fill, stroke`
   - Scale handle if implemented (show radius in edit mode)

3. **Text Layers**
   - Use Konva Text component
   - Properties: `x, y, text, fontSize, fill, fontFamily, align`
   - Double-click to edit inline
   - Blur to save and sync

4. **Lines**
   - Use Konva Line component
   - Properties: `points: [x1, y1, x2, y2], stroke, strokeWidth`
   - Start/end circles for dragging line endpoints

5. **UI Updates**
   - Add shape type selector in controls (buttons or dropdown)
   - Update shape creation UI
   - Show relevant controls based on selected shape

**Success Criteria:**
- Can create rectangles, circles, text, and lines
- Each shape type renders correctly
- All shape types sync in real-time
- Performance maintained with mixed shape types

**Estimated Effort:** 2-3 hours

---

### Phase 2b: Shape Styling (Priority: HIGH)

#### Feature: Color Customization & Borders

**Styling Options:**
- **Fill Color** - picker for each shape
- **Stroke Color** - optional border
- **Stroke Width** - thickness (1-10px)
- **Opacity/Transparency** - 0-100%
- **Rounded Corners** - for rectangles only

**User Stories:**

- As a designer, I want to **change shape colors** so that my designs are visually cohesive
- As a designer, I want to **add borders and adjust stroke width** so that shapes have visual hierarchy
- As a designer, I want to **adjust transparency** so that I can layer elements

**Implementation Details:**

1. **Styling Properties**
   - Add to Shape interface:
     ```typescript
     fill: string; // hex color or gradient (MVP: solid only)
     stroke?: string;
     strokeWidth?: number;
     opacity?: number;
     cornerRadius?: number; // rectangles only
     ```

2. **Color Picker**
   - Use HTML5 `<input type="color">` or library (e.g., react-color)
   - Position in shape property panel
   - Real-time preview and sync

3. **Property Panel**
   - Show when shape is selected
   - Floating panel or sidebar (TBD)
   - Controls: Fill color, stroke, stroke width, opacity
   - Auto-hide when deselected

4. **Firestore Updates**
   - Extend Shape document with styling fields
   - Migrations: Add default styling to existing shapes

**Success Criteria:**
- Can pick colors from palette or custom picker
- Color changes sync instantly
- Borders and transparency work correctly
- Property panel is intuitive

**Estimated Effort:** 2-3 hours

---

### Phase 2c: Shape Transformation (Priority: MEDIUM)

#### Feature: Resize & Rotate

**Transformation Features:**
- **Resize** - drag corner/edge handles
- **Rotate** - rotate button or rotate handle
- **Constraints** - stay within canvas bounds

**User Stories:**

- As a designer, I want to **resize shapes** so that I can create layouts of different scales
- As a designer, I want to **rotate elements** so that I can create diagonal compositions
- As a designer, I want to **maintain aspect ratio** (optional) when resizing

**Implementation Details:**

1. **Resize Handles**
   - Show 8 handles (corners + midpoints) when selected
   - Drag to resize
   - Konva Transformer can handle this automatically
   - Constraint to canvas bounds

2. **Rotation**
   - Add rotation handle (top center)
   - Drag to rotate around center
   - Show angle indicator (degrees)
   - Snap to 15° increments (optional)

3. **Store Transformations**
   - Add to Shape interface:
     ```typescript
     rotation?: number; // degrees 0-360
     scaleX?: number;
     scaleY?: number;
     ```

4. **Konva Integration**
   - Use Konva Transformer component
   - Attach to selected shape
   - Handle `transformend` event to save

**Success Criteria:**
- Can resize shapes with handles
- Can rotate with angle indicator
- Transformations persist and sync
- Performance remains at 60 FPS

**Estimated Effort:** 2-3 hours

---

### Phase 2d: Advanced Layout (Priority: MEDIUM)

#### Feature: Multi-Select, Grouping & Alignment

**Layout Features:**
- **Multi-Select** - Shift+Click or drag box select
- **Grouping** - Group selected shapes (Ctrl+G)
- **Alignment Tools** - Align left/center/right, top/middle/bottom
- **Distribution** - Space evenly horizontally/vertically

**User Stories:**

- As a designer, I want to **select multiple shapes** so that I can move them together
- As a designer, I want to **group shapes** so that I can treat them as a single unit
- As a designer, I want to **align and distribute shapes** so that I can create ordered layouts
- As a designer, I want to **arrange layers** (bring forward/send back) so that I can control stacking order

**Implementation Details:**

1. **Multi-Select**
   - Add `selectedIds: string[]` to Canvas context (was single ID)
   - Shift+Click to add/remove from selection
   - Drag box select (start drag on empty canvas, select all shapes in box)
   - Visual feedback: all selected shapes show blue border

2. **Grouping**
   - Add `Group` shape type or use metadata
   - Group contains `childIds: string[]`
   - Moving group moves all children
   - Lock group to prevent editing children
   - Keyboard shortcut: Ctrl+G

3. **Alignment**
   - Calculate bounding box of all selected shapes
   - Buttons: Align Left, Center, Right (horizontal)
   - Buttons: Align Top, Middle, Bottom (vertical)
   - Store each shape's new position and sync

4. **Distribution**
   - Space selected shapes evenly in X or Y axis
   - Calculate gaps between shapes
   - Adjust each shape position and sync

5. **Layer Stacking**
   - Maintain `zIndex` field in Shape
   - Keyboard: Ctrl+], Ctrl+[
   - Right-click context menu: "Bring Forward", "Send Back"

**Success Criteria:**
- Multi-select works intuitively
- Groups can be created and moved together
- Alignment tools snap shapes precisely
- Distribution evenly spaces elements
- Layer order can be adjusted

**Estimated Effort:** 3-4 hours

---

### Phase 2e: History & Undo/Redo (Priority: MEDIUM)

#### Feature: Undo/Redo Stack

**History Features:**
- **Undo** - Ctrl+Z
- **Redo** - Ctrl+Y or Ctrl+Shift+Z
- **History Stack** - Keep last 50 actions
- **Per-User History** - Each user has own undo stack

**User Stories:**

- As a designer, I want to **undo my last action** so that I can correct mistakes
- As a designer, I want to **redo** so that I can undo my undo
- As a designer, I want to **see action descriptions** so that I know what will be undone (nice-to-have)

**Implementation Details:**

1. **History State**
   ```typescript
   type HistoryAction = {
     type: 'create' | 'delete' | 'update' | 'move' | 'resize';
     shapesAffected: string[]; // shape IDs
     before: Record<string, any>; // previous state
     after: Record<string, any>; // new state
     timestamp: number;
     userId: string;
   };
   
   interface CanvasHistory {
     stack: HistoryAction[];
     currentIndex: number;
   }
   ```

2. **Undo/Redo Logic**
   - Add action to stack after each change
   - Undo: currentIndex--, restore `before` state
   - Redo: currentIndex++, restore `after` state
   - Limit stack to 50 actions (remove oldest)
   - Clear redo stack when new action taken

3. **Integration Points**
   - Intercept shape creation/deletion/update in context
   - Call `recordHistory()` before syncing to Firestore
   - Apply undo/redo via Firestore update

4. **Keyboard Shortcuts**
   - Ctrl+Z: Undo
   - Ctrl+Y: Redo
   - Ctrl+Shift+Z: Redo (alternative)

**Gotchas:**
- Multiple users editing: Don't undo other users' work (only your own)
- Undo must be local to user (not broadcast)
- Sync must not interfere with undo (be careful with Firestore writes)

**Success Criteria:**
- Undo/redo work for all action types
- Only user's own actions in their undo stack
- Performance remains smooth
- No data loss on undo/redo

**Estimated Effort:** 2-3 hours

---

### Phase 2f: Export & Save (Priority: LOW)

#### Feature: Download Canvas

**Export Features:**
- **Export as PNG** - Raster image of canvas
- **Export as JSON** - Canvas state (for import)
- **Export as SVG** - Vector format (if time)

**User Stories:**

- As a designer, I want to **download my canvas as an image** so that I can share it
- As a designer, I want to **save/load canvas state** so that I can backup work

**Implementation Details:**

1. **PNG Export**
   - Use Konva's `stage.toImage()` or `stage.toDataURL()`
   - Download via `<a>` tag with data URL
   - Include dialog for export options (resolution, background color)

2. **JSON Export**
   - Serialize shapes array to JSON
   - Include metadata: title, exported at, created by
   - Download as `.collabcanvas` or `.json` file

3. **Import**
   - Accept JSON file upload
   - Parse and validate
   - Clear current canvas (or append - TBD)
   - Load shapes and sync to Firestore

**Success Criteria:**
- Export generates correct image/file
- Download works in all browsers
- Import correctly restores canvas state

**Estimated Effort:** 1-2 hours

---

### Phase 2g: AI Canvas Agent (Priority: HIGH)

#### Feature: Natural Language Design Commands

**AI Capabilities:**

The AI agent interprets natural language commands and manipulates the canvas by calling backend functions. It understands:

**Creation Commands:**
- "Create a red circle at position 100, 200"
- "Add a text layer that says 'Hello World'"
- "Make a 200x300 rectangle"
- "Draw a line from 50,50 to 200,200"

**Manipulation Commands:**
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big"
- "Rotate the text 45 degrees"
- "Change the red shape to blue"

**Layout Commands:**
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Align all shapes to the top"

**Complex Commands:**
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image, and description"

**Implementation Details:**

1. **AI Integration**
   - Use Claude API (Anthropic) or GPT-4 (OpenAI)
   - Function calling: Define schema of canvas operations
   - Stream responses for real-time feedback

2. **Canvas API Schema**
   ```typescript
   type CanvasFunction =
     | { type: 'createShape'; params: CreateShapeParams }
     | { type: 'updateShape'; params: UpdateShapeParams }
     | { type: 'deleteShape'; params: { shapeId: string } }
     | { type: 'moveShape'; params: { shapeId: string; x: number; y: number } }
     | { type: 'resizeShape'; params: { shapeId: string; width: number; height: number } }
     | { type: 'rotateShape'; params: { shapeId: string; degrees: number } }
     | { type: 'styleShape'; params: { shapeId: string; fill?: string; stroke?: string } }
     | { type: 'groupShapes'; params: { shapeIds: string[] } }
     | { type: 'alignShapes'; params: { shapeIds: string[]; align: 'left' | 'center' | 'right' } };
   ```

3. **AI Agent Loop**
   - User types command in input box
   - Send to Claude/GPT with function schema
   - AI returns plan + function calls
   - Execute each function in sequence
   - Display results and feedback
   - All users see changes in real-time

4. **Frontend UI**
   - Input field: "What would you like to create?"
   - AI response display: Show plan and progress
   - Results preview
   - Undo last AI command (special button)

5. **Backend Handler** (new endpoint)
   - Accept user command
   - Call AI API with function schema
   - Execute validated functions
   - Return results
   - Sync to Firestore

**AI Prompting Strategies:**

```markdown
## System Prompt

You are an expert UI/UX designer assisting with canvas-based design creation.
The user will give you natural language commands to manipulate a digital canvas.

You have access to the following canvas operations:
[API schema here]

Guidelines:
1. Break complex commands into sequential steps
2. Calculate positions relative to canvas center (2500, 2500) unless specified
3. For layouts, use consistent spacing (50px gaps)
4. Assume reasonable defaults (e.g., shape size 100x100px, black text)
5. When creating UI elements (forms, buttons), use professional styling
6. Always acknowledge what you're creating before executing

For "Create a login form":
- Plan: Create a container background, username field, password field, submit button
- Step 1: Create rect at center (background)
- Step 2: Create text "Username" label
- Step 3: Create text input placeholder
- Step 4: Create text "Password" label
- Step 5: Create password input placeholder
- Step 6: Create submit button
- Step 7: Align all vertically with consistent spacing
```

**Success Criteria:**
- AI agent understands 6+ distinct command types
- Handles single-step commands (<2 seconds)
- Handles multi-step commands (<3 seconds)
- All users see results in real-time
- Clear feedback on what AI is creating

**Estimated Effort:** 4-6 hours (including prompt refinement)

---

### Phase 2h: Polish & Performance (Priority: LOW)

#### Feature: Visual Polish, Animations, and Performance Optimizations

**Polish Items:**
- Smooth animations on shape creation/deletion
- Hover effects on controls and shapes
- Loading spinners and progress indicators
- Better error messages and notifications
- Keyboard shortcuts reference modal (Help)

**Performance Optimizations:**
- Lazy load shapes (only render visible on canvas)
- Memoize expensive computations
- Optimize Firestore queries and indexes
- Compress images/assets
- Monitor bundle size

**Estimated Effort:** 2-3 hours

---

## Data Model Evolution

### Phase 2 Shape Structure

```typescript
interface Shape {
  // IDs and metadata
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line';
  canvasId: string;
  
  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Geometry (shape-specific)
  radius?: number; // for circles
  points?: number[]; // for lines: [x1, y1, x2, y2]
  text?: string; // for text layers
  
  // Styling
  fill: string; // hex color
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number; // for rectangles
  
  // Transformation
  rotation?: number; // degrees
  scaleX?: number;
  scaleY?: number;
  
  // Hierarchy
  zIndex: number;
  groupId?: string; // if part of a group
  
  // Locking and ownership
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Timestamp;
  
  // Text-specific (for text layers)
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Group type (for grouped shapes)
interface ShapeGroup {
  id: string;
  canvasId: string;
  name?: string;
  shapeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  createdBy: string;
  createdAt: Timestamp;
}
```

---

## Tech Stack & Architecture

### Frontend Stack

**React + Vite** (Excellent Choice)
- Fast dev server (HMR in <100ms)
- Optimized production builds
- ESM by default
- Growing ecosystem

**Konva.js** (Good for Canvas Rendering)
- Built-in shape transformers
- Performance optimized (60 FPS on 500+ objects)
- SVG-like API
- Good documentation

**Tailwind CSS** (Solid for UI)
- Utility-first approach
- Small bundle size
- Good accessibility defaults
- Responsive design out-of-box

### Backend Stack

**Firebase** (Good Choice for MVP, Some Concerns for Phase 2)

**Pros:**
- Zero auth setup (plug-and-play)
- Real-time sync with Firestore
- Realtime Database for high-frequency updates
- Generous free tier ($300/month credit)
- One-click deployment (Firebase Hosting)
- No server management

**Cons & Gotchas:**
- **Firestore costs scale with operations** - Each document write counts. At 5 concurrent users creating shapes rapidly, costs can spike. Mitigation: Batch writes, use RTDB for high-frequency, index carefully.
- **Limited query capabilities** - No complex aggregations. If you need analytics later, you'll need BigQuery.
- **Realtime Database limitations** - No built-in security for nested structures. Schema validation must be in rules (complex).
- **Vendor lock-in** - Migration to custom backend is possible but non-trivial.
- **Cold start for functions** - If adding Cloud Functions later, first invocation has ~5s latency.

**When Firestore Costs Get Expensive:**
- Each shape creation = 1 write
- Each shape movement = 1 write (if syncing every pan move, costs explode)
- Solution: Throttle updates, batch writes, use RTDB for cursor/presence

**Recommended Workaround:**
- Keep Firestore for shape storage (CRUD operations)
- Use RTDB exclusively for cursor positions and presence (high-frequency, cheaper)
- Implement write batching (collect 5-10 updates, write once)

---

### State Management

**Current: React Context + Custom Hooks**

**Phase 2 Considerations:**
- Context works well for MVP
- At scale (10K+ users), Context becomes slow (re-renders entire tree)
- For now, keep Context but optimize with React.memo and useMemo
- Future: Consider Redux Toolkit if context re-renders become issue

---

### AI Integration Options

**Option 1: Claude (Anthropic) - RECOMMENDED**
```
Pros:
- Excellent instruction following
- Supports function calling (perfect for canvas API)
- Good at multi-step planning ("create form" breaks down into steps)
- Reasonably priced ($0.003 per 1K input tokens)
- Can use Anthropic's playground to test prompts

Cons:
- Slightly higher latency than GPT-4 mini
- Requires API key management
```

**Option 2: GPT-4 Mini (OpenAI)**
```
Pros:
- Very fast responses
- Good function calling
- Competitive pricing ($0.00015 per 1K input tokens)
- Widely used and documented

Cons:
- Older knowledge cutoff
- Can be less nuanced than Claude for complex instructions
```

**Recommendation:** Use Claude. Its instruction-following is superior for design tasks, and the ability to break down complex "create a form" commands into steps is valuable.

---

### Database Scaling Strategy

**Phase 1-2 (MVP + Expansion):** Keep single global canvas
- Sufficient for 50+ concurrent users
- Firestore can handle 10K+ documents
- Realtime Database can handle 100K connections

**Phase 3 (When Scaling):** Multi-canvas architecture
- Add `canvasId` to routes
- Each user creates/owns canvases
- Canvas list on dashboard
- This requires schema changes (manageable)

---

## Risk Assessment & Mitigations

### High Risk: AI Prompt Failures

**Risk:** AI generates invalid function calls or misunderstands commands  
**Mitigation:**
- Validate all AI function calls before executing
- Provide clear error messages to user
- Show AI's interpretation of the command
- Allow user to refine or cancel

### Medium Risk: Firestore Cost Explosion

**Risk:** Costs spike due to high write volume  
**Mitigation:**
- Batch shape writes (collect updates for 100ms before writing)
- Use RTDB for all cursor/presence updates
- Monitor Firestore usage in console
- Set up billing alerts ($10/month warning)

### Medium Risk: Concurrent Editing Conflicts

**Risk:** Two users edit the same shape, data loss or conflicts  
**Mitigation:**
- Object locking prevents simultaneous edits (already have this)
- Last-write-wins if lock fails (acceptable for MVP)
- Test with 5+ concurrent users before Phase 2 release

### Low Risk: Performance Degradation

**Risk:** Canvas slows down with 500+ shapes  
**Mitigation:**
- Use Konva's caching and rendering optimizations
- Lazy-load shapes (only render visible)
- Monitor FPS during heavy use

---

## Success Metrics

### Phase 2 Launch Criteria

- [ ] All shape types (rectangle, circle, text, line) render correctly
- [ ] Styling (colors, borders, opacity) works end-to-end
- [ ] Resize and rotate transform shapes without data loss
- [ ] Multi-select and grouping work intuitively
- [ ] Undo/redo functional for all action types
- [ ] AI agent handles 6+ command types
- [ ] AI commands execute <2 seconds (single-step)
- [ ] AI commands execute <3 seconds (multi-step)
- [ ] 60 FPS maintained with 500+ mixed shapes
- [ ] Firestore costs <$10/month at typical usage
- [ ] All features tested with 5+ concurrent users

---

## Development Timeline Estimate

| Phase | Features | Estimated Hours | Priority |
|-------|----------|-----------------|----------|
| Phase 1 | MVP (Complete) | ~40 | ✅ Done |
| Phase 2a | Multiple shapes | 2-3 | HIGH |
| Phase 2b | Styling | 2-3 | HIGH |
| Phase 2c | Transform (resize/rotate) | 2-3 | MEDIUM |
| Phase 2d | Advanced layout | 3-4 | MEDIUM |
| Phase 2e | Undo/redo | 2-3 | MEDIUM |
| Phase 2f | Export/save | 1-2 | LOW |
| Phase 2g | AI agent | 4-6 | HIGH |
| Phase 2h | Polish | 2-3 | LOW |
| **Total Phase 2** | | **~22-32 hours** | |

---

## Future Considerations (Phase 3+)

- Multi-canvas support with dashboard
- User roles and permissions (edit, view-only)
- Canvas sharing and collaboration links
- Comment threads on shapes
- Design templates
- Asset library (reusable components)
- Mobile/tablet support
- Offline mode (sync on reconnect)
- Version history and snapshots
- Plugin system for extensions

---

## Appendix: Tech Stack Comparison

### Firestore vs PostgreSQL (via Supabase)

| Aspect | Firestore | Supabase PostgreSQL |
|--------|-----------|-------------------|
| **Setup Time** | 5 minutes | 15 minutes |
| **Auth** | Built-in | Auth0 integration required |
| **Queries** | Limited, schema-less | Full SQL, very flexible |
| **Scaling** | Automatic | Manual or auto-scaling |
| **Cost Model** | Per read/write | Per connection + storage |
| **Typical Cost (MVP)** | $0-5/month | $5-15/month |
| **Real-time** | Good (RTDB separate) | Good (websockets) |
| **Monitoring** | Firebase Console | pgAdmin or custom |
| **Best For** | Rapid prototyping | Complex queries, analytics |

### Konva.js vs Fabric.js vs Pixi.js

| Aspect | Konva | Fabric | Pixi |
|--------|-------|--------|------|
| **Learning Curve** | Easy | Moderate | Hard |
| **Shape Rendering** | SVG-like | DOM/Canvas hybrid | Canvas only |
| **Transformers** | Built-in (excellent) | Great | Manual |
| **Performance (500 objects)** | 60 FPS ✅ | 30-45 FPS | 60 FPS ✅ |
| **Bundle Size** | ~70KB | ~140KB | ~200KB |
| **Community** | Growing | Large | Large (games) |
| **Best For** | Figma-like apps | Photo editors | Games, 3D |

**Recommendation:** Keep Konva.js. Perfect for your use case.

---

## Questions for Review

1. **AI Integration:** Do you want Claude or GPT-4 Mini? Any preference on cost vs. latency?
2. **Shape Priorities:** Which shapes should we tackle first (circles, text, or lines)?
3. **Export:** How important is PNG/SVG export? (Can defer if time-constrained)
4. **Grouping:** Should groups be nestable (groups within groups)?
5. **Performance:** Is 500 shapes the target, or should we optimize for more?

---

**End of PRD**