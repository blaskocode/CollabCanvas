# CollabCanvas Phase 2 - Development Task List

**Phase 2 Goal:** Expand MVP with multiple shape types, styling, transformations, AI agent, and advanced layout features.

**Total Estimated Effort:** 22-32 hours across all features  
**Recommended Approach:** Complete features in priority order, testing each before moving to the next

---

## PR #10: Multiple Shape Types

**Branch:** `feature/multiple-shapes`  
**Goal:** Add circles, text layers, and lines to canvas

### Tasks:

- [x] **10.1: Update Shape Type System**
  - Files to update: `src/utils/types.ts`
  - Change shape type from literal `'rectangle'` to union: `'rectangle' | 'circle' | 'text' | 'line'`
  - Add shape-specific properties:
    - Circle: `radius?: number`
    - Text: `text?: string`, `fontSize?: number`, `fontFamily?: string`, `textAlign?: 'left' | 'center' | 'right'`
    - Line: `points?: [number, number, number, number]` (start x, y, end x, y)
  - Update Shape interface to include optional properties
  - Maintain backward compatibility with existing rectangles

- [x] **10.2: Create Circle Component**
  - Files to create: `src/components/Canvas/shapes/Circle.tsx`
  - Use Konva Circle component
  - Properties: `x, y, radius, fill, stroke, strokeWidth`
  - Selection state with blue border
  - Dragging and boundary constraints
  - Initial radius: 50px

- [x] **10.3: Create Text Component**
  - Files to create: `src/components/Canvas/shapes/Text.tsx`
  - Use Konva Text component
  - Properties: `text, fontSize, fontFamily, textAlign, fill`
  - Default: "Click to edit", fontSize 16px, black fill
  - Double-click to enter edit mode (inline editing)
  - Blur to save and sync to Firestore
  - Handle newlines and multiline text

- [x] **10.4: Create Line Component**
  - Files to create: `src/components/Canvas/shapes/Line.tsx`
  - Use Konva Line component
  - Properties: `points: [x1, y1, x2, y2], stroke, strokeWidth`
  - Start and end circle handles for dragging line endpoints
  - Update parent Shape position to bounding box
  - Default stroke: black, strokeWidth: 2px

- [x] **10.5: Update Shape Rendering**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Create factory function `renderShapeByType(shape, isSelected, callbacks)`
  - Import and render Circle, Text, Line based on type
  - Pass selection, drag, and lock state to each component
  - Handle TypeScript type guards for shape-specific properties

- [x] **10.6: Update Shape Creation UI**
  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Replace single "Add Shape" button with shape type selector
  - Options: Rectangle, Circle, Text, Line (radio buttons or dropdown)
  - Display selected type in UI
  - Create shapes with correct type and default properties

- [x] **10.7: Create Shape Factory**
  - Files to update: `src/services/canvas.ts`
  - Function: `createShapeByType(type, position, userId)` with type-specific defaults
  - Rectangle: 100x100, gray fill
  - Circle: radius 50
  - Text: "Click to edit", fontSize 16
  - Line: [x, y, x+100, y+100] (default line)
  - Return properly typed Shape object

- [x] **10.8: Update Firestore Schema Validation**
  - Files to update: `firestore.rules`
  - Validate `type` field is one of allowed values
  - Validate shape-specific fields are present for correct types
  - Helper function: `isValidShape(shape)` to check all required fields

- [x] **10.9: Test Multiple Shape Types**
  - Create rectangles, circles, text, lines
  - Verify each renders correctly
  - Verify selection and dragging works for each type
  - Verify sync across users
  - Test mixed shape types on same canvas
  - Verify 60 FPS maintained with mixed shapes

**PR Checklist:**
- [x] All 4 shape types render correctly
- [x] Can create each shape type
- [x] Selection and dragging work for all types
- [x] Shape-specific properties stored and synced
- [x] 60 FPS maintained
- [x] TypeScript compilation successful

**Estimated Effort:** 2-3 hours

---

## PR #11: Shape Styling & Colors

**Branch:** `feature/shape-styling`  
**Goal:** Add color picker and styling controls

### Tasks:

- [x] **11.1: Extend Shape Interface**
  - Files to update: `src/utils/types.ts`
  - Add optional fields:
    ```typescript
    fill: string; // hex color (required, default #cccccc)
    stroke?: string; // hex color for border
    strokeWidth?: number; // 1-10px
    opacity?: number; // 0-100
    cornerRadius?: number; // for rectangles only, 0-50
    ```
  - Add defaults for new fields

- [x] **11.2: Create Color Picker Component**
  - Files to create: `src/components/UI/ColorPicker.tsx`
  - Use HTML5 `<input type="color">` as base
  - Display current color swatch
  - Show hex value input field
  - Optional: Preset color palette (user colors)
  - Return hex color string on change

- [x] **11.3: Create Style Property Panel**
  - Files to create: `src/components/Canvas/PropertyPanel.tsx`
  - Show when shape is selected
  - Position: Floating panel on right side or sidebar
  - Controls:
    - Fill color picker (always shown)
    - Stroke color picker + toggle
    - Stroke width slider (1-10px)
    - Opacity slider (0-100%)
    - Corner radius slider (rectangles only, 0-50px)
  - Real-time preview as user adjusts
  - Hide when no shape selected

- [x] **11.4: Integrate Property Panel in Canvas**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Render PropertyPanel when shape selected
  - Pass selected shape ID and update callback
  - Handle TypeScript typing for shape-specific controls

- [x] **11.5: Add Styling Update Handler**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `styleShape(id, styleUpdates)` 
  - Accepts partial style object
  - Calls `updateShape(id, styleUpdates)`
  - Syncs to Firestore with updated styling

- [x] **11.6: Update Shape Components**
  - Files to update: `src/components/Canvas/shapes/Rectangle.tsx`, `Circle.tsx`, `Text.tsx`, `Line.tsx`
  - Apply `fill, stroke, strokeWidth, opacity` from props
  - Apply `cornerRadius` for rectangles
  - Set Konva props: `fill()`, `stroke()`, `strokeWidth()`, `opacity()`

- [x] **11.7: Update Firestore Rules**
  - Files to update: `firestore.rules`
  - Validate `fill` is valid hex color
  - Validate `stroke` is valid hex or null
  - Validate `strokeWidth` is 1-10
  - Validate `opacity` is 0-100
  - Validate `cornerRadius` is 0-50

- [x] **11.8: Test Styling Changes**
  - Create shapes with different colors
  - Verify color changes sync in real-time
  - Test borders and opacity
  - Test corner radius on rectangles
  - Verify styling persists on refresh
  - Test 5+ concurrent users styling shapes

**PR Checklist:**
- [x] Color picker works and saves colors
- [x] Styling changes sync <100ms
- [x] Property panel intuitive and responsive
- [x] All styling properties validated in Firestore rules
- [x] 60 FPS maintained while adjusting styles
- [x] TypeScript compilation successful

**Estimated Effort:** 2-3 hours

---

## PR #12: Shape Transformations (Resize & Rotate)

**Branch:** `feature/shape-transform`  
**Goal:** Add resize and rotation functionality

### Tasks:

- [x] **12.1: Add Transformation Properties to Shape**
  - Files to update: `src/utils/types.ts`
  - Add optional fields:
    ```typescript
    rotation?: number; // degrees 0-360
    scaleX?: number; // 1.0 default
    scaleY?: number; // 1.0 default
    ```
  - Update Shape interface to include these fields

- [x] **12.2: Integrate Konva Transformer**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Import Konva Transformer component
  - Create transformer ref
  - Attach transformer to selected shape
  - Handle `transformend` event to save transformations

- [x] **12.3: Create Transform Handler**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `transformShape(id, rotation, scaleX, scaleY)`
  - Calculate new width/height based on scale
  - Store rotation and scale in shape
  - Sync to Firestore

- [x] **12.4: Update Shape Components for Transforms**
  - Files to update: `src/components/Canvas/shapes/*.tsx`
  - Apply `rotation`, `scaleX`, `scaleY` from shape props
  - Use Konva's `rotation()`, `scaleX()`, `scaleY()` methods

- [x] **12.5: Handle Boundary Constraints During Transform**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - After transform ends, check if shape exceeds canvas bounds
  - If exceeds, clamp to boundaries and re-save
  - Prevent user from scaling off-canvas

- [x] **12.6: Add Rotation Indicator**
  - Files to update: `src/components/Canvas/PropertyPanel.tsx`
  - Show rotation value in degrees (read-only during transform)
  - Display rotation feedback during active transform
  - Show current scale factor (display-only)

- [x] **12.7: Test Transformations**
  - Resize shapes using corner and edge handles
  - Rotate shapes with rotation handle
  - Verify transformations sync in real-time
  - Test boundary constraints (can't resize off canvas)
  - Test with mixed shape types
  - Verify 60 FPS during transforms

- [x] **12.8: Update Firestore Rules**
  - Files to update: `firestore.rules`
  - Validate `rotation` is 0-360
  - Validate `scaleX` and `scaleY` are positive numbers
  - Allow transform updates for unlocked shapes only

**PR Checklist:**
- [x] Resize handles appear on selected shape
- [x] Rotation handle works
- [x] Transformations sync in real-time
- [x] Boundary constraints work correctly
- [x] 60 FPS maintained during transforms
- [x] TypeScript compilation successful

**Estimated Effort:** 2-3 hours

---

## PR #13: Advanced Layout (Multi-Select, Grouping, Alignment)

**Branch:** `feature/advanced-layout`  
**Goal:** Multi-select, grouping, alignment, and layer management

### Tasks:

- [ ] **13.1: Update Canvas Context for Multi-Select**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Change `selectedId: string | null` to `selectedIds: string[]`
  - Update `selectShape(id)` to accept `options: { shift?: boolean }`
  - Shift+click: add/remove from selection
  - Normal click: clear and select single
  - Function: `isSelected(id)` checks if in selectedIds array

- [ ] **13.2: Implement Box Select**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle stage `onMouseDown` on empty area
  - Track drag to create selection rectangle
  - On drag end, select all shapes within rectangle
  - Show visual rectangle during drag
  - Clear when releasing

- [ ] **13.3: Update Shape Selection UI**
  - Files to update: `src/components/Canvas/shapes/*.tsx`
  - Show blue border for all selected shapes (not just one)
  - Handle click to select/deselect
  - Handle Shift+click to toggle in multi-select

- [ ] **13.4: Create Grouping Service**
  - Files to create: `src/services/grouping.ts`
  - Function: `createGroup(canvasId, shapeIds, userId)` - returns group ID
  - Function: `deleteGroup(canvasId, groupId)` - ungroups shapes
  - Store group metadata in Firestore: `groups` subcollection
  - Group contains: `shapeIds, name, x, y, width, height`

- [ ] **13.5: Add Grouping to Canvas Context**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `groupShapes(shapeIds)` - calls grouping service
  - Function: `ungroupShapes(groupId)` - removes group, keeps shapes
  - Keyboard shortcut: Ctrl+G to group selected
  - Keyboard shortcut: Ctrl+Shift+G to ungroup

- [ ] **13.6: Add Alignment Tools**
  - Files to create: `src/components/Canvas/AlignmentTools.tsx`
  - Show when multiple shapes selected
  - Buttons: Align Left, Align Center H, Align Right
  - Buttons: Align Top, Align Center V, Align Bottom
  - Buttons: Distribute H (evenly space horizontally)
  - Buttons: Distribute V (evenly space vertically)

- [ ] **13.7: Implement Alignment Logic**
  - Files to update: `src/services/canvas.ts`
  - Function: `alignShapes(shapeIds, alignType)` where alignType is:
    - 'left', 'centerH', 'right' (horizontal)
    - 'top', 'centerV', 'bottom' (vertical)
  - Calculate bounding box of all shapes
  - Calculate new x positions for each shape
  - Call batch update to Firestore

- [ ] **13.8: Implement Distribution Logic**
  - Files to update: `src/services/canvas.ts`
  - Function: `distributeShapes(shapeIds, direction)` where direction is 'horizontal' or 'vertical'
  - Calculate equal gaps between shapes
  - Adjust positions and sync to Firestore

- [ ] **13.9: Add Layer Management**
  - Files to update: `src/utils/types.ts`
  - Add `zIndex: number` to Shape interface
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `bringForward(shapeId)` - increment zIndex
  - Function: `sendBack(shapeId)` - decrement zIndex
  - Keyboard: Ctrl+] to bring forward, Ctrl+[ to send back
  - Right-click context menu with layer options

- [ ] **13.10: Update Konva Rendering**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Sort shapes by zIndex before rendering
  - Higher zIndex renders on top
  - Update zIndex on each layer operation

- [ ] **13.11: Add Duplicate Feature**
  - Files to create: `src/services/canvas.ts` (add function)
  - Function: `duplicateShape(canvasId, shapeId, userId)` - creates copy with offset
  - Logic:
    - Get original shape from context
    - Create new shape with same properties
    - Offset x and y by 20px (so user sees the duplicate next to original)
    - Generate new ID
    - Sync to Firestore
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `duplicateShape(id)` - calls service function
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add keyboard shortcut: Ctrl+D to duplicate selected shape
  - Add button in PropertyPanel or CanvasControls: "Duplicate"
  - Behavior: Only works if shape is selected and not locked

- [ ] **13.12: Test Advanced Layout Features**
  - Select multiple shapes (click, Shift+click, box select)
  - Group and ungroup shapes
  - Test alignment tools (all 6 directions)
  - Test distribution (horizontal and vertical)
  - Verify grouped shapes move together
  - Test layer operations (bring forward, send back)
  - Test duplicate feature (Ctrl+D duplicates with 20px offset)
  - Verify duplicate syncs to other users
  - Test with 5+ concurrent users
  - Verify 60 FPS maintained

**PR Checklist:**
- [ ] Multi-select works (click, Shift+click, box select)
- [ ] Grouping and ungrouping functional
- [ ] All alignment tools work correctly
- [ ] Distribution spreads shapes evenly
- [ ] Grouped shapes move together
- [ ] Layer management works
- [ ] Duplicate feature works (Ctrl+D)
- [ ] Duplicate syncs in real-time
- [ ] All operations sync in real-time
- [ ] TypeScript compilation successful

**Estimated Effort:** 3-5 hours (includes duplicate)

---

## PR #14: Undo/Redo System

**Branch:** `feature/undo-redo`  
**Goal:** Implement undo/redo stack per user

### Tasks:

- [ ] **14.1: Define History Types**
  - Files to create: `src/utils/history.ts`
  - Type: `HistoryAction` with fields:
    - `type: 'create' | 'delete' | 'update' | 'move' | 'resize' | 'rotate' | 'style' | 'group' | 'ungroup'`
    - `shapesAffected: string[]`
    - `before: Record<string, any>` (previous state)
    - `after: Record<string, any>` (new state)
    - `timestamp: number`
    - `userId: string`
  - Type: `HistoryStack` with fields:
    - `actions: HistoryAction[]`
    - `currentIndex: number` (position in stack)

- [ ] **14.2: Create History Context**
  - Files to create: `src/contexts/HistoryContext.tsx`
  - State: `historyStack: HistoryStack`
  - Functions: `recordAction(action)`, `undo()`, `redo()`
  - Limit stack to 50 actions (remove oldest)
  - Clear redo stack on new action

- [ ] **14.3: Create History Hook**
  - Files to create: `src/hooks/useHistory.ts`
  - Return: `recordAction, undo, redo, canUndo, canRedo`
  - canUndo = currentIndex > 0
  - canRedo = currentIndex < stack.length - 1

- [ ] **14.4: Integrate History in Canvas Context**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Import useHistory hook
  - Call `recordAction` before each Firestore write:
    - `addShape` → record before/after
    - `deleteShape` → record before state
    - `updateShape` → record before/after
    - `moveShape` → record before/after
    - `transformShape` → record before/after
    - `styleShape` → record before/after

- [ ] **14.5: Implement Undo Logic**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `undo()`
  - Get current action from stack
  - Restore `before` state for each affected shape
  - Call Firestore updates without recording history
  - Decrement currentIndex

- [ ] **14.6: Implement Redo Logic**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `redo()`
  - Increment currentIndex
  - Get action at new index
  - Restore `after` state for each affected shape
  - Call Firestore updates without recording history

- [ ] **14.7: Add Keyboard Shortcuts**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Ctrl+Z: Undo
  - Ctrl+Y or Ctrl+Shift+Z: Redo
  - Use `useHistory` hook to get functions
  - Disable shortcuts if canUndo/canRedo is false

- [ ] **14.8: Add Undo/Redo Buttons**
  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Add Undo button (with Ctrl+Z label)
  - Add Redo button (with Ctrl+Y label)
  - Disable when canUndo/canRedo is false
  - Show tooltip on hover: "Undo (Ctrl+Z)", "Redo (Ctrl+Y)"

- [ ] **14.9: Test Undo/Redo**
  - Create shapes → undo → verify deleted
  - Move shape → undo → verify moved back
  - Style shape → undo → verify style reverted
  - Perform multiple actions → undo all
  - Redo after undo
  - Verify redo stack clears on new action
  - Test doesn't undo other users' work (local only)
  - Test 50-action history limit

**PR Checklist:**
- [ ] Undo works for all action types
- [ ] Redo works correctly
- [ ] Redo stack clears on new action
- [ ] 50-action limit enforced
- [ ] Keyboard shortcuts work
- [ ] Only undoes user's own actions
- [ ] Firestore sync works with history
- [ ] TypeScript compilation successful

**Estimated Effort:** 2-3 hours

---

## PR #15: Export & Save

**Branch:** `feature/export-save`  
**Goal:** Export canvas as image or JSON, import from JSON

### Tasks:

- [ ] **15.1: Create Export Service**
  - Files to create: `src/services/export.ts`
  - Function: `exportAsJSON(shapes)` - returns JSON string
  - Function: `exportAsImage(stageRef, filename)` - downloads PNG
  - Function: `exportAsSVG(shapes)` - returns SVG string (optional)

- [ ] **15.2: Implement PNG Export**
  - Files to update: `src/services/export.ts`
  - Use Konva's `stage.toImage()` or `toDataURL()`
  - Create data URL with image
  - Trigger download via `<a>` tag with `href` and `download` attribute
  - Include options dialog: resolution (1x, 2x, 3x), background color

- [ ] **15.3: Implement JSON Export**
  - Files to update: `src/services/export.ts`
  - Serialize shapes array to JSON
  - Include metadata: `title, exportedAt, createdBy, shapeCount`
  - Download as `.collabcanvas.json` file
  - Pretty-print JSON for readability

- [ ] **15.4: Implement JSON Import**
  - Files to create: `src/components/Canvas/ImportDialog.tsx`
  - File input for `.json` file
  - Parse and validate JSON
  - Show preview of shapes to import (count, types)
  - Options: Replace all or append to existing
  - Confirm and load

- [ ] **15.5: Create Export/Import Dialogs**
  - Files to create: `src/components/Canvas/ExportDialog.tsx`
  - Show export format options: JSON, PNG, SVG (optional)
  - Format-specific options (resolution, etc.)
  - Download button
  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Add "Export" and "Import" buttons

- [ ] **15.6: Add Export/Import to Menu**
  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Add Export button → opens ExportDialog
  - Add Import button → opens ImportDialog
  - Keyboard shortcut: Ctrl+E for export, Ctrl+I for import (optional)

- [ ] **15.7: Test Export/Import**
  - Export canvas as JSON → download works
  - Import JSON → shapes load correctly
  - Export as PNG → image downloads
  - Verify exported image matches canvas
  - Import and append (vs replace)
  - Test with various shape types and styling

**PR Checklist:**
- [ ] Export as JSON works
- [ ] Export as PNG works
- [ ] Import from JSON works
- [ ] File downloads work in all browsers
- [ ] JSON validation prevents corrupted imports
- [ ] Dialog UX is intuitive
- [ ] TypeScript compilation successful

**Estimated Effort:** 1-2 hours

---

## PR #16: AI Canvas Agent

**Branch:** `feature/ai-agent`  
**Goal:** Natural language design commands via Claude API

### Tasks:

- [ ] **16.1: Set Up Claude API Integration**
  - Install: `npm install @anthropic-ai/sdk`
  - Files to create: `src/services/ai.ts`
  - Function: `callClaudeWithFunctions(userCommand, canvasState)`
  - Initialize Anthropic client with API key
  - Handle errors and rate limiting

- [ ] **16.2: Define Canvas API Schema**
  - Files to update: `src/services/ai.ts`
  - Create tool definitions for Claude:
    ```typescript
    const tools = [
      {
        name: 'createShape',
        description: 'Create a new shape on the canvas',
        input_schema: { ... }
      },
      {
        name: 'updateShape',
        description: 'Update shape properties',
        input_schema: { ... }
      },
      // ... more tools
    ];
    ```
  - Include: createShape, deleteShape, moveShape, resizeShape, rotateShape, styleShape, groupShapes, alignShapes, distributeShapes

- [ ] **16.3: Implement Tool Execution**
  - Files to update: `src/services/ai.ts`
  - Function: `executeToolCall(toolName, toolInput, canvasService)`
  - Map each tool name to corresponding canvas service function
  - Validate inputs before executing
  - Collect results from each tool call
  - Return execution results to Claude for validation

- [ ] **16.4: Create AI Prompt System**
  - Files to create: `src/utils/ai-prompts.ts`
  - System prompt: Expert UI designer assisting with canvas creation
  - Include guidelines:
    - Canvas center: 2500, 2500
    - Reasonable defaults (shape size 100x100, spacing 50px)
    - Break complex commands into steps
    - Acknowledge what you're creating before executing
  - Few-shot examples for complex commands

- [ ] **16.5: Create AI Agent Loop**
  - Files to create: `src/services/ai.ts`
  - Function: `runAIAgent(userCommand, canvasState, callbacks)`
  - Send command + function schema to Claude
  - Claude returns plan + tool calls
  - Execute each tool call with error handling
  - Iterate: if Claude requests more info, respond
  - Return final results

- [ ] **16.6: Create AI Input Component**
  - Files to create: `src/components/Canvas/AIInput.tsx`
  - Input field: "What would you like to create?"
  - Send button or Enter key to submit
  - Loading state during AI processing
  - Disable input while processing
  - Show AI response/status

- [ ] **16.7: Create AI Response Display**
  - Files to create: `src/components/Canvas/AIResponse.tsx`
  - Show AI's interpretation of command
  - Show step-by-step execution progress
  - Show results after completion
  - Undo button for last AI command
  - Error display if something fails

- [ ] **16.8: Integrate AI into Canvas**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add AIInput component above or below canvas
  - Connect to useCanvas hook for shape operations
  - Real-time updates as AI creates shapes
  - Error handling and user feedback

- [ ] **16.9: Add AI Development Log**
  - Files to create: `AI_DEVELOPMENT_LOG.md`
  - Document:
    - Tools used for AI coding
    - Effective prompting strategies (3-5 examples)
    - Code generation stats (% AI vs hand-written)
    - Strengths and limitations of AI
    - Key learnings

- [ ] **16.10: Test AI Agent**
  - Test single-step commands:
    - "Create a red circle at center" → verify shape created
    - "Add text that says 'Hello'" → verify text created
  - Test multi-step commands:
    - "Create a login form" → verify form created with fields
    - "Make a navigation bar with 4 items" → verify nav created
  - Verify execution <2 seconds for single-step
  - Verify execution <3 seconds for multi-step
  - Test all users see AI-created shapes in real-time
  - Test error handling (invalid commands, failed API)

**PR Checklist:**
- [ ] Claude API integration works
- [ ] Tool schema correctly defined
- [ ] Tool execution works for all operations
- [ ] AI input component functional
- [ ] Single-step commands <2 seconds
- [ ] Multi-step commands <3 seconds
- [ ] All users see AI creations in real-time
- [ ] Error handling robust
- [ ] AI Development Log completed
- [ ] TypeScript compilation successful

**Estimated Effort:** 4-6 hours

---

## PR #17: Polish & Performance Optimization

**Branch:** `fix/polish-performance`  
**Goal:** Visual polish, animations, and performance optimization

### Tasks:

- [ ] **17.1: Add Shape Creation Animation**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - When shape created, animate scale from 0 to 1 (200ms)
  - Smooth easing: ease-out
  - Use Konva animations or CSS transitions

- [ ] **17.2: Add Shape Deletion Animation**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - When shape deleted, animate scale to 0 and fade out (200ms)
  - Then remove from DOM
  - Smooth easing: ease-out

- [ ] **17.3: Enhance Hover Effects**
  - Files to update: `src/components/Canvas/shapes/*.tsx`
  - Subtle shadow or glow on hover
  - Cursor changes to pointer
  - Apply to all interactive elements

- [ ] **17.4: Add Smooth Transitions**
  - Files to update: CSS and Tailwind classes
  - Use `transition` classes on color/opacity changes
  - Use Konva animations for canvas transforms
  - 100-200ms duration for smooth feel

- [ ] **17.5: Create Help Modal**
  - Files to create: `src/components/Canvas/HelpModal.tsx`
  - Show keyboard shortcuts:
    - Pan: Drag
    - Zoom: Mousewheel
    - Select: Click
    - Multi-select: Shift+Click
    - Box select: Drag on empty area
    - Delete: Delete/Backspace
    - Group: Ctrl+G
    - Ungroup: Ctrl+Shift+G
    - Undo: Ctrl+Z
    - Redo: Ctrl+Y
    - Forward: Ctrl+]
    - Back: Ctrl+[
  - Accessible via Help button in navbar
  - Keyboard shortcut: ? to open

- [ ] **17.6: Add Loading Spinners**
  - Files to update: `src/components/UI/Spinner.tsx`
  - Use Tailwind's `animate-spin`
  - Show during:
    - Initial canvas load
    - Firestore sync in progress
    - AI agent processing
    - Image export

- [ ] **17.7: Optimize Konva Performance**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Implement shape caching for non-moving shapes
  - Use `cache()` and `clearCache()` on Konva components
  - Lazy-load shapes (only render visible area - optional)
  - Monitor FPS during rendering

- [ ] **17.8: Optimize Firestore Queries**
  - Files to update: `src/hooks/useCanvas.ts`, `src/services/canvas.ts`
  - Add Firestore indexes for common queries
  - Batch writes when possible (5-10 updates per batch)
  - Implement debouncing for frequent updates (e.g., dragging)

- [ ] **17.9: Monitor Bundle Size**
  - Run: `npm run build`
  - Check bundle size: target <500KB gzipped
  - Identify and tree-shake unused dependencies
  - Document any large dependencies

- [ ] **17.10: Performance Testing**
  - Create 500 shapes → verify 60 FPS
  - Drag many shapes simultaneously → verify smooth
  - Zoom in/out rapidly → verify smooth
  - Test with 5+ concurrent users → verify responsive
  - Monitor Firestore read/write counts

**PR Checklist:**
- [ ] Shape creation/deletion animations smooth
- [ ] Hover effects on all interactive elements
- [ ] Help modal with all shortcuts
- [ ] Keyboard shortcuts reference complete
- [ ] Loading spinners display correctly
- [ ] 500+ shapes maintain 60 FPS
- [ ] Bundle size <500KB gzipped
- [ ] Firestore costs reasonable (<$15/month)
- [ ] TypeScript compilation successful

**Estimated Effort:** 2-3 hours

---

## Development Sequence Recommendation

**Phase 2a-2c (Shapes & Styling):**
Complete PRs 10-12 before moving to layout. These are the foundation.
- Order: #10 → #11 → #12
- Estimated total: 6-8 hours
- Deliverable: Full shape ecosystem with styling and transforms

**Phase 2d-2e (Layout & History):**
Complete PRs 13-14 for advanced editing capabilities.
- Order: #13 → #14
- Estimated total: 5-7 hours
- Deliverable: Professional layout tools + undo/redo

**Phase 2f-2g (Export & AI):**
Complete PRs 15-16 for extended features.
- Order: #15 → #16
- Estimated total: 5-8 hours
- Deliverable: Export capability + AI agent

**Phase 2h (Polish):**
Final PR #17 for polish and optimization.
- Estimated: 2-3 hours
- Deliverable: Production-ready polish

**Total Phase 2 Timeline:**
- Sequential approach: 22-32 hours
- Parallel approach (if team): 12-16 hours (1-2 weeks full-time)
- Part-time approach (8hrs/week): 3-4 weeks

---

## Testing Strategy Across Phase 2

### Unit Tests (Per PR)
- Add `*.test.tsx` for each new component
- Test in isolation with mock props
- Quick feedback loop

### Integration Tests
- Test with 2-5 concurrent users
- Test real-time sync for each feature
- Test with mixed shape types
- Performance test: 500+ shapes

### Manual Testing Checklist (Each PR)
- [ ] Feature works locally (dev server)
- [ ] TypeScript compilation: `npm run type-check`
- [ ] Linting passes
- [ ] 60 FPS maintained (check devtools)
- [ ] Feature syncs across browsers
- [ ] Feature persists on refresh
- [ ] Error states handled gracefully
- [ ] No console errors or warnings

### Deployment Testing
- [ ] Deploy to staging/preview
- [ ] Test with 5+ concurrent users
- [ ] Monitor Firestore costs
- [ ] Check performance metrics
- [ ] Verify all features work in production

---

## Known Challenges & Solutions

### Challenge 1: Multi-Shape Rendering Performance
**Problem:** Drawing 500 mixed shapes (rectangles, circles, text) might impact FPS

**Solution:**
- Use Konva's built-in caching
- Cache static shapes, invalidate on update
- Consider lazy-loading offscreen shapes (stretch goal)
- Monitor with Chrome DevTools Rendering tab

### Challenge 2: AI Token Costs
**Problem:** Calling Claude API frequently could accumulate costs

**Solution:**
- Claude input tokens: $0.003 per 1K tokens
- Typical command: 100-500 tokens → $0.0003-0.0015 per call
- Budget: 1000 AI commands/month = ~$1
- Implement user-facing cost warning if desired
- Consider rate limiting (1 command per 2 seconds)

### Challenge 3: Firestore Write Limits
**Problem:** At high concurrency, write volume could spike costs

**Solution:**
- Each shape operation = 1 write
- 5 users × 10 operations/min = 50 writes/min
- Free tier: 20K writes/day = ~14 writes/min
- At MVP scale: Should be fine
- Implement batch writes for high-frequency ops (dragging)
- Monitor usage: `firebase > Project Settings > Firestore > Usage`

### Challenge 4: Real-Time Sync Conflicts
**Problem:** Multiple users editing grouped shapes simultaneously

**Solution:**
- Maintain object locks during group operations
- Don't allow ungrouping if any child is locked
- First-come locking (already implemented)
- Clear documentation for users

### Challenge 5: AI Hallucination
**Problem:** AI might create invalid shapes or nonsensical layouts

**Solution:**
- Validate all tool inputs before execution
- Show AI's interpretation to user before executing
- Implement undo (PR #14) so users can revert bad AI
- Test prompts with edge cases
- Add feedback mechanism: "This worked well" / "This didn't help"

---

## Success Criteria for Phase 2 Completion

### Feature Completeness
- [x] 4 shape types fully implemented
- [x] Styling (colors, borders, opacity) working
- [x] Resize and rotate functional
- [x] Multi-select, grouping, alignment complete
- [x] Undo/redo working for all actions
- [x] Export/import functional
- [x] AI agent responding to 6+ command types

### Performance
- [x] 60 FPS with 500 mixed shapes
- [x] Shape creation <100ms sync
- [x] Cursor updates <50ms
- [x] Single-step AI commands <2 seconds
- [x] Multi-step AI commands <3 seconds

### Real-Time Collaboration
- [x] 5+ concurrent users without degradation
- [x] All features sync in real-time
- [x] No data loss or race conditions
- [x] Smooth multiplayer experience

### Quality
- [x] TypeScript: 100% type coverage (no `any` in critical paths)
- [x] Testing: Unit + integration tests passing
- [x] Error handling: User-friendly error messages
- [x] Documentation: Updated README, API docs
- [x] Deployment: Works on Firebase Hosting

### Cost & Scalability
- [x] Firestore costs <$15/month at typical usage
- [x] Bundle size <500KB gzipped
- [x] Can scale to 50+ concurrent users
- [x] No critical scaling issues identified

---

## Rollback & Risk Management

### If a Feature Breaks Production

1. **Identify the Problem**
   - Check Firebase console for errors
   - Review Firestore rules for permission issues
   - Check browser console for client errors

2. **Immediate Rollback**
   - Revert PR on main branch
   - Redeploy: `npm run build && firebase deploy`
   - Should be live within 2 minutes

3. **Post-Mortem**
   - What went wrong?
   - How do we prevent this?
   - Update testing checklist

### High-Risk PRs Requiring Extra Testing

- PR #13 (Advanced Layout) - Complex multi-select logic
- PR #16 (AI Agent) - External API dependency
- PR #17 (Performance) - Low-level optimizations

For these, test extra thoroughly before merge:
- Add integration tests
- Test with 10+ concurrent users
- Get manual QA approval

---

## Next Steps After Phase 2

### Phase 3: Dashboard & Multi-Canvas

- User dashboard with canvas list
- Create/delete/rename canvases
- Canvas thumbnails and metadata
- Share canvas with others (link-based)

### Phase 3b: Advanced Features

- Comments and annotations
- Design templates
- Asset library
- Collaborative cursors filtering by canvas
- Real-time presence awareness

### Phase 3c: Performance & Analytics

- User analytics (anonymous)
- Performance monitoring
- Error tracking (Sentry)
- Bandwidth optimization

### Phase 4: Mobile

- Responsive design for tablets
- Touch gestures (pinch-to-zoom, two-finger drag)
- Mobile-optimized UI
- Offline sync

---

## Resources & References

### Documentation
- [Konva.js Docs](https://konvajs.org/docs/)
- [Firebase Console](https://console.firebase.google.com/)
- [Claude API Docs](https://docs.anthropic.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Docs](https://react.dev/)

### Tools
- Chrome DevTools (Rendering tab for FPS monitoring)
- Firebase Console (Usage, Security Rules)
- Claude API Playground (test prompts)
- Vercel Analytics (if deployed there)

### Similar Projects (Inspiration)
- Figma (collaborative canvas)
- Tldraw (whiteboard)
- Excalidraw (quick sketching)
- Miro (infinite canvas)

---

**End of Phase 2 Task List**