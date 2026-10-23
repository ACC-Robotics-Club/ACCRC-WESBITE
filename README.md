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

## Firebase security rule update

Deploy the repository's Firestore and Storage rules with `firebase deploy --only firestore:rules,storage --project <firebase-project-id>`. Only Firebase accounts with the `admin: true` custom claim can manage content or read submitted personal data. Public visitors can read public club content and submit narrowly validated forms, while Executive, Prefect, and Sub-Executive submissions are rejected when their respective portal toggle is off.

Read [SECURITY.md](SECURITY.md) before production deployment. It covers administrator custom claims, App Check, credential rotation, rate limiting, and the Cloudflare/Vercel hosting differences.

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
