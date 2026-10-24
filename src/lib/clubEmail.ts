/**
 * Shared sender for all club notification emails (acceptance, verification).
 *
 * Email goes through EmailJS (emailjs.com), sent from the admin's browser
 * through the club's connected mailbox. The club's three EmailJS values are
 * built in below; they are public by design (EmailJS only accepts them from
 * the allowed origins set in its dashboard). The NEXT_PUBLIC_EMAILJS_*
 * variables can override them. The EmailJS template only has to pass through
 * {{to_email}}, {{subject}} and {{{message_html}}}; the email itself is
 * written by each caller.
 */

const EMAILJS = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim() || 'service_lr2nwbb',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim() || 'template_xwvt34m',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim() || 'E1sdmb3CYhQKFPP4b',
};

export const clubEmailReady = Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

export interface ClubEmailResult {
  sent: boolean;
  /** Why the email wasn't sent, when it wasn't. */
  problem?: string;
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendClubEmail(params: {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  extraParams?: Record<string, string>;
}): Promise<ClubEmailResult> {
  if (!clubEmailReady) {
    return { sent: false, problem: 'Email sending is not set up yet (EmailJS settings missing).' };
  }
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: {
          to_email: params.toEmail,
          ...(params.toName ? { to_name: params.toName } : {}),
          subject: params.subject,
          message_html: params.html,
          ...(params.extraParams || {}),
        },
      }),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      return { sent: false, problem: `EmailJS refused the email (${response.status}${detail ? `: ${detail}` : ''}).` };
    }
  } catch (error) {
    return { sent: false, problem: `Could not reach EmailJS (${(error as Error)?.message || 'network error'}).` };
  }
  return { sent: true };
}
