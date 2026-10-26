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

/**
 * One question of an event's registration form, chosen by the admin in the
 * events portal. Admins can delete the standard questions, reorder freely and
 * add their own; the public detail page renders exactly these.
 */
export interface FormField {
  /** Stable id so saved answers stay attached to their question. */
  id: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "number" | "select";
  required: boolean;
  placeholder?: string;
  /** Only used when type is "select". */
  options?: string[];
}

/** New uid-ish id for a builder field; fine for a form's lifetime. */
export const newFormFieldId = () =>
  "ff" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** The standard set every existing event form presented. */
export const DEFAULT_EVENT_FORM_FIELDS: FormField[] = [
  { id: "std-name", label: "Full Name", type: "text", required: true, placeholder: "Full Name" },
  { id: "std-email", label: "Email Address", type: "email", required: true, placeholder: "Email Address" },
  { id: "std-phone", label: "Phone Number", type: "tel", required: true, placeholder: "Phone Number" },
  { id: "std-class", label: "Class/Section", type: "text", required: true, placeholder: "Class/Section" },
  { id: "std-roll", label: "Roll Number", type: "text", required: true, placeholder: "Roll Number" },
  {
    id: "std-interest",
    label: "Area of Interest",
    type: "select",
    required: true,
    placeholder: "Area of Interest",
    options: ["Mechanical", "Electronics", "Programming", "Design"],
  },
  { id: "std-motivation", label: "Motivation (Why do you want to join?)", type: "textarea", required: true, placeholder: "Motivation (Why do you want to join?)" },
];

export interface FirestoreEvent {
  id: string;
  name: string;
  title?: string;
  description: string;
  date: Date;
  location: string;
  isLaunched?: boolean;
  paymentDetails?: {
    provider: "bKash" | "Nagad";
    number: string;
    feeAmount: number;
  };
  rulesPdfUrl?: string;
  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
  imageUrl?: string;
  /** Custom registration questions; undefined/empty keeps the standard set. */
  formFields?: FormField[];
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
  /** Event registrations: one saved answer per question the admin defined. */
  answers?: Array<{ id: string; label: string; value: string }>;
  /** Set by admins while reviewing; missing means not reviewed yet. */
  status?: ReviewStatus;
  /** When the "you're accepted" email with the club ID went out. */
  acceptanceEmailSentAt?: unknown;
  createdAt?: Date;
}

export type ReviewStatus = "pending" | "accepted" | "rejected";

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
  /** Set by admins while reviewing; missing means not reviewed yet. */
  status?: ReviewStatus;
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
    name: data.name || data.title || "",
    title: data.title || data.name || "",
    description: data.description || "",
    date: toDate(data.date),
    location: data.location || "",
    isLaunched: data.isLaunched !== false,
    paymentDetails: data.paymentDetails || undefined,
    rulesPdfUrl: data.rulesPdfUrl || undefined,
    registrationOpensAt: toOptionalDate(data.registrationOpensAt),
    registrationClosesAt: toOptionalDate(data.registrationClosesAt),
    imageUrl: data.imageUrl || undefined,
    formFields: Array.isArray(data.formFields) && data.formFields.length > 0
      ? data.formFields
          .filter((f: unknown): f is Record<string, unknown> => !!f && typeof f === "object")
          .map((f: Record<string, unknown>) => ({
            id: String(f.id || newFormFieldId()),
            label: String(f.label || ""),
            type: (typeof f.type === "string" &&
              (["text", "textarea", "email", "tel", "number", "select"] as const).includes(
                f.type as FormField["type"]
              )
              ? (f.type as FormField["type"])
              : "text"),
            required: f.required === true,
            placeholder: f.placeholder ? String(f.placeholder) : undefined,
            options: Array.isArray(f.options) ? f.options.map(String).filter(Boolean) : undefined,
          }))
      : undefined,
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
  return snapshot.docs
    .map((d) => parseEvent(d.id, d.data()))
    .filter((e) => e.isLaunched !== false);
}

/**
 * Admin-only: Returns ALL events regardless of isLaunched status,
 * so the admin portal can see and manage unlaunched events too.
 */
export async function getAllEvents(): Promise<FirestoreEvent[]> {
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
    const events = snapshot.docs
      .map((d) => parseEvent(d.id, d.data()))
      .filter((e) => e.isLaunched !== false);
    callback(events);
  }, onError);
}

/**
 * Admin-only realtime subscription: Returns ALL events regardless of isLaunched.
 */
export function subscribeToAllEvents(
  callback: (events: FirestoreEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "events"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => parseEvent(d.id, d.data())));
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

/**
 * Firestore rejects `undefined` anywhere in a document, including inside
 * arrays (e.g. a question with no placeholder). Drop those keys; Timestamps
 * and field sentinels are not plain objects, so they pass through untouched.
 */
function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, withoutUndefined(item)]),
    ) as T;
  }
  return value;
}

export async function createEvent(data: Omit<FirestoreEvent, "id" | "createdAt">): Promise<string> {
  const { registrationOpensAt, registrationClosesAt, ...eventData } = withoutUndefined(data);
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
  await updateDoc(doc(db, "events", id), withoutUndefined(updateData));
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
  // Attempt the indexed query first. If the composite index is missing or
  // Firestore returns an error, we fall back to fetching all registrations
  // and filtering client-side so the admin portal never silently returns empty.
  try {
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
    if (filters?.type) constraints.unshift(where("type", "==", filters.type));
    if (filters?.eventId) constraints.unshift(where("eventId", "==", filters.eventId));
    const q = query(collection(db, "registrations"), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) } as Registration));
  } catch (indexError) {
    // Fallback: fetch all and filter in-memory (works even without composite indexes)
    console.warn("getRegistrations: falling back to client-side filtering.", indexError);
    const snapshot = await getDocs(collection(db, "registrations"));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) } as Registration))
      .filter((r) => {
        if (filters?.type && r.type !== filters.type) return false;
        if (filters?.eventId && r.eventId !== filters.eventId) return false;
        return true;
      })
      .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
  }
}

export async function updateRegistrationStatus(id: string, status: ReviewStatus): Promise<void> {
  await updateDoc(doc(db, "registrations", id), { status, reviewedAt: Timestamp.now() });
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

export async function updateApplicationStatus(id: string, status: ReviewStatus): Promise<void> {
  await updateDoc(doc(db, "applications", id), { status, reviewedAt: Timestamp.now() });
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

/* ─── Fest Types ─── */

export interface FestMember {
  name: string;
  institution?: string;
  phone?: string;
  email?: string;
}

export interface FestConfig {
  id?: string;
  isLaunched: boolean;
  registrationOpen: boolean;
  festTitle: string;
  festSubtitle: string;
  festDates: string;
  registrationDeadline: string;
  venue: string;
  prizePool: string;
  bkashNumber: string;
  bkashAccountType: 'Merchant' | 'Personal' | 'Rocket' | 'Nagad';
  bkashInstructions: string;
  closedMessage: string;
  bannerNotice?: string;
  rulesUrl?: string;
  /** Granular module toggles (feature flags). Absent in older documents —
     default ON so existing live docs keep working. */
  bulletinActive?: boolean;
  passGeneration?: boolean;
  updatedAt?: Date;
}

export const DEFAULT_FEST_CONFIG: FestConfig = {
  /* Never public by default: if the real settings can't be read, the site
     must not advertise a fest that may not be launched. */
  isLaunched: false,
  registrationOpen: true,
  festTitle: 'National Robotics & Tech Fest 2026',
  festSubtitle: 'Ignite the Future. Build & Compete.',
  festDates: 'November 20-22, 2026',
  registrationDeadline: 'November 12, 2026',
  venue: 'Adamjee Cantonment College, Dhaka',
  prizePool: '৳ 1,50,000+',
  bkashNumber: '01712345678',
  bkashAccountType: 'Personal',
  bkashInstructions: 'Send the exact registration fee to our bKash number. Put your Team Name in the reference note. Save the 10-character Transaction ID (TrxID) to complete registration.',
  closedMessage: 'Registrations for National Robotics Fest are currently closed. Stay tuned for upcoming announcements.',
  bannerNotice: 'Registrations are open for college and university teams across Bangladesh!',
  rulesUrl: 'https://accrc.pages.dev/rules/fest-guide-2026.pdf',
  bulletinActive: true,
  passGeneration: true,
};

export interface FestSegment {
  id: string;
  title: string;
  category: string;
  description: string;
  teamMin: number;
  teamMax: number;
  registrationFee: number;
  prizePool?: string;
  rulesUrl?: string;
  rulesText?: string;
  venue?: string;
  scheduleTime?: string;
  customBkashNumber?: string;
  /** Empty string means "use the main fest payment setting". */
  customBkashType?: 'Merchant' | 'Personal' | 'Rocket' | 'Nagad' | '';
  guidelines?: string[];
  registrationDeadline?: string;
  requiresSubmissionLink?: boolean;
  isOpen: boolean;
  createdAt: Date;
}

export interface FestRegistration {
  id?: string;
  teamId?: string;
  participantId?: string;
  verificationHash?: string;
  festId?: string;
  segmentId: string;
  segmentTitle: string;
  teamName: string;
  teamNameSearch?: string;
  institution: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  leaderWhatsapp?: string;
  members: FestMember[];
  transactionId?: string;
  paymentMethod?: string;
  amountPaid?: number;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  submissionLink?: string;
  eventId?: string;
  paymentTrxId?: string;
  checkInStatus?: boolean;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  checkInNotes?: string;
  createdAt?: Date;
}

export interface FestScheduleItem {
  id?: string;
  day: string;
  time: string;
  segmentTitle: string;
  stage: string;
  venue: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface FestAnnouncement {
  id?: string;
  title: string;
  body: string;
  tag: 'Notice' | 'Result' | 'Schedule' | 'Urgent';
  isLive: boolean;
  createdAt: Date;
}

/* ─── Default Starter Segments ─── */

export const DEFAULT_FEST_SEGMENTS: Omit<FestSegment, 'id' | 'createdAt'>[] = [
  {
    title: 'Autonomous Line Follower (LFR)',
    category: 'Robotics',
    description: 'High-speed autonomous line follower robots navigating complex curves, intersections, and sharp angles on a custom matte arena.',
    teamMin: 1,
    teamMax: 4,
    registrationFee: 1000,
    prizePool: '৳ 35,000',
    rulesUrl: 'https://accrc.pages.dev/rules/lfr.pdf',
    venue: 'College Gymnasium Arena A',
    scheduleTime: 'Day 1 · 09:30 AM',
    isOpen: true,
  },
  {
    title: 'Robo Soccer Challenge',
    category: 'Robotics',
    description: 'Manual or wireless controlled combat-style robotic soccer matches with fast-paced dribbling and defense strategies.',
    teamMin: 2,
    teamMax: 4,
    registrationFee: 1200,
    prizePool: '৳ 30,000',
    rulesUrl: 'https://accrc.pages.dev/rules/soccer.pdf',
    venue: 'Auditorium Quad Field',
    scheduleTime: 'Day 1 · 01:30 PM',
    isOpen: true,
  },
  {
    title: 'Project Showcase & Innovation Display',
    category: 'Innovation',
    description: 'Present hardware and IoT prototypes solving real-world challenges in agriculture, healthcare, automation, or clean energy.',
    teamMin: 1,
    teamMax: 3,
    registrationFee: 800,
    prizePool: '৳ 25,000',
    rulesUrl: 'https://accrc.pages.dev/rules/project.pdf',
    venue: 'Main Science Gallery Hall',
    scheduleTime: 'Day 2 · 10:00 AM',
    requiresSubmissionLink: true,
    isOpen: true,
  },
  {
    title: 'National Tech & Robotics Olympiad',
    category: 'Olympiad',
    description: 'Individual competitive test assessing electronics, microcontrollers, algorithms, and computational robotics principles.',
    teamMin: 1,
    teamMax: 1,
    registrationFee: 300,
    prizePool: '৳ 15,000',
    rulesUrl: 'https://accrc.pages.dev/rules/olympiad.pdf',
    venue: 'Hall Room 301-304',
    scheduleTime: 'Day 2 · 09:00 AM',
    isOpen: true,
  },
  {
    title: 'CAD & 3D Mechanism Design',
    category: 'Engineering',
    description: 'Live 3-hour mechanical modeling sprint in SolidWorks/Fusion360 designing a precision robotic gripper or chassis.',
    teamMin: 1,
    teamMax: 2,
    registrationFee: 500,
    prizePool: '৳ 15,000',
    venue: 'Advanced Computer Lab 2',
    scheduleTime: 'Day 1 · 11:00 AM',
    isOpen: true,
  },
  {
    title: 'Speed Circuit & Soldering Sprint',
    category: 'Hardware',
    description: 'Precision circuit debugging and live high-speed soldering competition tested on real-time hardware diagnostics.',
    teamMin: 1,
    teamMax: 2,
    registrationFee: 500,
    prizePool: '৳ 12,000',
    venue: 'Electronics Lab 1',
    scheduleTime: 'Day 2 · 02:00 PM',
    isOpen: true,
  },
];

/* ─── Fest Segments ─── */

function parseFestSegment(id: string, data: DocumentData): FestSegment {
  return {
    id,
    title: data.title || '',
    category: data.category || 'Robotics',
    description: data.description || '',
    teamMin: Number(data.teamMin) || 1,
    teamMax: Number(data.teamMax) || 4,
    registrationFee: Number(data.registrationFee) || 0,
    prizePool: data.prizePool || '',
    rulesUrl: data.rulesUrl || '',
    rulesText: data.rulesText || '',
    venue: data.venue || '',
    scheduleTime: data.scheduleTime || '',
    customBkashNumber: data.customBkashNumber || '',
    /* Only a real account mode is an override; anything else lets the fest
       page fall back to the main fest payment setting. */
    customBkashType:
      data.customBkashType === 'Personal' || data.customBkashType === 'Merchant' ||
      data.customBkashType === 'Rocket' || data.customBkashType === 'Nagad'
        ? data.customBkashType
        : undefined,
    guidelines: Array.isArray(data.guidelines) ? data.guidelines : [],
    registrationDeadline: data.registrationDeadline || '',
    requiresSubmissionLink: data.requiresSubmissionLink === true,
    isOpen: data.isOpen !== false,
    createdAt: toDate(data.createdAt),
  };
}

export async function getFestSegments(): Promise<FestSegment[]> {
  try {
    const q = query(collection(db, "fest_segments"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return DEFAULT_FEST_SEGMENTS.map((seg, i) => ({
        ...seg,
        id: `default-${i}`,
        createdAt: new Date(),
      }));
    }
    return snapshot.docs.map((d) => parseFestSegment(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching fest segments:', error);
    return DEFAULT_FEST_SEGMENTS.map((seg, i) => ({
      ...seg,
      id: `default-${i}`,
      createdAt: new Date(),
    }));
  }
}

export function subscribeToFestSegments(
  callback: (segments: FestSegment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "fest_segments"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(
          DEFAULT_FEST_SEGMENTS.map((seg, i) => ({
            ...seg,
            id: `default-${i}`,
            createdAt: new Date(),
          }))
        );
        return;
      }
      callback(snapshot.docs.map((d) => parseFestSegment(d.id, d.data())));
    },
    (err) => {
      console.warn('Realtime fest segments notice:', err);
      callback(
        DEFAULT_FEST_SEGMENTS.map((seg, i) => ({
          ...seg,
          id: `default-${i}`,
          createdAt: new Date(),
        }))
      );
      onError?.(err);
    }
  );
}

export async function createFestSegment(data: Omit<FestSegment, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "fest_segments"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateFestSegment(id: string, data: Partial<Omit<FestSegment, "id" | "createdAt">>): Promise<void> {
  await updateDoc(doc(db, "fest_segments", id), {
    ...data,
  });
}

export async function deleteFestSegment(id: string): Promise<void> {
  await deleteDoc(doc(db, "fest_segments", id));
}

/* ─── Fest Configuration & Launcher ─── */

function parseFestConfig(data: DocumentData | undefined): FestConfig {
  const isLaunched = data?.isLaunched;
  const registrationOpen = data?.registrationOpen;

  return {
    ...DEFAULT_FEST_CONFIG,
    ...(data ?? {}),
    isLaunched: isLaunched === undefined
      ? DEFAULT_FEST_CONFIG.isLaunched
      : isLaunched === true || (typeof isLaunched === 'string' && isLaunched.toLowerCase() === 'true'),
    registrationOpen: registrationOpen === undefined
      ? DEFAULT_FEST_CONFIG.registrationOpen
      : registrationOpen === true || (typeof registrationOpen === 'string' && registrationOpen.toLowerCase() === 'true'),
    bulletinActive: data?.bulletinActive === undefined
      ? DEFAULT_FEST_CONFIG.bulletinActive
      : data.bulletinActive === true || (typeof data.bulletinActive === 'string' && data.bulletinActive.toLowerCase() === 'true'),
    passGeneration: data?.passGeneration === undefined
      ? DEFAULT_FEST_CONFIG.passGeneration
      : data.passGeneration === true || (typeof data.passGeneration === 'string' && data.passGeneration.toLowerCase() === 'true'),
    updatedAt: data?.updatedAt ? toDate(data.updatedAt) : undefined,
  };
}

export async function getFestConfig(): Promise<FestConfig> {
  try {
    const docRef = doc(db, "fest_settings", "global_config");
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return DEFAULT_FEST_CONFIG;
    }
    return parseFestConfig(snapshot.data());
  } catch (error) {
    console.error('Error fetching fest config:', error);
    return DEFAULT_FEST_CONFIG;
  }
}

export function subscribeToFestConfig(
  callback: (config: FestConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, "fest_settings", "global_config");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        /* A missing document from the local cache only means the server
           hasn't answered yet (slow or offline): wait instead of falling
           back to defaults. */
        if (snapshot.metadata.fromCache) return;
        callback(DEFAULT_FEST_CONFIG);
        return;
      }
      callback(parseFestConfig(snapshot.data()));
    },
    (err) => {
      console.warn('Realtime fest config notice:', err);
      onError?.(err);
    }
  );
}

export async function updateFestConfig(data: Partial<FestConfig>): Promise<void> {
  const docRef = doc(db, "fest_settings", "global_config");
  await setDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

/* ─── Participant ID & Hash Helpers ─── */

export function generateParticipantId(year = '26'): string {
  // A 48-bit random suffix makes collisions impractical while preserving the
  // printed ACCRC-FEST26-TM-[ID] format used by participant passes.
  const uuid = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12).toUpperCase();
  const suffix = uuid || Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  return `ACCRC-FEST${year}-TM-${suffix}`;
}

export function generateVerificationHash(participantId: string, teamName: string, leaderPhone: string): string {
  const cleanSeed = `${participantId}:${teamName.trim().toUpperCase()}:${leaderPhone.replace(/\D/g, '')}:${Date.now().toString(36)}`;
  let hash = 0;
  for (let i = 0; i < cleanSeed.length; i++) {
    hash = (hash << 5) - hash + cleanSeed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SEC-${hex}-${rand}`;
}

/* ─── Fest Registrations ─── */

export async function submitFestRegistration(
  data: Omit<FestRegistration, "id" | "createdAt">
): Promise<{ id: string; participantId: string; verificationHash: string }> {
  const participantId = data.participantId?.trim().toUpperCase() || generateParticipantId('26');
  if (!participantId) {
    throw new Error('Could not generate a participant ID. Please try again.');
  }
  const verificationHash = data.verificationHash || generateVerificationHash(participantId, data.teamName, data.leaderPhone);

  const cleanMembers = (data.members || []).map((m) => ({
    name: m.name ? String(m.name).trim() : '',
    institution: m.institution ? String(m.institution).trim() : '',
    phone: m.phone ? String(m.phone).trim() : '',
    email: m.email ? String(m.email).trim() : '',
  }));

  // Keep this payload explicit: Firestore rejects undefined values, and these
  // are the only fields a public registration needs to create under the rules.
  const payload = {
    participantId,
    verificationHash,
    eventId: data.segmentId.trim(),
    segmentId: data.segmentId.trim(),
    segmentTitle: data.segmentTitle.trim(),
    teamName: data.teamName.trim(),
    teamNameSearch: data.teamName.trim().toLocaleLowerCase(),
    institution: data.institution.trim(),
    leaderName: data.leaderName.trim(),
    leaderEmail: data.leaderEmail.trim(),
    leaderPhone: data.leaderPhone.trim(),
    leaderWhatsapp: data.leaderWhatsapp ? String(data.leaderWhatsapp).trim() : (data.leaderPhone ? String(data.leaderPhone).trim() : ''),
    members: cleanMembers,
    transactionId: data.transactionId ? String(data.transactionId).trim().toUpperCase() : '',
    paymentTrxId: data.transactionId ? String(data.transactionId).trim().toUpperCase() : '',
    paymentMethod: data.paymentMethod || 'bKash',
    amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : 0,
    status: data.status || 'pending',
    submissionLink: data.submissionLink ? String(data.submissionLink).trim() : '',
    checkInStatus: false,
    checkedIn: false,
    checkedInAt: null,
    type: 'fest' as const,
    createdAt: Timestamp.now(),
  };

  // The primary write is awaited so a rejected Firestore request reaches the
  // form's error state instead of reporting a successful registration.
  const docRef = await addDoc(collection(db, "registrations"), payload);
  const teamId = docRef.id;

  return { id: teamId, participantId, verificationHash };
}

export async function getFestRegistrations(filters?: { segmentId?: string; status?: string }): Promise<FestRegistration[]> {
  try {
    const snapshot = await getDocs(collection(db, "registrations"));
    return snapshot.docs
      .filter((d) => {
        const data = d.data();
        return data.type === 'fest' &&
          (!filters?.segmentId || data.segmentId === filters.segmentId) &&
          (!filters?.status || data.status === filters.status);
      })
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          participantId: data.participantId || `ACCRC-FEST26-TM-${d.id.substring(0, 4).toUpperCase()}`,
          verificationHash: data.verificationHash || `SEC-${d.id.substring(0, 8).toUpperCase()}`,
          createdAt: toDate(data.createdAt),
        } as FestRegistration;
      })
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  } catch (error) {
    console.error('Error fetching fest registrations:', error);
    return [];
  }
}

export async function getFestRegistrationById(id: string): Promise<FestRegistration | null> {
  try {
    const docRef = doc(db, "registrations", id);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().type === 'fest') {
      const data = snap.data();
      return {
        id: snap.id,
        ...data,
        participantId: data.participantId || `ACCRC-FEST26-TM-${snap.id.substring(0, 4).toUpperCase()}`,
        verificationHash: data.verificationHash || `SEC-${snap.id.substring(0, 8).toUpperCase()}`,
        createdAt: toDate(data.createdAt),
      } as FestRegistration;
    }
  } catch (err) {
    console.warn('Notice checking registrations by id:', err);
  }

  // Legacy fallback for registrations created before the canonical collection.
  try {
    const fallbackRef = doc(db, "fest_registrations", id);
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) {
      const data = fallbackSnap.data();
      return {
        id: fallbackSnap.id,
        ...data,
        participantId: data.participantId || `ACCRC-FEST26-TM-${fallbackSnap.id.substring(0, 4).toUpperCase()}`,
        verificationHash: data.verificationHash || `SEC-${fallbackSnap.id.substring(0, 8).toUpperCase()}`,
        createdAt: toDate(data.createdAt),
      } as FestRegistration;
    }
  } catch (fallbackErr) {
    console.warn('Notice checking legacy fest registration by id:', fallbackErr);
  }

  return null;
}

export async function getFestRegistrationByParticipantId(participantId: string): Promise<FestRegistration | null> {
  const cleanId = participantId.trim().toUpperCase();
  try {
    const q = query(
      collection(db, "registrations"),
      where("type", "==", "fest"),
      where("participantId", "==", cleanId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        ...data,
        participantId: data.participantId || cleanId,
        verificationHash: data.verificationHash || `SEC-${d.id.substring(0, 8).toUpperCase()}`,
        createdAt: toDate(data.createdAt),
      } as FestRegistration;
    }
  } catch (err) {
    console.warn('Notice querying registrations by participantId:', err);
  }

  // Legacy fallback for registrations created before the canonical collection.
  try {
    const fallbackQ = query(
      collection(db, "fest_registrations"),
      where("participantId", "==", cleanId),
      limit(1)
    );
    const fallbackSnap = await getDocs(fallbackQ);
    if (!fallbackSnap.empty) {
      const d = fallbackSnap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        ...data,
        participantId: data.participantId || cleanId,
        verificationHash: data.verificationHash || `SEC-${d.id.substring(0, 8).toUpperCase()}`,
        createdAt: toDate(data.createdAt),
      } as FestRegistration;
    }
  } catch (fallbackErr) {
    console.warn('Notice querying legacy fest registrations by participantId:', fallbackErr);
  }

  return null;
}

export async function findFestRegistration(searchValue: string): Promise<FestRegistration | null> {
  const value = searchValue.trim();
  if (!value) return null;

  const registrationCollection = collection(db, "registrations");
  const normalizedValue = value.toUpperCase();
  const lookups: Array<{ field: string; value: string }> = [
    { field: "participantId", value: normalizedValue },
    { field: "transactionId", value: normalizedValue },
    { field: "paymentTrxId", value: normalizedValue },
    { field: "teamNameSearch", value: value.toLocaleLowerCase() },
    { field: "teamName", value },
  ];

  for (const lookup of lookups) {
    const result = await getDocs(query(
      registrationCollection,
      where("type", "==", "fest"),
      where(lookup.field, "==", lookup.value),
      limit(1)
    ));

    if (!result.empty) {
      const registration = result.docs[0];
      const data = registration.data();
      return {
        id: registration.id,
        ...data,
        participantId: data.participantId || `ACCRC-FEST26-TM-${registration.id.substring(0, 4).toUpperCase()}`,
        verificationHash: data.verificationHash || `SEC-${registration.id.substring(0, 8).toUpperCase()}`,
        createdAt: toDate(data.createdAt),
      } as FestRegistration;
    }
  }

  if (value.length > 15) {
    return getFestRegistrationById(value);
  }

  return null;
}

export async function checkInFestRegistration(
  id: string,
  organizerNotes?: string
): Promise<{ success: boolean; message: string; checkedInAt: string }> {
  const docRef = doc(db, "registrations", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Registration record not found');
  }
  const existing = snap.data();
  if (existing.checkedIn || existing.checkInStatus) {
    return {
      success: false,
      message: `Already checked in at ${existing.checkedInAt || 'an earlier scan'}.`,
      checkedInAt: existing.checkedInAt,
    };
  }
  const nowIso = new Date().toISOString();
  await updateDoc(docRef, {
    checkedIn: true,
    checkInStatus: true,
    checkedInAt: nowIso,
    status: 'verified',
    ...(organizerNotes ? { checkInNotes: organizerNotes } : {}),
  });

  return {
    success: true,
    message: 'Team successfully verified and checked in at entrance gate.',
    checkedInAt: nowIso,
  };
}

export async function updateFestRegistrationStatus(
  id: string,
  status: FestRegistration["status"],
  notes?: string
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (notes !== undefined) payload.notes = notes;
  await updateDoc(doc(db, "registrations", id), payload);
}

export async function deleteFestRegistration(id: string): Promise<void> {
  await deleteDoc(doc(db, "registrations", id));
}

/* ─── Fest Schedules ─── */

export async function getFestSchedule(): Promise<FestScheduleItem[]> {
  try {
    const snapshot = await getDocs(collection(db, "fest_schedule"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FestScheduleItem));
  } catch (error) {
    console.error('Error fetching fest schedule:', error);
    return [];
  }
}

export async function createFestScheduleItem(data: Omit<FestScheduleItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "fest_schedule"), data);
  return docRef.id;
}

export async function deleteFestScheduleItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "fest_schedule", id));
}

/* ─── Fest Announcements ─── */

export async function getFestAnnouncements(): Promise<FestAnnouncement[]> {
  try {
    const q = query(collection(db, "fest_announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: toDate(d.data().createdAt),
    } as FestAnnouncement));
  } catch (error) {
    console.error('Error fetching fest announcements:', error);
    return [];
  }
}

export function subscribeToFestAnnouncements(
  callback: (announcements: FestAnnouncement[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "fest_announcements"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: toDate(d.data().createdAt),
        } as FestAnnouncement))
      );
    },
    onError
  );
}

export async function createFestAnnouncement(data: Omit<FestAnnouncement, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "fest_announcements"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function deleteFestAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, "fest_announcements", id));
}
