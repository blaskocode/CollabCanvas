# Canvas UX Enhancements - Implementation Plan

## Overview
Split into 4 pull requests with clear dependencies and subtasks for implementation tracking.

---

## PR #1: UI Layout & Panning UX Improvements ⚡
**Priority**: HIGH (Quick wins)  
**Estimated Time**: 50 minutes  
**Dependencies**: None  
**Files**: `CanvasControls.tsx`, `Canvas.tsx`

### Goal
Improve control panel layout and fix panning interaction issues.

### Subtasks

#### 1.1: Horizontal Zoom Controls Layout (20 min)
**File**: `CanvasControls.tsx` (lines 162-200)

- [ ] Replace vertical `space-y-2` div with horizontal `flex gap-2`
- [ ] Update all 3 zoom buttons to use `flex-1` class
- [ ] Reduce button padding: `px-2 py-2` instead of `px-4 py-3`
- [ ] Reduce text size: `text-xs` instead of `text-sm`
- [ ] Reduce icon size: `w-4 h-4` instead of `w-5 h-5`
- [ ] Test layout at different panel widths
- [ ] Verify all buttons remain clickable

**Code**:
```tsx
<div className="flex gap-2">
  <button onClick={onZoomIn} disabled={!canZoomIn}
    className="flex-1 px-2 py-2 text-xs font-semibold ...">
    <svg className="w-4 h-4" ... />
    <span>Zoom In</span>
  </button>
  <button onClick={onZoomOut} disabled={!canZoomOut}
    className="flex-1 px-2 py-2 text-xs font-semibold ...">
    <svg className="w-4 h-4" ... />
    <span>Zoom Out</span>
  </button>
  <button onClick={onResetView}
    className="flex-1 px-2 py-2 text-xs font-semibold ...">
    <svg className="w-4 h-4" ... />
    <span>Reset</span>
  </button>
</div>
```

#### 1.2: Move Help Text to Top (15 min)
**File**: `CanvasControls.tsx` (lines 743-760 → ~100)

- [ ] Cut entire help text section (lines 743-760)
- [ ] Paste after zoom level display, before zoom buttons (~line 160)
- [ ] Change "Drag to pan" → "Spc + drag to pan"
- [ ] Remove bottom border from help text div
- [ ] Add bottom border/divider after help text
- [ ] Verify visual hierarchy: Help → Zoom Level → Zoom Buttons

**Code**:
```tsx
{/* Help Text - Moved to Top */}
<div className="text-xs text-gray-600 text-center space-y-1 pb-3">
  <div className="flex items-center justify-center space-x-2">
    <svg className="w-3 h-3" ... />
    <span className="font-medium">Spc + drag to pan</span>
  </div>
  <div className="flex items-center justify-center space-x-2">
    <svg className="w-3 h-3" ... />
    <span className="font-medium">Scroll to zoom</span>
  </div>
</div>
<div className="border-t border-gray-200 mb-3" role="separator"></div>
```

#### 1.3: Disable Shape Selection While Panning (15 min)
**File**: `Canvas.tsx` (lines ~2040, ~2700)

- [ ] Find shape onClick handler in renderShape function (~line 2040)
- [ ] Add `if (isSpacePressed) return;` at start of onClick
- [ ] Find stage onClick handler (~line 2700)
- [ ] Add same check to stage onClick
- [ ] Test: Hold Space + click shapes → no selection
- [ ] Test: Release Space + click → selection works

**Code**:
```tsx
// In shape rendering (~line 2040)
onClick: (e: any) => {
  if (isSpacePressed) {
    return; // Ignore clicks during panning
  }
  handleShapeClick(e, shape.id);
}

// In stage click handler (~line 2700)
onClick={(e) => {
  if (isSpacePressed) return;
  // ... existing click logic
}}
```

### Testing Checklist
- [ ] Zoom buttons display in horizontal row
- [ ] All 3 buttons visible and clickable
- [ ] Help text shows "Spc + drag to pan" at top
- [ ] Space + click doesn't select shapes
- [ ] Normal selection works after releasing Space
- [ ] Layout responsive at different sizes

---

## PR #2: Distance-Based Snap Alignment Priority 🎯
**Priority**: MEDIUM  
**Estimated Time**: 30 minutes  
**Dependencies**: None  
**Files**: `snapping.ts`

### Goal
Prioritize snap guides by distance so closest snap wins (enables easy edge-to-edge touching).

### Subtasks

#### 2.1: Add Distance Calculation Helper (15 min)
**File**: `snapping.ts` (after line 150 in `findAlignmentGuides`)

- [ ] Define helper function inside `findAlignmentGuides`
- [ ] Calculate distance based on guide type and alignmentType
- [ ] Use existing edge position variables (movingLeft, movingRight, etc.)
- [ ] Return Infinity for invalid alignmentType (safety)

**Code**:
```tsx
const getGuideDistance = (
  guide: AlignmentGuide, 
  movingShape: { x: number; y: number; width?: number; height?: number; type?: string; radius?: number }
): number => {
  if (guide.type === 'vertical') {
    if (guide.alignmentType === 'left') return Math.abs(guide.position - movingLeft);
    if (guide.alignmentType === 'centerX') return Math.abs(guide.position - movingCenterX);
    if (guide.alignmentType === 'right') return Math.abs(guide.position - movingRight);
  } else if (guide.type === 'horizontal') {
    if (guide.alignmentType === 'top') return Math.abs(guide.position - movingTop);
    if (guide.alignmentType === 'centerY') return Math.abs(guide.position - movingCenterY);
    if (guide.alignmentType === 'bottom') return Math.abs(guide.position - movingBottom);
  }
  return Infinity;
};
```

#### 2.2: Sort Guides by Distance (15 min)
**File**: `snapping.ts` (line ~147, after duplicate removal)

- [ ] After uniqueGuides filter, sort by distance
- [ ] Use helper function to get distances
- [ ] Return sorted array (closest first)
- [ ] Test: Drag shape near multiple alignment points
- [ ] Verify closest snap is chosen

**Code**:
```tsx
// After removing duplicates (line ~147)
const sortedGuides = uniqueGuides.sort((a, b) => {
  const distA = getGuideDistance(a, movingShape);
  const distB = getGuideDistance(b, movingShape);
  return distA - distB;
});

return sortedGuides;
```

### Testing Checklist
- [ ] Drag shape near 2+ alignment points
- [ ] Closest snap is always chosen
- [ ] Edge-to-edge touching works smoothly
- [ ] No regression in existing behavior
- [ ] Same-edge and cross-edge snaps both work

---

## PR #3: Arrow Key Movement with Batched History ⌨️
**Priority**: HIGH (Complex feature)  
**Estimated Time**: 1.5 hours  
**Dependencies**: None  
**Files**: `Canvas.tsx`, `CanvasContext.tsx`

### Goal
Enable precise 1px arrow key movement for shapes with batched undo history.

### Subtasks

#### 3.1: Add Arrow Key State Management (10 min)
**File**: `Canvas.tsx` (top of component, with other refs)

- [ ] Add `arrowKeyTimerRef` for debounce timer
- [ ] Add `arrowKeyCumulativeDeltaRef` to track total dx/dy
- [ ] Add `arrowKeyShapeIdsRef` to track which shapes are moving
- [ ] Add `arrowKeyOriginalPositionsRef` to store starting positions

**Code**:
```tsx
const arrowKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const arrowKeyCumulativeDeltaRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
const arrowKeyShapeIdsRef = useRef<string[]>([]);
const arrowKeyOriginalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
```

#### 3.2: Add Arrow Key Detection (10 min)
**File**: `Canvas.tsx` (in existing handleKeyDown, ~line 263)

- [ ] Check for arrow keys: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
- [ ] Prevent default browser scrolling
- [ ] Get selected shape IDs (single, multi-select, or group)
- [ ] Return early if no shapes selected
- [ ] Calculate dx/dy deltas
- [ ] Call handleArrowKeyMove

**Code**:
```tsx
// In existing handleKeyDown function (~line 263)
// Arrow key movement (1px precision)
if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
  e.preventDefault();
  
  // Determine which shapes to move
  const shapeIdsToMove: string[] = [];
  if (selectedId) shapeIdsToMove.push(selectedId);
  if (selectedIds.length > 0) shapeIdsToMove.push(...selectedIds);
  
  if (shapeIdsToMove.length === 0) return;
  
  const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
  const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
  
  handleArrowKeyMove(shapeIdsToMove, dx, dy);
}
```

#### 3.3: Implement handleArrowKeyMove (30 min)
**File**: `Canvas.tsx` (new function, add to component)

- [ ] Store original positions on first move (when timer is null)
- [ ] Accumulate dx/dy deltas
- [ ] Move shapes immediately via context function
- [ ] Clear existing timer if present
- [ ] Set new 1-second timer
- [ ] On timer complete: save to history and reset state

**Code**:
```tsx
const handleArrowKeyMove = useCallback((shapeIds: string[], dx: number, dy: number) => {
  // Store original positions on first move
  if (arrowKeyTimerRef.current === null) {
    arrowKeyOriginalPositionsRef.current.clear();
    shapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        arrowKeyOriginalPositionsRef.current.set(id, { x: shape.x, y: shape.y });
      }
    });
    arrowKeyShapeIdsRef.current = shapeIds;
  }
  
  // Accumulate deltas
  arrowKeyCumulativeDeltaRef.current.dx += dx;
  arrowKeyCumulativeDeltaRef.current.dy += dy;
  
  // Move shapes immediately (optimistic)
  moveShapesByArrowKey(shapeIds, dx, dy);
  
  // Clear existing timer
  if (arrowKeyTimerRef.current) {
    clearTimeout(arrowKeyTimerRef.current);
  }
  
  // Set new timer (1 second)
  arrowKeyTimerRef.current = setTimeout(() => {
    const totalDx = arrowKeyCumulativeDeltaRef.current.dx;
    const totalDy = arrowKeyCumulativeDeltaRef.current.dy;
    const movedShapeIds = arrowKeyShapeIdsRef.current;
    const originalPositions = new Map(arrowKeyOriginalPositionsRef.current);
    
    // Save to history
    saveArrowKeyMovementToHistory(movedShapeIds, totalDx, totalDy, originalPositions);
    
    // Reset state
    arrowKeyTimerRef.current = null;
    arrowKeyCumulativeDeltaRef.current = { dx: 0, dy: 0 };
    arrowKeyShapeIdsRef.current = [];
    arrowKeyOriginalPositionsRef.current.clear();
  }, 1000);
}, [shapes, moveShapesByArrowKey, saveArrowKeyMovementToHistory]);
```

#### 3.4: Add Movement Function to Context (20 min)
**File**: `CanvasContext.tsx` (new function, export in context)

- [ ] Create `moveShapesByArrowKey` function
- [ ] For each shape: calculate new position with boundary checks
- [ ] Apply optimistic updates (skip history)
- [ ] Update Firestore with debouncing
- [ ] Export function from context

**Code**:
```tsx
const moveShapesByArrowKey = useCallback((shapeIds: string[], dx: number, dy: number) => {
  if (!canvasId) return;
  
  shapeIds.forEach(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Calculate new position with boundary constraints
    const newX = Math.max(0, Math.min(CANVAS_WIDTH - (shape.width || 100), shape.x + dx));
    const newY = Math.max(0, Math.min(CANVAS_HEIGHT - (shape.height || 100), shape.y + dy));
    
    // Apply optimistic update (skipHistory = true)
    updateShape(shapeId, { x: newX, y: newY }, true);
  });
}, [canvasId, shapes, updateShape]);
```

#### 3.5: Add History Save Function (20 min)
**File**: `CanvasContext.tsx` (new function, export in context)

- [ ] Create `saveArrowKeyMovementToHistory` function
- [ ] Return early if no movement (dx=0 and dy=0)
- [ ] Create before/after state arrays
- [ ] Add to history with custom action type
- [ ] Export function from context

**Code**:
```tsx
const saveArrowKeyMovementToHistory = useCallback((
  shapeIds: string[], 
  totalDx: number, 
  totalDy: number,
  originalPositions: Map<string, { x: number; y: number }>
) => {
  if (!canvasId || (totalDx === 0 && totalDy === 0)) return;
  
  const beforeState = shapeIds.map(id => {
    const orig = originalPositions.get(id);
    const shape = shapes.find(s => s.id === id);
    return { 
      shapeId: id, 
      x: orig?.x ?? shape?.x ?? 0, 
      y: orig?.y ?? shape?.y ?? 0 
    };
  });
  
  const afterState = shapeIds.map(id => {
    const shape = shapes.find(s => s.id === id);
    return { 
      shapeId: id, 
      x: shape?.x ?? 0, 
      y: shape?.y ?? 0 
    };
  });
  
  addToHistory({
    type: 'arrow-key-move',
    before: beforeState,
    after: afterState,
    timestamp: Date.now()
  });
}, [canvasId, shapes, addToHistory]);
```

#### 3.6: Export Functions from Context (5 min)
**File**: `CanvasContext.tsx` (CanvasContextType interface and return statement)

- [ ] Add functions to `CanvasContextType` interface
- [ ] Add functions to context provider return value
- [ ] Verify TypeScript types are correct

### Testing Checklist
- [ ] Single shape moves 1px per arrow press
- [ ] Multi-select moves all shapes together
- [ ] Grouped shapes move as unit
- [ ] Rapid key presses don't cause race conditions
- [ ] Undo groups 10+ movements into one action
- [ ] Shapes stay within canvas bounds
- [ ] Movement bypasses grid/guide snapping
- [ ] Arrow keys don't work while editing text (INPUT/TEXTAREA)
- [ ] Arrow keys don't move connections

---

## PR #4: AI Agent Summary Toast Notification 🤖
**Priority**: MEDIUM  
**Estimated Time**: 1 hour  
**Dependencies**: None  
**Files**: `ai.ts`, `AIInput.tsx`

### Goal
Show toast notification summarizing created shapes after AI execution completes.

### Subtasks

#### 4.1: Track Created Shapes (10 min)
**File**: `ai.ts` (in `executeAICanvas` function, at start)

- [ ] Add `createdShapes` array to track all created shapes
- [ ] After each `createShape` execution, push to array
- [ ] Capture type, color, and optional name/text

**Code**:
```tsx
// At start of executeAICanvas function
const createdShapes: Array<{ type: string; color: string; name?: string }> = [];

// After each createShape execution
if (functionName === 'createShape') {
  const shapeType = args.type;
  const shapeColor = args.fill || '#cccccc';
  const shapeName = args.text || undefined;
  
  createdShapes.push({ 
    type: shapeType, 
    color: shapeColor,
    name: shapeName
  });
}
```

#### 4.2: Implement Color Name Mapper (10 min)
**File**: `ai.ts` (new helper function above `executeAICanvas`)

- [ ] Create `getColorName` function
- [ ] Map common hex colors to friendly names
- [ ] Return hex if no match found

**Code**:
```tsx
const getColorName = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#ff0000': 'Red',
    '#00ff00': 'Green',
    '#0000ff': 'Blue',
    '#ffff00': 'Yellow',
    '#ff00ff': 'Magenta',
    '#00ffff': 'Cyan',
    '#808080': 'Gray',
    '#60a5fa': 'Blue',
    '#34d399': 'Green',
    '#f87171': 'Red',
    '#fbbf24': 'Yellow',
    '#a78bfa': 'Purple',
    '#fb923c': 'Orange',
    '#ec4899': 'Pink',
    '#14b8a6': 'Teal',
    '#cccccc': 'Light Gray',
  };
  return colorMap[hex.toLowerCase()] || hex;
};
```

#### 4.3: Implement Shape Type Formatter (10 min)
**File**: `ai.ts` (new helper function above `executeAICanvas`)

- [ ] Create `getShapeTypeName` function
- [ ] Map all 22 shape types to display names
- [ ] Fallback to capitalized type name

**Code**:
```tsx
const getShapeTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'rectangle': 'Rectangle',
    'circle': 'Circle',
    'text': 'Text',
    'line': 'Line',
    'process': 'Process Box',
    'decision': 'Decision Diamond',
    'startEnd': 'Start/End Oval',
    'document': 'Document',
    'database': 'Database',
    'triangle': 'Triangle',
    'rightTriangle': 'Right Triangle',
    'hexagon': 'Hexagon',
    'octagon': 'Octagon',
    'ellipse': 'Ellipse',
    'button': 'Button',
    'textInput': 'Text Input',
    'textarea': 'Textarea',
    'dropdown': 'Dropdown',
    'checkbox': 'Checkbox',
    'radio': 'Radio Button',
    'toggle': 'Toggle',
    'slider': 'Slider',
  };
  return typeMap[type] || (type.charAt(0).toUpperCase() + type.slice(1));
};
```

#### 4.4: Implement Summary Formatter (15 min)
**File**: `ai.ts` (new helper function above `executeAICanvas`)

- [ ] Create `formatShapeSummary` function
- [ ] Group shapes by type and color
- [ ] Count duplicates
- [ ] Format as multi-line string
- [ ] Include shape names if present

**Code**:
```tsx
const formatShapeSummary = (shapes: Array<{ type: string; color: string; name?: string }>): string => {
  if (shapes.length === 0) return '';
  
  // Group by type and color
  const grouped = shapes.reduce((acc, shape) => {
    const key = `${shape.type}|${shape.color}`;
    if (!acc[key]) {
      acc[key] = { 
        type: shape.type, 
        color: shape.color, 
        count: 0, 
        names: [] as string[] 
      };
    }
    acc[key].count++;
    if (shape.name) acc[key].names.push(shape.name);
    return acc;
  }, {} as Record<string, { type: string; color: string; count: number; names: string[] }>);
  
  // Format as list
  return Object.values(grouped)
    .map(item => {
      const colorName = getColorName(item.color);
      const typeName = getShapeTypeName(item.type);
      const plural = item.count > 1 ? 's' : '';
      const nameStr = item.names.length > 0 ? ` (${item.names.join(', ')})` : '';
      return `- ${item.count} ${colorName} ${typeName}${plural} (${item.color})${nameStr}`;
    })
    .join('\n');
};
```

#### 4.5: Return Summary from AI Service (5 min)
**File**: `ai.ts` (end of `executeAICanvas` function)

- [ ] Format summary at end of function
- [ ] Add summary to return object
- [ ] Update return type if needed

**Code**:
```tsx
// At end of executeAICanvas function
const summary = formatShapeSummary(createdShapes);

return { 
  success: true, 
  message: aiResponse, 
  summary: summary || undefined // Only include if not empty
};
```

#### 4.6: Display Toast in AIInput (10 min)
**File**: `AIInput.tsx` (in AI execution handler, after success)

- [ ] After successful AI execution, check for summary
- [ ] Call toast.success with summary
- [ ] Set duration to 8000ms (8 seconds)
- [ ] Apply pre-line styling for multi-line display
- [ ] Set max-width for readability

**Code**:
```tsx
// After AI execution completes successfully
const result = await executeAICanvas(/* ... */);

if (result.success) {
  // Show regular success message
  toast.success(result.message);
  
  // Show summary toast if shapes were created
  if (result.summary) {
    toast.success(
      `Created:\n${result.summary}`,
      { 
        duration: 8000,
        style: { 
          whiteSpace: 'pre-line',
          maxWidth: '500px',
          textAlign: 'left'
        }
      }
    );
  }
}
```

### Testing Checklist
- [ ] Toast appears after AI creates shapes
- [ ] Summary includes count, color name, and shape type
- [ ] Hex color code shown in parentheses
- [ ] Multi-line format is readable
- [ ] Toast persists for 8 seconds
- [ ] No toast if AI creates 0 shapes
- [ ] Multiple shapes of same type/color are grouped
- [ ] Shape names/text are included when present
- [ ] Toast has reasonable width (doesn't stretch screen)

---

## Implementation Order

### Recommended Execution Sequence:
1. **PR #1** (50 min) - Quick UI wins, immediate value
2. **PR #2** (30 min) - Independent improvement, easy to test
3. **PR #4** (1 hour) - Independent feature, good user feedback
4. **PR #3** (1.5 hours) - Most complex, do last with full focus

### Total Estimated Time: 3-4 hours

---

## Edge Cases to Handle

### Arrow Key Movement:
- Arrow keys while editing text (INPUT/TEXTAREA): Don't move shape
- Arrow keys with no selection: No action
- Arrow keys for connections: No movement (connections auto-update)
- Rapid undo during arrow key timer: Cancel pending history save
- Multi-user arrow key movements: Last write wins (existing behavior)

### Snap Alignment:
- Multiple guides at exact same distance: Use first in array
- No guides found: No snapping (existing behavior)

### AI Summary:
- AI creates 0 shapes: Don't show summary toast
- AI creates 20+ shapes: Group by type/color to keep summary readable
- AI modifies existing shapes: Don't include in summary (only track creates)

### UI Layout:
- Very small screen width: Zoom buttons may wrap (acceptable)
- Very long panel: Scrolling should work (already implemented)

---

## Dependencies

### No External Dependencies:
All PRs are independent and can be implemented in parallel if desired.

### Internal Dependencies:
- All features use existing `useToast` hook
- Arrow key movement uses existing `useCanvasContext` and `useHistory`
- Snap alignment modifies existing `snapping.ts` utilities
- All features respect existing keyboard shortcuts (don't conflict)

