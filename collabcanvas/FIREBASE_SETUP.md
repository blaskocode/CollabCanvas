# Firebase Setup Instructions

Follow these steps to set up your Firebase project for CollabCanvas.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** or **"Create a Project"**
3. Enter project name: `collabcanvas-mvp` (or your preferred name)
4. Google Analytics: **Disable** (optional for MVP)
5. Click **"Create Project"**
6. Wait for project creation to complete

## Step 2: Enable Firebase Authentication

### Enable Email/Password Authentication:

1. In Firebase Console, navigate to **Build > Authentication**
2. Click **"Get Started"**
3. Click on **"Email/Password"** provider
4. Toggle **"Enable"** to ON
5. Keep **"Email link (passwordless sign-in)"** OFF
6. Click **"Save"**

### Enable Google Authentication:

1. Still in Authentication providers section
2. Click on **"Google"** provider
3. Toggle **"Enable"** to ON
4. Select your **support email** from dropdown
5. Click **"Save"**

## Step 3: Create Cloud Firestore Database

1. Navigate to **Build > Firestore Database**
2. Click **"Create Database"**
3. **Select Mode**: Choose **"Production Mode"** ✅
   - Starts with secure rules (recommended)
   - We'll add auth rules later
4. **Select Location**: Choose closest region to your users
   - `us-central` (Iowa) - North America
   - `europe-west1` (Belgium) - Europe
   - `asia-northeast1` (Tokyo) - Asia
   - ⚠️ **Note**: Location cannot be changed later
5. Click **"Enable"**
6. Wait for database creation

### Set Initial Firestore Rules:

1. Go to **Firestore Database > Rules** tab
2. Replace with these rules:

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

3. Click **"Publish"**

## Step 4: Create Realtime Database

1. Navigate to **Build > Realtime Database**
2. Click **"Create Database"**
3. **Select Location**: Choose same or nearby region as Firestore
4. **Select Mode**: Choose **"Locked Mode"** ✅
   - Denies all access by default (recommended)
   - We'll add auth rules next
5. Click **"Enable"**

### Set Initial Realtime Database Rules:

1. Go to **Realtime Database > Rules** tab
2. Replace with these rules:

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

3. Click **"Publish"**

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the **⚙️ gear icon** (Project Settings)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Register your app:
   - **App nickname**: `CollabCanvas Web`
   - **Firebase Hosting**: ✅ Check this box
   - Click **"Register app"**

5. Copy the Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

## Step 6: Update .env File

1. Open the `.env` file in the `collabcanvas` directory
2. Replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

VITE_APP_ENV=development
```

3. Save the file
4. ⚠️ **Never commit `.env` to version control** (already in `.gitignore`)

## Step 7: Add Authorized Domains (for Google Sign-In)

1. In Firebase Console, go to **Authentication > Settings** tab
2. Scroll to **"Authorized domains"**
3. Add these domains:
   - `localhost` (should already be there)
   - Your production domain (when deploying)

## Verification Checklist

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled
- [ ] Firestore database created in Production mode
- [ ] Firestore rules set for authenticated users
- [ ] Realtime Database created in Locked mode
- [ ] Realtime Database rules set for authenticated users
- [ ] Web app registered in Firebase
- [ ] `.env` file updated with actual Firebase config
- [ ] `.env` is in `.gitignore`

## Next Steps

After completing this setup:

1. Test Firebase connection by running: `npm run dev`
2. Continue with **Task 1.5**: Create Firebase Service File

## Troubleshooting

**Issue**: Can't find databaseURL in Firebase config
- **Solution**: Go to Realtime Database in console, the URL is shown at the top

**Issue**: Authentication not working in dev
- **Solution**: Ensure `localhost` is in authorized domains (Authentication > Settings)

**Issue**: Firestore/RTDB permission denied
- **Solution**: Check that security rules allow authenticated users (`auth != null`)

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- Full setup guide: See `tasks.md` Configuration Reference Appendix

