import { auth } from './firebaseAuth';
import { signOut } from 'firebase/auth';

export async function signOutUser() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
