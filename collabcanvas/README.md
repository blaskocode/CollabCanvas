# CollabCanvas MVP

A real-time collaborative design tool built with React, Firebase, and Konva.js. Multiple users can simultaneously create, move, and manipulate shapes on a shared canvas with real-time cursor tracking and presence awareness.

## 🚀 Live Demo

**[Try CollabCanvas Live →](https://collabcanvas-mvp.web.app)**

Open in 2-3 browser windows to see real-time collaboration in action!

## 🚀 Features

### MVP Features (Phase 1)
- ✅ **User Authentication** - Email/Password and Google Sign-In
- ✅ **Real-Time Collaboration** - Changes sync across all users in <100ms
- ✅ **Canvas Workspace** - 5000x5000px canvas with pan and zoom
- ✅ **Shape Creation** - Create and manipulate rectangles (MVP)
- ✅ **Object Locking** - First user to drag locks the object
- ✅ **Multiplayer Cursors** - See other users' cursors with names and colors
- ✅ **Presence Awareness** - Know who's online and collaborating
- ✅ **Persistent State** - All work saved to Firebase
- ✅ **Offline Support** - Works offline with automatic sync when reconnected

### Coming Soon (Phase 2+)
- Multiple shape types (circles, text, lines)
- Shape styling (colors, borders, effects)
- Resize and rotate functionality
- Multi-select and grouping
- Undo/redo system
- AI agent integration

## 🛠 Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Canvas Rendering**: Konva.js + react-konva
- **Styling**: Tailwind CSS v4
- **Backend Services**: Firebase
  - Authentication (Email/Password + Google)
  - Cloud Firestore (persistent state)
  - Realtime Database (cursors & presence)
- **Testing**: Vitest + Testing Library
- **Type Safety**: TypeScript 5.9

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**
- A **Firebase account** (free tier is sufficient)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CollabCanvas/collabcanvas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

Follow the detailed guide in `FIREBASE_SETUP.md` to:
- Create a Firebase project
- Enable Authentication (Email/Password + Google)
- Create Firestore database
- Create Realtime Database
- Get your Firebase configuration

### 4. Configure Environment Variables

Copy the example environment file and add your Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_APP_ENV=development
```

**⚠️ Never commit your `.env` file to version control!**

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Available Scripts

### Development

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Check TypeScript types
```

### Testing

```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
```

### Linting

```bash
npm run lint             # Run ESLint
```

## 🧪 Testing

The project uses Vitest and Testing Library for testing.

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

Test files are located in the `tests/` directory:
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/setup.ts` - Test configuration

### Multi-User Testing

To test real-time collaboration features:

1. **Open multiple browser windows** (or use incognito/private mode):
   - Chrome + Chrome Incognito
   - Chrome + Firefox
   - Or use different browsers

2. **Sign in as different users** in each window

3. **Test the following scenarios**:
   - Create shapes in one window → verify they appear in other windows
   - Move shapes in one window → verify movement syncs to others
   - Delete shapes → verify deletion syncs immediately
   - Check cursor tracking → each user's cursor should show their name
   - Verify presence list → all online users should be visible in navbar
   - Test offline mode → disconnect network, make changes, reconnect

4. **Expected Performance**:
   - Shape changes should sync in <100ms
   - Cursor positions should update in <50ms (throttled to ~30 FPS)
   - 60 FPS maintained during pan/zoom
   - Should support 500+ shapes without FPS drops
   - 5+ concurrent users without performance degradation

### Keyboard Shortcuts

- **Delete/Backspace**: Delete selected shape
- **Escape**: Deselect current selection
- **Mouse Wheel**: Zoom in/out
- **Drag Canvas**: Pan the canvas (when not dragging a shape)

## 📁 Project Structure

```
collabcanvas/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Auth/          # Authentication components
│   │   ├── Canvas/        # Canvas and shape components
│   │   ├── Collaboration/ # Cursor and presence components
│   │   ├── Layout/        # Layout components
│   │   └── UI/            # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Firebase and API services
│   ├── utils/             # Utility functions and types
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── tests/                 # Test files
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example           # Environment variables template
├── FIREBASE_SETUP.md      # Detailed Firebase setup guide
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest configuration
└── README.md              # This file
```

## 🔥 Firebase Configuration

This app uses three Firebase services:

1. **Authentication** - User login and identity management
2. **Cloud Firestore** - Persistent canvas state (shapes)
3. **Realtime Database** - Real-time cursors and presence

### Security Rules

Security rules are configured to require authentication:

**Firestore Rules:**
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

**Realtime Database Rules:**
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

For detailed Firebase setup instructions, see `FIREBASE_SETUP.md`.

## 🎨 Key Concepts

### Object Locking

To prevent conflicts in real-time collaboration:
- First user to select/drag an object acquires a lock
- Other users cannot move locked objects
- Lock releases automatically when drag completes
- Lock timeout after 5 seconds of inactivity
- Visual indicators show which user has locked an object

### Canvas Boundaries

- Canvas size: 5000x5000 pixels
- Objects cannot be moved outside boundaries
- Pan and zoom keep you within the canvas
- Zoom range: 0.1x to 3x

### Real-Time Synchronization

- **Shape changes**: <100ms sync time via Firestore
- **Cursor positions**: <50ms sync time via Realtime Database
- **Presence updates**: Real-time via Realtime Database
- **Offline support**: Automatic sync when reconnected

## 🌐 Browser Compatibility

### Supported Browsers (Tested)

- ✅ **Chrome** 100+ (Recommended)
- ✅ **Firefox** 100+
- ✅ **Safari** 15.4+
- ✅ **Edge** 100+

### Known Browser-Specific Issues

- **Safari**: May show occasional "Persistence failed" warnings in console (can be safely ignored)
- **Firefox**: Canvas rendering is slightly slower than Chrome but still performant
- **Mobile Browsers**: Currently not optimized for mobile/tablet devices (desktop-only for MVP)

### Recommended Setup for Testing

- **Primary**: Chrome or Edge (best performance)
- **Secondary**: Firefox (for cross-browser testing)
- Use **incognito/private** mode for multi-user testing on same device

## ⚠️ Known Limitations & Issues

### MVP Scope Limitations

These are intentional limitations of the MVP and will be addressed in future releases:

1. **Single Shape Type**: Only rectangles supported (no circles, text, lines, etc.)
2. **No Shape Styling**: Fixed gray fill color (#cccccc), no custom colors or borders
3. **No Resize/Rotate**: Cannot resize or rotate shapes after creation
4. **No Multi-Select**: Can only select one shape at a time
5. **No Undo/Redo**: No history or command system
6. **Fixed Canvas Size**: 5000x5000px canvas (not infinite)
7. **Desktop Only**: Not optimized for mobile/tablet devices
8. **Single Global Canvas**: All users collaborate on one shared canvas (no project management)
9. **No Shape Layers**: All shapes on single layer, no z-index control
10. **Basic Locking**: Simple first-to-drag locking (not CRDT or OT based)

### Known Technical Issues

1. **Firestore Persistence Warnings**:
   - May see "Persistence failed" in Safari console
   - Can be safely ignored - app will still work with network-only mode
   - Workaround: Clear browser cache or use Chrome

2. **Lock Timeout**:
   - If user's browser crashes, lock releases after 5 seconds
   - Other users will need to wait briefly before editing locked shapes

3. **Offline Sync**:
   - Changes made offline will queue and sync when reconnected
   - Large numbers of offline changes may take several seconds to sync

4. **Performance with Many Shapes**:
   - 500+ shapes tested and performant
   - 1000+ shapes may cause slight FPS drops on slower devices
   - Recommendation: Use zoom/pan to focus on specific areas

## 🐛 Troubleshooting

### Firebase Connection Issues

**Problem**: "Missing required environment variables"
- **Solution**: Check that your `.env` file has all Firebase config variables set

**Problem**: "Permission denied" when accessing Firestore/RTDB
- **Solution**: Verify security rules are deployed and you're authenticated

**Problem**: Can't find Realtime Database URL
- **Solution**: Go to Realtime Database in Firebase Console, URL is shown at the top

**Problem**: "Persistence failed" warnings in console
- **Solution**: These are safe to ignore. The app uses Firestore's new persistence API which may show warnings in some browsers. App functionality is not affected.

### Development Server Issues

**Problem**: Port 5173 already in use
```bash
# Kill existing process
kill -9 $(lsof -ti:5173)

# Or use a different port
npm run dev -- --port 3000
```

**Problem**: TypeScript errors after pulling changes
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Check types
npm run type-check
```

**Problem**: Shapes not syncing between users
- **Solution**: 
  1. Check that both users are authenticated
  2. Verify Firebase security rules are deployed
  3. Check browser console for errors
  4. Try refreshing both browser windows

**Problem**: Cursors not showing
- **Solution**:
  1. Verify Realtime Database is enabled in Firebase Console
  2. Check that RTDB URL is correct in `.env`
  3. Ensure both users are on the canvas (not login page)

### Performance Issues

**Problem**: Canvas feels laggy or slow
- **Solution**:
  1. Check if you have 100+ shapes on canvas (try deleting some)
  2. Close other resource-intensive browser tabs
  3. Use Chrome for best performance
  4. Check if your zoom level is very low (<20%)

**Problem**: High Firestore read/write counts
- **Solution**: This is expected with real-time collaboration. Each shape operation creates read/write events. Firebase free tier includes 50k reads and 20k writes per day, which is sufficient for testing.

## 🚀 Deployment

CollabCanvas uses Firebase Hosting for deployment.

### Quick Deployment

```bash
# 1. Login to Firebase
firebase login

# 2. Link your Firebase project
cp .firebaserc.example .firebaserc
# Edit .firebaserc with your project ID

# 3. Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only database

# 4. Build and deploy
npm run build
firebase deploy --only hosting
```

### Detailed Deployment Guide

See `DEPLOYMENT.md` for complete step-by-step deployment instructions including:
- Firebase project setup
- Security rules deployment
- Production build process
- Testing procedures
- Troubleshooting tips

## 🎬 Demo

See `DEMO_SCRIPT.md` for a comprehensive guide on demonstrating CollabCanvas features.

## 🤝 Contributing

This is an MVP project. For contribution guidelines and development workflow, please refer to the project documentation.

## 📚 Additional Resources

- **Deployment Guide**: See `DEPLOYMENT.md` for production deployment
- **Demo Script**: See `DEMO_SCRIPT.md` for feature demonstration
- **Detailed Firebase Setup**: See `FIREBASE_SETUP.md`
- **Task List**: See `../tasks.md` for complete development roadmap
- **Architecture**: See `../architecture.md` for system design
- **PRD**: See `../PRD.md` for product requirements

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep Firebase API keys secure
- Use Firebase security rules in production
- Environment variables are validated on app startup

## 📝 License

[Add your license here]

## 👥 Team

[Add team members here]

---

**Built with ❤️ using React, TypeScript, Firebase, and Konva.js**
