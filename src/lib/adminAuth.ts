/**
 * adminAuth.ts — legacy shim (kept for import compatibility only).
 *
 * All admin authentication is now handled exclusively through Firebase Auth
 * via `signInWithEmailAndPassword` in `/admin/login/page.tsx` and the
 * `AdminGuard` component. The previous hardcoded-credential logic has been
 * removed. Do not add new logic here.
 */
export {};
