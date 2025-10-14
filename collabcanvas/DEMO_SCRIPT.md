# CollabCanvas MVP Demo Script

This script outlines how to demonstrate CollabCanvas's key features effectively.

## Demo Setup (Before Starting)

### Prerequisites
- 2-3 browser windows ready (Chrome + Firefox + Incognito)
- CollabCanvas deployed and accessible
- Test user accounts created (or use Google sign-in)
- Clear canvas (delete previous test shapes if needed)

### Recommended Setup
1. **Browser 1 (Chrome)**: Primary user "Alice"
2. **Browser 2 (Chrome Incognito)**: Secondary user "Bob"
3. **Browser 3 (Firefox)** _(optional)_: Third user "Charlie"

### Screen Arrangement
- Arrange browser windows side-by-side for screen recording
- Ensure both users' canvases are visible simultaneously
- Clear resolution: 1920x1080 recommended

---

## Demo Script (5-7 Minutes)

### Part 1: Introduction (30 seconds)

**What to say:**
> "Hi! I'm going to show you CollabCanvas, a real-time collaborative design tool. Multiple users can work on the same canvas simultaneously, and all changes sync instantly. Let me show you how it works."

**What to show:**
- Open landing page
- Point out clean, minimal UI

---

### Part 2: Authentication (30 seconds)

**What to say:**
> "First, let's sign in. CollabCanvas supports both email/password and Google authentication."

**What to do:**
- **Browser 1**: Click "Sign Up" → Enter email/password → Create account
- Show successful login, redirected to canvas
- **Browser 2**: Click "Sign in with Google" → Authenticate
- Show both users now on canvas

**Key feature**: Secure authentication with multiple options

---

### Part 3: Canvas Navigation (45 seconds)

**What to say:**
> "The canvas is 5000x5000 pixels with smooth pan and zoom controls. You can navigate using your mouse or the control panel."

**What to do:**
- **Browser 1**: 
  - Drag canvas to pan around
  - Scroll to zoom in and out
  - Click "Reset View" button
  - Point out zoom percentage display

**Key features**: 
- Smooth 60 FPS pan/zoom
- Zoom range: 10% to 300%
- Reset view button

---

### Part 4: Shape Creation (45 seconds)

**What to say:**
> "Creating shapes is simple. Click 'Add Shape' and a rectangle appears in the center of your view."

**What to do:**
- **Browser 1**: Click "Add Shape" 3-4 times
- Pan to different areas and add more shapes
- **Browser 2**: Watch shapes appear in real-time
- Point out shapes syncing across both browsers

**Key feature**: Real-time shape synchronization (<100ms)

---

### Part 5: Real-Time Collaboration (1 minute)

**What to say:**
> "Here's where it gets interesting. Watch what happens when both users interact with the canvas simultaneously."

**What to do:**
- **Browser 1 & 2 simultaneously**:
  - Both users create shapes
  - Both users move different shapes
  - Show shapes updating in real-time
  - No conflicts, smooth synchronization

**Key feature**: Conflict-free real-time collaboration

---

### Part 6: Multiplayer Cursors (45 seconds)

**What to say:**
> "You can see exactly where other users are working. Each user has a colored cursor with their name."

**What to do:**
- **Browser 1**: Move mouse around canvas
- **Browser 2**: Watch Alice's cursor appear with name label
- **Browser 2**: Move mouse around
- **Browser 1**: Watch Bob's cursor appear
- Move cursors near each other to show distinct colors

**Key features**:
- Real-time cursor tracking (<50ms)
- Unique colors per user
- Name labels for identification

---

### Part 7: Presence Awareness (30 seconds)

**What to say:**
> "The navbar shows who's currently online and collaborating with you."

**What to do:**
- Point to presence list in navbar
- Show "2 users online" (or however many)
- Hover over user avatars to show names
- **Browser 1**: Log out
- **Browser 2**: Watch user disappear from presence list
- **Browser 1**: Log back in
- **Browser 2**: Watch user reappear

**Key feature**: Real-time presence awareness

---

### Part 8: Shape Manipulation (1 minute)

**What to say:**
> "Let me show you how easy it is to work with shapes."

**What to do:**
- **Browser 1**:
  - Click a shape to select it (blue border appears)
  - Drag it to a new position
  - Press Delete key to delete it
  - Press Escape key to deselect
  - Try to drag a shape outside canvas (constrained to boundaries)

- **Browser 2**: Watch all actions sync in real-time

**Key features**:
- Select, move, delete shapes
- Keyboard shortcuts (Delete, Escape)
- Canvas boundary constraints

---

### Part 9: Object Locking (1 minute)

**What to say:**
> "To prevent conflicts, only one user can edit a shape at a time. The first user to grab it locks it."

**What to do:**
- **Browser 1**: Start dragging a shape (gets locked)
- **Browser 2**: Try to drag the same shape (can't move it, shows as locked)
- **Browser 1**: Release the shape
- **Browser 2**: Now able to drag the shape
- Show visual indicators (locked shapes have red border)

**Key feature**: First-come object locking prevents conflicts

---

### Part 10: Performance Demo (1 minute)

**What to say:**
> "CollabCanvas is built for performance. Watch how smooth it stays even with many shapes."

**What to do:**
- Quickly create 20-30 shapes by rapidly clicking "Add Shape"
- Pan and zoom around with all shapes visible
- Move multiple shapes quickly
- Show that FPS stays at 60
- Show that all changes sync instantly

**Key features**:
- Handles 500+ shapes without FPS drops
- Smooth pan/zoom with many objects
- Fast synchronization

---

### Part 11: Persistence (30 seconds)

**What to say:**
> "Everything is automatically saved. Watch what happens when I refresh the page."

**What to do:**
- **Browser 1**: Refresh the page (F5 or Cmd+R)
- Show page reloading
- All shapes persist and reload
- Canvas state exactly as it was

**Key feature**: Automatic persistence to Cloud Firestore

---

### Part 12: Offline Support (45 seconds)

**What to say:**
> "CollabCanvas even works offline. Changes queue up and sync when you reconnect."

**What to do:**
- **Browser 1**: Open DevTools > Network > Set to "Offline"
- Create/move some shapes
- Show "You are offline" toast notification
- Re-enable network
- Watch changes sync
- Show "Back online!" toast notification

**Key feature**: Offline-first architecture with automatic sync

---

### Part 13: Cross-Browser Testing (30 seconds)

**What to say:**
> "It works seamlessly across all modern browsers."

**What to do:**
- **Browser 3 (Firefox)**: Open CollabCanvas and sign in
- Show all three users collaborating simultaneously
- Point out presence list shows 3 users
- Create shapes in Firefox, watch them appear in Chrome
- Show cursors from all three users

**Key feature**: Full cross-browser compatibility

---

### Closing (30 seconds)

**What to say:**
> "That's CollabCanvas MVP! Key features include:
> - Real-time collaboration with <100ms sync
> - Multiplayer cursors and presence awareness
> - Object locking to prevent conflicts
> - Smooth 60 FPS performance
> - Offline support with automatic sync
> - Secure authentication
> 
> All built with React, TypeScript, Firebase, and Konva.js. Thanks for watching!"

**What to show:**
- Quick final pan/zoom around canvas
- Point to all active users in presence list
- Show final canvas state

---

## Demo Tips

### Do's ✅
- **Practice first**: Run through the script 2-3 times before recording
- **Speak clearly**: Explain what you're doing as you do it
- **Go slow**: Give viewers time to see what's happening
- **Show sync delays**: Pause briefly to show how fast changes appear
- **Emphasize key features**: Real-time sync, cursors, locking
- **Test beforehand**: Ensure all features work before demo

### Don'ts ❌
- **Don't rush**: Take your time, especially with real-time features
- **Don't skip authentication**: Shows security is built-in
- **Don't use too many shapes**: 20-30 is enough to show performance
- **Don't ignore errors**: If something breaks, acknowledge it
- **Don't forget to show presence**: Key differentiator from single-user tools

---

## Alternative Demo Flow (Quick 2-Minute Version)

For a shorter demo:

1. **Sign in** (10 seconds) - Google sign-in
2. **Create shapes** (20 seconds) - Add 5-10 shapes quickly
3. **Multi-user sync** (30 seconds) - Show real-time with 2 browsers
4. **Cursors** (15 seconds) - Show cursor tracking
5. **Locking** (20 seconds) - Demo object locking
6. **Performance** (15 seconds) - Pan/zoom with shapes
7. **Persistence** (10 seconds) - Quick refresh

---

## Recording Setup

### Recommended Tools
- **Screen Recording**: OBS Studio, Loom, or QuickTime
- **Video Editing**: DaVinci Resolve, iMovie, or Camtasia
- **Audio**: Use external microphone for better quality

### Video Settings
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 60 FPS (to show smooth canvas performance)
- **Format**: MP4 (H.264)
- **Length**: 5-7 minutes (or 2 minutes for quick version)

### Audio Tips
- Use a quiet room
- Test audio levels before full recording
- Speak clearly and at moderate pace
- Leave brief pauses between sections

---

## Follow-Up Content Ideas

After the main demo, consider creating:

1. **Technical Deep Dive** (for developers)
   - Architecture overview
   - Firebase integration
   - Real-time sync implementation
   - Performance optimizations

2. **Use Case Demos**
   - Design team collaboration
   - Remote whiteboarding
   - Brainstorming sessions
   - Education/teaching scenarios

3. **Feature Highlights** (short videos)
   - Just cursors and presence
   - Just locking mechanism
   - Just offline support
   - Just performance

---

**Good luck with your demo! 🎬**

