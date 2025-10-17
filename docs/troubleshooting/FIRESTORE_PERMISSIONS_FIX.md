# Firestore Permissions Fix

## Problem Summary

Users were experiencing "Missing or insufficient permissions" errors when:
1. Reading from Firestore (shapes, groups, connections)
2. Writing to Firestore (creating connections)
3. Shapes would appear briefly from cache, then disappear

## Root Causes Identified

1. **🔴 COLLECTION NAME MISMATCH (PRIMARY CAUSE)**: `canvas.ts` used `'canvas'` collection while `connections.ts` and Firestore rules used `'canvases'`
2. **Offline Persistence Interference**: Firebase's persistent cache was interfering with auth token propagation
3. **Auth Token Timing**: Firestore subscriptions were starting before auth tokens were fully ready
4. **No Token Verification**: No explicit verification that auth token was valid before attempting operations
5. **Missing Document Fields**: Canvas documents created before `groups` and `connections` were added were missing these required fields, causing permission errors

## Solutions Implemented

### 1. Fixed Collection Name Mismatch (CRITICAL FIX)

**File**: `collabcanvas/src/services/canvas.ts`

**Change**: Updated collection name from `'canvas'` to `'canvases'` to match Firestore rules and connections service.

```typescript
// Before:
const CANVAS_COLLECTION = 'canvas';

// After:
const CANVAS_COLLECTION = 'canvases'; // Must match Firestore rules collection name
```

**Why**: The Firestore security rules defined permissions for `match /canvases/{canvasId}`, but `canvas.ts` was trying to access `canvas/{canvasId}`. This caused all shape/group operations to fail with permission errors.

### 2. Disabled Offline Persistence (Temporary)

**File**: `collabcanvas/src/services/firebase.ts`

**Change**: Removed `persistentLocalCache` to use memory-only cache

```typescript
// Before:
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// After:
export const db = initializeFirestore(app, {
  // No localCache - use memory cache only
});
```

**Why**: Persistent cache can sometimes hold stale auth state or interfere with token propagation during login.

### 2. Explicit Auth Token Verification

**File**: `collabcanvas/src/hooks/useCanvas.ts`

**Changes**:
- Import `auth` from Firebase
- Wait for auth token explicitly using `getIdToken(true)` (force refresh)
- Added comprehensive debug logging
- Subscribe to Firestore only after token is confirmed valid

```typescript
const waitForAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('[useCanvas] No current user found');
    return;
  }
  
  // Force token refresh to ensure it's valid
  const token = await currentUser.getIdToken(true);
  console.log('[useCanvas] Auth token ready, length:', token.length);
  
  // Now subscribe to Firestore...
};
```

### 3. Token Verification Before Writes

**File**: `collabcanvas/src/services/connections.ts`

**Changes**:
- Import `auth` from Firebase
- Verify and refresh auth token before any write operation
- Added comprehensive debug logging
- Better error messages

```typescript
export async function addConnection(...) {
  console.log('[addConnection] Starting...');
  
  // Verify auth token before attempting write
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Must be authenticated to create connections');
  }
  
  // Force refresh token
  const token = await currentUser.getIdToken(true);
  console.log('[addConnection] Auth token verified');
  
  // Now perform the write...
}
```

### 4. Simplified Firestore Rules

**File**: `collabcanvas/firestore.rules`

Already had simplified rules (redeployed for certainty):

```javascript
match /canvases/{canvasId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated();
}
```

### 5. Canvas Document Verification

**File**: `collabcanvas/src/services/canvas.ts`

**New Function**: `ensureCanvasDocument()`

Created utility to verify canvas document exists with all required fields (`shapes`, `groups`, `connections`). This fixes documents that were created before these fields were added.

```typescript
export const ensureCanvasDocument = async (canvasId: string): Promise<void> => {
  // Verify auth token
  const currentUser = auth.currentUser;
  await currentUser.getIdToken(true);
  
  // Check if document exists
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    // Create new document with all required fields
    await initializeCanvas(canvasId);
  } else {
    // Add missing fields to existing document
    const data = canvasDoc.data();
    const updates: any = {};
    if (!data.shapes) updates.shapes = [];
    if (!data.groups) updates.groups = [];
    if (!data.connections) updates.connections = [];
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(canvasRef, updates);
    }
  }
}
```

**Integration**: Called automatically in `useCanvas.ts` before subscribing to Firestore.

### 6. Cache Clearing Utility

**File**: `collabcanvas/src/utils/clear-cache.ts`

Created utilities to clear Firestore cache and fix document structure:

```typescript
window.clearFirestoreCache(); // Clear IndexedDB and localStorage
window.ensureCanvasDocument(); // Fix document structure
```

## Debug Logging Added

All Firebase operations now log to console with `[componentName]` prefix:

- `[useCanvas]` - Subscription lifecycle
- `[addConnection]` - Connection write operations
- Token verification status
- Error details with context

## How to Test

1. **Hard refresh the browser** (Cmd+Shift+R / Ctrl+Shift+R)
2. **Clear browser cache completely** (or run `window.clearFirestoreCache()` in console)
3. **Sign out and sign in again**
4. **Watch the console** for debug logs showing:
   - Auth token verification
   - Subscription setup
   - Any remaining errors with full context

## Expected Console Output (Success)

```
[useCanvas] Not subscribing: { isAuthReady: false, userId: 'anonymous' }
[useCanvas] Waiting for auth token...
[useCanvas] Auth token ready, length: 1234
[useCanvas] Ensuring canvas document exists...
[ensureCanvasDocument] Checking canvas document: global-canvas-v1
[ensureCanvasDocument] Auth verified
[ensureCanvasDocument] Document exists, checking fields... ['canvasId', 'shapes', 'lastUpdated']
[ensureCanvasDocument] Adding missing fields: ['groups', 'connections']
[ensureCanvasDocument] Document updated successfully
[useCanvas] Canvas document verified
[useCanvas] Starting Firestore subscriptions...
[useCanvas] All subscriptions active
[useCanvas] Shapes updated: 5
[useCanvas] Groups updated: 0
[useCanvas] Connections updated: 2
```

## If Errors Persist

1. Check Firebase Console → Authentication → Users (verify user is signed in)
2. Check Firebase Console → Firestore → Usage (verify quota isn't exceeded)
3. Check browser console for `[useCanvas]` and `[addConnection]` logs
4. Try incognito/private window to rule out extension interference
5. Verify `.env` file has correct Firebase credentials

## Temporary Trade-offs

- **Offline support disabled**: Shapes won't load when offline
- **More network requests**: Memory cache is cleared on page refresh
- **Debug logging**: Extra console output (can be removed later)

## Next Steps (Once Working)

1. Re-enable offline persistence with better auth state management
2. Remove debug logging or move to debug-only mode
3. Add retry logic for transient permission errors
4. Implement exponential backoff for token refresh

