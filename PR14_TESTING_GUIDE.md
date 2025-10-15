# PR #14: Undo/Redo System - Testing Guide

## 🎯 Testing Objective
Verify that the undo/redo system works correctly for all canvas operations, with proper keyboard shortcuts and UI controls.

## 🚀 Getting Started

The development server should now be running at: **http://localhost:5173**

1. Open your browser and navigate to the app
2. Log in with your test account
3. Open the canvas
4. Follow the test scenarios below

---

## 📋 Test Scenarios

### ✅ Test 1: Create Shape & Undo/Redo

**Steps:**
1. Click the "Rectangle" button to add a rectangle
2. Verify the rectangle appears on the canvas
3. Press **Ctrl+Z** (or click the Undo button)
4. ✓ **Expected**: Rectangle disappears
5. Press **Ctrl+Y** (or click the Redo button)
6. ✓ **Expected**: Rectangle reappears in the same position

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 2: Move Shape & Undo/Redo

**Steps:**
1. Create a shape (any type)
2. Drag it to a new position
3. Note the new position
4. Press **Ctrl+Z**
5. ✓ **Expected**: Shape returns to original position
6. Press **Ctrl+Y**
7. ✓ **Expected**: Shape moves back to the new position

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 3: Resize Shape & Undo/Redo

**Steps:**
1. Create a rectangle
2. Click to select it (you should see transform handles)
3. Drag a corner handle to resize
4. Press **Ctrl+Z**
5. ✓ **Expected**: Shape returns to original size
6. Press **Ctrl+Y**
7. ✓ **Expected**: Shape returns to resized size

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 4: Rotate Shape & Undo/Redo

**Steps:**
1. Create a rectangle
2. Select it
3. Use the rotation handle to rotate it
4. Press **Ctrl+Z**
5. ✓ **Expected**: Shape returns to original rotation
6. Press **Ctrl+Y**
7. ✓ **Expected**: Shape rotates back

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 5: Change Color & Undo/Redo

**Steps:**
1. Create a shape
2. Select it
3. Open the property panel (right side)
4. Change the fill color
5. Press **Ctrl+Z**
6. ✓ **Expected**: Color reverts to original
7. Press **Ctrl+Y**
8. ✓ **Expected**: Color changes back to new color

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 6: Delete Shape & Undo/Redo

**Steps:**
1. Create a shape
2. Select it
3. Press **Delete** or **Backspace**
4. ✓ **Expected**: Shape disappears
5. Press **Ctrl+Z**
6. ✓ **Expected**: Shape reappears in original position with all properties intact
7. Press **Ctrl+Y**
8. ✓ **Expected**: Shape disappears again

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 7: Duplicate Shape & Undo/Redo

**Steps:**
1. Create a shape
2. Select it
3. Press **Ctrl+D** (duplicate)
4. ✓ **Expected**: A duplicate appears with 20px offset
5. Press **Ctrl+Z**
6. ✓ **Expected**: Duplicate disappears, original remains
7. Press **Ctrl+Y**
8. ✓ **Expected**: Duplicate reappears

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 8: Layer Order (Bring Forward) & Undo/Redo

**Steps:**
1. Create two overlapping shapes (e.g., two rectangles)
2. Select the bottom shape
3. Press **Ctrl+]** (bring forward)
4. ✓ **Expected**: Shape moves forward one layer
5. Press **Ctrl+Z**
6. ✓ **Expected**: Shape returns to original layer
7. Press **Ctrl+Y**
8. ✓ **Expected**: Shape moves forward again

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 9: Align Shapes & Undo/Redo

**Steps:**
1. Create 3 shapes at different positions
2. Select all 3 shapes (hold Shift and click each)
3. Click "Align Left" button in the alignment toolbar (bottom center)
4. ✓ **Expected**: All shapes align to the left edge
5. Press **Ctrl+Z**
6. ✓ **Expected**: Shapes return to original positions
7. Press **Ctrl+Y**
8. ✓ **Expected**: Shapes align left again

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 10: Distribute Shapes & Undo/Redo

**Steps:**
1. Create 3 shapes in a horizontal line (not evenly spaced)
2. Select all 3 shapes
3. Click "Distribute Horizontally" button
4. ✓ **Expected**: Shapes distribute evenly, first and last stay in place
5. Press **Ctrl+Z**
6. ✓ **Expected**: Shapes return to original positions
7. Press **Ctrl+Y**
8. ✓ **Expected**: Shapes distribute evenly again

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 11: Multiple Actions & Multiple Undo/Redo

**Steps:**
1. Create a rectangle (Action 1)
2. Move it (Action 2)
3. Resize it (Action 3)
4. Change its color (Action 4)
5. Duplicate it (Action 5)
6. Press **Ctrl+Z** five times
7. ✓ **Expected**: Each undo reverts one action in reverse order:
   - Undo 1: Duplicate removed
   - Undo 2: Color reverts
   - Undo 3: Size reverts
   - Undo 4: Position reverts
   - Undo 5: Rectangle deleted
8. Press **Ctrl+Y** five times
9. ✓ **Expected**: All actions reapplied in original order

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 12: Redo Stack Clearing

**Steps:**
1. Create a shape
2. Press **Ctrl+Z** (undo creation)
3. Verify Redo button is enabled
4. Create a NEW shape (different type)
5. ✓ **Expected**: Redo button becomes disabled (redo stack cleared)
6. Press **Ctrl+Y**
7. ✓ **Expected**: Nothing happens (redo stack is empty)

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 13: Button State Management

**Steps:**
1. Refresh the page
2. ✓ **Expected**: Both Undo and Redo buttons are disabled (grayed out)
3. Create a shape
4. ✓ **Expected**: Undo button is enabled, Redo button still disabled
5. Press **Ctrl+Z**
6. ✓ **Expected**: Undo button disabled, Redo button enabled
7. Press **Ctrl+Y**
8. ✓ **Expected**: Undo button enabled, Redo button disabled

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 14: Keyboard Shortcuts

**Steps:**
1. Create a shape
2. Test **Ctrl+Z**
3. ✓ **Expected**: Undo works
4. Test **Ctrl+Y**
5. ✓ **Expected**: Redo works
6. Test **Ctrl+Shift+Z**
7. ✓ **Expected**: Redo works (alternative shortcut)
8. Verify no browser default actions occur (e.g., browser undo/redo)

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 15: History Limit (50 actions)

**Steps:**
1. Create 55 rectangles (click "Rectangle" button 55 times)
2. ✓ **Expected**: All 55 rectangles appear
3. Press **Ctrl+Z** repeatedly (try to undo all)
4. ✓ **Expected**: Can only undo the last 50 actions
5. ✓ **Expected**: First 5 rectangles remain (cannot be undone)

**Status**: [ ] PASS [ ] FAIL

---

### ✅ Test 16: Multi-User Isolation (Optional - requires 2 browsers)

**Steps:**
1. Open the app in Chrome (User A)
2. Open the app in an incognito window (User B, different account)
3. Both users create shapes on the same canvas
4. User A presses **Ctrl+Z**
5. ✓ **Expected**: Only User A's last action is undone
6. ✓ **Expected**: User B's shapes are unaffected
7. User B presses **Ctrl+Z**
8. ✓ **Expected**: Only User B's last action is undone

**Status**: [ ] PASS [ ] FAIL [ ] SKIPPED

---

### ✅ Test 17: Tooltips & Accessibility

**Steps:**
1. Hover over the Undo button
2. ✓ **Expected**: Tooltip shows "Undo (Ctrl+Z)"
3. Hover over the Redo button
4. ✓ **Expected**: Tooltip shows "Redo (Ctrl+Y)"

**Status**: [ ] PASS [ ] FAIL

---

## 🐛 Bug Report Template

If you find any issues, please document them:

### Issue #1
- **Test**: [Test number/name]
- **Steps**: [What you did]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Screenshot**: [If applicable]

---

## ✅ Final Checklist

After completing all tests:

- [ ] All core tests (1-15) pass
- [ ] No TypeScript errors in browser console
- [ ] No Firebase errors in browser console
- [ ] Undo/Redo buttons work correctly
- [ ] Keyboard shortcuts work correctly
- [ ] Button states update correctly
- [ ] No visual glitches during undo/redo
- [ ] Shapes maintain all properties (position, size, color, rotation) after undo/redo

---

## 📊 Test Results Summary

**Total Tests**: 17  
**Passed**: ___  
**Failed**: ___  
**Skipped**: ___  

**Overall Status**: [ ] ✅ PASS [ ] ❌ FAIL

---

## 🎉 Next Steps

If all tests pass:
1. Mark PR #14 as complete and ready to merge
2. Create a commit with the completed work
3. Move on to PR #15: Export & Save

If any tests fail:
1. Document the issues above
2. Fix the bugs
3. Re-run the failed tests
4. Repeat until all tests pass

---

**Testing Date**: _______________  
**Tester**: _______________  
**Browser**: _______________  
**Notes**: _______________

