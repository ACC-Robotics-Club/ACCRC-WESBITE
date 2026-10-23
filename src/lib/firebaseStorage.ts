import { getStorage } from 'firebase/storage';
import { app } from './firebase';

/* Separate from firebase.ts so only code that uploads files pulls in Storage. */
export const storage = getStorage(app);
