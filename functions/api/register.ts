import { sendGmail } from '../_shared/gmail';
import { handleRegistration, type Env } from '../_shared/registration';

/**
 * POST /api/register on Cloudflare Pages. The registration itself lives in
 * functions/_shared/registration.ts; Vercel serves the same endpoint from
 * src/app/api/register/route.vercel.ts.
 *
 * Set GMAIL_USER, GMAIL_APP_PASSWORD and FIREBASE_SERVICE_ACCOUNT under
 * Settings → Variables and Secrets.
 */

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = ({ request, env }: PagesContext): Promise<Response> =>
  handleRegistration(request, env, sendGmail);
