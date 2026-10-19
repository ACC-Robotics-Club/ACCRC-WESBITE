import { auth } from './firebaseAuth';
import { signOut } from 'firebase/auth';

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
