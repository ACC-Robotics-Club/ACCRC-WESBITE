import type { FestConfig, FirestoreEvent } from './firestore';

/** One entry on the public calendar: a club event or the launched fest. */
export interface ScheduleItem {
  id: string;
  kind: 'event' | 'fest';
  name: string;
  description: string;
  location: string;
  /** When it starts. */
  date: Date;
  /** When it is over (end of the last day for the fest, the start time for events). */
  endsAt: Date;
  /** Human date, e.g. "November 20-22, 2026", when there is a nicer one than `date`. */
  dateLabel?: string;
  href: string;
  imageUrl?: string;
  registration: RegistrationState;
}

export type RegistrationState =
  | { state: 'open'; closesAt?: Date; deadlineLabel?: string }
  | { state: 'soon'; opensAt: Date }
  | { state: 'closed' }
  | { state: 'none' };

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Reads the fest's free-text dates ("November 20-22, 2026", "Nov 20 – 22, 2026",
 * "20-22 November 2026", "November 20, 2026") into a start and end date.
 */
export function parseFestDates(text: string): { start: Date; end: Date } | null {
  const clean = text.trim().toLowerCase().replace(/[–—]/g, '-');
  const monthIndex = (word: string) => MONTHS.findIndex((m) => m.startsWith(word.slice(0, 3)));

  // Month first: "november 20-22, 2026"
  let match = clean.match(/^([a-z]+)\.?\s+(\d{1,2})(?:\s*-\s*(\d{1,2}))?,?\s+(\d{4})/);
  if (match) {
    const month = monthIndex(match[1]);
    if (month < 0) return null;
    const year = Number(match[4]);
    const startDay = Number(match[2]);
    const endDay = match[3] ? Number(match[3]) : startDay;
    return { start: new Date(year, month, startDay), end: new Date(year, month, endDay, 23, 59, 59) };
  }

  // Day first: "20-22 november 2026"
  match = clean.match(/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([a-z]+)\.?,?\s+(\d{4})/);
  if (match) {
    const month = monthIndex(match[3]);
    if (month < 0) return null;
    const year = Number(match[4]);
    const startDay = Number(match[1]);
    const endDay = match[2] ? Number(match[2]) : startDay;
    return { start: new Date(year, month, startDay), end: new Date(year, month, endDay, 23, 59, 59) };
  }

  return null;
}

export function eventToSchedule(event: FirestoreEvent, now = new Date()): ScheduleItem {
  const opens = event.registrationOpensAt;
  const closes = event.registrationClosesAt;
  let registration: RegistrationState = { state: 'none' };
  if (opens && closes) {
    if (now < opens) registration = { state: 'soon', opensAt: opens };
    else if (now <= closes) registration = { state: 'open', closesAt: closes };
    else registration = { state: 'closed' };
  }

  return {
    id: event.id,
    kind: 'event',
    name: event.name,
    description: event.description ?? '',
    location: event.location,
    date: event.date,
    endsAt: event.date,
    href: `/events/detail/?id=${event.id}`,
    imageUrl: event.imageUrl,
    registration,
  };
}

/** The fest appears on the calendar only once it is launched in the admin. */
export function festToSchedule(config: FestConfig | null): ScheduleItem | null {
  if (!config?.isLaunched) return null;
  const dates = parseFestDates(config.festDates || '');
  if (!dates) return null;

  return {
    id: 'fest',
    kind: 'fest',
    name: config.festTitle,
    description: config.festSubtitle || '',
    location: config.venue,
    date: dates.start,
    endsAt: dates.end,
    dateLabel: config.festDates,
    href: '/fest/',
    registration: config.registrationOpen
      ? { state: 'open', deadlineLabel: config.registrationDeadline || undefined }
      : { state: 'closed' },
  };
}

/**
 * Splits the calendar into what is still to come (soonest first) and what has
 * finished (latest first). An event stays "upcoming" for the whole day it
 * happens on, so it does not vanish the moment its start time passes.
 */
export function splitSchedule(items: ScheduleItem[], now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isUpcoming = (item: ScheduleItem) =>
    item.kind === 'fest' ? item.endsAt >= now : item.date >= startOfToday;

  return {
    upcoming: items.filter(isUpcoming).sort((a, b) => a.date.getTime() - b.date.getTime()),
    past: items.filter((item) => !isUpcoming(item)).sort((a, b) => b.date.getTime() - a.date.getTime()),
  };
}

export function registrationLabel(item: ScheduleItem): string {
  const r = item.registration;
  switch (r.state) {
    case 'open':
      if (r.deadlineLabel) return `Registration open · until ${r.deadlineLabel}`;
      if (r.closesAt) return `Registration open · until ${r.closesAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      return 'Registration open';
    case 'soon':
      return `Registration opens ${r.opensAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    case 'closed':
      return 'Registration closed';
    default:
      return 'Details coming soon';
  }
}
