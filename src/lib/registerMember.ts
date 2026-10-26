import { submitRegistration } from './publicData';

export interface MemberDetails {
  name: string;
  email: string;
  whatsapp: string;
  classSection: string;
  collegeId: string;
  motivation: string;
  /** Honeypot; must stay empty. */
  website?: string;
}

export type RegistrationResult =
  | { status: 'created'; clubId: string; emailSent: boolean }
  | { status: 'existing'; emailSent: boolean }
  /** Saved without a club ID: the registration service isn't available here. */
  | { status: 'received' };

/**
 * Registers a new member through the /api/register function, which issues
 * the club ID and emails the confirmation from the club's Gmail.
 *
 * That function runs on Cloudflare Pages. Where it isn't deployed (on Vercel
 * the path is a plain 404), the registration is saved straight to Firestore
 * as before, without a club ID, so signing up never breaks.
 */
export async function registerMember(details: MemberDetails): Promise<RegistrationResult> {
  // A filled honeypot is a bot: report success and store nothing.
  if (details.website) return { status: 'received' };

  let response: Response | null = null;
  try {
    response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
  } catch {
    response = null;
  }

  const isJson = response?.headers.get('content-type')?.includes('application/json') ?? false;
  if (!response || !isJson) {
    // No registration service on this host (or unreachable): save directly.
    const { name, email, whatsapp, classSection, collegeId, motivation } = details;
    await submitRegistration({
      type: 'membership',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      classSection: classSection.trim(),
      collegeId: collegeId.trim(),
      motivation: motivation.trim(),
    });
    return { status: 'received' };
  }

  const body = (await response.json().catch(() => null)) as
    | (RegistrationResult & { error?: string })
    | null;
  if (!response.ok || !body) {
    throw new Error(body?.error ?? 'We could not complete your registration. Please try again.');
  }
  return body;
}
