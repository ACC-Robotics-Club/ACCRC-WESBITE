/**
 * Lazy data access for public pages.
 *
 * Firestore is the single largest piece of JavaScript on the site (~100 KB
 * gzipped). Importing it directly made every visitor download, parse and run
 * it before the page could respond. These wrappers have the same signatures as
 * lib/firestore.ts but load it only once the page is up and the main thread is
 * idle — or immediately when a visitor submits a form. Admin pages keep using
 * lib/firestore.ts directly.
 */
import type {
  Application,
  FestConfig,
  FirestoreAchievement,
  FirestoreEvent,
  FirestoreNews,
  PortalConfig,
  Registration,
} from './firestore';

import { submitPublicForm } from './submitForm';

export type { FestConfig, FirestoreAchievement, FirestoreEvent, FirestoreNews, PortalConfig } from './firestore';

type FirestoreModule = typeof import('./firestore');

let modulePromise: Promise<FirestoreModule> | null = null;

/** Import Firestore now (a visitor action is waiting on it). */
function loadNow(): Promise<FirestoreModule> {
  modulePromise ??= import('./firestore');
  return modulePromise;
}

/** Import Firestore once the browser is idle after load (background data). */
let idlePromise: Promise<FirestoreModule> | null = null;
function loadWhenIdle(): Promise<FirestoreModule> {
  if (modulePromise) return modulePromise;
  idlePromise ??= new Promise<void>((resolve) => {
    const go = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 1500 });
      else setTimeout(resolve, 200);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }).then(loadNow);
  return idlePromise;
}

/** Wraps a Firestore subscription so it can be set up before the module loads. */
function lazySubscribe(start: (m: FirestoreModule) => () => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  loadWhenIdle()
    .then((m) => {
      if (!cancelled) unsubscribe = start(m);
    })
    .catch((error) => console.error('Unable to load live data.', error));
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export const subscribeToEvents = (callback: (events: FirestoreEvent[]) => void, onError?: (error: Error) => void) =>
  lazySubscribe((m) => m.subscribeToEvents(callback, onError));

export const subscribeToEvent = (id: string, callback: (event: FirestoreEvent | null) => void) =>
  lazySubscribe((m) => m.subscribeToEvent(id, callback));

export const subscribeToAchievements = (
  callback: (achievements: FirestoreAchievement[]) => void,
  onError?: (error: Error) => void,
) => lazySubscribe((m) => m.subscribeToAchievements(callback, onError));

export const subscribeToPortalConfig = (callback: (config: PortalConfig) => void) =>
  lazySubscribe((m) => m.subscribeToPortalConfig(callback));

export const subscribeToFestConfig = (callback: (config: FestConfig) => void, onError?: (error: Error) => void) =>
  lazySubscribe((m) => m.subscribeToFestConfig(callback, onError));

export const getNewsPosts = async () => (await loadWhenIdle()).getNewsPosts();
export const getNewsPost = async (id: string) => (await loadWhenIdle()).getNewsPost(id);
export const getLatestNews = async (count?: number) => (await loadWhenIdle()).getLatestNews(count);

/* Public forms save with one plain request (see submitForm.ts), not the SDK. */
export const submitRegistration = async (data: Omit<Registration, 'id' | 'createdAt'>) =>
  submitPublicForm('registrations', data as unknown as Record<string, string | undefined>);
export const submitApplication = async (data: Omit<Application, 'id' | 'createdAt'>) =>
  submitPublicForm('applications', data as unknown as Record<string, string | undefined>);
