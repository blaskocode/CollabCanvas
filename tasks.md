# CollabCanvas MVP - Development Task List

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasControls.tsx
│   │   │   └── Shape.tsx
│   │   ├── Collaboration/
│   │   │   ├── Cursor.tsx
│   │   │   ├── UserPresence.tsx
│   │   │   └── PresenceList.tsx
│   │   ├── Layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   └── UI/
│   │       └── Toast.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── canvas.ts
│   │   └── presence.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── useCursors.ts
│   │   ├── usePresence.ts
│   │   └── useToast.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── types.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── CanvasContext.tsx
│   │   └── ToastContext.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   ├── utils/
│   │   │   └── helpers.test.js
│   │   ├── services/
│   │   │   ├── auth.test.js
│   │   │   └── canvas.test.js
│   │   └── contexts/
│   │       └── CanvasContext.test.js
│   └── integration/
│       ├── auth-flow.test.js
│       ├── canvas-sync.test.js
│       └── multiplayer.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── firebase.json
├── .firebaserc
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize project with all dependencies and Firebase configuration

### Tasks:

- [x] **1.1: Initialize React + Vite Project** ✅ COMPLETED

  - Files to create: `package.json`, `vite.config.ts`, `index.html`
  - Run: `npm create vite@latest collabcanvas -- --template react-ts`
  - Verify dev server runs

- [x] **1.2: Install Core Dependencies** ✅ COMPLETED

  - Files to update: `package.json`
  - Install:
    ```bash
    npm install firebase konva react-konva react-hot-toast
    npm install -D tailwindcss postcss autoprefixer
    npm install -D @types/react @types/react-dom
    npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
    ```

- [x] **1.3: Configure Tailwind CSS** ✅ COMPLETED

  - Files to create: `postcss.config.js`
  - Files to update: `src/index.css`
  - Installed: `@tailwindcss/postcss` for Tailwind v4 compatibility
  - Added Tailwind import to `index.css`

- [x] **1.4: Set Up Firebase Project** ✅ COMPLETED

  - Files created: `.env`, `.env.example`, `FIREBASE_SETUP.md`
  - Updated: `.gitignore` (added .env, .firebase, coverage)
  - ✅ Firebase project created in console
  - ✅ Authentication enabled (Email/Password AND Google)
  - ✅ Firestore database created (Production mode)
  - ✅ Realtime Database created (Locked mode)
  - ✅ Security rules configured for both databases
  - ✅ Firebase config copied and `.env` file updated

- [x] **1.5: Create Firebase Service File** ✅ COMPLETED

  - Files to create: `src/services/firebase.ts`, `src/vite-env.d.ts`
  - Initialize Firebase app with environment variables
  - Export `auth`, `db` (Firestore), `rtdb` (Realtime Database)
  - Use proper TypeScript types from Firebase SDK
  - Added offline persistence for Firestore
  - Added environment variable validation
  - Defined TypeScript types for env variables

- [x] **1.6: Configure Testing Infrastructure** ✅ COMPLETED

  - Files to create: `vitest.config.ts`, `tests/setup.ts`, `tests/unit/smoke.test.tsx`
  - Configure Vitest with jsdom environment
  - Set up Testing Library globals
  - Add test scripts to `package.json`:
    - `"test": "vitest"`
    - `"test:ui": "vitest --ui"`
    - `"test:coverage": "vitest --coverage"`
    - `"type-check": "tsc --noEmit"`
  - Created test directory structure (unit/, integration/)
  - Created basic smoke test to verify setup
  - Mock environment variables for tests
  - All tests passing (3/3)

- [x] **1.7: Set Up TypeScript Types** ✅ COMPLETED

  - Files to create: `src/utils/types.ts`
  - Define core types: `User`, `Shape`, `CursorPosition`, `PresenceUser`
  - Define context types: `AuthContextType`, `CanvasContextType`
  - Define utility types: `Position`, `Size`, `Bounds`, `AppError`
  - Define shape operation types: `ShapeCreateData`, `ShapeUpdateData`
  - Re-export Konva types for canvas rendering
  - Verify TypeScript compilation works: `npm run type-check` ✅

- [x] **1.8: Configure Git & .gitignore** ✅ COMPLETED

  - Files updated: `.gitignore` (completed in Task 1.4)
  - ✅ `.env` is properly ignored
  - ✅ `node_modules/`, `dist/`, `.firebase/`, `coverage/` in `.gitignore`
  - ✅ Environment variables (.env, .env.local, .env.*.local) ignored
  - ✅ Logs and editor files ignored
  - ✅ Git repository verified and working
  - ✅ All sensitive files properly excluded from version control

- [x] **1.9: Create README with Setup Instructions** ✅ COMPLETED
  - Files to create: `README.md`
  - ✅ Project overview and features
  - ✅ Tech stack documentation
  - ✅ Prerequisites and quick start guide
  - ✅ Setup steps with Firebase configuration
  - ✅ Environment variables documentation
  - ✅ All available npm scripts documented
  - ✅ Testing instructions
  - ✅ Project structure overview
  - ✅ Troubleshooting section
  - ✅ Links to FIREBASE_SETUP.md and other docs
  - ✅ Security notes and best practices

**PR Checklist:**

- [x] Dev server runs successfully (`npm run dev`) ✅
- [x] TypeScript compilation works without errors (`tsc --noEmit`) ✅
- [x] Firebase initialized without errors ✅
- [x] Tailwind classes work in test component ✅
- [x] Basic test runs successfully (`npm test`) ✅
- [x] `.env` is in `.gitignore` ✅

**🎉 PR #1 COMPLETE - Ready for Review!**

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with login/signup flows

### Tasks:

- [x] **2.1: Create Auth Context** ✅ COMPLETED

  - Files to create: `src/contexts/AuthContext.tsx`
  - Provide: `currentUser`, `loading`, `login()`, `signup()`, `logout()`
  - Define proper TypeScript interfaces for context value
  - Firebase auth state subscription with onAuthStateChanged
  - Integrated with auth service functions

- [x] **2.2: Create Auth Service** ✅ COMPLETED

  - Files to create: `src/services/auth.ts`
  - Functions: `signUp(email, password, displayName)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`, `updateUserProfile(displayName)`
  - Display name logic: Extract from Google profile or use email prefix
  - Truncate display names to 20 characters max
  - Use proper Firebase Auth types
  - User-friendly error messages with `getAuthErrorMessage()`
  - Handles all Firebase auth error codes

- [x] **2.3: Create Auth Hook** ✅ COMPLETED

  - Files to create: `src/hooks/useAuth.ts`
  - Return auth context values
  - Proper TypeScript return type
  - JSDoc documentation

- [x] **2.4: Build Signup Component** ✅ COMPLETED

  - Files to create: `src/components/Auth/Signup.tsx`
  - Form fields: email, password, display name (max 20 chars)
  - Handle signup errors with toast notifications
  - Redirect to canvas on success
  - Form validation (email, password length)
  - Google sign-up button with Google icon
  - Link to login page
  - Loading states during auth operations
  - Beautiful responsive UI with Tailwind CSS

- [x] **2.5: Build Login Component** ✅ COMPLETED

  - Files to create: `src/components/Auth/Login.tsx`
  - Form fields: email, password
  - "Sign in with Google" button with Google icon
  - Handle login errors with toast notifications
  - Link to signup page
  - Form validation
  - Loading states during auth operations
  - Beautiful responsive UI with Tailwind CSS

- [x] **2.6: Create Toast System** ✅ COMPLETED

  - Files to create: `src/components/UI/Toast.tsx`, `src/hooks/useToast.ts`
  - Integrate `react-hot-toast`
  - Provide toast notifications for errors and success messages
  - Configure toast position and styling (top-right)
  - Custom styling for success, error, and loading states
  - Wrap in useToast hook for easy access

- [x] **2.7: Create Auth Provider Wrapper** ✅ COMPLETED

  - AuthProvider already created in Task 2.1 (`src/contexts/AuthContext.tsx`)
  - Integrated directly in App.tsx
  - Shows loading state during auth check
  - Wraps entire app with authentication context

- [x] **2.8: Update App.tsx with Protected Routes** ✅ COMPLETED

  - Files to update: `src/App.tsx`
  - Installed react-router-dom for routing
  - Created ProtectedRoute component for authenticated pages
  - Created PublicRoute component (redirects if already logged in)
  - Show Login/Signup if not authenticated
  - Show Canvas placeholder if authenticated
  - Loading states during auth checks
  - Automatic redirects based on auth state
  - Catch-all route for 404s
  - Integrated AuthProvider and ToastContainer

- [x] **2.9: Create Navbar Component** ✅ COMPLETED
  - Files to create: `src/components/Layout/Navbar.tsx`
  - Display current user name (or email if no name)
  - User avatar with first initial
  - Logout button with confirmation toast
  - Only shows when user is authenticated
  - Clean, responsive design with Tailwind CSS

**PR Checklist:**

- [x] All components created and integrated ✅
- [x] TypeScript compilation successful ✅
- [x] Dev server runs without errors ✅
- [x] Routing works (login, signup, protected routes) ✅
- [x] Can create new account with email/password ✅
- [x] Can login with existing account ✅
- [x] Can sign in with Google ✅
- [x] Display name appears correctly (Google name or email prefix) ✅
- [x] Display name truncates at 20 chars if too long ✅
- [x] Logout works and redirects to login ✅
- [x] Auth state persists on page refresh ✅

**Note:** All functional auth testing has been completed with Firebase credentials.

**✅ PR #2 COMPLETE - ALL TESTS PASSED!**

---

## PR #3: Basic Canvas Rendering

**Branch:** `feature/canvas-basic`  
**Goal:** Canvas with pan, zoom, and basic stage setup

### Tasks:

- [x] **3.1: Create Canvas Constants** ✅ COMPLETED

  - Files to create: `src/utils/constants.ts`
  - Define: `CANVAS_WIDTH = 5000`, `CANVAS_HEIGHT = 5000`
  - Note: `VIEWPORT_WIDTH` and `VIEWPORT_HEIGHT` will be calculated dynamically from window dimensions
  - Define: `MIN_ZOOM = 0.1`, `MAX_ZOOM = 3`
  - Define: User color palette (10 colors with good contrast)

- [x] **3.2: Create Canvas Context** ✅ COMPLETED

  - Files to create: `src/contexts/CanvasContext.tsx`
  - State: `shapes`, `selectedId`, `stageRef`
  - Provide methods to add/update/delete shapes
  - Define proper TypeScript interfaces for context value
  - Includes: `addShape()`, `updateShape()`, `deleteShape()`, `selectShape()`

- [x] **3.3: Build Base Canvas Component** ✅ COMPLETED

  - Files to create: `src/components/Canvas/Canvas.tsx`
  - Set up Konva Stage and Layer
  - Container div with dimensions based on viewport
  - Background color (gray-100)
  - Dynamic viewport sizing based on window dimensions

- [x] **3.4: Implement Pan Functionality** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle `onDragEnd` on Stage
  - Constrain panning to canvas bounds (5000x5000px)
  - Added 100px padding to keep canvas edges visible
  - Smooth panning experience

- [x] **3.5: Implement Zoom Functionality** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle `onWheel` event
  - Zoom to cursor position
  - Min zoom: 0.1, Max zoom: 3
  - Smooth zooming experience with 1.05 scale factor

- [x] **3.6: Create Canvas Controls Component** ✅ COMPLETED

  - Files to create: `src/components/Canvas/CanvasControls.tsx`
  - Buttons: "Zoom In", "Zoom Out", "Reset View", "Add Shape"
  - Position: Fixed/floating on canvas (top-right)
  - Display current zoom level as percentage
  - Help text for pan/zoom controls
  - Disabled states for zoom buttons at limits

- [x] **3.7: Add Canvas to App** ✅ COMPLETED
  - Files to update: `src/App.tsx`
  - Wrap Canvas in CanvasProvider
  - Include Navbar and Canvas in CanvasPage component
  - Proper layout with flex structure
  - Integrated into protected route

**PR Checklist:**

- [x] Canvas renders at correct size (5000x5000px) ✅
- [x] Can pan by dragging canvas background ✅
- [x] Can zoom with mousewheel ✅
- [x] Zoom centers on cursor position ✅
- [x] Reset view button works ✅
- [x] Canvas boundaries are enforced with padding ✅
- [x] Smooth performance maintained during pan/zoom ✅
- [x] TypeScript compilation successful ✅
- [x] No linter errors ✅

**✅ PR #3 COMPLETE - Ready for Review!**

---

## PR #4: Shape Creation & Manipulation

**Branch:** `feature/shapes`  
**Goal:** Create, select, and move shapes on canvas

### Tasks:

- [x] **4.1: Create Shape Component** ✅ COMPLETED

  - Files to create: `src/components/Canvas/Shape.tsx`
  - Support: **Rectangles only for MVP**
  - Props: `id`, `x`, `y`, `width`, `height`, `fill`, `isSelected`, `isLocked`, `lockedBy`, `onSelect`, `onDragEnd`
  - Define proper TypeScript interface for Shape props
  - Visual feedback: blue border for selected, red border for locked
  - Shadow effect for selected shapes
  - Transformer component integrated (disabled for MVP)

- [x] **4.2: Add Shape Creation Logic** ✅ COMPLETED

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `addShape(type, position)`
  - Generate unique ID using Firebase `doc().id` method
  - Default properties: 100x100px from constants, gray fill (#cccccc)
  - Include metadata: `createdBy` (currentUser.uid), `createdAt`
  - Uses constants for default dimensions and fill color

- [x] **4.3: Implement Shape Rendering** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Map over `shapes` array
  - Render Shape component for each with all required props
  - Proper TypeScript typing for shape array
  - Pass selection state, lock state, and callbacks

- [x] **4.4: Add Shape Selection** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Handle `onClick` and `onTap` to set selected
  - Visual feedback: blue border (2px) when selected
  - Shadow effect (10px blur) for selected shapes
  - Event bubbling properly handled (cancelBubble)
  - Already integrated in Canvas component with selectedId state

- [x] **4.5: Implement Shape Dragging** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Enable `draggable={!isLocked}` - only if not locked
  - Handle `onDragEnd` to update position
  - Handle `onDragMove` to enforce boundaries during drag
  - Enforce canvas boundaries (0 to CANVAS_WIDTH/HEIGHT minus shape size)
  - Position constraints applied in real-time
  - Update function integrated with Canvas context

- [x] **4.6: Add Click-to-Deselect** ✅ COMPLETED

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Already implemented in PR #3
  - Handle Stage `onClick` and `onTap` to deselect when clicking background
  - Verified working with shape selection

- [x] **4.7: Connect "Add Shape" Button** ✅ COMPLETED

  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Already implemented in PR #3
  - Button creates shape at center of current viewport
  - Calculate center based on current pan/zoom state
  - Converts screen coordinates to canvas coordinates
  - Verified working with new shape creation logic

- [x] **4.8: Add Delete Functionality** ✅ COMPLETED
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `deleteShape(id)` already implemented
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add keyboard listener for Delete/Backspace key with useEffect
  - Delete selected shape when key pressed
  - Prevent default browser behavior
  - Check if shape is locked before deletion
  - Show toast notification when attempting to delete locked shape
  - Cleanup event listener on unmount

- [x] **4.9: Fix Canvas Auto-Pan During Shape Dragging** ✅ COMPLETED 🐛 BUG FIX

  - **Issue**: Canvas sometimes auto-pans to random locations when dragging shapes, or conflicts with stage dragging
  - **Requirements**:
    - Canvas should NOT shift when dragging objects in the center of viewport ✅
    - ONLY auto-pan when shape is dragged near the edge of the viewport (within 50px of viewport edge) ✅
    - Auto-pan should be smooth and gradual (not jumpy) ✅
    - Pan direction should match the direction of the drag ✅
    - Must not conflict with stage's native draggable property ✅
    - Auto-pan should stop immediately when drag ends ✅
  - Files updated: `src/components/Canvas/Canvas.tsx`, `src/components/Canvas/Shape.tsx`, `src/utils/constants.ts`
  - **Critical Fixes**:
    - **STAGE DRAGGING DISABLED DURING SHAPE DRAG**: Set `draggable={!isDraggingShape}` on Stage to prevent canvas movement when dragging shapes ✅
    - **EVENT BUBBLING PREVENTION**: Added `e.cancelBubble = true` to all shape drag events (start, move, end) ✅
    - **PROPER NULL CHECKS**: Fixed TypeScript errors with proper stageRef null checking ✅
  - Implementation:
    - Added `onDragStart` callback to Shape component to notify Canvas ✅
    - Track dragging state with `isDraggingShape` and `autoPanFrameId` ref ✅
    - Use `requestAnimationFrame` for smooth 60fps auto-pan updates ✅
    - Defined edge threshold constants in constants.ts (50px, min/max speeds) ✅
    - Calculate pan speed based on distance from edge using intensity formula ✅
    - Only apply auto-pan when actively dragging AND within threshold of viewport edge ✅
    - Proper cleanup of animation frame on drag end and unmount ✅
    - Uses `useCallback` for memoized handlers to prevent re-renders ✅

- [x] **4.10: Fix Dynamic Minimum Zoom to Fit Canvas** ✅ COMPLETED 🐛 BUG FIX

  - **Issue**: When zoomed out to minimum (10%), canvas locks to upper-right corner and user can see outside canvas boundaries
  - **Requirements**:
    - Minimum zoom should be calculated dynamically based on viewport dimensions ✅
    - At minimum zoom, ENTIRE canvas (5000x5000px) should be visible in viewport ✅
    - Allow seeing full larger dimension, even if smaller dimension has empty space ✅
    - Minimum zoom = min(viewportWidth/canvasWidth, viewportHeight/canvasHeight) ✅
    - Uses smaller ratio to ensure entire canvas fits in viewport ✅
    - Canvas should be CENTERED horizontally or vertically at minimum zoom ✅
    - Recalculate minimum zoom on window resize ✅
  - Files updated: `src/components/Canvas/Canvas.tsx`, `src/components/Canvas/CanvasControls.tsx`
  - Implementation:
    - Added `minZoom` state variable calculated dynamically ✅
    - Calculate minimum zoom in resize handler using `Math.min(width/CANVAS_WIDTH, height/CANVAS_HEIGHT)` ✅
    - Takes SMALLER ratio to ensure entire canvas is visible ✅
    - Initial calculation on component mount ✅
    - Update min zoom on window resize ✅
    - Auto-adjust current zoom if below new minimum ✅
    - Applied minimum zoom constraint to all zoom operations (wheel, zoom out button) ✅
    - Pass `minZoom` to CanvasControls component ✅
    - Updated CanvasControls to use dynamic minZoom instead of static MIN_ZOOM ✅
    - Zoom out button correctly disables at calculated minimum ✅
    - **CENTERING LOGIC**: Added `centerCanvasAtMinZoom()` function ✅
    - Centers canvas horizontally if viewport width > scaled canvas width ✅
    - Centers canvas vertically if viewport height > scaled canvas height ✅
    - Centering applied when: zooming to minimum (wheel/button), window resize, reset view ✅
    - Reset view now zooms to minimum and centers (instead of zoom 1 at 0,0) ✅

**PR Checklist:**

- [x] Can create rectangles via button ✅
- [x] Rectangles render at correct positions with gray fill ✅
- [x] Can select rectangles by clicking ✅
- [x] Can drag rectangles smoothly ✅
- [x] Selection state shows visually (blue border + shadow) ✅
- [x] Can delete selected rectangle with Delete/Backspace key ✅
- [x] Clicking another shape deselects the previous one ✅
- [x] Clicking empty canvas deselects current selection ✅
- [x] Objects cannot be moved outside canvas boundaries ✅
- [x] Canvas auto-pans smoothly when dragging shapes near viewport edge ✅
- [x] Canvas does NOT auto-pan when dragging shapes in center of viewport ✅
- [x] No conflicts between shape dragging and stage panning ✅
- [x] Shapes stay within canvas boundaries when created ✅
- [x] Minimum zoom dynamically calculated to show entire canvas in viewport ✅
- [x] At minimum zoom, entire canvas (all 5000x5000px) is visible ✅
- [x] Canvas is centered horizontally or vertically at minimum zoom ✅
- [x] Empty space is evenly distributed on sides when centered ✅
- [x] Minimum zoom updates when window is resized ✅
- [x] Reset view button zooms to minimum and centers canvas ✅
- [x] TypeScript compilation successful ✅
- [x] No linter errors ✅

**✅ PR #4 COMPLETE - All Features & Bug Fixes Implemented!**

---

## PR #5: Real-Time Shape Synchronization

**Branch:** `feature/realtime-sync`  
**Goal:** Sync shape changes across all connected users

### Tasks:

- [ ] **5.1: Design Firestore Schema**

  - Collection: `canvas` (single document: `global-canvas-v1`)
  - Document structure:
    ```typescript
    {
      canvasId: "global-canvas-v1",
      shapes: [
        {
          id: string,
          type: 'rectangle',
          x: number,
          y: number,
          width: number,
          height: number,
          fill: string,
          createdBy: string (userId),
          createdAt: timestamp,
          lastModifiedBy: string,
          lastModifiedAt: timestamp,
          isLocked: boolean,
          lockedBy: string (userId) or null,
          lockedAt: timestamp or null
        }
      ],
      lastUpdated: timestamp
    }
    ```
  - Define TypeScript interfaces in `src/utils/types.ts`

- [ ] **5.2: Create Canvas Service**

  - Files to create: `src/services/canvas.ts`
  - Function: `subscribeToShapes(canvasId, callback)`
  - Function: `createShape(canvasId, shapeData)`
  - Function: `updateShape(canvasId, shapeId, updates)`
  - Function: `deleteShape(canvasId, shapeId)`
  - Proper TypeScript types for all functions

- [ ] **5.3: Create Canvas Hook**

  - Files to create: `src/hooks/useCanvas.ts`
  - Subscribe to Firestore on mount with `onSnapshot`
  - Sync local state with Firestore
  - Return: `shapes`, `loading`, `addShape()`, `updateShape()`, `deleteShape()`
  - Enable Firestore offline persistence

- [ ] **5.4: Integrate Real-Time Updates in Context**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Replace local state with `useCanvas` hook
  - Listen to Firestore changes
  - Update local shapes array on remote changes
  - Handle optimistic updates for better UX

- [ ] **5.5: Implement Object Locking (Client-Side)**

  - Files to update: `src/services/canvas.ts`
  - Strategy: First user to select/drag acquires lock
  - Function: `lockShape(canvasId, shapeId, userId)`
  - Function: `unlockShape(canvasId, shapeId)`
  - Function: `checkAndReleaseStaleLocks(shapes)` - releases locks older than 5 seconds
  - Files to update: `src/components/Canvas/Shape.tsx`
  - Lock shape on `onDragStart` or selection
  - Unlock shape on `onDragEnd` or deselection
  - Visual indicator showing which user has locked an object (colored border matching user's cursor color)
  - Prevent dragging if shape is locked by another user

- [ ] **5.6: Implement Lock Timeout (Hybrid Approach)**

  - Files to update: `src/hooks/useCanvas.ts`
  - Client-side: Set up interval to check for stale locks every 2 seconds
  - Call `checkAndReleaseStaleLocks()` to auto-release locks older than 5 seconds
  - Files to update: `src/services/presence.ts`
  - Use RTDB `onDisconnect()` to clear all user's locks when they disconnect
  - Store mapping of userId to locked shape IDs in RTDB

- [ ] **5.7: Add Loading States**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Show loading spinner while initial shapes load
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Display "Loading canvas..." message with spinner

- [ ] **5.8: Handle Offline/Reconnection**
  - Files to update: `src/hooks/useCanvas.ts`
  - Firestore offline persistence already enabled in 5.3
  - Add connection status listener
  - Show toast notification when user goes offline/online

**PR Checklist:**

- [ ] Open two browsers: creating shape in one appears in other
- [ ] User A starts dragging shape → shape locks for User A
- [ ] User B cannot move shape while User A has it locked
- [ ] Lock shows visual indicator (e.g., different border color)
- [ ] Lock releases automatically when User A stops dragging
- [ ] Lock releases after timeout (3-5 seconds) if User A disconnects mid-drag
- [ ] Moving shape in one browser updates in other (<100ms)
- [ ] Deleting shape in one removes from other
- [ ] Cannot delete shapes locked by other users
- [ ] Page refresh loads all existing shapes
- [ ] All users leave and return: shapes still there
- [ ] No duplicate shapes or sync issues

---

## PR #6: Multiplayer Cursors

**Branch:** `feature/cursors`  
**Goal:** Real-time cursor tracking for all connected users

### Tasks:

- [ ] **6.1: Design Realtime Database Schema**

  - Path: `/sessions/global-canvas-v1/{userId}`
  - Data structure:
    ```typescript
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp,
      lockedShapes: string[] // Array of shape IDs locked by this user
    }
    ```
  - Define TypeScript interfaces in `src/utils/types.ts`

- [ ] **6.2: Create Cursor Service**

  - Files to create: `src/services/cursors.ts`
  - Function: `updateCursorPosition(canvasId, userId, x, y, name, color)`
  - Function: `subscribeToCursors(canvasId, callback)`
  - Function: `removeCursor(canvasId, userId)` (on disconnect)
  - Proper TypeScript types for all functions

- [ ] **6.3: Create Cursors Hook**

  - Files to create: `src/hooks/useCursors.ts`
  - Track mouse position on canvas
  - Convert screen coords to canvas coords (account for pan/zoom)
  - Throttle updates to meet <50ms requirement (30-40 FPS is sufficient)
  - Return: `cursors` object (keyed by userId)
  - Proper TypeScript return types

- [ ] **6.4: Build Cursor Component**

  - Files to create: `src/components/Collaboration/Cursor.tsx`
  - SVG cursor icon with user color
  - Name label next to cursor (truncated if needed)
  - Smooth CSS transitions for movement
  - Position absolutely on canvas

- [ ] **6.5: Integrate Cursors into Canvas**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add `onMouseMove` handler to Stage
  - Update cursor position in RTDB
  - Render Cursor components for all other users (not own cursor)
  - Filter out current user's cursor from display

- [ ] **6.6: Assign User Colors**

  - Files to update: `src/utils/helpers.ts`
  - Function: `generateUserColor(userId)` - deterministically assigned based on userId hash
  - Use color palette from constants (defined in PR #3, task 3.1)
  - Return consistent color for same userId across sessions
  - Export color palette for use in other components

- [ ] **6.7: Handle Cursor Cleanup**

  - Files to update: `src/hooks/useCursors.ts`
  - Remove cursor on component unmount
  - Use `onDisconnect()` in RTDB to auto-cleanup
  - Clean up event listeners

- [ ] **6.8: Optimize Cursor Updates**
  - Files to update: `src/hooks/useCursors.ts`
  - Throttle mouse events to 30-40ms (25-33 FPS)
  - Only send if position changed significantly (>2px)
  - Use requestAnimationFrame for smooth updates

**PR Checklist:**

- [ ] Moving mouse shows cursor to other users
- [ ] Cursor has correct user name and color
- [ ] Cursors move smoothly without jitter
- [ ] Cursor disappears when user leaves
- [ ] Updates happen within 50ms
- [ ] No performance impact with 5 concurrent cursors

---

## PR #7: User Presence System

**Branch:** `feature/presence`  
**Goal:** Show who's online and active on the canvas

### Tasks:

- [ ] **7.1: Design Presence Schema**

  - Path: `/sessions/global-canvas-v1/{userId}` (same as cursors)
  - Data structure (combined with cursor data):
    ```typescript
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp,
      lockedShapes: string[]
    }
    ```
  - Note: Presence and cursor data share same RTDB location (already defined in PR #6)

- [ ] **7.2: Create Presence Service**

  - Files to create: `src/services/presence.ts`
  - Function: `setUserOnline(canvasId, userId, name, color)`
  - Function: `setUserOffline(canvasId, userId)`
  - Function: `subscribeToPresence(canvasId, callback)`
  - Function: `updateLockedShapes(canvasId, userId, shapeIds)` - for lock tracking
  - Use `onDisconnect()` to auto-set offline and clear locks
  - Proper TypeScript types

- [ ] **7.3: Create Presence Hook**

  - Files to create: `src/hooks/usePresence.ts`
  - Set user online on mount with assigned color
  - Subscribe to presence changes
  - Return: `onlineUsers` array
  - Proper TypeScript return types

- [ ] **7.4: Build Presence List Component**

  - Files to create: `src/components/Collaboration/PresenceList.tsx`
  - Display list of online users (excluding current user)
  - Show user color dot + name (truncated)
  - Show count: "3 users online" or "You are alone"
  - Smooth animations for user join/leave

- [ ] **7.5: Build User Presence Badge**

  - Files to create: `src/components/Collaboration/UserPresence.tsx`
  - Avatar circle with user's first initial
  - Background color matches cursor color
  - Tooltip with full name on hover
  - Used within PresenceList

- [ ] **7.6: Add Presence to Navbar**

  - Files to update: `src/components/Layout/Navbar.tsx`
  - Include PresenceList component
  - Position in top-right corner (before logout button)
  - Responsive layout

- [ ] **7.7: Integrate Presence System**
  - Files to update: `src/App.tsx`
  - Initialize presence when canvas loads
  - Clean up on unmount
  - Ensure presence is set before canvas is accessible

**PR Checklist:**

- [ ] Current user appears in presence list
- [ ] Other users appear when they join
- [ ] Users disappear when they leave
- [ ] User count is accurate
- [ ] Colors match cursor colors
- [ ] Updates happen in real-time

---

## PR #8: Testing, Polish & Bug Fixes

**Branch:** `fix/testing-polish`  
**Goal:** Ensure MVP requirements are met and fix critical bugs

### Tasks:

- [ ] **8.1: Multi-User Testing**

  - Test with 2-5 concurrent users
  - Create shapes simultaneously
  - Move shapes simultaneously
  - Check for race conditions

- [ ] **8.2: Performance Testing**

  - Create 500+ shapes and test FPS
  - Test pan/zoom with many objects
  - Monitor Firestore read/write counts
  - Optimize if needed

- [ ] **8.3: Persistence Testing**

  - All users leave canvas
  - Return and verify shapes remain
  - Test page refresh mid-edit
  - Test browser close and reopen

- [ ] **8.4: Error Handling**

  - Files to update: All service files (`src/services/*.ts`)
  - Add try/catch blocks around all Firebase operations
  - Display user-friendly error messages via toast notifications
  - Handle network failures gracefully
  - Log errors to console for debugging
  - Add proper TypeScript error types

- [ ] **8.5: UI Polish**

  - Files to update: All component files
  - Consistent spacing and colors (Tailwind utilities)
  - Responsive button states (hover, active, disabled)
  - Loading states for all async operations
  - Smooth transitions and animations
  - Ensure accessibility (ARIA labels, keyboard navigation)

- [ ] **8.6: Verify Keyboard Shortcuts**

  - Files to verify: `src/components/Canvas/Canvas.tsx`
  - Delete/Backspace key: delete selected shape (already implemented in PR #4)
  - Escape key: deselect (optional enhancement, implement if time allows)
  - Note: Undo/redo is out of scope for MVP

- [ ] **8.7: Cross-Browser Testing**

  - Test in Chrome (primary browser)
  - Test in Firefox
  - Test in Safari
  - Fix any compatibility issues
  - Document browser requirements in README

- [ ] **8.8: TypeScript Compilation Check**

  - Run: `tsc --noEmit` to check for type errors
  - Fix all TypeScript errors
  - Ensure no `any` types in critical paths
  - Add JSDoc comments for complex functions

- [ ] **8.9: Document Known Issues**
  - Files to update: `README.md`
  - List any known bugs or limitations
  - Add troubleshooting section
  - Document browser compatibility
  - Add performance considerations

**PR Checklist:**

- [ ] All MVP requirements pass
- [ ] No console errors
- [ ] Smooth performance on test devices
- [ ] Works in multiple browsers
- [ ] Error messages are helpful

---

## PR #9: Deployment & Final Prep

**Branch:** `deploy/production`  
**Goal:** Deploy to production and finalize documentation

### Tasks:

- [ ] **9.1: Configure Firebase Hosting**

  - Files to create: `firebase.json`, `.firebaserc`
  - Run: `firebase init hosting`
  - Set public directory to `dist`

- [ ] **9.2: Update Environment Variables**

  - Create production Firebase project (or use same)
  - Files to update: `.env.example`
  - Document all required env vars

- [ ] **9.3: Build Production Bundle**

  - Run: `npm run build`
  - Test production build locally
  - Check bundle size

- [ ] **9.4: Deploy to Firebase Hosting**

  - Run: `firebase deploy --only hosting`
  - Test deployed URL
  - Verify all features work in production

- [ ] **9.5: Set Up Firestore Security Rules**

  - Files to create: `firestore.rules`
  - Allow authenticated users to read/write
  - Validate shape schema
  - Deploy rules: `firebase deploy --only firestore:rules`

- [ ] **9.6: Set Up Realtime Database Rules**

  - Files to create: `database.rules.json`
  - Allow authenticated users read/write
  - Deploy rules: `firebase deploy --only database`

- [ ] **9.7: Update README with Deployment Info**

  - Files to update: `README.md`
  - Add live demo link
  - Add deployment instructions
  - Add architecture diagram (optional)

- [ ] **9.8: Final Production Testing**

  - Test with 5 concurrent users on deployed URL
  - Verify auth works
  - Verify shapes sync
  - Verify cursors work
  - Verify presence works

- [ ] **9.9: Create Demo Video Script**
  - Outline key features to demonstrate
  - Prepare 2-3 browser windows for demo

**PR Checklist:**

- [ ] App deployed and accessible via public URL
- [ ] Auth works in production
- [ ] Real-time features work in production
- [ ] 5+ concurrent users tested successfully
- [ ] README has deployment link and instructions
- [ ] Security rules deployed and working

---

## MVP Completion Checklist

### Required Features:

- [ ] Basic canvas with pan/zoom (5000x5000px with boundaries)
- [ ] Rectangle shapes with gray fill (#cccccc)
- [ ] Ability to create, move, and delete objects
- [ ] Object locking (first user to drag locks the object)
- [ ] Real-time sync between 2+ users (<100ms)
- [ ] Multiplayer cursors with name labels and unique colors
- [ ] Presence awareness (who's online)
- [ ] User authentication (email/password AND Google login)
- [ ] Deployed and publicly accessible

### Performance Targets:

- [ ] 60 FPS during all interactions
- [ ] Shape changes sync in <100ms
- [ ] Cursor positions sync in <50ms
- [ ] Support 500+ simple objects without FPS drops
- [ ] Support 5+ concurrent users without degradation

### Testing Scenarios:

- [ ] 2 users editing simultaneously in different browsers
- [ ] User A drags shape → User B sees it locked and cannot move it
- [ ] Lock releases when User A stops dragging → User B can now move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] One user refreshing mid-edit confirms state persistence
- [ ] Multiple shapes created and moved rapidly to test sync performance
- [ ] Test with 500+ rectangles to verify performance target

---

## Post-MVP: Phase 2 Preparation

**Next PRs (After MVP Deadline):**

- PR #10: Multiple shape types (circles, text)
- PR #11: Shape styling (colors, borders)
- PR #12: Resize and rotate functionality
- PR #13: AI agent integration
- PR #14: Multi-select and grouping
- PR #15: Undo/redo system

---

---

# APPENDIX: Configuration Reference

## Environment Variables

### Required Environment Variables (`.env`)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Database URLs
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com

# Optional: Environment indicator
VITE_APP_ENV=development
```

### `.env.example` Template

```env
# Firebase Configuration (Get these from Firebase Console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=

# Environment
VITE_APP_ENV=development
```

---

## Firebase Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a Project"
3. Enter project name (e.g., `collabcanvas-mvp`)
4. Disable Google Analytics (optional for MVP)
5. Click "Create Project"

### 2. Set Up Firebase Authentication

1. In Firebase Console, navigate to **Build > Authentication**
2. Click "Get Started"
3. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Toggle "Email link (passwordless sign-in)" to OFF (not needed for MVP)
   - Click "Save"
4. Enable **Google** provider:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Select support email from dropdown
   - Click "Save"

### 3. Set Up Cloud Firestore

1. In Firebase Console, navigate to **Build > Firestore Database**
2. Click "Create Database"
3. **Select Mode**: Choose **Production Mode** (recommended)
   - Production mode starts with secure rules
   - You'll update rules later in deployment
4. **Select Location**: Choose closest region to your users
   - `us-central` (Iowa) - Good for North America
   - `europe-west1` (Belgium) - Good for Europe
   - `asia-northeast1` (Tokyo) - Good for Asia
   - **Note**: Location cannot be changed later
5. Click "Enable"

**Production vs Development Mode:**
- **Production Mode** (✅ Recommended): Restrictive rules from start, more secure
- **Development Mode** (❌ Not Recommended): Open access for 30 days, security risk

### 4. Set Up Realtime Database

1. In Firebase Console, navigate to **Build > Realtime Database**
2. Click "Create Database"
3. **Select Location**: Choose same or nearby region as Firestore
4. **Select Mode**: Choose **Locked Mode** (recommended)
   - Locked mode denies all access by default
   - You'll add proper rules later
5. Click "Enable"

**Locked vs Test Mode:**
- **Locked Mode** (✅ Recommended): All read/write denied by default
- **Test Mode** (❌ Not Recommended): All read/write allowed, major security risk

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Web** icon (`</>`) to add a web app
4. Register app:
   - App nickname: `CollabCanvas Web`
   - Firebase Hosting: Check this box (you'll use it for deployment)
   - Click "Register app"
5. Copy the configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
     databaseURL: "..."
   };
   ```
6. Paste these values into your `.env` file with `VITE_` prefix

### 6. Initial Security Rules (For Development)

**Firestore Rules** (Basic authenticated-only access):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{canvasId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules** (Basic authenticated-only access):
```json
{
  "rules": {
    "sessions": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

**Note**: You'll update these rules with better validation in PR #9.

---

## Application Constants

### Canvas Configuration (`src/utils/constants.ts`)

```typescript
// Canvas dimensions
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Viewport dimensions (calculated dynamically)
// VIEWPORT_WIDTH = window.innerWidth
// VIEWPORT_HEIGHT = window.innerHeight - navbarHeight

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

// Shape defaults
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_SHAPE_FILL = '#cccccc';

// Lock timeout (milliseconds)
export const LOCK_TIMEOUT_MS = 5000; // 5 seconds
export const LOCK_CHECK_INTERVAL_MS = 2000; // Check every 2 seconds

// Cursor update throttling
export const CURSOR_UPDATE_THROTTLE_MS = 33; // ~30 FPS (meets <50ms requirement)
export const CURSOR_POSITION_THRESHOLD_PX = 2; // Only update if moved >2px

// Display name constraints
export const MAX_DISPLAY_NAME_LENGTH = 20;
```

### User Color Palette (`src/utils/constants.ts`)

**Requirements:**
- 8-10 distinct colors
- High contrast against white/light backgrounds
- Easily distinguishable from each other
- Professional and visually appealing

```typescript
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
] as const;

export type UserColor = typeof USER_COLORS[number];
```

**Color Selection Logic:**
```typescript
// Deterministic color assignment based on userId
export function generateUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
```

---

## Lock Timeout Configuration

### Hybrid Lock Timeout Strategy

**Client-Side Timer:**
- Check for stale locks every 2 seconds (`LOCK_CHECK_INTERVAL_MS`)
- Release locks older than 5 seconds (`LOCK_TIMEOUT_MS`)
- Implemented in `src/hooks/useCanvas.ts`

**Server-Side (RTDB onDisconnect):**
- When user disconnects, clear their locked shapes
- Implemented in `src/services/presence.ts`
- Uses Firebase RTDB `onDisconnect()` callback

**Lock Flow:**
1. User starts dragging shape → Lock acquired (set `isLocked: true`, `lockedBy: userId`, `lockedAt: timestamp`)
2. User finishes dragging → Lock released immediately
3. If user doesn't release (crash/disconnect):
   - Client-side: Other users detect stale lock after 5 seconds and clear it
   - Server-side: `onDisconnect()` clears all user's locks when they disconnect
4. Visual feedback: Locked shapes show colored border matching locker's cursor color

**Implementation Notes:**
- Store `lockedAt` timestamp in Firestore
- Store `lockedShapes` array in RTDB for quick disconnect cleanup
- Check timestamp on client-side: `Date.now() - lockedAt > LOCK_TIMEOUT_MS`
- Prevents race conditions with "first lock wins" strategy

---

## TypeScript Configuration

### Core Type Definitions (`src/utils/types.ts`)

```typescript
import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Shape types
export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
}

// Canvas document structure
export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: Timestamp;
}

// Cursor and presence types
export interface CursorPosition {
  userId: string;
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
  cursorColor: string;
  lastSeen: number;
  lockedShapes: string[];
}

// Context types
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  loading: boolean;
  stageRef: React.RefObject<Konva.Stage> | null;
  addShape: (type: 'rectangle', position: { x: number; y: number }) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  selectShape: (id: string | null) => void;
}
```

---

## NPM Scripts

### `package.json` Scripts Section

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "firebase:emulators": "firebase emulators:start",
    "deploy": "npm run build && firebase deploy"
  }
}
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run type-check       # Check TypeScript types without building

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report

# Build & Deploy
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run deploy           # Build and deploy to Firebase Hosting

# Firebase Emulators (for local testing)
npm run firebase:emulators  # Start Firebase emulators
```

---

## Firebase CLI Installation

### Install Firebase Tools

```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (during PR #9)
firebase init
```

### Firebase Initialization (PR #9)

When running `firebase init`, select:
- ✅ Firestore
- ✅ Realtime Database
- ✅ Hosting

Configuration:
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Realtime Database rules: `database.rules.json`
- Hosting public directory: `dist`
- Single-page app: `yes`
- Automatic builds/deploys: `no`

---

## Troubleshooting

### Common Issues

**1. Firebase config not found:**
- Ensure `.env` file exists in project root
- Verify all `VITE_FIREBASE_*` variables are set
- Restart dev server after changing `.env`

**2. TypeScript errors:**
- Run `npm install --save-dev @types/react @types/react-dom`
- Run `tsc --noEmit` to see all type errors
- Check `tsconfig.json` includes `"jsx": "react-jsx"`

**3. Cursor positions not syncing:**
- Verify Realtime Database URL in `.env`
- Check RTDB security rules allow authenticated access
- Check browser console for RTDB connection errors

**4. Shapes not persisting:**
- Verify Firestore is enabled in Firebase Console
- Check Firestore security rules
- Look for errors in browser console

**5. Authentication not working:**
- Verify Auth providers enabled in Firebase Console
- For Google login: Ensure authorized domain added (localhost for dev)
- Check Firebase Auth config in `.env`

---

## Performance Benchmarks

### Target Performance Metrics

- **60 FPS** during pan/zoom operations
- **<100ms** for shape synchronization
- **<50ms** for cursor position updates
- **500+ shapes** without FPS drops
- **5+ concurrent users** without degradation

### Monitoring Performance

```typescript
// FPS monitoring (add to Canvas component during development)
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime >= lastTime + 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = currentTime;
  }
  requestAnimationFrame(measureFPS);
}

// Start monitoring
measureFPS();
```

### Optimization Checklist

- [ ] Use React.memo for cursor components
- [ ] Throttle cursor updates to 30-40ms
- [ ] Use Konva caching for static shapes
- [ ] Batch Firestore writes when possible
- [ ] Use Firestore offline persistence
- [ ] Implement debouncing for zoom events
- [ ] Use CSS transforms for cursor positioning
- [ ] Optimize re-renders with proper React keys

---

**End of Configuration Reference**
