import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { registrationLabel, type ScheduleItem } from '@/lib/schedule';

export function formatScheduleDate(item: ScheduleItem): string {
  return item.dateLabel ?? item.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Days from today until the item starts: 0 = today. */
export function daysUntil(date: Date, now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((day - start) / 86_400_000);
}

export function whenLabel(item: ScheduleItem, now = new Date()): string {
  if (item.date <= now && item.endsAt >= now) return 'Happening now';
  const days = daysUntil(item.date, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

function RegistrationBadge({ item }: { item: ScheduleItem }) {
  const open = item.registration.state === 'open';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-wider ${
        open ? 'border-success/30 bg-success/10 text-success' : 'border-border-strong bg-primary text-text-secondary'
      }`}
    >
      {open && <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />}
      {registrationLabel(item)}
    </span>
  );
}

/** An upcoming event in the grid on /events/. */
export function EventCard({ item }: { item: ScheduleItem }) {
  const open = item.registration.state === 'open';
  return (
    <a
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-border-strong bg-secondary transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent"
    >
      {item.imageUrl && (
        <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-44 w-full border-b-2 border-border-strong object-cover" />
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="mono-label text-accent">{item.kind === 'fest' ? 'Fest' : 'Club event'}</span>
          <span className="mono-label text-text-tertiary">{whenLabel(item)}</span>
        </div>
        <h3 className="font-display text-display-xs font-extrabold tracking-tight text-ink">{item.name}</h3>
        <div className="mt-3 space-y-1.5 text-body-sm text-text-secondary">
          <p className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0 text-text-tertiary" aria-hidden />
            {formatScheduleDate(item)}
          </p>
          {item.location && (
            <p className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0 text-text-tertiary" aria-hidden />
              {item.location}
            </p>
          )}
        </div>
        {item.description && <p className="mt-4 line-clamp-3 text-body-sm text-text-tertiary">{item.description}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <RegistrationBadge item={item} />
          <span className="inline-flex items-center gap-1.5 mono-label text-accent">
            {open ? 'Register' : 'Details'}
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  );
}

/** The next event, shown large at the top of /events/. */
export function FeaturedEventCard({ item }: { item: ScheduleItem }) {
  const open = item.registration.state === 'open';
  return (
    <a
      href={item.href}
      className="group relative block overflow-hidden rounded-3xl border-2 border-ink bg-ink p-7 text-[#F7F5EE] shadow-[0_40px_100px_-50px_rgba(28,25,23,0.5)] sm:p-10"
    >
      <div className="dot-grid-light absolute inset-0 opacity-20" aria-hidden />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.25),transparent_68%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-glow px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-ink">
            Next up · {whenLabel(item)}
          </span>
          <span className="mono-label text-[#F7F5EE]/60">{item.kind === 'fest' ? 'Fest' : 'Club event'}</span>
        </div>
        <h2 className="mt-5 font-display text-display-md font-black leading-[0.95] tracking-tight">{item.name}</h2>
        {item.description && <p className="mt-4 max-w-2xl text-body-md text-[#F7F5EE]/70">{item.description}</p>}
        <div className="mt-6 flex flex-col gap-2 text-body-sm text-[#F7F5EE]/80 sm:flex-row sm:flex-wrap sm:gap-x-8">
          <p className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-glow" aria-hidden />
            {formatScheduleDate(item)}
          </p>
          {item.location && (
            <p className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-glow" aria-hidden />
              {item.location}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-glow px-6 py-3 font-mono text-mono-sm font-bold uppercase tracking-wider text-ink transition-transform duration-200 group-active:scale-95">
            {open ? 'Register now' : 'View details'}
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-[#F7F5EE]/60">{registrationLabel(item)}</span>
        </div>
      </div>
    </a>
  );
}

/** A finished event in the compact list on /events/. */
export function PastEventRow({ item }: { item: ScheduleItem }) {
  return (
    <a
      href={item.href}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b-2 border-border py-4 transition-colors hover:bg-secondary sm:gap-6 sm:px-3"
    >
      <span className="w-16 font-mono text-xs uppercase leading-tight text-text-tertiary">
        {item.date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
        <br />
        {item.date.getFullYear()}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold text-ink">{item.name}</span>
        {item.location && <span className="block truncate text-body-sm text-text-tertiary">{item.location}</span>}
      </span>
      <ArrowRight size={16} className="text-text-tertiary transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" aria-hidden />
    </a>
  );
}
  );
}
