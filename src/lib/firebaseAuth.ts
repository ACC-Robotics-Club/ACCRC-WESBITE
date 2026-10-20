import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';
import { app, firebaseConfigReady } from './firebase';

/* Admin-only. Kept out of firebase.ts so public pages don't ship Firebase Auth. */
export const auth = firebaseConfigReady ? getAuth(app) : null;

/*
 * Admin sessions last for the browser tab: a refresh, a typed admin URL, or a
 * phone reloading the tab keeps you signed in, and closing the tab signs you
 * out. (Memory-only sessions were tried and read as "login doesn't work":
 * every reload dropped the admin back at the login page.)
 */
export const adminSessionReady = auth
  ? setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error('Unable to initialise the admin session.', error);
      throw error;
    })
  : Promise.reject(
      new Error('Firebase Auth is not configured. Add your Firebase web credentials to .env.local.')
    );
