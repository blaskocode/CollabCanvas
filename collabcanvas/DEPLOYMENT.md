# CollabCanvas Deployment Guide

This guide walks you through deploying CollabCanvas to Firebase Hosting.

## Prerequisites

- [x] Firebase CLI installed (`npm install -g firebase-tools`)
- [x] Firebase project created with Auth, Firestore, and Realtime Database enabled
- [x] Local development environment working

## Deployment Steps

### 1. Login to Firebase CLI

```bash
firebase login
```

This will open a browser window for authentication.

### 2. Link Your Firebase Project

Create a `.firebaserc` file from the example:

```bash
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**OR** use Firebase CLI to initialize:

```bash
firebase use --add
```

Select your project from the list and set an alias (use `default` as the alias).

### 3. Deploy Security Rules First

Deploy Firestore and Realtime Database security rules before deploying the app:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

**Verify rules deployment:**
- Go to Firebase Console > Firestore Database > Rules
- Go to Firebase Console > Realtime Database > Rules
- Ensure rules match the files in your repo

### 4. Build Production Bundle

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

**Verify build:**
- Check that `dist/` folder exists
- Check `dist/index.html` is present
- Check `dist/assets/` contains JS and CSS files

### 5. Test Production Build Locally (Optional but Recommended)

```bash
npm run preview
```

Open the URL shown (usually http://localhost:4173) and test:
- [ ] Login works
- [ ] Can create shapes
- [ ] Can move shapes
- [ ] Real-time sync works (test with 2 browsers)

### 6. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

### 7. Verify Deployment

Open your hosting URL and test all features:

- [ ] **Authentication**
  - [ ] Sign up with email/password
  - [ ] Log in with email/password
  - [ ] Sign in with Google
  - [ ] Log out

- [ ] **Canvas Operations**
  - [ ] Create shapes
  - [ ] Move shapes
  - [ ] Delete shapes with Delete key
  - [ ] Deselect with Escape key
  - [ ] Pan canvas
  - [ ] Zoom in/out

- [ ] **Real-Time Features**
  - [ ] Open 2 browsers, sign in as different users
  - [ ] Create shape in Browser 1 → appears in Browser 2
  - [ ] Move shape in Browser 1 → syncs to Browser 2
  - [ ] Delete shape in Browser 1 → disappears in Browser 2
  - [ ] Cursors show for both users
  - [ ] Presence list shows both users

### 8. Update README with Live Demo Link

Once deployed successfully, update your `README.md`:

```markdown
## 🚀 Live Demo

**[Try CollabCanvas Live](https://your-project.web.app)**

- Sign up or log in with Google
- Create and move shapes
- Open in multiple browsers to see real-time collaboration!
```

## Deployment Commands Reference

```bash
# Full deployment (hosting + rules)
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Realtime Database rules
firebase deploy --only database

# View deployment history
firebase hosting:channel:list

# Roll back to previous version
firebase hosting:rollback
```

## Troubleshooting

### Build Fails

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Try build again
npm run build
```

### Deployment Fails

**Error: "HTTP Error: 401, Unauthorized"**
- Solution: Run `firebase login --reauth`

**Error: "No project active"**
- Solution: Run `firebase use --add` and select your project

**Error: "Permission denied"**
- Solution: Ensure you have Owner or Editor role in Firebase project
- Go to Firebase Console > Project Settings > Users and permissions

### App Works Locally But Not in Production

1. **Check environment variables:**
   - Ensure `.env` file has correct Firebase config
   - Environment variables must start with `VITE_` to be available in production

2. **Check Firebase security rules:**
   - Verify Firestore rules allow authenticated users
   - Verify RTDB rules allow authenticated users
   - Check browser console for permission errors

3. **Check browser console:**
   - Look for CORS errors
   - Look for Firebase initialization errors
   - Check network tab for failed requests

### Firestore/RTDB Rules Not Working

```bash
# Redeploy rules
firebase deploy --only firestore:rules
firebase deploy --only database

# View current rules in console
firebase firestore:rules:get
```

## Production Checklist

Before announcing your deployment:

- [ ] All security rules deployed and tested
- [ ] Multi-user testing completed (2-5 concurrent users)
- [ ] Performance testing completed (500+ shapes)
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari)
- [ ] Error handling working (network failures, permission errors)
- [ ] README updated with live demo link
- [ ] Demo video recorded (optional)

## Monitoring & Maintenance

### Monitor Firebase Usage

Check Firebase Console regularly:

1. **Authentication > Users**: Monitor user signups
2. **Firestore Database > Usage**: Monitor read/write operations
3. **Realtime Database > Usage**: Monitor bandwidth and storage
4. **Hosting > Usage**: Monitor bandwidth and requests

### Firebase Free Tier Limits

- **Firestore**: 50k reads, 20k writes per day
- **RTDB**: 100 simultaneous connections, 1GB storage, 10GB/month bandwidth
- **Authentication**: Unlimited users
- **Hosting**: 10GB storage, 360MB/day bandwidth

### Update Deployed App

```bash
# Make changes to your code
# Test locally
npm run dev

# Build and deploy
npm run build
firebase deploy --only hosting
```

## Security Best Practices

1. **Never commit sensitive data:**
   - `.env` file should be in `.gitignore`
   - Don't commit Firebase service account keys

2. **Review security rules regularly:**
   - Ensure rules validate all user input
   - Test rules with different user scenarios
   - Update rules as features are added

3. **Monitor for abuse:**
   - Check Firebase Console for unusual activity
   - Set up budget alerts in Google Cloud Console
   - Review authentication logs

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Check `README.md` for common issues
- Check GitHub issues (if applicable)

---

**🎉 Congratulations on deploying CollabCanvas!**

