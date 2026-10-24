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
type FormValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | FormValue[]
  | { [key: string]: FormValue };

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

const TIMEOUT_MS = 20_000;
const ATTEMPTS = 2;

function toFirestoreValue(value: FormValue): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFirestoreValue(item)) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) fields[key] = toFirestoreValue(item);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: value };
}

function toFields(data: Record<string, FormValue>) {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  }
  return fields;
}

function requestBody(database: string, collection: string, id: string, fields: Record<string, FirestoreValue>) {
  return JSON.stringify({
    writes: [
      {
        update: { name: `${database}/documents/${collection}/${id}`, fields },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ],
  });
}

type FirestoreErrorBody = { error?: { status?: string; message?: string } } | null;

async function commit(url: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function submitPublicForm(
  collection: 'registrations' | 'applications',
  data: Record<string, FormValue>
): Promise<string> {
  const { projectId, apiKey } = firebaseConfig;
  const database = `projects/${projectId}/databases/(default)`;
  // A fixed document id makes the retry below safe: it can never create a
  // second copy of the same submission.
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  const url = `https://firestore.googleapis.com/v1/${database}/documents:commit?key=${encodeURIComponent(apiKey)}`;
  const body = requestBody(database, collection, id, toFields(data));

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await commit(url, body);
    } catch (error) {
      lastError = error;
      // Only a network/timeout failure is worth retrying.
      if (attempt < ATTEMPTS) continue;
      throw new Error(
        (error as Error)?.name === 'AbortError'
          ? 'The connection timed out. Please check your internet and try again.'
          : 'Could not reach the server. Please check your internet and try again.'
      );
    }

    if (response.ok) return id;

    const error = (await response.json().catch(() => null)) as FirestoreErrorBody;

    // The first attempt may have reached Firestore even though the answer was
    // lost. The document now exists with our id, so the submission is saved.
    if (error?.error?.status === 'ALREADY_EXISTS') return id;

    // Retry transient server failures, but never a rejected rule.
    if (response.status >= 500 && attempt < ATTEMPTS) continue;

    console.error('Form submission failed.', response.status, error?.error);
    throw new Error(
      error?.error?.status === 'PERMISSION_DENIED'
        ? 'This form is not accepting submissions right now.'
        : 'We could not save your submission. Please try again.'
    );
  }

  console.error('Form submission failed.', lastError);
  throw new Error('We could not save your submission. Please try again.');
}
