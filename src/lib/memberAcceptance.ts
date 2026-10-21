import { doc, runTransaction, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Registration } from './firestore';

/**
 * Accepting a membership request in the admin portal:
 * 1. gives the member the next club ID (ACCRC-26-0001, ACCRC-26-0002, …),
 *    unless they already have one; and
 * 2. emails them that they're accepted, with that ID.
 *
 * The ID comes from the same `counters/membership-YY` document the Cloudflare
 * /api/register function used, inside a transaction, so two admins accepting
 * at once can never get the same number.
 *
 * Email goes through EmailJS (emailjs.com), sent from the admin's browser
 * through the club's connected mailbox. The club's three EmailJS values are
 * built in below; they are public by design (EmailJS only accepts them from
 * the allowed origins set in its dashboard). The NEXT_PUBLIC_EMAILJS_*
 * variables can override them. The EmailJS template only has to pass
 * through {{to_email}}, {{subject}} and {{{message_html}}}; the email itself is
 * written here.
 */

const EMAILJS = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim() || 'service_lr2nwbb',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim() || 'template_xwvt34m',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim() || 'E1sdmb3CYhQKFPP4b',
};

export const acceptanceEmailReady = Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

export interface AcceptResult {
  clubId: string;
  emailSent: boolean;
  /** Why the email wasn't sent, when it wasn't. */
  emailProblem?: string;
}

/** Marks the request accepted and gives it a club ID (keeps an existing one). */
async function assignClubId(registrationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = doc(db, 'counters', `membership-${year}`);
  const registrationRef = doc(db, 'registrations', registrationId);

  return runTransaction(db, async (transaction) => {
    const registration = await transaction.get(registrationRef);
    if (!registration.exists()) throw new Error('This membership request no longer exists.');
    const existing = registration.get('clubId') as string | undefined;
    if (existing) {
      transaction.update(registrationRef, { status: 'accepted', reviewedAt: Timestamp.now() });
      return existing;
    }
    const counter = await transaction.get(counterRef);
    const next = ((counter.exists() ? (counter.get('count') as number) : 0) || 0) + 1;
    const clubId = `ACCRC-${String(year).slice(-2)}-${String(next).padStart(4, '0')}`;
    transaction.set(counterRef, { count: next, updatedAt: Timestamp.now() }, { merge: true });
    transaction.update(registrationRef, { status: 'accepted', clubId, reviewedAt: Timestamp.now() });
    return clubId;
  });
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function acceptanceEmail(member: Registration, clubId: string) {
  const firstName = escapeHtml(member.name.trim().split(/\s+/)[0] || member.name);
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:#5b6b67;font-size:13px;width:120px">${label}</td><td style="padding:6px 0;color:#0d1b18;font-size:14px;font-weight:700">${escapeHtml(value)}</td></tr>`
      : '';
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ece8e0;padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:2px solid #0d1b18">
<tr><td style="background:#0d1b18;padding:28px 32px">
<p style="margin:0;color:#2be0d2;font:700 12px/1 monospace;letter-spacing:3px">ACCRC / MEMBERSHIP</p>
<h1 style="margin:12px 0 0;color:#e8fffb;font-size:28px;line-height:1.15">You're in, ${firstName}.</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 20px;color:#334;font-size:15px;line-height:1.6">Your membership request to <strong>ACC Robotics Club</strong> has been <strong>accepted</strong>. Welcome to the club! This is your club ID:</p>
<div style="background:#e6faf7;border:2px dashed #0e8a80;border-radius:14px;padding:20px;text-align:center">
<p style="margin:0;color:#0e8a80;font:700 11px/1 monospace;letter-spacing:3px">CLUB ID</p>
<p style="margin:10px 0 0;color:#0d1b18;font:900 30px/1 monospace;letter-spacing:2px">${escapeHtml(clubId)}</p>
</div>
<p style="margin:20px 0 24px;color:#5b6b67;font-size:13px;line-height:1.6">Keep this ID safe. You will need it for club events, workshops and competitions.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e0d8;padding-top:12px">
${row('Name', member.name)}${row('Section', member.classSection)}${row('College ID', member.collegeId || member.rollNumber)}
</table>
</td></tr>
<tr><td style="padding:20px 32px;background:#f6f4ef;color:#7a8784;font-size:12px;line-height:1.6">
If you did not ask to join, you can ignore this email.<br>
ACCRC, Adamjee Cantonment College Robotics Club, Dhaka
</td></tr>
</table>
</td></tr>
</table>`;
  return { subject: `You're accepted into ACCRC: your club ID is ${clubId}`, html };
}

/** Sends (or re-sends) the acceptance email and records when it went out. */
export async function sendAcceptanceEmail(member: Registration, clubId: string): Promise<AcceptResult> {
  if (!acceptanceEmailReady) {
    return { clubId, emailSent: false, emailProblem: 'Email sending is not set up yet (EmailJS settings missing).' };
  }
  const { subject, html } = acceptanceEmail(member, clubId);
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: {
          to_email: member.email,
          to_name: member.name,
          club_id: clubId,
          subject,
          message_html: html,
        },
      }),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      return { clubId, emailSent: false, emailProblem: `EmailJS refused the email (${response.status}${detail ? `: ${detail}` : ''}).` };
    }
  } catch (error) {
    return { clubId, emailSent: false, emailProblem: `Could not reach EmailJS (${(error as Error)?.message || 'network error'}).` };
  }
  await updateDoc(doc(db, 'registrations', member.id!), { acceptanceEmailSentAt: Timestamp.now() }).catch(() => undefined);
  return { clubId, emailSent: true };
}

export async function acceptMembership(member: Registration): Promise<AcceptResult> {
  const clubId = await assignClubId(member.id!);
  return sendAcceptanceEmail(member, clubId);
}
