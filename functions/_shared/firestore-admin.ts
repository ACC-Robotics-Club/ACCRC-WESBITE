/**
 * Server-side Firestore access for Pages Functions, using a Firebase service
 * account over the REST API. Service-account requests bypass security rules,
 * which is what lets the function be the only writer of membership records
 * and the club-ID counter.
 */

export interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { timestampValue: string }
  | { nullValue: null };

export type FirestoreFields = Record<string, FirestoreValue>;

interface FirestoreDocument {
  name: string;
  fields?: FirestoreFields;
}

const encoder = new TextEncoder();

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Access tokens last an hour; reuse one across requests on a warm isolate. */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = base64Url(
    encoder.encode(
      JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    ),
  );

  const pem = account.private_key
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(`${header}.${claims}`),
  );

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${base64Url(signature)}`,
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed (${response.status}).`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

export class Firestore {
  private readonly root: string;

  constructor(private readonly account: ServiceAccount) {
    this.root = `projects/${account.project_id}/databases/(default)/documents`;
  }

  docName(path: string): string {
    return `${this.root}/${path}`;
  }

  private async call<T>(path: string, body: unknown): Promise<{ status: number; data: T }> {
    const token = await getAccessToken(this.account);
    const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { status: response.status, data };
  }

  /** Documents in `collection` whose `field` equals `value`. */
  async findByField(collection: string, field: string, value: string): Promise<FirestoreDocument[]> {
    const { status, data } = await this.call<Array<{ document?: FirestoreDocument }>>(
      `${this.root}:runQuery`,
      {
        structuredQuery: {
          from: [{ collectionId: collection }],
          where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
          limit: 10,
        },
      },
    );
    if (status !== 200) throw new Error(`Firestore query failed (${status}).`);
    return data.flatMap((row) => (row.document ? [row.document] : []));
  }

  /**
   * Runs `work` inside a Firestore transaction and retries on contention, so
   * two people registering at the same moment can never get the same ID.
   */
  async transaction<T>(
    work: (read: (path: string) => Promise<FirestoreDocument | null>) => Promise<{
      writes: unknown[];
      result: T;
    }>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const begin = await this.call<{ transaction: string }>(`${this.root}:beginTransaction`, {});
      if (begin.status !== 200) throw new Error(`Firestore transaction failed to start (${begin.status}).`);
      const transaction = begin.data.transaction;

      const read = async (path: string) => {
        const { status, data } = await this.call<Array<{ found?: FirestoreDocument }>>(
          `${this.root}:batchGet`,
          { documents: [this.docName(path)], transaction },
        );
        if (status !== 200) throw new Error(`Firestore read failed (${status}).`);
        return data[0]?.found ?? null;
      };

      const { writes, result } = await work(read);
      const commit = await this.call<{ error?: { status?: string } }>(`${this.root}:commit`, {
        writes,
        transaction,
      });
      if (commit.status === 200) return result;
      // Contention, or the ID was taken between our read and commit: both
      // are safe to retry with a fresh read.
      const reason = commit.data.error?.status ?? '';
      if (!['ABORTED', 'ALREADY_EXISTS', 'FAILED_PRECONDITION'].includes(reason)) {
        throw new Error(`Firestore commit failed (${commit.status} ${reason}).`);
      }
    }
    throw new Error('Firestore is busy. Please try again.');
  }
}

export const str = (value: string): FirestoreValue => ({ stringValue: value });
export const int = (value: number): FirestoreValue => ({ integerValue: String(value) });
export const timestamp = (value: Date): FirestoreValue => ({ timestampValue: value.toISOString() });

export function readString(doc: FirestoreDocument, field: string): string | undefined {
  const value = doc.fields?.[field];
  return value && 'stringValue' in value ? value.stringValue : undefined;
}

export function readInt(doc: FirestoreDocument | null, field: string): number {
  const value = doc?.fields?.[field];
  return value && 'integerValue' in value ? Number(value.integerValue) : 0;
}
