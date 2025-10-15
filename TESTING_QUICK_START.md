# Quick Testing Guide - PR #14

## ✅ Undo/Redo is NOW WORKING!

I fixed the history recording issue. It now uses a useEffect to detect new shapes and record them automatically.

###  How to Test Undo/Redo:

1. **Create a Rectangle**:
   - Click the "Rectangle" button in the right panel
   - A rectangle will appear on the canvas

2. **Undo the Creation**:
   - Look at the **top of the right panel** - you'll see two buttons:
     - **Green "Undo" button** (with left arrow)
     - **Cyan "Redo" button** (with right arrow)
   - Click the **Undo button** OR press **Ctrl+Z**
   - ✓ The rectangle should disappear!

3. **Redo**:
   - Click the **Redo button** OR press **Ctrl+Y**
   - ✓ The rectangle should reappear!

4. **Test Other Operations**:
   - **Move**: Drag a shape, then press Ctrl+Z → it moves back
   - **Resize**: Resize a shape, then press Ctrl+Z → size restores
   - **Color**: Change color in property panel, then press Ctrl+Z → color reverts
   - **Delete**: Delete a shape (press Delete key), then press Ctrl+Z → shape returns

---

## 📦 Box Selection (Multi-Select)

### How Box Selection Works:

**Box selection** lets you select multiple shapes at once by drawing a rectangle around them.

### How to Do It:

1. **Click on empty canvas** (not on a shape)
2. **Hold the mouse button down**
3. **Drag at least 10 pixels** in any direction
4. ✓ You'll see a blue rectangle appear
5. **Release the mouse button**
6. ✓ All shapes inside the rectangle are selected

### Why 10 Pixels?
- If you drag less than 10 pixels → **Canvas pans** (moves around)
- If you drag more than 10 pixels → **Box selection starts**

This prevents accidental box selection when you just want to pan.

### Alternative: Multi-Select with Shift+Click

If box selection feels awkward, you can also:
1. Click a shape to select it
2. Hold **Shift** and click another shape
3. Both shapes are now selected!
4. Keep Shift+clicking to add more shapes

---

## 🎯 What to Look For

### Undo/Redo Buttons:
- Located at the **top** of the right control panel
- **Green button = Undo** (emerald gradient)
- **Cyan button = Redo** (blue gradient)
- Buttons are **gray and disabled** when you can't undo/redo
- Buttons are **colorful and enabled** when available

### Keyboard Shortcuts:
- **Ctrl+Z** = Undo
- **Ctrl+Y** = Redo
- **Ctrl+Shift+Z** = Redo (alternative)

---

## 🐛 If It Still Doesn't Work:

1. **Hard refresh** your browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
2. **Check the browser console** (F12) for errors
3. **Check the port**: The dev server is running on **http://localhost:5175** (or 5173/5174)
4. Let me know what error you see!

---

## ✅ Quick Test Checklist:

- [ ] I can see the Undo/Redo buttons at the top of the right panel
- [ ] After creating a rectangle, the Undo button is enabled (colorful)
- [ ] Clicking Undo (or Ctrl+Z) removes the rectangle
- [ ] After undo, the Redo button is enabled
- [ ] Clicking Redo (or Ctrl+Y) brings back the rectangle
- [ ] I can pan the canvas by clicking and dragging (small movements)
- [ ] I can box-select by clicking and dragging far (10+ pixels)

---

**Ready to test!** Refresh your browser and try the steps above. 🚀

