import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/*
 * The club's Firebase web settings. These are public by design: every visitor's
 * browser receives them, and the data is protected by firestore.rules, not by
 * keeping these secret. They are built in so the site works on any host, even
 * one where the NEXT_PUBLIC_FIREBASE_* variables were never set. (accrcbd.com
 * once ran without them, pointed at a database that didn't exist, and showed a
 * placeholder fest after ~40s of failed connections.) The variables can still
 * point the site at a different Firebase project.
 */
const CLUB_FIREBASE = {
  apiKey: 'AIzaSyDW5TDRkZco3JL4fcA-44UUoTwjwRL4HBM',
  authDomain: 'accrcwebsite.firebaseapp.com',
  projectId: 'accrcwebsite',
  storageBucket: 'accrcwebsite.firebasestorage.app',
  messagingSenderId: '607350579814',
  appId: '1:607350579814:web:49c69233a51beb3cb443a7',
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || CLUB_FIREBASE.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || CLUB_FIREBASE.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || CLUB_FIREBASE.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || CLUB_FIREBASE.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || CLUB_FIREBASE.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || CLUB_FIREBASE.appId,
};

/** False only if someone set the variables to placeholder values. */
export const firebaseConfigReady =
  !firebaseConfig.apiKey.includes('Dummy') && !firebaseConfig.projectId.includes('demo');

if (!firebaseConfigReady && typeof window !== 'undefined') {
  console.warn(
    'Firebase configuration is using placeholder values. Remove or correct the NEXT_PUBLIC_FIREBASE_* variables.'
  );
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
