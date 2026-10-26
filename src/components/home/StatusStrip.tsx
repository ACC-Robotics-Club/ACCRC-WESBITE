'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { subscribeToEvents } from '@/lib/publicData';
import { getEventStatus, formatCountdown } from '@/lib/utils';
import { club } from '@/lib/club';
import type { FirestoreEvent } from '@/lib/publicData';

export function StatusStrip() {
  const [nextEvent, setNextEvent] = useState<FirestoreEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>('');
  const [statusLabel, setStatusLabel] = useState<string>('');

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = subscribeToEvents((events) => {
        const now = new Date();
        const futureEvents = events
          .filter(e => e.date >= now || getEventStatus(e.registrationOpensAt, e.registrationClosesAt).status === 'open')
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (futureEvents.length > 0) {
          setNextEvent(futureEvents[0]);
        } else {
          setNextEvent(null);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!nextEvent) return;

    const updateStatus = () => {
      const statusObj = getEventStatus(nextEvent.registrationOpensAt, nextEvent.registrationClosesAt);
      setStatusLabel(statusObj.label);
      if (statusObj.timeRemaining !== undefined) {
        setCountdown(formatCountdown(statusObj.timeRemaining));
      } else {
        setCountdown('');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [nextEvent]);

  return (
    <div className="border-y-2 border-border-strong bg-secondary">
      <div className="container-content flex flex-col items-start justify-between gap-3 py-4 md:flex-row md:items-center">
        {loading ? (
          <div className="flex w-full animate-pulse flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="h-4 w-32 rounded bg-border" />
            <div className="h-4 w-48 rounded bg-border" />
          </div>
        ) : nextEvent ? (
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono-label text-text-tertiary">Next event</span>
              <span className="font-display text-body-md font-extrabold tracking-tight">
                {nextEvent.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3 font-mono text-mono-sm">
              <Badge
                status={statusLabel === 'UPCOMING' ? 'upcoming' : statusLabel === 'REGISTRATION OPEN' ? 'open' : 'closed'}
                label={statusLabel}
              />
              {countdown && (
                <span className="min-w-[120px] text-right font-bold text-accent">
                  T-MINUS {countdown}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mono-label w-full text-text-tertiary">No upcoming events</div>
        )}

        <div className="flex shrink-0 items-center gap-5 md:border-l md:border-border md:pl-6">
          <span className="mono-label hidden whitespace-nowrap text-text-tertiary lg:inline">Stay tuned</span>
          <a
            href={club.socials.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit ACCRC on Facebook"
            className="group -my-3 inline-flex items-center gap-1.5 whitespace-nowrap py-3 mono-label text-text-primary transition-colors hover:text-accent"
          >
            Facebook
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </a>
          <a
            href={club.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit ACCRC on Instagram"
            className="group -my-3 inline-flex items-center gap-1.5 whitespace-nowrap py-3 mono-label text-text-primary transition-colors hover:text-accent"
          >
            Instagram
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
