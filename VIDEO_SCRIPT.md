# CollabCanvas Video Walkthrough Script

**Duration:** 3-5 minutes  
**Format:** Screen recording with voiceover  
**Style:** Professional but conversational

---

## 🎬 FULL SCRIPT

### **[00:00 - 00:30] INTRO**

**[SCREEN: Show login page at https://collabcanvas-mvp.web.app]**

**[YOU SAY:]**
"Hi, I'm Courtney, and this is CollabCanvas—a real-time collaborative design tool I built from scratch.

Think of it like Figma or Miro, but I wanted to understand the technical challenges of building real-time collaboration, so I built my own version.

In the next four minutes, I'll show you what it does and walk through some interesting technical decisions I made along the way."

**[SCREEN: Quick login (1-2 seconds), show canvas with a few shapes]**

---

### **[00:30 - 01:00] DEMO PART 1: Basic Canvas Operations**

**[SCREEN: Canvas view with clean workspace]**

**[YOU SAY:]**
"Let me start with the basics."

**[ACTION: Double-click to create a rectangle]**

"Double-click to create shapes—rectangles, circles, or text."

**[ACTION: Create a circle and a text shape quickly]**

**[ACTION: Click a shape, drag it around]**

"Click to select, drag to move."

**[ACTION: Open color picker, change a shape's color to blue, another to green]**

"Change colors with the color picker."

**[ACTION: Select a shape, press Delete]**

"And delete with the Delete key."

**[ACTION: Create 3 rectangles in a row, select all, click 'Align Left' button]**

"For layout, I've got alignment tools—align, distribute, that kind of thing."

**[SCREEN: Shapes now aligned]**

**[YOU SAY:]**
"All of this is rendered on HTML5 Canvas using Konva.js, which gives me 60 frames per second performance."

---

### **[01:00 - 01:30] DEMO PART 2: Advanced Features**

**[ACTION: Drag a box to select multiple shapes]**

**[YOU SAY:]**
"Now some more advanced stuff. Box selection to select multiple shapes at once."

**[ACTION: Press Ctrl+G to group them]**

**[SCREEN: Dotted outline appears around the group]**

"Ctrl+G to group them together. You can see this dotted outline showing it's a group."

**[ACTION: Drag the group—all shapes move together]**

"Now they all move as one unit."

**[ACTION: Press Ctrl+Shift+G to ungroup]**

"Ctrl+Shift+G to ungroup. And these groups can even be nested—you can group groups together."

**[ACTION: Create a new shape, move it, then press Ctrl+Z]**

"And everything has full undo and redo support. Ctrl+Z to undo..."

**[SCREEN: Shape disappears]**

**[ACTION: Press Ctrl+Y]**

"...Ctrl+Y to redo."

**[SCREEN: Shape reappears]**

---

### **[01:30 - 02:00] DEMO PART 3: Real-Time Collaboration**

**[SCREEN: Canvas still visible]**

**[YOU SAY:]**
"But here's where it gets interesting—real-time collaboration."

**[ACTION: Move your window to left side of screen, open second browser on right side]**

"Let me open a second browser as a different user."

**[SCREEN: Two browser windows side-by-side, both showing same canvas]**

**[ACTION: Move mouse in left browser]**

**[SCREEN: Cursor appears in right browser with your name]**

**[YOU SAY:]**
"You can see my cursor position syncing in real-time with my name."

**[ACTION: Create a shape in left browser]**

**[SCREEN: Shape appears instantly in right browser]**

"Create a shape here, it appears instantly over here."

**[ACTION: In right browser, drag a different shape]**

**[SCREEN: Shape moves in both windows simultaneously]**

"Move something in this window, it syncs immediately."

**[ACTION: Point to navbar where user avatars are shown]**

"And up here in the navbar, you can see presence indicators—who's currently online."

**[YOU SAY:]**
"All of this is happening in under 100 milliseconds, which is why it feels instantaneous."

**[SCREEN: Close second browser, go back to full-screen first browser]**

---

### **[02:00 - 02:30] CODE PART 1: Architecture Overview**

**[SCREEN: Open VS Code, show project file structure]**

**[YOU SAY:]**
"Alright, let me show you how this actually works under the hood."

**[ACTION: Show folder structure - expand src/ folder showing components/, services/, hooks/, contexts/]**

"The architecture follows a layered pattern: Components talk to Contexts, Contexts use Hooks, Hooks call Services."

**[ACTION: Briefly hover over each folder as you mention it]**

"This keeps everything decoupled and testable. Components don't know about Firebase, they just consume React Context."

**[ACTION: Maybe show architecture.md briefly or keep file tree open]**

"The business logic lives in services, and hooks bridge the gap between Firebase and React state."

---

### **[02:30 - 03:15] CODE PART 2: Real-Time Sync Deep Dive**

**[SCREEN: Open src/services/canvas.ts]**

**[YOU SAY:]**
"The real-time magic happens here in the canvas service."

**[ACTION: Scroll to subscribeToShapes function, highlight the onSnapshot listener]**

**[YOU SAY:]**
"I'm using Firestore's `onSnapshot` listener. When any user creates, moves, or deletes a shape, this listener fires immediately for every connected client."

**[ACTION: Scroll down slightly, show where updates are pushed]**

"And when a shape changes, we push the update to Firestore, which broadcasts it to all users."

**[SCREEN: Open src/services/cursors.ts or keep canvas.ts visible]**

**[YOU SAY:]**
"Now, for cursor positions, I actually used a different database—Firebase Realtime Database instead of Firestore."

**[ACTION: Show cursor update code if you switched files, or just gesture to it]**

**[YOU SAY:]**
"The reason is that cursor positions are high-frequency updates—every mouse movement. Firestore charges per read and write, and it's optimized for structured data, not for hundreds of updates per second.

Realtime Database is built for exactly this—ephemeral, high-frequency data. It has lower latency and it's cheaper for this use case."

**[YOU SAY:]**
"So the architectural decision was: persistent data like shapes and groups go in Firestore, ephemeral data like cursors and presence goes in Realtime Database. Two databases, each doing what it's best at."

---

### **[03:15 - 04:00] CODE PART 3: Conflict Resolution & Locking**

**[SCREEN: Still in src/services/canvas.ts or switch to it]**

**[YOU SAY:]**
"One challenge with multiplayer is: what happens if two people try to edit the same shape at the same time?"

**[ACTION: Scroll to or highlight lockShape() and unlockShape() functions]**

**[YOU SAY:]**
"I implemented an optimistic locking system. When you start dragging a shape, it locks it for other users."

**[ACTION: Show where isLocked and lockedBy fields are set]**

"So if I'm dragging this shape, you see it with a lock indicator and you can't move it."

**[ACTION: If time, quickly demo this in the browser - show locked shape with red border]**

**[SCREEN: Back to code]**

**[YOU SAY:]**
"Now, what if someone disconnects mid-edit without releasing the lock? I handle that two ways:"

**[ACTION: Gesture to code or scroll to relevant section]**

"One: there's a 5-second timeout on locks. If a lock is older than 5 seconds, any client can clean it up.

Two: Firebase has an `onDisconnect` handler. When a user disconnects, it automatically clears any locks they held."

**[YOU SAY:]**
"This prevents conflicts without needing complex CRDTs or operational transforms. For an MVP, optimistic locking with timeouts works really well."

---

### **[04:00 - 04:30] CODE PART 4: State Management Choice**

**[SCREEN: Open src/contexts/CanvasContext.tsx]**

**[YOU SAY:]**
"Quick note on state management. You'll notice I'm using React Context API instead of something like Redux or Zustand."

**[ACTION: Scroll through the CanvasContext provider briefly]**

**[YOU SAY:]**
"The reason is: Firebase is already handling my global state synchronization. It's managing the source of truth and broadcasting changes."

**[YOU SAY:]**
"I just needed to lift that Firebase state into React so components could access it. Context API is perfect for this—it's simpler, less boilerplate, and re-renders are minimal because of how I structured the hooks."

**[ACTION: Maybe show how a component uses the context, or just move on]**

**[YOU SAY:]**
"For an app where the backend is already managing state, you don't always need a heavy state management library."

---

### **[04:30 - 05:00] CLOSING**

**[SCREEN: Back to the deployed app showing the canvas with shapes]**

**[YOU SAY:]**
"So that's CollabCanvas: a real-time collaborative design tool built with React, TypeScript, Konva.js, and Firebase."

**[ACTION: Maybe show tasks.md quickly with all the checkmarks, or MVP_COMPLETE.md]**

"I built this over nine pull requests with 63 individual tasks, all documented and tracked."

**[SCREEN: Back to canvas]**

**[YOU SAY:]**
"The most interesting technical challenges were:
- Handling concurrent edits without conflicts
- Optimizing cursor updates to sync in under 50 milliseconds
- And implementing nested grouping with full undo-redo support."

**[ACTION: Hover over the URL bar showing the deployed link]**

"You can try it yourself—it's live at collabcanvas-mvp.web.app. Just open it in two browsers and watch the real-time sync in action."

**[YOU SAY:]**
"Thanks for watching!"

**[SCREEN: Optional - Show an end card with:
- Your name
- GitHub link
- Email/LinkedIn
- Project URL]**

---

## 📝 SCRIPT NOTES

### **Timing Breakdown:**
- **Intro:** 30 seconds
- **Feature Demo:** 90 seconds (30s each for basic, advanced, real-time)
- **Code Walkthrough:** 150 seconds (30s architecture, 45s real-time, 45s locking, 30s state management)
- **Closing:** 30 seconds
- **TOTAL:** ~4 minutes 50 seconds

### **Key Phrases to Emphasize:**
1. "Built from scratch" (shows initiative)
2. "Under 100 milliseconds" (quantifiable performance)
3. "Two databases, each doing what it's best at" (architectural thinking)
4. "Without needing complex CRDTs" (knows advanced concepts but pragmatic)
5. "Less boilerplate" (values simplicity)
6. "Documented and tracked" (organized developer)

### **Visual Transitions:**
- Demo → Code: "Let me show you how this actually works"
- Code → Demo: "Let me show you what this looks like in practice"
- Between code sections: Use natural phrases like "Now, another interesting part..."

### **Pacing Tips:**
- **Speak slowly** during code sections (viewers need time to read)
- **Speed up** during repetitive actions (creating shapes)
- **Pause briefly** after making an important point
- **Vary your tone** - excited for features, thoughtful for architecture decisions

### **Ad-Lib Opportunities:**
If you want to sound more natural, you can ad-lib around these key points:
- When showing features: "Let me just quickly..." or "One more thing..."
- When showing code: "The interesting part here is..." or "What I did was..."
- Transitions: "So now that you've seen what it does..." or "Let me pop open the code..."

### **Common Stumbles to Avoid:**
- Don't say "um" or "uh" (pause silently instead)
- Don't apologize ("Sorry, let me...") - just do it confidently
- Don't say "I think" or "I guess" - be definitive
- Don't go down rabbit holes - stick to the script

### **If Something Goes Wrong:**
- Mouse misses a button: Just try again casually
- Forget what to say next: Glance at script, pause briefly, continue
- Code doesn't show what you expected: Say "And you can see here..." and point to something nearby
- Browser lags: Have a second take ready, or edit it out

---

## 🎯 ALTERNATIVE SHORTER VERSION (3 minutes)

If you want a tighter 3-minute video, cut these sections:
1. Skip the nested grouping mention (save 10s)
2. Shorten the state management explanation (save 15s)
3. Only show one browser for real-time demo (save 15s)
4. Reduce the locking explanation (save 20s)
5. Shorten the closing (save 10s)

**Total saved:** 70 seconds → brings it to ~3:40

---

## 🎥 RECORDING CHECKLIST

### **Before Recording:**
- [ ] Read through script 2-3 times
- [ ] Have demo data ready (some shapes pre-created)
- [ ] Bookmark all code files you'll show
- [ ] Test second browser login
- [ ] Close unnecessary tabs/apps
- [ ] Turn off notifications
- [ ] Test microphone
- [ ] Have water nearby

### **Screen Setup:**
- [ ] Browser window sized appropriately
- [ ] VS Code font size increased (14-16pt)
- [ ] Browser zoom at 100% (or 110% for readability)
- [ ] Dev tools closed
- [ ] Bookmarks bar hidden (cleaner look)

### **During Recording:**
- [ ] Take a breath before starting
- [ ] Smile (it comes through in your voice!)
- [ ] Speak slower than normal
- [ ] Pause between sections
- [ ] Move mouse deliberately
- [ ] Don't rush

### **After First Take:**
- [ ] Review for audio quality
- [ ] Check if code is readable
- [ ] Time yourself (adjust pace if needed)
- [ ] Note any stumbles to fix
- [ ] Re-record if major issues

---

## 🎨 OPTIONAL ADDITIONS

### **If You Want to Add Polish:**

1. **Add text overlays at key moments:**
   - "Real-time sync < 100ms"
   - "Firestore + Realtime DB"
   - "Optimistic Locking"
   - "React Context + Firebase"

2. **Add transition slides between sections:**
   - Slide 1: "✨ Features"
   - Slide 2: "🏗️ Architecture"
   - Slide 3: "💡 Technical Deep Dive"

3. **Add background music:**
   - Very subtle, low volume
   - Upbeat but not distracting
   - Royalty-free (YouTube Audio Library)
   - Fade out during code sections

4. **Add a quick metrics slide:**
   ```
   CollabCanvas Stats:
   ⚡ < 100ms shape sync
   🖱️ < 50ms cursor updates
   📦 357 KB bundle (gzipped)
   ✅ 63/63 tasks complete
   ```

---

## 💬 DELIVERY TIPS

### **Tone & Energy:**
- **Intro:** Confident, welcoming
- **Feature Demo:** Excited, demonstrative
- **Code Walkthrough:** Thoughtful, educational
- **Closing:** Proud but humble, inviting

### **Voice Tips:**
- Vary your pitch (don't be monotone)
- Emphasize key technical terms
- Speak with confidence (you built this!)
- Imagine explaining to a smart colleague

### **Body Language (if on camera):**
- If you're not on camera, ignore this
- If you are: smile, look at camera occasionally, use hand gestures naturally

---

## 🚀 YOU'VE GOT THIS!

This script is a guide—not a word-for-word recitation. Feel free to:
- Adjust wording to match your speaking style
- Add personality and natural fillers
- Reorder sections if it flows better for you
- Cut content if you're running long

The most important things are:
1. ✅ Show the features working
2. ✅ Explain the interesting technical decisions
3. ✅ Sound confident and knowledgeable
4. ✅ Keep it under 5 minutes

**Good luck with the recording!** 🎬

