# PR#10 Testing Guide: Multiple Shape Types

## Quick Start
The dev server is now running. Open your browser to test the new features.

## Visual Testing Steps

### 1. Shape Type Selector (1 minute)
1. Look at the right-side control panel
2. You should see a 2x2 grid with 4 shape type buttons:
   - Rectangle (top-left)
   - Circle (top-right)
   - Text (bottom-left)
   - Line (bottom-right)
3. Click each button and verify it highlights with a green border
4. The "Add Shape" button text should change to match the selected type

### 2. Create Each Shape Type (2 minutes)
**Rectangle:**
- Select "Rectangle"
- Click "Add Rectangle"
- Should create a gray 100x100 rectangle at viewport center

**Circle:**
- Select "Circle"
- Click "Add Circle"
- Should create a gray circle with 50px radius

**Text:**
- Select "Text"
- Click "Add Text"
- Should create black text saying "Click to edit"

**Line:**
- Select "Line"
- Click "Add Line"
- Should create a black diagonal line

### 3. Test Selection (2 minutes)
- Click on each shape type
- Verify blue border appears when selected
- Verify shadow effect on selected shapes
- For lines: verify blue endpoint handles appear when selected
- Press Escape to deselect

### 4. Test Dragging (2 minutes)
- Drag each shape type around the canvas
- Verify they stay within canvas boundaries
- For lines: try dragging the endpoint handles (when selected)
- Verify smooth dragging performance

### 5. Test Deletion (1 minute)
- Select a shape
- Press Delete or Backspace key
- Verify shape disappears
- Try with each shape type

### 6. Test Real-Time Sync (3 minutes)
- Open the same canvas in another browser window/tab
- Create shapes in one window
- Verify they appear immediately in the other window
- Try with all shape types
- Test dragging in one window, watch it update in the other

### 7. Test Mixed Shapes (2 minutes)
- Create multiple shapes of different types on the same canvas
- Verify they all render correctly together
- Select different shapes
- Drag them around
- Verify no conflicts or rendering issues

### 8. Performance Check (2 minutes)
- Create 10-15 mixed shapes
- Pan and zoom the canvas
- Drag shapes around
- Open browser DevTools > Performance tab
- Check FPS - should stay at 60 FPS

## Expected Behavior

### Shape Appearance
- **Rectangle**: Gray fill, sharp corners, 100x100px
- **Circle**: Gray fill, perfect circle, 50px radius
- **Text**: Black text "Click to edit", 16px Arial font
- **Line**: Black stroke, 2px width, diagonal

### Selection States
- **Selected**: Blue border (#2563eb), subtle shadow
- **Unselected**: No border (or original stroke)
- **Locked by other user**: Red border (#ef4444)

### Dragging
- All shapes constrain to canvas boundaries
- Circles account for radius in boundary calculation
- Lines use bounding box for boundaries
- Smooth 60 FPS dragging

## Known Issues to Verify

### Text Component
- ⚠️ Text cannot be edited by double-clicking yet
- This is expected - full text editing will be added in a future update
- Text displays correctly but is read-only for now

### Line Endpoints
- ⚠️ Line endpoint dragging works but may not update the parent shape position optimally
- This is acceptable for MVP - will be enhanced in transform PR

## What to Look For

### ✅ Success Indicators
- All 4 shape types render correctly
- Shape selector UI is intuitive and responsive
- Shapes can be created, selected, dragged, deleted
- Real-time sync works across browser windows
- No console errors
- Smooth 60 FPS performance
- TypeScript compilation successful
- Build completes without errors

### ❌ Potential Issues
- Shapes rendering in wrong positions
- Selection not working for certain types
- Dragging feels laggy or stutters
- Real-time sync delays > 1 second
- Console errors when creating shapes
- Shapes not appearing in second browser window
- TypeScript errors
- Firestore permission errors

## Browser Testing
Test in at least 2 browsers:
- Chrome (recommended)
- Firefox
- Safari (if on Mac)

## Firestore Console Check
1. Open Firebase Console
2. Navigate to Firestore Database
3. Find the `canvas/default` document
4. Check the `shapes` array
5. Verify:
   - Shape objects have correct structure
   - `type` field is one of: rectangle, circle, text, line
   - Shape-specific properties are present:
     - Circle has `radius`
     - Text has `text`, `fontSize`
     - Line has `points` array

## Performance Metrics
- Bundle size: ~362 KB gzipped (acceptable)
- Shape creation: < 100ms
- Real-time sync: < 100ms
- FPS: 60 (even with 20+ shapes)

## Next Steps After Testing
If all tests pass:
1. ✅ Mark PR#10 as complete
2. 🎯 Ready to move to PR#11 (Shape Styling)
3. 📝 Document any issues found
4. 🚀 Ready for deployment

---

**Testing Duration**: ~15 minutes  
**Status**: Ready for testing  
**Dev Server**: Running in background  

