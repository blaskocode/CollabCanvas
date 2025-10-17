# CollabCanvas Testing Walkthrough

This guide will systematically walk you through testing all the recently implemented features and bug fixes.

---

## 🎯 Test 1: Drawing Mode & Shape Creation

### 1.1 Rectangle Drawing
- [ ] Click the **Rectangle** button (should highlight in green)
- [ ] Your cursor should change to a crosshair
- [ ] Click and drag on the canvas to draw a rectangle
- [ ] Release the mouse
- [ ] ✅ **Expected**: Rectangle appears exactly where you drew it, matching the preview
- [ ] ✅ **Expected**: Rectangle is automatically selected after creation

### 1.2 Circle Drawing
- [ ] Click the **Circle** button
- [ ] Click and drag on the canvas
- [ ] ✅ **Expected**: Preview shows a **circle** (not a rectangle)
- [ ] Release the mouse
- [ ] ✅ **Expected**: Final circle appears in the same location as the preview
- [ ] ✅ **Expected**: Circle is automatically selected

### 1.3 Line Drawing
- [ ] Click the **Line** button
- [ ] Click and drag on the canvas
- [ ] ✅ **Expected**: Preview shows a line from start to end point
- [ ] Release the mouse
- [ ] ✅ **Expected**: Final line appears exactly where the preview was
- [ ] ✅ **Expected**: Line is automatically selected

### 1.4 Text Box Drawing
- [ ] Click the **Text** button
- [ ] Click and drag on the canvas
- [ ] Release the mouse
- [ ] Double-click the text to edit it
- [ ] Type "Hello World"
- [ ] Click outside to finish editing
- [ ] ✅ **Expected**: Text is centered horizontally and vertically in the box
- [ ] ✅ **Expected**: Text box position is relative to its center (not top-left corner)

### 1.5 Exit Drawing Mode
- [ ] Click any shape button to enter drawing mode
- [ ] Press **Escape** key
- [ ] ✅ **Expected**: Drawing mode exits, cursor returns to normal

---

## 🎯 Test 2: Shape Selection

### 2.1 Single Selection
- [ ] Click on a shape (unselected)
- [ ] ✅ **Expected**: Shape is immediately selected (blue border/transformer)
- [ ] Click on a different shape
- [ ] ✅ **Expected**: Previous shape deselects, new shape selects

### 2.2 Line Selection
- [ ] Create a thin line (drag a short distance)
- [ ] Try clicking near the line (not exactly on it)
- [ ] ✅ **Expected**: Line is easy to select with a generous hitbox

### 2.3 Multi-Selection
- [ ] Hold **Shift** and click multiple shapes
- [ ] ✅ **Expected**: All clicked shapes are selected
- [ ] ✅ **Expected**: Blue outline shows around each shape

### 2.4 Drag Selection Box
- [ ] Click on empty canvas and drag to create selection box
- [ ] ✅ **Expected**: All shapes within the box are selected
- [ ] ✅ **Expected**: Alignment tools appear (since 2+ shapes are selected)

---

## 🎯 Test 3: Dragging Shapes

### 3.1 Single Shape Drag with Auto-Select
- [ ] Click on an **unselected** shape and immediately start dragging (don't release)
- [ ] ✅ **Expected**: Shape becomes selected immediately as you start dragging
- [ ] ✅ **Expected**: Shape moves smoothly with your cursor
- [ ] Release the mouse
- [ ] ✅ **Expected**: No unwanted panning occurs
- [ ] ✅ **Expected**: Canvas stays in place

### 3.2 Multi-Select Drag (Non-Grouped)
- [ ] Select 3 different shapes (Shift+click)
- [ ] Click and drag one of the selected shapes
- [ ] ✅ **Expected**: All 3 shapes move together in real-time
- [ ] Release the mouse
- [ ] ✅ **Expected**: All shapes land in their new positions correctly
- [ ] ✅ **Expected**: No shapes "glitch" or jump to wrong positions

### 3.3 Group Drag
- [ ] Select 2-3 shapes
- [ ] Press **Ctrl+G** (or Cmd+G on Mac) to group them
- [ ] ✅ **Expected**: Green group bounding box appears
- [ ] Click on empty canvas to deselect
- [ ] Click and drag **any single shape** in the group
- [ ] ✅ **Expected**: **ALL shapes in the group** are auto-selected and highlighted
- [ ] ✅ **Expected**: **All shapes move together in real-time** as you drag (not just the one you clicked)
- [ ] ✅ **Expected**: Group bounding box moves with the shapes in real-time
- [ ] Release the mouse
- [ ] ✅ **Expected**: Group box is in the correct position (not offset)
- [ ] ✅ **Expected**: All shapes land in their final positions simultaneously (no glitching)

### 3.4 Individual Shape in Group (Double-Click Edit)
- [ ] Create a group with 2-3 shapes
- [ ] Click on empty canvas to deselect
- [ ] **Double-click** one shape inside the group (click twice quickly on the same shape)
- [ ] ✅ **Expected**: Only that one shape is selected (blue border, no group box)
- [ ] ✅ **Expected**: Other shapes in the group are NOT selected
- [ ] Now drag that individual shape to a new location
- [ ] ✅ **Expected**: Only the one shape moves (other group shapes stay in place)
- [ ] Release the mouse
- [ ] Click on another shape to deselect
- [ ] Click on any shape in the group again (single click)
- [ ] ✅ **Expected**: Entire group selects and group box updates to encompass the moved shape

### 3.5 Boundary Constraints for Multi-Drag
- [ ] Create 3 shapes: one near the left edge, one in the middle, one near the right edge
- [ ] Select all 3 shapes (Shift+click or drag selection box)
- [ ] Try to drag the **middle** shape to the left edge
- [ ] ✅ **Expected**: The group stops moving when the leftmost shape hits the left boundary
- [ ] ✅ **Expected**: No shape goes outside the canvas boundary
- [ ] Try to drag the **left** shape to the right edge
- [ ] ✅ **Expected**: The group stops moving when the rightmost shape hits the right boundary
- [ ] Try the same test with top/bottom boundaries
- [ ] ✅ **Expected**: All shapes stay within canvas bounds regardless of which shape you're dragging

### 3.6 Boundary Constraints for Group Drag
- [ ] Create a group with shapes spread across different positions
- [ ] Try to drag the group toward each edge (left, right, top, bottom)
- [ ] ✅ **Expected**: The group stops when ANY shape in the group reaches the boundary
- [ ] ✅ **Expected**: No shape can ever go outside the canvas, regardless of which shape you click

---

## 🎯 Test 4: Alignment Tools

### 4.1 Visibility
- [ ] Select only 1 shape
- [ ] ✅ **Expected**: Alignment tools are **hidden**
- [ ] Hold Shift and click another shape (2 shapes selected)
- [ ] ✅ **Expected**: Alignment tools appear at the top

### 4.2 Align Left (Mixed Shapes)
- [ ] Create: 1 rectangle, 1 circle, 1 line
- [ ] Position them randomly on the canvas
- [ ] Select all 3 shapes
- [ ] Click **Align Left** button
- [ ] ✅ **Expected**: All shapes align their left edges
- [ ] ✅ **Expected**: Circle moves correctly (not offset)
- [ ] ✅ **Expected**: Line aligns correctly

### 4.3 Align Top
- [ ] With the same 3 shapes selected
- [ ] Click **Align Top** button
- [ ] ✅ **Expected**: All shapes align their top edges
- [ ] ✅ **Expected**: No shapes jump or move incorrectly

### 4.4 Center & Middle
- [ ] Keep the 3 shapes selected
- [ ] Click **Center** button (horizontal center)
- [ ] ✅ **Expected**: All shapes align to the same vertical centerline
- [ ] Click **Middle** button (vertical middle)
- [ ] ✅ **Expected**: All shapes align to the same horizontal centerline

### 4.5 Distribute Horizontally
- [ ] Create 4 rectangles in a rough horizontal line
- [ ] Select all 4
- [ ] Click **Distribute H** button
- [ ] ✅ **Expected**: Shapes spread out evenly with equal spacing
- [ ] Try with circles and lines
- [ ] ✅ **Expected**: Works correctly for all shape types

### 4.6 Distribute Vertically
- [ ] Create 4 shapes in a rough vertical line
- [ ] Select all 4
- [ ] Click **Distribute V** button
- [ ] ✅ **Expected**: Shapes spread out evenly vertically

---

## 🎯 Test 5: Text Formatting

### 5.1 Font Size
- [ ] Create a text shape
- [ ] Select it
- [ ] In the PropertyPanel, find **Font Size** slider
- [ ] Drag the slider from 12 to 48
- [ ] ✅ **Expected**: Text size changes in real-time
- [ ] Type a number (e.g., 72) in the input box
- [ ] ✅ **Expected**: Text updates to that size

### 5.2 Font Family
- [ ] With text selected, open the **Font Family** dropdown
- [ ] Try different fonts: Arial, Times New Roman, Courier, Georgia, Verdana
- [ ] ✅ **Expected**: Text font changes immediately for each selection

### 5.3 Bold, Italic, Underline, Strikethrough
- [ ] With text selected, click the **Bold** button (B)
- [ ] ✅ **Expected**: Text becomes bold
- [ ] Click **Italic** button (I)
- [ ] ✅ **Expected**: Text becomes italic (and stays bold)
- [ ] Click **Underline** button (U)
- [ ] ✅ **Expected**: Text gets underlined
- [ ] Click **Strikethrough** button (S)
- [ ] ✅ **Expected**: Text gets strikethrough line
- [ ] Click all buttons again to toggle them off
- [ ] ✅ **Expected**: All formatting removes correctly

### 5.4 Text Alignment
- [ ] With text selected, click **Left** align button
- [ ] ✅ **Expected**: Text aligns to left of text box
- [ ] Click **Center** align button
- [ ] ✅ **Expected**: Text centers horizontally
- [ ] Click **Right** align button
- [ ] ✅ **Expected**: Text aligns to right

---

## 🎯 Test 6: Context Menu (Right-Click)

### 6.1 Open Context Menu
- [ ] **Right-click** on a shape (or Ctrl+Click on Mac)
- [ ] ✅ **Expected**: Context menu appears at cursor location
- [ ] Click outside the menu
- [ ] ✅ **Expected**: Menu closes

### 6.2 Layer Ordering - Bring to Front
- [ ] Create 3 overlapping rectangles (different colors)
- [ ] Right-click the bottom rectangle
- [ ] Select **Bring to Front**
- [ ] ✅ **Expected**: That rectangle moves to the top layer

### 6.3 Layer Ordering - Send to Back
- [ ] Right-click the top rectangle
- [ ] Select **Send to Back**
- [ ] ✅ **Expected**: That rectangle moves to the bottom layer

### 6.4 Bring Forward / Send Backward
- [ ] Right-click a middle rectangle
- [ ] Select **Bring Forward**
- [ ] ✅ **Expected**: Rectangle moves up one layer
- [ ] Select **Send Backward**
- [ ] ✅ **Expected**: Rectangle moves down one layer

### 6.5 Duplicate
- [ ] Create a shape with custom formatting:
  - Rotate it 45 degrees
  - Change fill color to red
  - Change stroke color to blue
  - If text: make it bold, size 48, italic
- [ ] Right-click the shape
- [ ] Select **Duplicate**
- [ ] ✅ **Expected**: New shape appears slightly offset
- [ ] ✅ **Expected**: New shape has ALL the same formatting (rotation, colors, text style, etc.)
- [ ] ✅ **Expected**: Duplicated shape is automatically selected

### 6.6 Delete
- [ ] Right-click a shape
- [ ] Select **Delete**
- [ ] ✅ **Expected**: Shape is removed from canvas

### 6.7 Lock/Unlock Removed
- [ ] Right-click any shape
- [ ] ✅ **Expected**: Lock and Unlock options are **not** in the menu

---

## 🎯 Test 7: Pan & Zoom

### 7.1 Normal Pan
- [ ] Hold **Spacebar**
- [ ] Click and drag on the canvas
- [ ] ✅ **Expected**: Canvas pans smoothly
- [ ] Release spacebar

### 7.2 Pan Bug Fix (Shape Drag + Pan)
- [ ] Create a rectangle
- [ ] Click to select it (don't drag)
- [ ] Click again and drag it to a new position
- [ ] Release the mouse
- [ ] ✅ **Expected**: Canvas does NOT pan randomly
- [ ] ✅ **Expected**: Canvas stays in the same position

### 7.3 Zoom
- [ ] Use mouse **scroll wheel** to zoom in/out
- [ ] ✅ **Expected**: Canvas zooms smoothly toward cursor
- [ ] Click **Reset Zoom** button (if available)
- [ ] ✅ **Expected**: Canvas resets to 100% zoom

---

## 🎯 Test 8: Grouping

### 8.1 Create Group
- [ ] Select 3 shapes
- [ ] Press **Ctrl+G** (Cmd+G on Mac)
- [ ] ✅ **Expected**: Green group bounding box appears around all shapes
- [ ] Click elsewhere to deselect
- [ ] Click on one shape in the group
- [ ] ✅ **Expected**: Entire group selects

### 8.2 Ungroup
- [ ] With group selected, press **Ctrl+Shift+G** (Cmd+Shift+G on Mac)
- [ ] ✅ **Expected**: Group bounding box disappears
- [ ] ✅ **Expected**: Shapes can now be selected individually

---

## 🎯 Test 9: Undo/Redo

### 9.1 Undo Operations
- [ ] Create a shape
- [ ] Press **Ctrl+Z** (Cmd+Z on Mac)
- [ ] ✅ **Expected**: Shape disappears
- [ ] Move a shape
- [ ] Press Ctrl+Z
- [ ] ✅ **Expected**: Shape returns to previous position

### 9.2 Redo Operations
- [ ] After undoing, press **Ctrl+Shift+Z** (Cmd+Shift+Z on Mac)
- [ ] ✅ **Expected**: Action is redone

---

## 🎯 Test 10: Edge Cases

### 10.1 Group with Mixed Shape Types
- [ ] Create a group with: 1 rectangle, 1 circle, 1 line
- [ ] Drag the group around
- [ ] ✅ **Expected**: Group box encompasses all shapes correctly
- [ ] Double-click to select individual circle
- [ ] Move the circle outside the group area
- [ ] Click elsewhere, then click group again
- [ ] ✅ **Expected**: Group box expands to include the moved circle

### 10.2 Multi-Select with Locked Shape
- [ ] Open in two browser tabs (simulate two users)
- [ ] In Tab 1: Select and start dragging a shape (lock it)
- [ ] In Tab 2: Try to select that same shape
- [ ] ✅ **Expected**: Locked shapes show lock indicator
- [ ] ✅ **Expected**: Can't drag locked shapes

### 10.3 Rapid Operations
- [ ] Quickly create 5 shapes by drawing
- [ ] Immediately select all and drag
- [ ] ✅ **Expected**: No shapes "glitch" or end up in wrong positions
- [ ] Rapidly click Align Left, Align Right, Center several times
- [ ] ✅ **Expected**: No race conditions or errors

---

## ✅ Summary Checklist

After completing all tests, verify:

- [ ] All shapes draw correctly with preview matching final position
- [ ] Shapes auto-select when dragging
- [ ] Lines are easy to select
- [ ] Multi-select drag works smoothly (no glitches)
- [ ] Group drag works smoothly (group box updates)
- [ ] Individual shapes in groups update group bounds when moved
- [ ] No unwanted panning after shape drag
- [ ] Alignment works for all shape type combinations
- [ ] Text formatting controls work (size, bold, italic, underline, etc.)
- [ ] Duplicate copies all formatting
- [ ] Context menu works for all operations
- [ ] Lock/Unlock removed from context menu
- [ ] Pan and zoom work correctly

---

## 🐛 If You Find Issues

If any test fails:
1. Note which specific test failed
2. Describe what happened vs. what was expected
3. Check browser console for errors (F12 → Console tab)
4. Report the issue with steps to reproduce

---

**Happy Testing! 🎨**

