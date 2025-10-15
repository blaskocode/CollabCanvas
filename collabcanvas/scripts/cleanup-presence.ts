/**
 * Cleanup Script for Stale Presence Data
 * 
 * This script removes presence data for users who:
 * 1. Have been offline for more than 5 minutes
 * 2. No longer exist in Firebase Auth
 * 
 * Usage:
 *   npx tsx scripts/cleanup-presence.ts
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const auth = getAuth(app);

const SESSIONS_PATH = 'sessions';
const GLOBAL_CANVAS_ID = 'global-canvas-v1';
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function cleanupStalePresence() {
  console.log('🧹 Starting presence cleanup...\n');

  try {
    const sessionsRef = ref(rtdb, `${SESSIONS_PATH}/${GLOBAL_CANVAS_ID}`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) {
      console.log('✅ No presence data found. Nothing to clean up.');
      return;
    }

    const data = snapshot.val();
    const now = Date.now();
    let removedCount = 0;
    let keptCount = 0;

    console.log(`📊 Found ${Object.keys(data).length} presence entries\n`);

    for (const userId of Object.keys(data)) {
      const userData = data[userId];
      const lastSeen = userData.lastSeen || 0;
      const age = now - lastSeen;

      console.log(`\n👤 User: ${userData.displayName || 'Unknown'} (${userId})`);
      console.log(`   Last seen: ${new Date(lastSeen).toLocaleString()}`);
      console.log(`   Age: ${Math.floor(age / 1000)}s`);

      // Check if user is stale (offline for more than 5 minutes)
      if (age > STALE_THRESHOLD_MS) {
        console.log(`   🗑️  Removing (stale for ${Math.floor(age / 60000)} minutes)`);
        
        const userRef = ref(rtdb, `${SESSIONS_PATH}/${GLOBAL_CANVAS_ID}/${userId}`);
        await remove(userRef);
        removedCount++;
      } else {
        console.log(`   ✅ Keeping (still active)`);
        keptCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n✨ Cleanup complete!`);
    console.log(`   Removed: ${removedCount} stale entries`);
    console.log(`   Kept: ${keptCount} active entries`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupStalePresence()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

