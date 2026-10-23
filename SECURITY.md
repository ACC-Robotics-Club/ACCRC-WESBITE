# Security deployment checklist

This static application uses Firebase directly from the browser. Firebase web configuration values prefixed with `NEXT_PUBLIC_` are identifiers, not secrets; the protection for data is the deployed Firebase rules, Firebase Authentication, App Check, and the configuration of the hosting platform.

## Required before production

1. Rotate the Facebook Page access token and any credential that was ever committed, pasted into a ticket, or added to an untrusted deployment. Check GitHub secret scanning and Vercel/Cloudflare environment history. Do not rotate a value by committing its replacement.
2. Deploy the checked-in database and Storage rules:

   ```powershell
   firebase deploy --only firestore:rules,storage --project <firebase-project-id>
   ```

3. Give each administrator a Firebase Auth custom claim of `{ admin: true }` from a tightly controlled Admin SDK process. Do not rely on an email address, a client-side role flag, or an authenticated user alone. Force affected users to sign out and sign in again after changing a claim.
4. In Firebase Authentication, disable public sign-up if this site has no public user accounts. Use strong password policy, email-enumeration protection, and MFA for administrator accounts where available.
5. Register the production and preview domains with Firebase App Check and enforce App Check for Firestore and Storage. App Check is essential because public form writes are otherwise susceptible to automated abuse.
6. Put registration endpoints behind a server-side abuse control before accepting high-volume traffic. With a static client writing directly to Firestore, reliable IP/user rate limiting is not possible in browser code. Use a Cloudflare Turnstile-verified Pages Function/Worker (or another server endpoint) plus WAF rate limits, then make Firestore writes only from that trusted service.
7. Add Firebase API-key restrictions in Google Cloud (HTTP-referrer restrictions for the site domains and only the APIs this app uses). This does not replace Firestore rules.
8. Restrict Cloudflare/Vercel team access, require MFA, use separate preview and production projects/environments, and never expose server tokens through `NEXT_PUBLIC_` variables.

## One-time fest bootstrap

The stricter rules require real Firestore documents before public fest registration opens. After assigning the first administrator claim, sign in to the admin portal and save the global fest configuration plus each public fest segment. Only then enable `isLaunched`, `registrationOpen`, and the individual segment's `isOpen` flag.

## Hosting notes

`public/_headers` is used by Cloudflare Pages. `vercel.json` supplies the equivalent headers for Vercel. The `functions/` directory contains a Cloudflare Pages Function and does **not** run on Vercel; either deploy to Cloudflare Pages or move that endpoint to a reviewed Vercel serverless function before using Vercel with Facebook imports.

## Privacy change

Registration, application, team, payment, and contact records are now administrator-only. Public team lookup was intentionally disabled because client-side Firebase queries cannot return a single record without making that collection enumerable or exposing personal data. Staff can look up and check in teams from the authenticated fest administration page.

## Verification

After deployment, test with three accounts: signed out, a normal authenticated Firebase user, and an account with the `admin: true` custom claim. Only the claim-bearing account should be able to read registrations/applications or alter content. Also test a valid public form, an invalid/oversized form payload, and an automated-abuse challenge through the server-side registration path before launch.
