# CollabCanvas - Conflict Resolution Strategy

**Last Updated:** October 15, 2025  
**Status:** Implemented and Production-Ready

---

## Overview

CollabCanvas uses a **hybrid conflict resolution strategy** that combines lock-based prevention for editing operations with last-write-wins for styling updates. This approach balances user experience with data consistency.

---

## Primary Strategy: Lock-Based Prevention

### How It Works

When a user begins editing a shape (e.g., dragging, resizing, rotating), the shape is immediately locked:

1. **Lock Acquisition** - User A starts dragging a shape
   - Shape metadata updates: `{ isLocked: true, lockedBy: userA_id, lockedAt: timestamp }`
   - Lock is written to Firestore immediately
   - All other users receive the update via onSnapshot listener

2. **Lock Enforcement** - User B tries to edit the same shape
   - Client checks `isLocked` property before allowing interaction
   - Shape is rendered with red border to indicate "locked by another user"
   - Drag/resize/rotate operations are disabled
   - Tooltip shows: "Locked by [username]"

3. **Lock Release** - User A stops editing
   - Lock is released: `{ isLocked: false, lockedBy: null, lockedAt: null }`
   - Shape becomes editable for all users again
   - Lock is cleared from Firestore

### Implementation Details

**Files:**
- `src/services/canvas.ts` - `lockShape()`, `unlockShape()`, `checkAndReleaseStaleLocks()`
- `src/contexts/CanvasContext.tsx` - Lock state management
- `src/components/Canvas/Shape.tsx` - Visual feedback for locked shapes

**Lock Properties:**
```typescript
interface Shape {
  // ... other properties
  isLocked: boolean;           // Is shape currently locked?
  lockedBy: string | null;      // User ID who locked it
  lockedAt: Timestamp | null;   // When lock was acquired
}
```

**Lock Timeout:**
- Client-side interval checks every 2 seconds for stale locks
- Locks older than 5 seconds are automatically released
- Prevents deadlocks from network disconnections or browser crashes

---

## Secondary Strategy: Last-Write-Wins

### When It's Used

For non-locked operations, primarily **styling changes**:
- Fill color
- Stroke color and width
- Opacity
- Corner radius (rectangles)
- Text properties

### How It Works

1. User A changes shape fill to red → writes to Firestore with timestamp
2. User B changes shape fill to blue at same time → writes to Firestore with timestamp
3. Firestore server timestamps determine ordering
4. Shape ends up with color from the last write to reach the server
5. Both users see the same final state after sync

### Why This Works

- **Rare in practice** - Users typically don't style the same shape simultaneously
- **Low consequence** - If it happens, user can undo (Ctrl+Z)
- **Simple implementation** - No complex CRDTs or operational transforms needed
- **Fast** - No additional round trips or coordination required

---

## Visual Feedback System

### Locked Shapes

**For Other Users:**
- Red border (2px solid)
- Tooltip: "Locked by [username]"
- Cursor changes to "not-allowed"
- Drag, resize, rotate disabled
- Delete disabled

**For Lock Owner:**
- Blue border (2px solid) - indicates "your selection"
- Full editing capabilities
- Normal cursor behavior

### Last Edited Indicator

**In PropertyPanel:**
- Shows: "Last edited by: [displayName]"
- Time ago: "just now", "2 minutes ago", etc.
- Updates in real-time as shape is modified
- Uses presence data for display names
- Graceful fallback: "Unknown user" if user left

### Connection Status

**In Navbar:**
- Green dot + "Connected" - normal operation
- Yellow dot + "Reconnecting" - attempting to reconnect
- Red dot + "Offline" - no connection, changes will queue

---

## Edge Cases & Handling

### 1. Simultaneous Move (Two Users Drag Same Shape)

**Scenario:** User A and User B both try to drag the same shape at the same time.

**Resolution:**
- First user to acquire lock wins
- Lock acquisition is atomic via Firestore write
- Second user sees "locked" indicator immediately
- Second user's drag is prevented

**Testing:** Verified with 2 concurrent users in separate browsers

---

### 2. Delete vs Edit

**Scenario:** User A deletes a shape while User B is editing it.

**Resolution:**
- Locked shapes cannot be deleted by other users
- Delete button is disabled if `isLocked === true && lockedBy !== currentUser.uid`
- Toast notification: "Cannot delete: shape is locked by another user"
- If owner deletes, shape disappears for all users immediately

**Testing:** Verified with delete key and locked shapes

---

### 3. Create Collision

**Scenario:** Two users create shapes at identical timestamps and positions.

**Resolution:**
- **No collision possible** - Firestore assigns unique IDs via `doc().id`
- Each shape gets a globally unique identifier
- Both shapes are created successfully
- No data loss

**Testing:** Verified by creating multiple shapes rapidly from different users

---

### 4. Network Partition (User Goes Offline Mid-Edit)

**Scenario:** User A starts dragging, then loses network connection.

**Client-Side Cleanup:**
- Lock timeout mechanism (5 seconds)
- Other clients detect stale lock and release it
- Shape becomes editable again after timeout

**Server-Side Cleanup:**
- Realtime Database `onDisconnect()` triggers
- Presence data cleared when user disconnects
- Firestore security rules prevent writes from disconnected users

**Offline Persistence:**
- Firestore offline cache queues changes
- Changes sync when connection restored
- Timestamp ordering determines final state

**Testing:** Verified by disabling network mid-drag

---

### 5. Rapid Edit Storm

**Scenario:** User A resizes while User B changes color while User C moves the shape.

**Resolution:**
- Move is locked (only one user can transform at a time)
- Color changes use last-write-wins
- Final state: Transform from lock owner + color from last write
- No corruption or lost updates

**Testing:** Verified with 3+ concurrent users editing rapidly

---

## Firestore Security Rules

### Shape Update Rules

```javascript
// Only allow updates if shape is unlocked OR user is the lock owner
allow update: if request.auth != null && (
  // Shape is not locked
  !resource.data.isLocked ||
  // Or current user is the lock owner
  resource.data.lockedBy == request.auth.uid ||
  // Or lock has expired (>5 seconds old)
  request.time > resource.data.lockedAt + duration.seconds(5)
);
```

### Delete Rules

```javascript
// Allow delete if unlocked or user is lock owner
allow delete: if request.auth != null && (
  !resource.data.isLocked ||
  resource.data.lockedBy == request.auth.uid
);
```

---

## Performance Impact

### Lock Operations

- **Lock acquisition:** 1 Firestore write (~50-100ms)
- **Lock release:** 1 Firestore write (~50-100ms)
- **Lock check:** Local (0ms) - data already in client cache
- **Overhead:** Minimal - only 2 writes per edit operation

### Sync Performance

- **Shape creation:** <100ms across all users
- **Lock updates:** <100ms across all users
- **Lock timeout checks:** Every 2 seconds (client-side, no network cost)

### Cost Implications

- Average edit operation: 3-4 Firestore writes
  1. Lock acquisition
  2. Shape update
  3. Lock release
  4. Metadata update (lastModifiedBy, lastModifiedAt)
- At 5 users × 10 edits/minute = 50 writes/minute
- Daily cost: ~$0.01-0.05 (well within budget)

---

## Testing Scenarios

### Manual Testing Checklist

All scenarios tested with 2-5 concurrent users:

- ✅ **Simultaneous drag:** First user locks, second user sees red border
- ✅ **Lock release:** Shape becomes editable when first user stops
- ✅ **Delete locked shape:** Disabled with toast notification
- ✅ **Network disconnect:** Lock times out after 5 seconds
- ✅ **Create collision:** Both shapes created with unique IDs
- ✅ **Rapid edits:** No data corruption or lost updates
- ✅ **Color changes:** Last-write-wins works smoothly
- ✅ **Undo after conflict:** User can undo unwanted changes
- ✅ **Lock timeout:** Stale locks released automatically
- ✅ **Multi-user stress:** 5 users editing simultaneously

### Browser Testing

- ✅ Chrome (Mac/Windows)
- ✅ Firefox
- ✅ Safari
- ✅ Chrome Incognito (for multi-user simulation)

---

## Comparison to Alternatives

### Why Not CRDTs?

**Pros of CRDTs:**
- Eventual consistency guaranteed
- No coordination required
- Works offline seamlessly

**Cons of CRDTs:**
- Complex implementation
- Larger payload sizes
- Harder to reason about
- Overkill for our use case

**Our Decision:** Lock-based prevention is simpler, faster, and sufficient for real-time collaborative editing where users are typically online.

### Why Not Operational Transforms (OT)?

**Pros of OT:**
- Used by Google Docs
- Handles complex text editing

**Cons of OT:**
- Very complex to implement correctly
- Primarily designed for text
- Our use case (shape editing) doesn't need it

**Our Decision:** Shape positions and properties are simple - locks are enough.

### Why Not Pure Last-Write-Wins Everywhere?

**Pros of LWW:**
- Simplest possible approach
- No locks needed

**Cons of LWW:**
- Confusing user experience (shapes jump around)
- Lost work (one user's drag overwritten by another)
- Frustrating for users

**Our Decision:** Hybrid approach - locks for transforms, LWW for styling - gives best UX.

---

## Future Enhancements

### Potential Improvements (Phase 3+)

1. **Visual Lock Indicators on Canvas**
   - Show lock owner's avatar near locked shapes
   - Animate lock acquisition

2. **Lock Notifications**
   - Toast: "John started editing this shape"
   - Sound effects for lock events

3. **Graceful Lock Conflicts**
   - Queue edit requests when shape is locked
   - Apply after lock releases

4. **Lock History**
   - Track who locked what and when
   - Analytics on collaboration patterns

5. **Selective Locks**
   - Lock only specific properties
   - Allow position changes while styling locked

---

## References

### Code Locations

| Component | File | Function |
|-----------|------|----------|
| Lock Service | `src/services/canvas.ts` | `lockShape()`, `unlockShape()` |
| Lock Management | `src/contexts/CanvasContext.tsx` | Lock state + timeout checks |
| Visual Feedback | `src/components/Canvas/Shape.tsx` | Red/blue borders |
| Last Edited | `src/components/Canvas/PropertyPanel.tsx` | Display name + time |
| Connection Status | `src/components/Layout/Navbar.tsx` | Status badge |
| Time Helpers | `src/utils/timeHelpers.ts` | `getTimeAgo()` |

### Related Documentation

- Architecture: `collabcanvas_phase2_architecture.md`
- Testing Guide: `48_HOUR_ACTION_PLAN.md`
- Task List: `COMPREHENSIVE_TASK_LIST.md`
- Project Plan: `COMPREHENSIVE_PROJECT_PLAN.md`

---

## Conclusion

CollabCanvas's hybrid conflict resolution strategy provides:

✅ **Intuitive UX** - Users see clear feedback about locks  
✅ **Data Consistency** - No lost updates or corruption  
✅ **High Performance** - <100ms sync times maintained  
✅ **Scalability** - Handles 5+ concurrent users smoothly  
✅ **Simplicity** - Easy to understand and maintain  

The combination of lock-based prevention for editing and last-write-wins for styling strikes the right balance for a real-time collaborative canvas application.

---

**End of Conflict Resolution Documentation**

