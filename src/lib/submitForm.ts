import { firebaseConfig } from './firebaseConfig';

/**
 * Saves a public form (membership, event sign-up, leadership application) with
 * one ordinary HTTPS request to Firestore's REST API instead of the Firestore
 * SDK.
 *
 * The SDK sends writes over its long-lived streaming connection and only
 * resolves once the server's acknowledgement comes back over that stream. On
 * some phone and ISP networks the stream stalls: the entry was saved, but the
 * button kept spinning forever. A single request gets a single answer, and it
 * is also far less JavaScript for visitors. The same firestore.rules apply.
 *
 * `createdAt` is stamped by the server.
 */
type FormValue = string | number | boolean | null | undefined;

const TIMEOUT_MS = 20_000;

function toFirestoreValue(value: Exclude<FormValue, undefined>) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: value };
}

export async function submitPublicForm(
  collection: 'registrations' | 'applications',
  data: Record<string, FormValue>
): Promise<string> {
  const { projectId, apiKey } = firebaseConfig;
  const database = `projects/${projectId}/databases/(default)`;
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  const fields: Record<string, ReturnType<typeof toFirestoreValue>> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `https://firestore.googleapis.com/v1/${database}/documents:commit?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          writes: [
            {
              update: { name: `${database}/documents/${collection}/${id}`, fields },
              currentDocument: { exists: false },
              updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
            },
          ],
        }),
      }
    );
  } catch (error) {
    throw new Error(
      (error as Error)?.name === 'AbortError'
        ? 'The connection timed out. Please check your internet and try again.'
        : 'Could not reach the server. Please check your internet and try again.'
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
    console.error('Form submission failed.', response.status, body?.error);
    throw new Error(
      body?.error?.status === 'PERMISSION_DENIED'
        ? 'This form is not accepting submissions right now.'
        : 'We could not save your submission. Please try again.'
    );
  }
  return id;
}
