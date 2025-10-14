# Deploying CollabCanvas to Vercel

## Overview

CollabCanvas can be deployed to Vercel as an alternative to Firebase Hosting. The backend services (Firebase Auth, Firestore, Realtime Database) remain on Firebase, while Vercel hosts the frontend.

**Current Firebase Deployment:** https://collabcanvas-mvp.web.app (publicly available)

---

## Prerequisites

1. ✅ Firebase project already configured (Auth, Firestore, RTDB)
2. ✅ Production build working (`npm run build`)
3. ⬜ Vercel account (free tier is fine)
4. ⬜ Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Git Repository is Set Up

```bash
# Check if you have a remote repository
git remote -v

# If not, create one on GitHub/GitLab/Bitbucket and add it
git remote add origin <your-repo-url>
git branch -M main
git add .
git commit -m "Ready for Vercel deployment"
git push -u origin main
```

### 1.2 Create `vercel.json` Configuration

Create a `vercel.json` file in `/Users/courtneyblaskovich/Documents/Projects/CollabCanvas/collabcanvas/`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**What this does:**
- Tells Vercel to use Vite framework
- Sets up SPA routing (all routes go to index.html)
- Configures asset caching for performance

---

## Step 2: Install Vercel CLI (Optional but Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

#### 3.1 Go to Vercel Dashboard
1. Visit https://vercel.com/signup (or login if you have an account)
2. Click **"Add New..."** → **"Project"**

#### 3.2 Import Your Git Repository
1. Click **"Import Git Repository"**
2. Authorize Vercel to access your GitHub/GitLab/Bitbucket
3. Select your `CollabCanvas` repository
4. Click **"Import"**

#### 3.3 Configure Project Settings
Vercel should auto-detect Vite, but verify:

**Framework Preset:** `Vite`  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`

#### 3.4 Add Environment Variables
Click **"Environment Variables"** and add:

```
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
VITE_FIREBASE_DATABASE_URL=<your-database-url>
```

**Where to find these values:**
- Copy from your local `.env` file
- Or get from Firebase Console → Project Settings

**Important:** Add these to **all environments** (Production, Preview, Development)

#### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes for build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

---

### Option B: Deploy via CLI (For Power Users)

#### 3.1 Navigate to Project Directory
```bash
cd /Users/courtneyblaskovich/Documents/Projects/CollabCanvas/collabcanvas
```

#### 3.2 Run Vercel Deployment
```bash
# First deployment (follow prompts)
vercel

# Answer the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? collabcanvas (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No
```

#### 3.3 Add Environment Variables via CLI
```bash
# Add each environment variable
vercel env add VITE_FIREBASE_API_KEY production
# Paste your value when prompted

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
vercel env add VITE_FIREBASE_PROJECT_ID production
vercel env add VITE_FIREBASE_STORAGE_BUCKET production
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
vercel env add VITE_FIREBASE_APP_ID production
vercel env add VITE_FIREBASE_DATABASE_URL production
```

#### 3.4 Deploy to Production
```bash
# Deploy to production
vercel --prod
```

---

## Step 4: Configure Firebase for Vercel Domain

### 4.1 Add Vercel Domain to Firebase Auth

1. Go to Firebase Console → Authentication → Settings
2. Click **"Authorized domains"**
3. Click **"Add domain"**
4. Add your Vercel domain: `your-project-name.vercel.app`
5. Click **"Add"**

**Why:** Firebase Auth needs to whitelist your deployment domain

### 4.2 Update Firestore Security Rules (if needed)

Your existing rules should work fine, but verify they're deployed:

```bash
firebase deploy --only firestore:rules
```

### 4.3 Update Realtime Database Rules (if needed)

```bash
firebase deploy --only database
```

---

## Step 5: Test Your Vercel Deployment

### 5.1 Open Your Vercel URL
Visit: `https://your-project-name.vercel.app`

### 5.2 Test Core Features
- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Create shapes on canvas
- [ ] Pan and zoom
- [ ] Open in second browser/incognito
- [ ] Verify real-time cursors work
- [ ] Verify real-time shapes sync
- [ ] Test with 2-3 concurrent users

### 5.3 Check Browser Console
- [ ] No Firebase errors
- [ ] No CORS errors
- [ ] Cursors updating smoothly
- [ ] Shapes syncing correctly

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel
1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain (e.g., `collabcanvas.com`)
5. Follow DNS configuration instructions

### 6.2 Update Firebase Authorized Domains
1. Go to Firebase Console → Authentication
2. Add your custom domain to authorized domains
3. Save changes

---

## Comparison: Firebase Hosting vs Vercel

| Feature | Firebase Hosting | Vercel |
|---------|------------------|--------|
| **Deployment Speed** | ~30 seconds | ~1 minute |
| **Global CDN** | ✅ Yes | ✅ Yes |
| **Automatic HTTPS** | ✅ Yes | ✅ Yes |
| **Custom Domains** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ 10GB storage | ✅ 100GB bandwidth |
| **Build Minutes** | ✅ Unlimited | ✅ 6000 min/month |
| **Git Integration** | ⚠️ Via CLI | ✅ Native |
| **Automatic Deployments** | ❌ Manual | ✅ Auto on push |
| **Preview Deployments** | ❌ No | ✅ Yes (per branch) |
| **Analytics** | ✅ Firebase Analytics | ✅ Vercel Analytics |
| **Serverless Functions** | ⚠️ Cloud Functions | ✅ Edge Functions |

**Recommendation:**
- **Firebase Hosting:** Simpler, all-in-one with Firebase backend
- **Vercel:** Better CI/CD, preview deployments, modern developer experience

---

## Continuous Deployment (Automatic)

Once connected to Git, Vercel automatically deploys:

### Production Deployments
- Every push to `main` branch → Production deployment
- URL: `https://your-project-name.vercel.app`

### Preview Deployments
- Every push to other branches → Preview deployment
- URL: `https://your-project-name-git-branch-name.vercel.app`
- Perfect for testing before merging

### Pull Request Deployments
- Every PR gets its own preview URL
- Reviewers can test changes before merge
- Comments automatically added to PR

---

## Environment Variables Management

### View Current Variables
```bash
vercel env ls
```

### Add New Variable
```bash
vercel env add VARIABLE_NAME production
```

### Remove Variable
```bash
vercel env rm VARIABLE_NAME production
```

### Pull Variables Locally (for development)
```bash
vercel env pull .env.local
```

---

## Rollback Deployments

### Via Dashboard
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Via CLI
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

---

## Troubleshooting Vercel Deployment

### Issue 1: Build Fails

**Error:** `Command "npm run build" exited with 1`

**Solution:**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

### Issue 2: Environment Variables Not Working

**Error:** Firebase config undefined

**Solution:**
1. Verify variables are added in Vercel Dashboard
2. Ensure variables start with `VITE_` prefix
3. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

### Issue 3: 404 on Routes

**Error:** Refreshing page shows 404

**Solution:**
Ensure `vercel.json` has SPA rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue 4: Firebase Auth Error

**Error:** "Unauthorized domain"

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to authorized domains
3. Include both:
   - `your-project.vercel.app`
   - `*.vercel.app` (for preview deployments)

### Issue 5: CORS Errors

**Error:** CORS policy blocked request

**Solution:**
This should not happen with Firebase, but if it does:
1. Check Firebase security rules are deployed
2. Verify Firebase config is correct
3. Check browser console for specific endpoint failing

---

## Monitoring & Analytics

### Vercel Analytics (Optional)
```bash
npm install @vercel/analytics

# Add to src/main.tsx
import { inject } from '@vercel/analytics';
inject();
```

### Vercel Web Vitals
Automatic tracking of:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

View in: Vercel Dashboard → Analytics

---

## Cost Considerations

### Vercel Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 6000 build minutes/month
- ✅ Automatic HTTPS
- ✅ Edge Network (CDN)
- ❌ No commercial use

### Vercel Pro Tier ($20/month)
- ✅ Everything in Free tier
- ✅ Commercial use allowed
- ✅ Team collaboration
- ✅ Password protection
- ✅ Advanced analytics
- ✅ Faster builds

**For CollabCanvas MVP:** Free tier is sufficient unless commercial use.

---

## Complete Deployment Checklist

### Pre-Deployment ✅
- [x] Local build works (`npm run build`)
- [x] TypeScript compiles (`npm run type-check`)
- [x] Tests pass (`npm test`)
- [x] Firebase project configured
- [x] Git repository exists

### Vercel Setup ⬜
- [ ] Vercel account created
- [ ] Git repository connected to Vercel
- [ ] `vercel.json` created
- [ ] Environment variables added
- [ ] Build settings configured

### Deployment ⬜
- [ ] First deployment completed
- [ ] Production URL accessible
- [ ] Firebase authorized domain added
- [ ] All features tested on Vercel

### Post-Deployment ⬜
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)
- [ ] Team invited (optional)
- [ ] README updated with Vercel URL

---

## Commands Cheat Sheet

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Open project dashboard
vercel dashboard

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add VARIABLE_NAME production

# Rollback deployment
vercel rollback <deployment-url>
```

---

## Support & Resources

### Vercel Documentation
- Getting Started: https://vercel.com/docs
- CLI Reference: https://vercel.com/docs/cli
- Environment Variables: https://vercel.com/docs/environment-variables
- Custom Domains: https://vercel.com/docs/custom-domains

### CollabCanvas Documentation
- Main README: See `README.md`
- Firebase Setup: See `FIREBASE_SETUP.md`
- Architecture: See `architecture.md`

### Community
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: (your repository)

---

## Summary

**Current Status:**
- ✅ **Firebase Hosting:** https://collabcanvas-mvp.web.app (LIVE & PUBLIC)

**To Deploy on Vercel:**
1. Create `vercel.json` configuration file
2. Connect Git repository to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy (automatic on git push)
5. Add Vercel domain to Firebase authorized domains
6. Test all features on Vercel URL

**Benefits of Vercel:**
- Automatic deployments on git push
- Preview deployments for every PR
- Better developer experience
- Modern CI/CD pipeline

**Both hosting options are FREE and publicly accessible!** 🎉

Choose based on your preference:
- **Firebase Hosting:** Simpler, already set up
- **Vercel:** Better CI/CD, more modern workflow

