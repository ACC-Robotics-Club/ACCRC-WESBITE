import { getAuth, inMemoryPersistence, setPersistence, signOut } from 'firebase/auth';
import { app } from './firebase';

/* Admin-only. Kept out of firebase.ts so public pages don't ship Firebase Auth. */
export const auth = getAuth(app);

/*
 * Admin sessions deliberately stay in memory only. No Firebase credentials are
 * retained in browser storage, so a reload, a new tab, or a later visit must
 * pass through the password screen again.
 */
export const adminSessionReady = typeof window !== 'undefined'
  ? setPersistence(auth, inMemoryPersistence)
      .then(() => signOut(auth))
      .catch((error) => {
        console.error('Unable to initialise the secure admin session.', error);
      })
  : Promise.resolve();
