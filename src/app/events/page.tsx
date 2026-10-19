'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { subscribeToEvents, subscribeToFestConfig, type FestConfig, type FirestoreEvent } from '@/lib/publicData';
import { eventToSchedule, festToSchedule, splitSchedule } from '@/lib/schedule';
import { EventCard, FeaturedEventCard, PastEventRow } from '@/components/events/EventCard';
import { FacebookCard } from '@/components/events/FacebookCard';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';

const PAST_PREVIEW = 6;

export default function EventsPage() {
  const [clubEvents, setClubEvents] = useState<FirestoreEvent[]>([]);
  const [festConfig, setFestConfig] = useState<FestConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    const unsubscribeEvents = subscribeToEvents(
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
    const unsubscribeFest = subscribeToFestConfig(setFestConfig);
    return () => {
      unsubscribeEvents();
      unsubscribeFest();
    };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const fest = festToSchedule(festConfig);
    return splitSchedule([...clubEvents.map((event) => eventToSchedule(event)), ...(fest ? [fest] : [])]);
  }, [clubEvents, festConfig]);

  const [next, ...later] = upcoming;
  const visiblePast = showAllPast ? past : past.slice(0, PAST_PREVIEW);

  return (
    <div className="min-h-screen bg-primary pt-32">
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
          lines={[<>Competitions,</>, <><span className="text-text-tertiary">workshops &amp; meetups</span></>]}
        />
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-2xl text-body-md text-text-secondary">
            Everything ACCRC is running next, with registration right where you need it.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="min-w-0">
            {loading ? (
              <div className="space-y-6" aria-busy="true" aria-label="Loading events">
                <div className="h-72 w-full animate-pulse rounded-3xl bg-tertiary" />
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="h-56 animate-pulse rounded-3xl bg-tertiary" />
                  <div className="h-56 animate-pulse rounded-3xl bg-tertiary" />
                </div>
              </div>
            ) : error ? (
              <div className="rounded-3xl border-2 border-danger/30 bg-danger/5 p-8" role="alert">
                <h2 className="font-display text-display-xs font-extrabold text-ink">Events could not be loaded.</h2>
                <p className="mt-2 text-body-sm text-text-secondary">Check your connection and refresh the page.</p>
              </div>
            ) : (
              <>
                <section aria-labelledby="upcoming-heading">
                  <h2 id="upcoming-heading" className="sr-only">Upcoming events</h2>
                  {next ? (
                    <>
                      <Reveal>
                        <FeaturedEventCard item={next} />
                      </Reveal>
                      {later.length > 0 && (
                        <>
                          <Reveal>
                            <p className="mono-label mb-5 mt-12 flex items-center gap-3 text-text-tertiary">
                              <span className="inline-block h-px w-10 bg-border-strong" aria-hidden />
                              ALSO COMING UP
                            </p>
                          </Reveal>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {later.map((item, i) => (
                              <Reveal key={item.id} delay={0.06 * i}>
                                <EventCard item={item} />
                              </Reveal>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <Reveal>
                      <div className="flex flex-col gap-5 rounded-3xl border-2 border-border-strong bg-secondary p-7 sm:flex-row sm:items-center sm:p-10">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent" aria-hidden>
                          <CalendarDays size={26} />
                        </span>
                        <div>
                          <p className="font-display text-display-xs font-extrabold text-ink">No upcoming events right now.</p>
                          <p className="mt-1.5 text-body-sm text-text-secondary">
                            New events appear here as soon as the club announces them. Follow us on Facebook to hear first.
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  )}
                </section>

                {past.length > 0 && (
                  <section className="mt-16" aria-labelledby="past-heading">
                    <Reveal>
                      <h2 id="past-heading" className="mb-4 flex items-baseline justify-between gap-4 font-display text-display-xs font-extrabold tracking-tight text-ink">
                        Past events
                        <span className="mono-label text-text-tertiary">{past.length}</span>
                      </h2>
                    </Reveal>
                    <div className="border-t-2 border-border">
                      {visiblePast.map((item) => (
                        <PastEventRow key={item.id} item={item} />
                      ))}
                    </div>
                    {past.length > PAST_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setShowAllPast((v) => !v)}
                        className="mt-5 inline-flex min-h-11 items-center rounded-full border-2 border-border-strong px-5 py-2 mono-label text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {showAllPast ? 'Show fewer' : `Show all ${past.length}`}
                      </button>
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          <Reveal delay={0.15} direction="right" className="lg:sticky lg:top-28">
            <FacebookCard />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
