import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';

/**
 * Admins are the accounts listed in the Firestore `admins` collection, one
 * document per admin whose ID is the account's Firebase Auth UID. Being signed
 * in is not enough: anyone can create a Firebase Auth account with the public
 * API key, so both this check and the security rules (firestore.rules,
 * storage.rules) require that document.
 *
 * This check only decides what the admin UI shows. The security rules are what
 * actually protect the data.
 */
export async function isApprovedAdmin(user: User): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, 'admins', user.uid));
    return snapshot.exists();
  } catch (error) {
    // permission-denied means the rules refused the read: not an admin.
    console.warn('Admin check failed.', error);
    return false;
  }
}

export const NOT_APPROVED_MESSAGE =
  'This account is not on the admin list. Ask an existing admin to add your account to the "admins" list in Firebase.';
