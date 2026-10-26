import nodemailer from 'nodemailer';
import { handleRegistration, type SendMail } from '../../../../functions/_shared/registration';

/**
 * POST /api/register on Vercel. The `.vercel.ts` extension is only enabled
 * for Vercel builds (see next.config.mjs), so the static export for
 * Cloudflare Pages never sees this route; there functions/api/register.ts
 * serves the same endpoint.
 *
 * Set GMAIL_USER, GMAIL_APP_PASSWORD and FIREBASE_SERVICE_ACCOUNT in the
 * Vercel project under Settings → Environment Variables.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sendWithNodemailer: SendMail = async (credentials, message) => {
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: credentials.user, pass: credentials.appPassword },
    connectionTimeout: 10_000,
    socketTimeout: 20_000,
  });
  await transport.sendMail({
    from: { name: credentials.fromName, address: credentials.user },
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

export function POST(request: Request): Promise<Response> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM_NAME, FIREBASE_SERVICE_ACCOUNT } = process.env;
  return handleRegistration(
    request,
    { GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM_NAME, FIREBASE_SERVICE_ACCOUNT },
    sendWithNodemailer,
  );
}
