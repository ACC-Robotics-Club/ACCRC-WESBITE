'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import {
  ArrowRight,
  ChevronRight,
  CalendarDays,
  Send,
  Terminal,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  subscribeToEvents,
  subscribeToFestConfig,
  subscribeToPortalConfig,
  type FestConfig,
  type FirestoreEvent,
  type PortalConfig,
} from '@/lib/publicData';
import { club } from '@/lib/club';
import { eventToSchedule, festToSchedule, registrationLabel, splitSchedule, type ScheduleItem } from '@/lib/schedule';
import { Hero } from '@/components/home/Hero';
import { StatusStrip } from '@/components/home/StatusStrip';
import { Achievements } from '@/components/home/AchievementsAndPanels';
import { LaunchFilm } from '@/components/home/LaunchFilm';
import { registerMember, type RegistrationResult } from '@/lib/registerMember';
import { RegistrationSuccess } from '@/components/membership/RegistrationSuccess';
import { FacebookCard } from '@/components/events/FacebookCard';
import { SocialFeed } from '@/components/events/SocialFeed';
import { Marquee } from '@/components/fx/Marquee';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { ScrollFillText } from '@/components/fx/ScrollFillText';
import { ScrollSlide } from '@/components/fx/ScrollSlide';
import { FanTag } from '@/components/fx/FanTag';

/** One calendar row: a club event or the fest. */
function ScheduleRow({ item, index, past = false }: { item: ScheduleItem; index: number; past?: boolean }) {
  const sameDay = item.date.toDateString() === item.endsAt.toDateString();
  const day = sameDay
    ? item.date.toLocaleDateString(undefined, { day: '2-digit' })
    : `${item.date.getDate()}–${item.endsAt.getDate()}`;
  const open = item.registration.state === 'open';

  return (
    <Reveal direction="right" distance={60} delay={index * 0.1}>
      <a
        className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b-2 border-border-strong py-6 transition-colors duration-300 hover:bg-secondary sm:grid-cols-[70px_1fr_auto_auto] sm:gap-x-8 sm:px-4 sm:py-7"
        href={item.href}
      >
        <div className="hidden mono-label text-text-tertiary transition-colors group-hover:text-accent sm:block">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0">
          <p className="mono-label flex flex-wrap items-center gap-2 text-accent">
            {item.kind === 'fest' ? 'FEST' : past ? 'PAST EVENT' : 'CLUB EVENT'}
            {!past && (
              <span className={`rounded-full px-2 py-0.5 text-[0.62rem] ${open ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                {registrationLabel(item).toUpperCase()}
              </span>
            )}
          </p>
          <h3 className="mt-2 font-display text-display-xs font-extrabold tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1.5">
            {item.name}
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            <span className="sm:hidden">{item.dateLabel ?? item.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · </span>
            {item.location}
          </p>
        </div>
        <div className="hidden flex-col border-l-2 border-border pl-6 sm:flex">
          <strong className="font-display text-4xl font-black leading-none tracking-tight text-ink">{day}</strong>
          <span className="mono-label mt-1.5 text-text-tertiary">
            {item.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4 justify-self-end text-accent">
          <span className="hidden mono-label text-text-tertiary md:inline">
            {past ? 'RECAP' : open ? 'REGISTER' : 'DETAILS'}
          </span>
          <ChevronRight size={24} className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
        </div>
      </a>
    </Reveal>
  );
}

export default function HomePage() {
  const [registration, setRegistration] = useState<{ result: RegistrationResult; email: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [festConfig, setFestConfig] = useState<FestConfig | null>(null);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);

  useEffect(() => {
    const unsubscribeEvents = subscribeToEvents(setEvents);
    const unsubscribeFest = subscribeToFestConfig(setFestConfig);
    const unsubscribePortal = subscribeToPortalConfig(setPortalConfig);
    return () => {
      unsubscribeEvents();
      unsubscribeFest();
      unsubscribePortal();
    };
  }, []);

  /* Published club events plus the fest once it is launched in the admin. */
  const { upcoming: upcomingEvents, past: pastEvents } = useMemo(() => {
    const fest = festToSchedule(festConfig);
    return splitSchedule([...events.map((event) => eventToSchedule(event)), ...(fest ? [fest] : [])]);
  }, [events, festConfig]);

  const activeLeadershipApplications = [
    portalConfig?.execOpen ? 'Executive Panel' : null,
    portalConfig?.prefectOpen ? 'Prefect Application' : null,
    portalConfig?.subExecOpen ? 'Sub-Executive Application' : null,
  ].filter(Boolean) as string[];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setFormError('');

    try {
      const email = String(formData.get('email') ?? '').trim().toLowerCase();
      const result = await registerMember({
        website: String(formData.get('website') ?? ''),
        name: String(formData.get('name') ?? ''),
        email,
        whatsapp: String(formData.get('whatsapp') ?? ''),
        classSection: String(formData.get('classSection') ?? ''),
        collegeId: String(formData.get('collegeId') ?? ''),
        motivation: String(formData.get('motivation') ?? ''),
      });
      form.reset();
      setRegistration({ result, email });
    } catch (error) {
      console.error('Failed to register member', error);
      setFormError(error instanceof Error ? error.message : 'We could not complete your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-primary">
      <Hero />

      {/* Everything below the hero is one opaque "sheet" that slides up over the
          pinned hero as you scroll (depth-curtain scroll, see Hero.tsx). */}
      <div className="relative z-10 overflow-hidden rounded-t-[2rem] bg-primary shadow-[0_-28px_70px_-28px_rgba(28,25,23,0.2)] sm:rounded-t-[3rem]">
      <StatusStrip />

      {/* ═══ MARQUEE ═══ */}
      <div className="overflow-hidden border-b-2 border-border-strong bg-glow py-3.5" aria-hidden>
        <Marquee speed={24}>
          {['EST. 2019', 'ADAMJEE CANTONMENT COLLEGE', 'DHAKA', 'ROBOTICS', 'ELECTRONICS', 'COMPUTATIONAL THINKING'].map((word) => (
            <span key={word} className="mx-7 flex items-center gap-7">
              <span className="mono-label text-ink">{word}</span>
              <Sparkles size={14} className="text-ink/70" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ═══ LAUNCH FILM ═══ */}
      <LaunchFilm />

      {/* ═══ MISSION ═══ */}
      <section className="relative section-padding overflow-hidden" id="mission">
        <div className="container-content relative grid gap-10 md:grid-cols-12">
          <div className="md:col-span-9 md:col-start-4">
            {/* The mission statement keeps drifting as the section scrolls past. */}
            <ScrollSlide axis="y" from={110} to={-16}>
              <Reveal>
                <p className="mono-label mb-4 flex items-center gap-3 text-accent">
                  <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                  OUR MISSION
                </p>
              </Reveal>
              <SplitReveal
                className="font-display text-display-lg font-black text-ink"
                lines={[
                  <>
                    <FanTag
                      layers={['#1C1917', '#FF7A59', '#C8432C']}
                      bgColor="#C8432C"
                      textColor="white"
                      size="lg"
                      delay={0.2}
                    >
                      Curiosity
                    </FanTag>{' '}
                    is our
                  </>,
                  <>
                    <span className="text-text-tertiary">operating system.</span>
                  </>,
                ]}
              />
            </ScrollSlide>
            <ScrollSlide axis="y" from={90} to={-14} className="mt-8 max-w-xl">
              {/* The mission statement fills with colour as it crosses the viewport. */}
              <ScrollFillText className="text-display-xs font-extrabold leading-snug tracking-tight">
                ACCRC is where students turn questions into working prototypes. We learn
                by building &mdash; and build things that make the world a little more
                capable.
              </ScrollFillText>
              <Reveal delay={0.1}>
                <a
                  href="#join"
                  className="group mt-7 inline-flex min-h-11 items-center gap-2.5 mono-label text-accent transition-colors hover:text-accent-hover"
                >
                  Meet the club
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-accent transition-all duration-300 group-hover:translate-x-1.5 group-hover:bg-accent group-hover:text-white" aria-hidden>
                    <ArrowRight size={15} />
                  </span>
                </a>
              </Reveal>
            </ScrollSlide>
          </div>
        </div>
      </section>

      {/* ═══ EVENTS ═══ */}
      <section className="cv-auto relative border-t-2 border-border-strong bg-tertiary/50 section-padding" id="events">
        <div className="dot-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" aria-hidden />
        <div className="container-content relative">
          <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <ScrollSlide axis="y" from={90} to={-16}>
              <Reveal>
                <p className="mono-label mb-4 flex items-center gap-3 text-accent">
                  <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                  CALENDAR / LIVE
                </p>
              </Reveal>
              <SplitReveal
                className="font-display text-display-lg font-black text-ink"
                lines={[
                  <>
                    <FanTag
                      layers={['#C8432C', '#FF7A59', '#1C1917']}
                      bgColor="#1C1917"
                      textColor="#FF7A59"
                      size="lg"
                      delay={0.1}
                    >
                      UPCOMING
                    </FanTag>
                  </>,
                  <>
                    <span className="text-text-tertiary">MISSIONS.</span>
                  </>,
                ]}
              />
            </ScrollSlide>
            <ScrollSlide axis="y" from={80} to={-16}>
              <Reveal delay={0.15}>
                <a
                  href="/events/"
                  className="group inline-flex min-h-11 items-center gap-2.5 mono-label text-accent transition-colors hover:text-accent-hover"
                >
                  All events
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-accent transition-all duration-300 group-hover:translate-x-1.5 group-hover:bg-accent group-hover:text-white" aria-hidden>
                    <ArrowRight size={15} />
                  </span>
                </a>
              </Reveal>
            </ScrollSlide>
          </div>

          {/* Upcoming events on the left, the club's Facebook card on the right. */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:gap-14">
            <div>
              {upcomingEvents.length > 0 ? (
                <div className="border-t-2 border-border-strong">
                  {upcomingEvents.slice(0, 4).map((item, index) => (
                    <ScheduleRow key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <>
                  <Reveal>
                    <div className="flex flex-col gap-5 rounded-3xl border-2 border-border-strong bg-secondary p-7 sm:flex-row sm:items-center sm:p-9">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent" aria-hidden>
                        <CalendarDays size={26} />
                      </span>
                      <div className="flex-1">
                        <h3 className="font-display text-display-xs font-extrabold text-ink">No upcoming events right now.</h3>
                        <p className="mt-1.5 text-body-sm text-text-secondary">
                          New events show up here as soon as they are announced. Follow the club on Facebook so you don&rsquo;t miss one.
                        </p>
                      </div>
                    </div>
                  </Reveal>
                  {pastEvents.length > 0 && (
                    <div className="mt-10">
                      <Reveal>
                        <p className="mono-label mb-4 flex items-center gap-3 text-text-tertiary">
                          <span className="inline-block h-px w-10 bg-border-strong" aria-hidden />
                          RECENT EVENTS
                        </p>
                      </Reveal>
                      <div className="border-t-2 border-border-strong">
                        {pastEvents.slice(0, 2).map((item, index) => (
                          <ScheduleRow key={item.id} item={item} index={index} past />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <ScrollSlide axis="y" from={90} to={-16} className="lg:sticky lg:top-28">
              <FacebookCard />
            </ScrollSlide>
          </div>
        </div>
      </section>

      <SocialFeed />

      <Achievements />

      {/* ═══ RECRUITMENT ANNOUNCEMENT ═══ */}
      <section className="cv-auto section-padding" id="news">
        <div className="container-content">
          <ScrollSlide axis="y" from={100} to={-14}>
            <Reveal>
              <p className="mono-label mb-4 flex items-center gap-3 text-accent">
                <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                MEMBERSHIP / 2026
              </p>
            </Reveal>
            <SplitReveal
              className="font-display text-display-lg font-black text-ink"
              lines={[
                <>
                  <FanTag
                    layers={['#FF7A59', '#C8432C', '#1C1917']}
                    bgColor="#1C1917"
                    textColor="#FF7A59"
                    size="lg"
                    delay={0.15}
                  >
                    JOIN
                  </FanTag>{' '}
                  THE
                </>,
                <>
                  <span className="text-text-tertiary">CLUB.</span>
                </>,
              ]}
            />
          </ScrollSlide>

          {/* Recruitment banner — slides up into place, no fade */}
          <ScrollSlide axis="y" from={150} to={-16} className="mt-12">
            <Reveal distance={70}>
              <TiltCard className="overflow-hidden rounded-3xl border-2 border-border-strong bg-ink text-[#F7F5EE] shadow-[0_30px_80px_-40px_rgba(28,25,23,0.5)]">
                <div className="relative flex min-h-[200px] flex-col items-start justify-between gap-6 p-7 sm:min-h-[240px] sm:flex-row sm:items-center sm:gap-8 sm:p-14">
                  <div className="dot-grid-light absolute inset-0 opacity-20" aria-hidden />
                  <h3 className="relative font-display text-display-md font-black tracking-display">
                    Accepting New{' '}
                    <span className="text-glow">Members</span>
                  </h3>
                  <time
                    dateTime="2026-09-23"
                    className="relative mono-label rounded-full border border-glow/40 bg-glow/10 px-5 py-2.5 text-glow"
                  >
                    September 23, 2026
                  </time>
                </div>
              </TiltCard>
            </Reveal>
          </ScrollSlide>
        </div>
      </section>

      {/* ═══ JOIN ═══ */}
      <section className="cv-auto border-t-2 border-border-strong bg-secondary section-padding" id="join">
        <div className="container-content grid gap-14 lg:grid-cols-2 lg:gap-20">
          <ScrollSlide axis="y" from={100} to={-16}>
          <div>
            <Reveal>
              <p className="mono-label mb-4 flex items-center gap-3 text-accent">
                <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                OPEN CALL / 2026&ndash;27
              </p>
            </Reveal>
            <SplitReveal
              className="font-display text-display-lg font-black text-ink"
              lines={[
                <>YOUR NEXT</>,
                <>
                  <FanTag
                    layers={['#1C1917', '#FF7A59', '#C8432C']}
                    bgColor="#C8432C"
                    textColor="white"
                    size="lg"
                    delay={0.1}
                  >
                    BUILD
                  </FanTag>{' '}
                  <span className="text-text-tertiary">STARTS HERE.</span>
                </>,
              ]}
            />
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-md text-body-lg text-text-secondary">
                No experience required. Just a question you can&apos;t stop asking,
                and the willingness to figure it out.
              </p>
            </Reveal>

            {activeLeadershipApplications.length > 0 && (
              <Reveal delay={0.25}>
                <a
                  className="group mt-10 flex items-start gap-4 rounded-2xl border-2 border-border bg-tertiary/60 p-6 transition-colors hover:border-accent"
                  href="/portal/"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-white transition-transform duration-300 group-hover:rotate-12" aria-hidden>
                    <Terminal size={20} />
                  </span>
                  <div>
                    <p className="mono-label text-ink">Leadership applications open</p>
                    <p className="mt-1.5 text-body-sm text-text-secondary">
                      {activeLeadershipApplications.join(' · ')}
                    </p>
                  </div>
                </a>
              </Reveal>
            )}
          </div>
          </ScrollSlide>

          <ScrollSlide axis="y" from={120} to={-16}>
          <div className="lg:border-l-2 lg:border-border lg:pl-16">
            <Reveal>
              <p className="mono-label text-text-tertiary">New member registration / always open</p>
            </Reveal>

            {registration ? (
              <div className="mt-6">
                <RegistrationSuccess result={registration.result} email={registration.email} />
              </div>
            ) : (
              /* Form fields cascade upward one after another. Each field animates
                 itself rather than relying on parent variant propagation. */
              <form
                className="mt-6 flex flex-col gap-6"
                onSubmit={handleSubmit}
              >
                  {/* Honeypot for bots; hidden from people and assistive tech. */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                  <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                    {[
                      { label: 'FULL NAME', name: 'name', type: 'text', placeholder: 'Your name', autoComplete: 'name' },
                      { label: 'EMAIL ADDRESS', name: 'email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
                      { label: 'WHATSAPP NUMBER', name: 'whatsapp', type: 'tel', placeholder: '+880 1XXX-XXXXXX', autoComplete: 'tel' },
                      { label: 'SECTION', name: 'classSection', type: 'text', placeholder: 'XI · Science A', autoComplete: 'off' },
                      { label: 'COLLEGE ID', name: 'collegeId', type: 'text', placeholder: 'Your college ID', autoComplete: 'off' },
                    ].map((field, i) => (
                      <Reveal key={field.name} distance={28} delay={i * 0.06}>
                      <label className="flex flex-col gap-2">
                        <span className="mono-label text-text-tertiary">{field.label}</span>
                        <input
                          className="rounded-xl border-2 border-border bg-primary px-4 py-3.5 text-body-md text-ink transition-all duration-200 placeholder:text-text-tertiary/70 focus:border-accent focus:outline-none focus:shadow-[0_0_0_4px_rgba(200,67,44,0.15)]"
                          name={field.name}
                          required
                          type={field.type}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                        />
                      </label>
                      </Reveal>
                    ))}
                  </div>
                  <Reveal distance={28} delay={0.3}>
                  <label className="flex flex-col gap-2">
                    <span className="mono-label text-text-tertiary">WHY DO YOU WANT TO JOIN?</span>
                    <textarea
                      className="rounded-xl border-2 border-border bg-primary px-4 py-3.5 text-body-md text-ink transition-all duration-200 placeholder:text-text-tertiary/70 focus:border-accent focus:outline-none focus:shadow-[0_0_0_4px_rgba(200,67,44,0.15)]"
                      name="motivation"
                      required
                      rows={4}
                      placeholder="Tell us why you want to join ACCRC..."
                    />
                  </label>
                  </Reveal>
                  {formError && (
                    <p className="m-0 text-body-sm font-bold text-danger" role="alert">
                      {formError}
                    </p>
                  )}
                  <button
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_14px_36px_-12px_rgba(200,67,44,0.45)] sm:w-fit transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:cursor-wait disabled:opacity-65"
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                    {submitting ? 'Registering...' : 'Register'}
                  </button>
              </form>
            )}
          </div>
          </ScrollSlide>
        </div>
      </section>
      </div>
    </main>
  );
}
