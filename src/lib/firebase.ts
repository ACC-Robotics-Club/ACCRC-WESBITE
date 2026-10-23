import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig, firebaseConfigReady } from './firebaseConfig';

export { firebaseConfigReady };

if (!firebaseConfigReady && typeof window !== 'undefined') {
  console.warn(
    'Firebase configuration is using placeholder values. Remove or correct the NEXT_PUBLIC_FIREBASE_* variables.'
  );
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
