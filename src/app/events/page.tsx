'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFacebookEvents, type FacebookEvent } from '@/lib/facebook-events';
import { subscribeToEvents, type FirestoreEvent } from '@/lib/publicData';
import { EventCard, type PublicEvent } from '@/components/events/EventCard';
import { FacebookTimeline } from '@/components/events/FacebookTimeline';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';

export default function EventsPage() {
  const [clubEvents, setClubEvents] = useState<FirestoreEvent[]>([]);
  const [facebookEvents, setFacebookEvents] = useState<FacebookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEvents(
      (events) => {
        setClubEvents(events);
        setLoading(false);
      },
      (eventError) => {
        console.error('Failed to load events', eventError);
        setError(true);
        setLoading(false);
      }
    );

    getFacebookEvents()
      .then(setFacebookEvents)
      // Facebook automatic import is optional; the embedded official timeline
      // remains available even when its server-side credentials are not set.
      .catch(() => setFacebookEvents([]));

    return () => unsubscribe();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const allEvents: PublicEvent[] = [...clubEvents, ...facebookEvents];
    const ordered = allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      upcoming: ordered.filter((event) => event.date >= now),
      past: ordered.filter((event) => event.date < now).reverse(),
    };
  }, [clubEvents, facebookEvents]);

  return (
    <div className="bg-primary pt-32 min-h-screen">
      <div className="container-content py-12 md:py-16">
        <Reveal>
          <p className="mono-label mb-4 flex items-center gap-3 text-accent">
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
            EVENTS
          </p>
        </Reveal>
        <SplitReveal
          delay={0.1}
          className="font-display text-display-lg font-black text-ink"
          lines={[
            <>Competitions,</>,
            <><span className="text-text-tertiary">workshops &amp; meetups</span></>,
          ]}
        />

        <div className="mt-16 grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {loading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-64 w-full rounded-2xl border-2 border-border bg-tertiary" />
                <div className="h-64 w-full rounded-2xl border-2 border-border bg-tertiary" />
              </div>
            ) : error ? (
              <p className="text-danger font-bold">Events could not be loaded. Please try again later.</p>
            ) : upcoming.length === 0 ? (
              <Reveal>
                <section className="rounded-3xl border-2 border-border-strong bg-secondary p-8 text-center sm:p-12">
                  <p className="mono-label mb-3 text-accent">Calendar clear</p>
                  <h2 className="mb-3 font-display text-display-xs font-extrabold text-ink">
                    No upcoming events right now.
                  </h2>
                  <p className="text-body-sm text-text-secondary">
                    Stay tuned! New events will appear here as soon as the club publishes them.
                  </p>
                </section>
              </Reveal>
            ) : (
              <section>
                <Reveal>
                  <h2 className="mb-6 font-display text-display-xs font-extrabold tracking-tight text-ink">
                    Upcoming events
                  </h2>
                </Reveal>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {upcoming.map((event, i) => (
                    <Reveal key={event.id} delay={0.06 * i}>
                      <EventCard event={event} />
                    </Reveal>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="mt-16 opacity-80">
                <Reveal>
                  <h2 className="mb-6 font-display text-display-xs font-extrabold tracking-tight text-text-secondary">
                    Past events
                  </h2>
                </Reveal>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {past.map((event, i) => (
                    <Reveal key={event.id} delay={0.06 * i}>
                      <EventCard event={event} />
                    </Reveal>
                  ))}
                </div>
              </section>
            )}
          </div>

          <Reveal delay={0.15} direction="right">
            <FacebookTimeline />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
