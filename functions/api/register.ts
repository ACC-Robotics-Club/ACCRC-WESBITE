import {
  Firestore,
  int,
  readInt,
  readString,
  str,
  timestamp,
  type ServiceAccount,
} from '../_shared/firestore-admin';
import { sendGmail, type GmailCredentials } from '../_shared/gmail';

/**
 * POST /api/register — new member registration.
 *
 * 1. Validates the form.
 * 2. Issues the next club ID (ACCRC-26-0001, ACCRC-26-0002, …) inside a
 *    Firestore transaction and stores the registration under that ID.
 * 3. Emails the member a confirmation with their club ID, from the club's
 *    Gmail account.
 *
 * Required Cloudflare Pages environment variables (Settings → Variables and
 * Secrets; mark the last two as secrets):
 *   GMAIL_USER                 the Gmail address mail is sent from
 *   GMAIL_APP_PASSWORD         a Google App Password for that account
 *   FIREBASE_SERVICE_ACCOUNT   the service-account key JSON, pasted whole
 */

interface Env {
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  GMAIL_FROM_NAME?: string;
  FIREBASE_SERVICE_ACCOUNT?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface RegistrationInput {
  name: string;
  email: string;
  whatsapp: string;
  classSection: string;
  collegeId: string;
  house: 'MJ' | 'MK' | 'MAR' | 'HR';
  motivation: string;
}

const LIMITS: Record<keyof RegistrationInput, number> = {
  name: 80,
  email: 120,
  whatsapp: 24,
  classSection: 40,
  collegeId: 30,
  house: 3,
  motivation: 1500,
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function parseInput(raw: Record<string, unknown>): RegistrationInput | string {
  const input = {} as RegistrationInput;
  for (const key of Object.keys(LIMITS) as Array<keyof RegistrationInput>) {
    const value = typeof raw[key] === 'string' ? (raw[key] as string).trim() : '';
    if (!value) return 'Please fill in every field.';
    if (value.length > LIMITS[key]) return `That ${key} is too long.`;
    input[key] = value as RegistrationInput[typeof key];
  }
  input.email = input.email.toLowerCase();
  if (!['MJ', 'MK', 'MAR', 'HR'].includes(input.house)) return 'Please select a valid house.';
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(input.email)) return 'Please enter a valid email address.';
  if (!/^[+\d][\d\s-]{6,}$/.test(input.whatsapp)) return 'Please enter a valid WhatsApp number.';
  return input;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function confirmationEmail(input: RegistrationInput, clubId: string) {
  const firstName = input.name.split(/\s+/)[0];
  const text = [
    `Hi ${firstName},`,
    '',
    'Welcome to ACC Robotics Club! Your registration is confirmed.',
    '',
    `Your club ID: ${clubId}`,
    '',
    'Keep this ID safe. You will need it for club events, workshops and competitions.',
    '',
    `Name: ${input.name}`,
    `Section: ${input.classSection}`,
    `College ID: ${input.collegeId}`,
    `House: ${input.house}`,
    '',
    'If you did not register, you can ignore this email.',
    '',
    'ACCRC, Adamjee Cantonment College Robotics Club',
    'https://www.facebook.com/accroboticsclub',
  ].join('\n');

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#5b6b67;font-size:13px;width:120px">${label}</td><td style="padding:6px 0;color:#0d1b18;font-size:14px;font-weight:700">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#ece8e0;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ece8e0;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:2px solid #0d1b18">
<tr><td style="background:#0d1b18;padding:28px 32px">
<p style="margin:0;color:#2be0d2;font:700 12px/1 monospace;letter-spacing:3px">ACCRC / MEMBERSHIP</p>
<h1 style="margin:12px 0 0;color:#e8fffb;font-size:28px;line-height:1.15">Welcome to the build, ${escapeHtml(firstName)}.</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 20px;color:#334;font-size:15px;line-height:1.6">Your registration with <strong>ACC Robotics Club</strong> is confirmed. This is your club ID:</p>
<div style="background:#e6faf7;border:2px dashed #0e8a80;border-radius:14px;padding:20px;text-align:center">
<p style="margin:0;color:#0e8a80;font:700 11px/1 monospace;letter-spacing:3px">CLUB ID</p>
<p style="margin:10px 0 0;color:#0d1b18;font:900 30px/1 monospace;letter-spacing:2px">${clubId}</p>
</div>
<p style="margin:20px 0 24px;color:#5b6b67;font-size:13px;line-height:1.6">Keep this ID safe. You will need it for club events, workshops and competitions.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e0d8;padding-top:12px">
${row('Name', input.name)}
${row('Section', input.classSection)}
${row('College ID', input.collegeId)}
${row('House', input.house)}
${row('WhatsApp', input.whatsapp)}
</table>
</td></tr>
<tr><td style="padding:20px 32px;background:#f6f4ef;color:#7a8784;font-size:12px;line-height:1.6">
If you did not register, you can ignore this email.<br>
ACCRC, Adamjee Cantonment College Robotics Club, Dhaka
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject: `Welcome to ACCRC: your club ID is ${clubId}`, text, html };
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  // Only this site's own pages may register members.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD || !env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('Registration is not configured: missing environment variables.');
    return json({ error: 'Registration is temporarily unavailable. Please try again later.' }, 503);
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return json({ error: 'Invalid request.' }, 400);
  }

  const input = parseInput(raw);
  if (typeof input === 'string') return json({ error: input }, 400);

  const mailer: GmailCredentials = {
    user: env.GMAIL_USER,
    appPassword: env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
    fromName: env.GMAIL_FROM_NAME || 'ACC Robotics Club',
  };

  try {
    const db = new Firestore(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount);

    /* Already a member: re-send their ID to the registered address instead of
       issuing a second one. The ID itself is never returned to the browser
       here, so only the inbox owner learns it. */
    const existing = (await db.findByField('registrations', 'email', input.email)).find(
      (doc) => readString(doc, 'type') === 'membership' && readString(doc, 'clubId'),
    );
    if (existing) {
      const clubId = readString(existing, 'clubId')!;
      const previous: RegistrationInput = {
        name: readString(existing, 'name') ?? input.name,
        email: input.email,
        whatsapp: readString(existing, 'whatsapp') ?? input.whatsapp,
        classSection: readString(existing, 'classSection') ?? input.classSection,
        collegeId: readString(existing, 'collegeId') ?? input.collegeId,
        house: readString(existing, 'house') === 'MJ' || readString(existing, 'house') === 'MK' || readString(existing, 'house') === 'MAR' || readString(existing, 'house') === 'HR'
          ? readString(existing, 'house') as RegistrationInput['house']
          : input.house,
        motivation: '',
      };
      const emailSent = await sendGmail(mailer, { to: input.email, ...confirmationEmail(previous, clubId) })
        .then(() => true)
        .catch((error) => {
          console.error('Failed to re-send confirmation email.', error);
          return false;
        });
      return json({ status: 'existing', emailSent });
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const counterPath = `counters/membership-${year}`;

    const clubId = await db.transaction(async (read) => {
      const counter = await read(counterPath);
      const next = readInt(counter, 'last') + 1;
      const id = `ACCRC-${String(year).slice(-2)}-${String(next).padStart(4, '0')}`;
      return {
        result: id,
        writes: [
          {
            update: {
              name: db.docName(counterPath),
              fields: { last: int(next), updatedAt: timestamp(now) },
            },
          },
          {
            update: {
              name: db.docName(`registrations/${id}`),
              fields: {
                type: str('membership'),
                clubId: str(id),
                name: str(input.name),
                email: str(input.email),
                whatsapp: str(input.whatsapp),
                classSection: str(input.classSection),
                collegeId: str(input.collegeId),
                house: str(input.house),
                motivation: str(input.motivation),
                createdAt: timestamp(now),
              },
            },
            currentDocument: { exists: false },
          },
        ],
      };
    });

    const emailSent = await sendGmail(mailer, { to: input.email, ...confirmationEmail(input, clubId) })
      .then(() => true)
      .catch((error) => {
        console.error('Failed to send confirmation email.', error);
        return false;
      });

    return json({ status: 'created', clubId, emailSent });
  } catch (error) {
    console.error('Registration failed.', error);
    return json({ error: 'We could not complete your registration. Please try again.' }, 500);
  }
};
