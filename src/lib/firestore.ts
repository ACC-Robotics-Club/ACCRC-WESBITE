import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  deleteField,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

/* ─── Types ─── */

export interface FirestoreEvent {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
  imageUrl?: string;
  createdAt: Date;
}

export interface FirestoreNews {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt: Date;
  createdAt: Date;
}

export interface FirestoreAchievement {
  id: string;
  title: string;
  recipients: string;
  competition: string;
  level: "Global" | "National";
  year: number;
  createdAt: Date;
}

export interface Registration {
  id?: string;
  type: "membership" | "event";
  eventId?: string;
  /** Issued by /api/register for membership registrations. */
  clubId?: string;
  name: string;
  email: string;
  whatsapp?: string;
  collegeId?: string;
  classSection: string;
  motivation: string;
  phone?: string;
  rollNumber?: string;
  areaOfInterest?: string;
  bloodGroup?: string;
  createdAt?: Date;
}

export interface Application {
  id?: string;
  type: "sub-executive" | "executive" | "prefect";
  name: string;
  email: string;
  whatsapp?: string;
  idNumber: string;
  section: string;
  pastExperience: string;
  visionStatement: string;
  roleApplyingFor: string;
  createdAt?: Date;
}

export interface PortalConfig {
  subExecOpen: boolean;
  execOpen: boolean;
  prefectOpen: boolean;
  subExecRoles: string[];
  execRoles: string[];
  prefectRoles: string[];
}

export const defaultPortalConfig: PortalConfig = {
  subExecOpen: false,
  execOpen: false,
  prefectOpen: false,
  subExecRoles: [],
  execRoles: [],
  prefectRoles: [],
};

/* ─── Helpers ─── */

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (ts && typeof ts === "object" && "seconds" in ts) {
    return new Date((ts as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

function toOptionalDate(ts: unknown): Date | undefined {
  if (!ts) return undefined;
  return toDate(ts);
}

function parsePortalConfig(data: DocumentData | undefined): PortalConfig {
  return {
    ...defaultPortalConfig,
    ...(data ?? {}),
    subExecRoles: Array.isArray(data?.subExecRoles) ? data.subExecRoles : [],
    execRoles: Array.isArray(data?.execRoles) ? data.execRoles : [],
    prefectRoles: Array.isArray(data?.prefectRoles) ? data.prefectRoles : [],
  };
}

function parseEvent(id: string, data: DocumentData): FirestoreEvent {
  return {
    id,
    name: data.name || "",
    description: data.description || "",
    date: toDate(data.date),
    location: data.location || "",
    registrationOpensAt: toOptionalDate(data.registrationOpensAt),
    registrationClosesAt: toOptionalDate(data.registrationClosesAt),
    imageUrl: data.imageUrl || undefined,
    createdAt: toDate(data.createdAt),
  };
}

function parseNews(id: string, data: DocumentData): FirestoreNews {
  return {
    id,
    title: data.title || "",
    body: data.body || "",
    excerpt: data.excerpt || "",
    imageUrl: data.imageUrl || undefined,
    publishedAt: toDate(data.publishedAt),
    createdAt: toDate(data.createdAt),
  };
}

function parseAchievement(id: string, data: DocumentData): FirestoreAchievement {
  const year = Number(data.year);

  return {
    id,
    title: data.title || "",
    recipients: data.recipients || "",
    competition: data.competition || "",
    level: data.level === "Global" ? "Global" : "National",
    year: Number.isInteger(year) && year >= 1900 && year <= 9999 ? year : new Date().getFullYear(),
    createdAt: toDate(data.createdAt),
  };
}

/* ─── Events ─── */

export async function getEvents(): Promise<FirestoreEvent[]> {
  const q = query(collection(db, "events"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseEvent(d.id, d.data()));
}

export async function getEvent(id: string): Promise<FirestoreEvent | null> {
  const docRef = doc(db, "events", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return parseEvent(snapshot.id, snapshot.data());
}

export function subscribeToEvents(
  callback: (events: FirestoreEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "events"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((d) => parseEvent(d.id, d.data()));
    callback(events);
  }, onError);
}

export function subscribeToEvent(id: string, callback: (event: FirestoreEvent | null) => void): Unsubscribe {
  const docRef = doc(db, "events", id);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(parseEvent(snapshot.id, snapshot.data()));
  });
}

export async function createEvent(data: Omit<FirestoreEvent, "id" | "createdAt">): Promise<string> {
  const { registrationOpensAt, registrationClosesAt, ...eventData } = data;
  const docRef = await addDoc(collection(db, "events"), {
    ...eventData,
    date: Timestamp.fromDate(data.date),
    ...(registrationOpensAt ? { registrationOpensAt: Timestamp.fromDate(registrationOpensAt) } : {}),
    ...(registrationClosesAt ? { registrationClosesAt: Timestamp.fromDate(registrationClosesAt) } : {}),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateEvent(id: string, data: Partial<Omit<FirestoreEvent, "id" | "createdAt">>): Promise<void> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = Timestamp.fromDate(data.date);
  if ("registrationOpensAt" in data) {
    updateData.registrationOpensAt = data.registrationOpensAt
      ? Timestamp.fromDate(data.registrationOpensAt)
      : deleteField();
  }
  if ("registrationClosesAt" in data) {
    updateData.registrationClosesAt = data.registrationClosesAt
      ? Timestamp.fromDate(data.registrationClosesAt)
      : deleteField();
  }
  await updateDoc(doc(db, "events", id), updateData);
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}

/* ─── News ─── */

export async function getNewsPosts(): Promise<FirestoreNews[]> {
  const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseNews(d.id, d.data()));
}

export async function getNewsPost(id: string): Promise<FirestoreNews | null> {
  const docRef = doc(db, "news", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return parseNews(snapshot.id, snapshot.data());
}

export async function getLatestNews(count: number = 3): Promise<FirestoreNews[]> {
  const q = query(collection(db, "news"), orderBy("publishedAt", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseNews(d.id, d.data()));
}

export async function createNewsPost(data: Omit<FirestoreNews, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "news"), {
    ...data,
    publishedAt: Timestamp.fromDate(data.publishedAt),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateNewsPost(id: string, data: Partial<Omit<FirestoreNews, "id" | "createdAt">>): Promise<void> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.publishedAt) updateData.publishedAt = Timestamp.fromDate(data.publishedAt);
  await updateDoc(doc(db, "news", id), updateData);
}

export async function deleteNewsPost(id: string): Promise<void> {
  await deleteDoc(doc(db, "news", id));
}

/* ─── Achievements ─── */

export async function getAchievements(): Promise<FirestoreAchievement[]> {
  const snapshot = await getDocs(collection(db, "achievements"));
  return snapshot.docs
    .map((document) => parseAchievement(document.id, document.data()))
    .sort((a, b) => b.year - a.year || b.createdAt.getTime() - a.createdAt.getTime());
}

export function subscribeToAchievements(
  callback: (achievements: FirestoreAchievement[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(collection(db, "achievements"), (snapshot) => {
    callback(
      snapshot.docs
        .map((document) => parseAchievement(document.id, document.data()))
        .sort((a, b) => b.year - a.year || b.createdAt.getTime() - a.createdAt.getTime())
    );
  }, onError);
}

export async function createAchievement(data: Omit<FirestoreAchievement, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "achievements"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateAchievement(
  id: string,
  data: Partial<Omit<FirestoreAchievement, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "achievements", id), data);
}

export async function deleteAchievement(id: string): Promise<void> {
  await deleteDoc(doc(db, "achievements", id));
}

/* ─── Registrations ─── */

export async function submitRegistration(data: Omit<Registration, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "registrations"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getRegistrations(filters?: { type?: string; eventId?: string }): Promise<Registration[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (filters?.type) constraints.unshift(where("type", "==", filters.type));
  if (filters?.eventId) constraints.unshift(where("eventId", "==", filters.eventId));
  const q = query(collection(db, "registrations"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) } as Registration));
}

export async function deleteRegistration(id: string): Promise<void> {
  await deleteDoc(doc(db, "registrations", id));
}

/* ─── Applications ─── */

export async function submitApplication(data: Omit<Application, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "applications"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getApplications(type?: Application["type"]): Promise<Application[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (type) constraints.unshift(where("type", "==", type));
  const q = query(collection(db, "applications"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) } as Application));
}

export async function deleteApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, "applications", id));
}

/* ─── Portal Config ─── */

export async function getPortalConfig(): Promise<PortalConfig> {
  const docRef = doc(db, "config", "portal");
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return defaultPortalConfig;
  }
  return parsePortalConfig(snapshot.data());
}

export function subscribeToPortalConfig(callback: (config: PortalConfig) => void): Unsubscribe {
  const docRef = doc(db, "config", "portal");
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(defaultPortalConfig);
      return;
    }
    callback(parsePortalConfig(snapshot.data()));
  });
}

export async function updatePortalConfig(data: Partial<PortalConfig>): Promise<void> {
  await setDoc(doc(db, "config", "portal"), data, { merge: true });
}
