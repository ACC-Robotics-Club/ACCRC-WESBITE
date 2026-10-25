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
  | { status: 'existing'; emailSent: boolean };

/**
 * Registers a new member through the /api/register Pages Function, which
 * issues the club ID and emails the confirmation from the club's Gmail.
 */
export async function registerMember(details: MemberDetails): Promise<RegistrationResult> {
  let response: Response;
  try {
    response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const body = (await response.json().catch(() => null)) as
    | (RegistrationResult & { error?: string })
    | null;
  if (!response.ok || !body) {
    throw new Error(body?.error ?? 'We could not complete your registration. Please try again.');
  }
  return body;
}
