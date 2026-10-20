# ACCRC website

The public site for the Adamjee Cantonment College Robotics Club. It is a static Next.js export backed by Firebase for live forms, portal controls, and manual event management.

## Local setup

1. Copy `.env.local.example` to `.env.local` and fill in the Firebase web-app values.
2. Install dependencies with `npm install`.
3. Start the site with `npm run dev`.

## Everyday content management

- **Membership:** `/membership/` and the homepage membership form are always available. They require a full name, section, email address, college ID, and reason for joining.
- **Leadership applications:** Sign in at `/admin/login/`, then open **Manage Portal**. The Executive Panel, Prefect Application, and Sub-Executive Application each have their own on/off toggle and configurable roles. When all three are off, leadership links and forms are hidden from visitors.
- **Achievements:** Sign in at `/admin/login/`, then open **Achievements Portal**. Add an award/result, recipient or team, recognition level, year, and competition context. Entries appear immediately in the matching year on the homepage.
- **Events:** In `/admin/events/`, create or edit events. Registration opening/closing times are optional, so an event can be published before registration details are ready. With no event records, visitors see the "No upcoming events right now" empty state.

## Facebook event import

The Events page always displays the official [ACCRC Facebook page](https://www.facebook.com/accroboticsclub) in a light embedded timeline. Automatic event cards are enabled by adding these **encrypted** Cloudflare Pages environment variables:

```text
FACEBOOK_PAGE_ID=...
FACEBOOK_PAGE_ACCESS_TOKEN=...
FACEBOOK_GRAPH_API_VERSION=v24.0
```

The access token is used only by `functions/api/facebook-events.ts`; it is never sent to a browser. The Facebook Graph API must authorize the token to read the official page's events. If it is not configured or Facebook is unavailable, the manual Firebase events and timeline continue to work.

## Member registration (club ID + Gmail confirmation)

The Join forms (home page and `/membership/`) post to `functions/api/register.ts`. That function issues the next club ID (`ACCRC-26-0001`, `ACCRC-26-0002`, …) inside a Firestore transaction, saves the registration under that ID, and emails the member a confirmation with their ID **from the club's Gmail account**. Registering again with the same email re-sends the existing ID instead of issuing a new one.

**It runs on Cloudflare Pages only.** On Vercel (accrcbd.vercel.app) `/api/register` does not exist, so the forms fall back to saving the registration straight to Firestore, without a club ID or email — exactly how sign-up worked before. Nothing breaks either way.

To turn it on, host the site on Cloudflare Pages and add these environment variables (Production and Preview; mark the last two **encrypted**):

```text
GMAIL_USER=yourclub@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...", ...}
```

1. **Gmail App Password:** turn on 2-Step Verification for the Gmail account, then create an App Password at <https://myaccount.google.com/apppasswords>. Use that 16-character password, not your normal one. Gmail allows about 500 sent emails a day.
2. **Firebase service account:** Firebase console → Project settings → Service accounts → *Generate new private key*. Paste the whole JSON file as the value.
3. Optional: `GMAIL_FROM_NAME` sets the sender name (default "ACC Robotics Club").

Club IDs appear in **Admin → Applications → Membership** and in its CSV export.

## Firebase security rule update

Deploy the repository's Firestore rules with `firebase deploy --only firestore:rules --project <firebase-project-id>`. The signed-in admin account can update fest settings; unauthenticated visitors can still read the public fest configuration. The rules also keep membership registration public while rejecting Executive, Prefect, and Sub-Executive submissions when their respective portal toggle is off.

## Deploy to Cloudflare Pages

The repository is configured as a static export (`output: "export"`). In Cloudflare Pages use:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node.js version | `20` or newer |

Add the Firebase `NEXT_PUBLIC_*` values to both Preview and Production environments. Add the optional Facebook variables above as encrypted variables. Cloudflare deploys the `functions/` directory alongside `out/`, keeping the Facebook token server-side.

After the first deploy, verify a membership submission, the three portal toggles, a manually added event, and the Facebook timeline in a preview deployment.
