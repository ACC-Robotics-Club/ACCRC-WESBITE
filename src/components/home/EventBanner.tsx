'use client';

import { useEffect, useState } from 'react';
import { X, CalendarDays, ArrowRight } from 'lucide-react';
import { type FirestoreEvent } from '@/lib/publicData';

interface EventBannerProps {
  events: FirestoreEvent[];
}

/**
 * Displays a dismissable banner for the next upcoming registrable event.
 * Only shown when there is an event whose registration window is open or
 * will open within the next 30 days.
 */
export function EventBanner({ events }: EventBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Find the most relevant upcoming event with registration enabled
  const activeEvent = events.find((e) => {
    if (e.date.getTime() < now.getTime()) return false;
    if (!e.registrationOpensAt) return false;
    const opensAt = e.registrationOpensAt.getTime();
    const closesAt = e.registrationClosesAt?.getTime() ?? Infinity;
    const isRegistrationOpen = opensAt <= now.getTime() && now.getTime() <= closesAt;
    const isRegistrationSoon = opensAt > now.getTime() && opensAt - now.getTime() <= thirtyDays;
    return isRegistrationOpen || isRegistrationSoon;
  });

  // Persist dismissal in sessionStorage so the banner stays hidden after
  // the user dismisses it within the same browser session.
  const DISMISS_KEY = `accrc-event-banner-dismissed-${activeEvent?.id ?? ''}`;

  useEffect(() => {
    if (!activeEvent) return;
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    if (!wasDismissed) setVisible(true);
  }, [activeEvent?.id, DISMISS_KEY]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  if (!activeEvent || !visible || dismissed) return null;

  const now2 = new Date();
  const registrationOpen =
    activeEvent.registrationOpensAt!.getTime() <= now2.getTime() &&
    (activeEvent.registrationClosesAt
      ? now2.getTime() <= activeEvent.registrationClosesAt.getTime()
      : true);

  const eventUrl = `/events/detail/?id=${activeEvent.id}`;

  return (
    <div className="event-banner" role="banner" aria-label="Upcoming event announcement">
      <a className="event-banner-inner" href={eventUrl}>
        <CalendarDays size={18} aria-hidden />
        <div className="event-banner-text">
          <span className="event-banner-label">
            {registrationOpen ? 'REGISTRATION OPEN' : 'REGISTRATION OPENS SOON'}
          </span>
          <span className="event-banner-name">{activeEvent.name}</span>
          <span className="event-banner-date">
            {activeEvent.date.toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <span className="event-banner-cta">
          {registrationOpen ? 'REGISTER NOW' : 'VIEW EVENT'} <ArrowRight size={14} aria-hidden />
        </span>
      </a>
      <button
        className="event-banner-close"
        onClick={handleDismiss}
        aria-label="Dismiss event announcement"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
