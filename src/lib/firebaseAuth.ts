import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { app, firebaseConfigReady } from './firebase';

/* Admin-only. Kept out of firebase.ts so public pages don't ship Firebase Auth. */
export const auth = firebaseConfigReady ? getAuth(app) : null;

/*
 * Admin sessions deliberately stay in memory only. We do not sign the user out
 * on every page load because that breaks valid admin sessions and causes login
 * loops. The browser still clears the in-memory session on refresh by design.
 */
export const adminSessionReady = auth
  ? setPersistence(auth, inMemoryPersistence).catch((error) => {
      console.error('Unable to initialise the secure admin session.', error);
      throw error;
    })
  : Promise.reject(
      new Error('Firebase Auth is not configured. Add your Firebase web credentials to .env.local.')
    );
