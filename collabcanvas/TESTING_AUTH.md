# Authentication System Testing Guide

## 🚀 Quick Start

Your dev server is running at: **http://localhost:5173**

The app should automatically redirect you to the login page if you're not authenticated.

---

## 📋 Test Plan

### Test 1: Signup with Email/Password ✅

1. **Navigate to Signup Page**
   - Go to: http://localhost:5173/signup
   - OR click "Sign up" link from the login page

2. **Fill in the Form**
   - **Display Name**: Enter your name (test with <20 chars and >20 chars)
   - **Email**: Use a valid email (e.g., `test@example.com`)
   - **Password**: Use at least 6 characters (e.g., `password123`)

3. **Submit the Form**
   - Click "Sign up" button
   - Watch for loading state ("Creating account...")
   
4. **Expected Results** ✅
   - Success toast: "Account created successfully!"
   - Automatic redirect to home page (/)
   - Navbar appears with your display name
   - Canvas placeholder shows: "Welcome to CollabCanvas! 🎨"

5. **Verify Display Name Truncation**
   - Try signing up with a name longer than 20 characters
   - Should see truncated version in navbar (20 chars max)

---

### Test 2: Login with Existing Account ✅

1. **Navigate to Login Page**
   - Go to: http://localhost:5173/login
   - OR click "Sign in" link from signup page

2. **Fill in the Form**
   - **Email**: Use the account you just created
   - **Password**: Enter your password

3. **Submit the Form**
   - Click "Sign in" button
   - Watch for loading state ("Signing in...")

4. **Expected Results** ✅
   - Success toast: "Welcome back!"
   - Automatic redirect to home page
   - Navbar shows your display name
   - Canvas placeholder visible

---

### Test 3: Google Sign-In ✅

1. **From Login or Signup Page**
   - Click "Sign in with Google" or "Sign up with Google" button
   - Google logo should be visible in the button

2. **Google OAuth Flow**
   - Google popup should appear
   - Select your Google account
   - Grant permissions if prompted

3. **Expected Results** ✅
   - Success toast: "Welcome to CollabCanvas!" or "Welcome back!"
   - Automatic redirect to home page
   - Navbar shows your Google display name
   - Canvas placeholder visible

4. **Verify Google Display Name**
   - Display name should match your Google profile name
   - If too long, should be truncated to 20 characters

---

### Test 4: Protected Routes ✅

1. **Without Being Logged In**
   - Try accessing: http://localhost:5173/
   - **Expected**: Automatic redirect to /login

2. **After Logging In**
   - Try accessing: http://localhost:5173/
   - **Expected**: Canvas placeholder page loads
   - **Expected**: Navbar shows with your name

3. **Try Invalid Routes**
   - Go to: http://localhost:5173/invalid-route
   - **Expected**: Redirect to home (/) then to /login if not authenticated

---

### Test 5: Logout Functionality ✅

1. **While Logged In**
   - Click the "Logout" button in the navbar (red button, top right)

2. **Expected Results** ✅
   - Success toast: "Logged out successfully"
   - Automatic redirect to login page
   - Navbar disappears
   - Cannot access protected routes

3. **Verify Complete Logout**
   - Try accessing http://localhost:5173/
   - Should redirect to /login
   - No user info should be visible

---

### Test 6: Auth State Persistence ✅

1. **Login and Refresh Page**
   - Login with any method
   - Press F5 or Ctrl+R (Cmd+R on Mac) to refresh
   - **Expected**: Should stay logged in
   - **Expected**: User info still in navbar

2. **Login and Close Browser**
   - Login with any method
   - Close the browser completely
   - Reopen and go to http://localhost:5173
   - **Expected**: Should still be logged in

3. **Verify Persistent Session**
   - Firebase Auth uses browser storage
   - Session should persist until explicit logout

---

### Test 7: Navigation Between Pages ✅

1. **Login to Signup Navigation**
   - On login page, click "Sign up" link
   - Should navigate to /signup
   - Form should be empty and ready

2. **Signup to Login Navigation**
   - On signup page, click "Sign in" link
   - Should navigate to /login
   - Form should be empty and ready

3. **Authenticated User on Auth Pages**
   - Login first
   - Try visiting http://localhost:5173/login
   - **Expected**: Automatic redirect to home page (/)
   - Try visiting http://localhost:5173/signup
   - **Expected**: Automatic redirect to home page (/)

---

### Test 8: Error Handling ✅

1. **Signup with Existing Email**
   - Try to sign up with an email that's already registered
   - **Expected Error**: "This email is already registered. Please sign in instead."
   - Error should appear as red toast notification

2. **Weak Password**
   - Try password with <6 characters
   - **Expected Error**: "Password must be at least 6 characters"

3. **Invalid Email Format**
   - Enter invalid email (e.g., "notanemail")
   - **Expected**: Browser validation or Firebase error

4. **Wrong Password on Login**
   - Use correct email but wrong password
   - **Expected Error**: "Incorrect password. Please try again."

5. **Non-existent Account**
   - Try logging in with email that doesn't exist
   - **Expected Error**: "No account found with this email. Please sign up first."

6. **Google Sign-In Cancelled**
   - Click "Sign in with Google"
   - Close the popup without completing
   - **Expected Error**: "Sign-in cancelled. Please try again."

7. **Empty Form Submission**
   - Leave fields empty and click submit
   - **Expected Error**: "Please fill in all fields"

---

### Test 9: Loading States ✅

1. **During Signup**
   - Fill form and click "Sign up"
   - **Expected**:
     - Button text changes to "Creating account..."
     - Button is disabled
     - Form inputs are disabled
     - Cannot submit multiple times

2. **During Login**
   - Fill form and click "Sign in"
   - **Expected**:
     - Button text changes to "Signing in..."
     - Button is disabled
     - Form inputs are disabled

3. **During Auth Check (Page Load)**
   - Refresh page while logged in
   - **Expected**:
     - Brief loading spinner
     - "Loading..." text
     - Then content appears

---

### Test 10: Display Name Logic ✅

1. **Email Prefix as Display Name**
   - Login with email/password
   - If user has no display name set
   - **Expected**: Use part before @ as display name

2. **Custom Display Name**
   - Sign up with custom display name
   - **Expected**: Shows your custom name in navbar

3. **Display Name from Google**
   - Sign in with Google
   - **Expected**: Shows your Google profile name

4. **Long Display Names**
   - Sign up with name: "ThisIsAReallyLongDisplayNameThatExceedsTwentyCharacters"
   - **Expected**: Truncated to: "ThisIsAReallyLongDi..." (20 chars)

---

## 🐛 Common Issues & Solutions

### Issue: "Missing required environment variables"
**Solution**: Check your `.env` file has all Firebase credentials

```bash
cd /Users/courtneyblaskovich/Documents/Projects/CollabCanvas/collabcanvas
cat .env
```

Ensure all `VITE_FIREBASE_*` variables are set with actual values (not placeholders).

---

### Issue: "Permission denied" errors
**Solution**: Verify Firebase security rules are deployed

1. Go to Firebase Console
2. Check Firestore Rules and Realtime Database Rules
3. Ensure authenticated users have read/write access

---

### Issue: Google Sign-In doesn't work
**Solution**: Check authorized domains

1. Firebase Console → Authentication → Settings
2. Under "Authorized domains", ensure `localhost` is listed
3. Add it if missing

---

### Issue: Page stays on loading spinner
**Solution**: Check browser console for errors

1. Press F12 to open DevTools
2. Check Console tab for Firebase errors
3. Look for authentication or configuration errors

---

### Issue: Toast notifications don't appear
**Solution**: Verify ToastContainer is rendered

- Check browser console for errors
- Toast notifications should appear in top-right corner
- Check if react-hot-toast is properly installed

---

## ✅ Testing Checklist

Use this checklist to track your testing:

- [ ] Can create new account with email/password
- [ ] Can login with existing account
- [ ] Can sign in with Google
- [ ] Display name appears correctly in navbar
- [ ] Display name uses email prefix when not provided
- [ ] Display name truncates at 20 chars if too long
- [ ] Logout works and redirects to login
- [ ] Auth state persists on page refresh
- [ ] Auth state persists after closing browser
- [ ] Protected routes redirect to login when not authenticated
- [ ] Auth pages redirect to home when already authenticated
- [ ] Loading states show during auth operations
- [ ] Error messages are user-friendly and accurate
- [ ] Can navigate between login and signup pages
- [ ] Form validation works (empty fields, short passwords)
- [ ] Toast notifications appear for success/error
- [ ] Google sign-in button has proper icon
- [ ] Navbar shows user avatar with initial
- [ ] Multiple rapid clicks don't cause issues (buttons disabled)

---

## 🎯 Expected User Experience

### First Time User Journey:
1. Visit app → Redirected to /login
2. Click "Sign up" → Goes to /signup
3. Fill form → Create account
4. Success! → Redirected to home page
5. See navbar with name and logout button
6. See "Welcome to CollabCanvas! 🎨" message

### Returning User Journey:
1. Visit app → Redirected to /login
2. Enter credentials → Login
3. Success! → Redirected to home page
4. See navbar with name
5. Continue where left off

### Google User Journey:
1. Visit app → Redirected to /login
2. Click "Sign in with Google"
3. Google popup → Select account
4. Success! → Redirected to home page
5. Name from Google profile in navbar

---

## 📊 Testing Report Template

After testing, note any issues:

```
Testing Date: [Date]
Browser: [Chrome/Firefox/Safari]
OS: [macOS/Windows/Linux]

✅ Working Features:
- [List what works]

❌ Issues Found:
- [List any problems]

📝 Notes:
- [Any additional observations]
```

---

## 🎉 Success Criteria

Authentication system is fully working if ALL of these work:
- ✅ Email/password signup and login
- ✅ Google OAuth sign-in
- ✅ Display names show correctly (20 char max)
- ✅ Logout redirects to login
- ✅ Auth persists across refreshes
- ✅ Protected routes work properly
- ✅ User-friendly error messages
- ✅ Loading states during operations
- ✅ Toast notifications for feedback

---

**Happy Testing! 🚀**

If you encounter any issues, check the browser console (F12) for error messages and refer to the troubleshooting section above.

