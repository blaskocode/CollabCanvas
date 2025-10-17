# CollabCanvas Data Migration Guide

## Why Migration is Needed

When we fixed the Firestore permission errors, we discovered the collection name was mismatched:
- ❌ Old code used: `'canvas'` collection
- ✅ New code uses: `'canvases'` collection (matches Firestore rules)

Your existing shapes are still in the old `'canvas'` collection and need to be moved to `'canvases'`.

## Migration Steps

### Step 1: Run the Migration

1. **Refresh your browser** to load the migration utility
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Run the migration command**:
   ```javascript
   await window.migrateCanvasCollection()
   ```

### Step 2: Verify Success

You should see:
```
[migrateCanvasCollection] Starting migration...
[migrateCanvasCollection] Found old data: { shapes: 5, groups: 0, connections: 2 }
[migrateCanvasCollection] Copying data to new collection...
[migrateCanvasCollection] ✅ Migration complete!
[migrateCanvasCollection] Migrated: { shapes: 5, groups: 0, connections: 2 }
[migrateCanvasCollection] Please refresh the page to see your shapes.
```

### Step 3: Refresh and Verify

1. **Refresh the page**
2. **Check your shapes are back** on the canvas
3. **Verify the console shows**:
   ```
   [useCanvas] Shapes updated: 5
   [useCanvas] Groups updated: 0
   [useCanvas] Connections updated: 2
   ```

### Step 4: Clean Up (Optional)

After confirming your shapes are back, remove the temporary migration rules:

```bash
./remove-old-rules.sh
```

This script:
1. Removes read access to the old `'canvas'` collection
2. Redeploys Firestore rules
3. Prevents accidental access to old data

## Safety Features

The migration script includes safety checks:

✅ **No Data Loss**: Won't overwrite if new collection already has data
✅ **Read-Only**: Only reads from old collection, never deletes
✅ **Atomic Write**: Copies all data in a single operation
✅ **Verbose Logging**: Shows exactly what's being migrated

## Troubleshooting

### Error: "Migration failed: Missing or insufficient permissions"

**Cause**: Firestore rules haven't propagated yet (can take 10-30 seconds)

**Solution**: Wait 30 seconds and try again

### Error: "New collection already has data"

**Cause**: You've already created shapes in the new collection

**Solution**: 
- If old data is important: manually merge data using Firebase Console
- If not: continue using current data, no migration needed

### No data in old collection

**Cause**: Your canvas was truly empty, or data was already migrated

**Solution**: Start creating shapes! Everything works now.

### Shapes still not showing after migration

**Cause**: Browser cache or didn't refresh

**Solution**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Check console for `[useCanvas] Shapes updated: X` with X > 0
3. If still empty, run `await window.migrateCanvasCollection()` again

## Technical Details

### What Gets Migrated

- ✅ All shapes (rectangles, circles, text, lines, workflow shapes)
- ✅ All groups
- ✅ All connections
- ✅ All shape properties (position, size, color, etc.)
- ✅ All metadata (createdBy, timestamps, etc.)

### What Doesn't Get Migrated

- ❌ The old collection itself (stays for safety)
- ❌ Undo/redo history (ephemeral, not persisted)
- ❌ Selection state (local to each user)

### Migration Script Location

The migration utility is in:
```
src/utils/migrate-collection.ts
```

Exposed to console as:
```javascript
window.migrateCanvasCollection()
```

## After Migration

Once migration is complete:

1. ✅ All shapes work in the new `'canvases'` collection
2. ✅ No more permission errors
3. ✅ Real-time sync works correctly
4. ✅ All workflow features enabled
5. ✅ Can create connections between shapes
6. ✅ AI agent can create workflows

You can now use all the new workflow features! 🚀

