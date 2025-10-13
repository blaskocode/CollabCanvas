# CollabCanvas MVP

A real-time collaborative design tool built with React, Firebase, and Konva.js. Multiple users can simultaneously create, move, and manipulate shapes on a shared canvas with real-time cursor tracking and presence awareness.

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

## 🐛 Troubleshooting

### Firebase Connection Issues

**Problem**: "Missing required environment variables"
- **Solution**: Check that your `.env` file has all Firebase config variables set

**Problem**: "Permission denied" when accessing Firestore/RTDB
- **Solution**: Verify security rules are deployed and you're authenticated

**Problem**: Can't find Realtime Database URL
- **Solution**: Go to Realtime Database in Firebase Console, URL is shown at the top

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

## 🤝 Contributing

This is an MVP project. For contribution guidelines and development workflow, please refer to the project documentation.

## 📚 Additional Resources

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
