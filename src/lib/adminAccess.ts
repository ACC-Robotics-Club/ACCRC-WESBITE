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
 *
 * Resolves false only when the account is really not on the list. If the
 * database can't be reached it throws (after one retry), so the admin sees the
 * real problem instead of being told they aren't an admin.
 */
export async function isApprovedAdmin(user: User): Promise<boolean> {
  for (let attempt = 0; ; attempt++) {
    try {
      const snapshot = await getDoc(doc(db, 'admins', user.uid));
      return snapshot.exists();
    } catch (error) {
      // permission-denied means the rules refused the read: not an admin.
      if ((error as { code?: string })?.code === 'permission-denied') return false;
      if (attempt >= 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

export const NOT_APPROVED_MESSAGE =
  'This account is not on the admin list. Ask an existing admin to add your account to the "admins" list in Firebase.';

/** Shown when the admin list couldn't be checked at all. */
export function adminCheckFailedMessage(error: unknown): string {
  const detail = (error as Error)?.message || 'unknown error';
  return `Signed in, but the database couldn't be reached to confirm admin access (${detail}). Check your internet connection, turn off any ad or tracker blocker for this site, and try again.`;
}
