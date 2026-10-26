import type { User } from 'firebase/auth';

/**
 * Admins are accounts with the Firebase Authentication custom claim
 * `admin: true`. Being signed in is not enough: anyone can create a Firebase
 * Auth account with the public API key, so the custom claim is required by
 * both this UI check and the Firestore/Storage security rules.
 *
 * This check only decides what the admin UI shows. The security rules are what
 * actually protect the data.
 *
 * The claim is issued only from a trusted Admin SDK environment. It cannot be
 * assigned from the browser application.
 */
export async function isApprovedAdmin(user: User): Promise<boolean> {
  return (await user.getIdTokenResult(true)).claims.admin === true;
}

export const NOT_APPROVED_MESSAGE =
  'This account is not approved for administration. Ask a Firebase project owner to grant it the admin custom claim.';

/** Shown when the admin list couldn't be checked at all. */
export function adminCheckFailedMessage(error: unknown): string {
  const detail = (error as Error)?.message || 'unknown error';
  return `Signed in, but administrator access could not be verified (${detail}). Check your internet connection, then sign out and try again.`;
}
