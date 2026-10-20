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
  subscribeToPortalConfig,
  type FirestoreEvent,
  type PortalConfig,
} from '@/lib/firestore';
import { club } from '@/lib/club';
import { registerMember, type RegistrationResult } from '@/lib/registerMember';
import { RegistrationSuccess } from '@/components/membership/RegistrationSuccess';
import { readFacebookFeed, type FacebookEvent, type FacebookPost } from '@/lib/facebook-events';
import { Hero } from '@/components/home/Hero';
import { StatusStrip } from '@/components/home/StatusStrip';
import { Achievements } from '@/components/home/AchievementsAndPanels';
import { LaunchFilm } from '@/components/home/LaunchFilm';
import { FacebookTimeline } from '@/components/events/FacebookTimeline';
import { Marquee } from '@/components/fx/Marquee';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { Parallax } from '@/components/fx/Parallax';
import { ScrollFillText } from '@/components/fx/ScrollFillText';
import { ScrollSlide } from '@/components/fx/ScrollSlide';
import { FanTag } from '@/components/fx/FanTag';
import { motion } from 'framer-motion';

/** One calendar row, whether it came from Firestore or a Facebook post. */
type FeedEvent = {
  id: string;
  name: string;
  date: Date;
  location: string;
  description: string;
  isPost: boolean;
  permalinkUrl: string | null;
  registrationOpensAt: Date | undefined;
};

export default function HomePage() {
  const [registration, setRegistration] = useState<{ result: RegistrationResult; email: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [facebookEvents, setFacebookEvents] = useState<FacebookEvent[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);

  useEffect(() => {
    const unsubscribeEvents = subscribeToEvents(setEvents);
    const unsubscribePortal = subscribeToPortalConfig(setPortalConfig);

    /* Facebook posts are mirrored into the calendar as post cards when the
       optional Pages Function is configured. The embedded official timeline
       below still works without it. */
    readFacebookFeed()
      .then(({ events: fbEvents, posts }) => {
        setFacebookEvents(fbEvents);
        setFacebookPosts(posts);
      })
      .catch(() => {
        setFacebookEvents([]);
        setFacebookPosts([]);
      });

    return () => {
      unsubscribeEvents();
      unsubscribePortal();
    };
  }, []);

  const allEvents = useMemo<FeedEvent[]>(() => {
    const known = new Set(events.map((event) => event.id));
    const fromFirestore: FeedEvent[] = events.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description ?? '',
      isPost: false,
      permalinkUrl: null,
      registrationOpensAt: event.registrationOpensAt,
    }));
    const fromFacebook: FeedEvent[] = facebookEvents
      .filter((event) => !known.has(event.id))
      .map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        isPost: true,
        permalinkUrl: event.permalinkUrl,
        registrationOpensAt: undefined,
      }));
    return [...fromFirestore, ...fromFacebook].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [events, facebookEvents]);

  const upcomingEvents = useMemo(
    () => allEvents.filter((event) => event.date.getTime() >= Date.now()),
    [allEvents]
  );

  /**
   * Facebook posts are announcements rather than calendar entries, so they stay
   * out of the schedule and are rendered as their own "latest activity" list.
   */
  const activityPosts = useMemo<FeedEvent[]>(
    () =>
      facebookPosts.map((post) => ({
        id: post.id,
        name: post.headline,
        date: post.date,
        location: 'Official Facebook page',
        description: post.body,
        isPost: true,
        permalinkUrl: post.permalinkUrl,
        registrationOpensAt: undefined,
      })),
    [facebookPosts]
  );

  /**
   * When nothing is scheduled the calendar column would otherwise sit empty
   * right next to a busy Facebook feed, which reads as a contradiction. Fall
   * back to the most recent activity instead, so the two columns always agree.
   */
  const recentEvents = useMemo(() => {
    if (upcomingEvents.length > 0) return [];
    const past = allEvents
      .filter((event) => event.date.getTime() < Date.now())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    // Posts lead the list, then past events, newest first.
    return [...activityPosts, ...past];
  }, [allEvents, upcomingEvents, activityPosts]);
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
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        whatsapp: String(formData.get('whatsapp') ?? ''),
        classSection: String(formData.get('classSection') ?? ''),
        collegeId: String(formData.get('collegeId') ?? ''),
        motivation: String(formData.get('motivation') ?? ''),
        website: String(formData.get('website') ?? ''),
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
      <div className="relative z-10 overflow-hidden rounded-t-[2rem] bg-primary shadow-[0_-28px_70px_-28px_rgba(13,27,24,0.35)] sm:rounded-t-[3rem]">
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

      {/* ═══ MISSION — wipe + parallax depth ═══ */}
      <section className="relative section-padding overflow-hidden" id="mission">
        {/* Oversized index numeral drifting behind the copy */}
        <Parallax speed={22} className="pointer-events-none absolute -left-6 top-6 select-none" aria-hidden>
          <p className="font-display text-[16rem] font-black leading-none tracking-display text-transparent [-webkit-text-stroke:1.5px_rgba(13,27,24,0.1)]">
            01
          </p>
        </Parallax>

        <div className="container-content relative grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-3" direction="left">
            <div className="mono-label text-text-tertiary">01 / 04</div>
          </Reveal>
          <div className="md:col-span-9">
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
                      layers={['#0d1b18', '#2be0d2', '#0e8a80']}
                      bgColor="#0e8a80"
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
                  className="group mt-7 inline-flex items-center gap-2.5 mono-label text-accent transition-colors hover:text-accent-hover"
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
      <section className="relative border-t-2 border-border-strong bg-tertiary/50 section-padding" id="events">
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
                      layers={['#0e8a80', '#2be0d2', '#0d1b18']}
                      bgColor="#0d1b18"
                      textColor="#2be0d2"
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
                  className="group inline-flex items-center gap-2.5 mono-label text-accent transition-colors hover:text-accent-hover"
                >
                  All events
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-accent transition-all duration-300 group-hover:translate-x-1.5 group-hover:bg-accent group-hover:text-white" aria-hidden>
                    <ArrowRight size={15} />
                  </span>
                </a>
              </Reveal>
            </ScrollSlide>
          </div>

          {/* Club events on the left, the official Facebook feed on the right —
              same information, presented the way the club posts it. When there
              is no calendar entry to show, the feed takes the full width rather
              than leaving a tall empty column beside it. */}
          <div
            className={
              upcomingEvents.length === 0 && recentEvents.length === 0
                ? 'grid gap-14'
                : 'grid gap-14 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start'
            }
          >
            <div>
          {upcomingEvents.length === 0 && recentEvents.length === 0 ? (
            <Reveal>
              <div className="flex flex-col gap-6 rounded-3xl border-2 border-border-strong bg-secondary p-8 sm:flex-row sm:items-center sm:p-10">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent" aria-hidden>
                  <CalendarDays size={26} />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-display-xs font-extrabold text-ink">No upcoming events right now.</h3>
                  <p className="mt-1.5 text-body-sm text-text-secondary">
                    Stay tuned! Follow ACCRC on Facebook for the latest announcements.
                  </p>
                </div>
                <a
                  className="inline-flex shrink-0 items-center gap-2 mono-label text-accent hover:text-accent-hover"
                  href={club.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit ACCRC on Facebook"
                >
                  Facebook <ArrowRight size={15} aria-hidden />
                </a>
              </div>
            </Reveal>
          ) : upcomingEvents.length === 0 ? (
            /* Nothing scheduled: show the latest activity so this column still
               matches the live feed beside it. */
            <div>
              <Reveal>
                <p className="mono-label mb-5 flex items-center gap-3 text-text-tertiary">
                  <span className="inline-block h-px w-10 bg-border-strong" aria-hidden />
                  LATEST ACTIVITY &mdash; NOTHING SCHEDULED YET
                </p>
              </Reveal>
              <div className="border-t-2 border-border-strong">
                {recentEvents.slice(0, 3).map((event, index) => {
                  const href = event.permalinkUrl ?? `/events/detail/?id=${event.id}`;
                  return (
                    <motion.a
                      key={event.id}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 border-b-2 border-border-strong py-7 transition-colors duration-300 hover:bg-secondary sm:grid-cols-[70px_1fr_auto_auto] sm:gap-x-8 sm:px-4"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ x: -70 }}
                      whileInView={{ x: 0 }}
                      viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
                      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mono-label text-text-tertiary transition-colors group-hover:text-accent">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="mono-label flex items-center gap-2 text-accent">
                          {event.isPost ? 'FACEBOOK POST' : 'CLUB EVENT'}
                          {event.isPost && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.62rem] text-accent">
                              ACCRC
                            </span>
                          )}
                        </p>
                        <h3 className="mt-2 font-display text-display-xs font-extrabold tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1.5">
                          {event.name}
                        </h3>
                        <p className="mt-1 text-body-sm text-text-secondary">{event.location}</p>
                        {event.description && (
                          <p className="mt-2 line-clamp-2 max-w-xl text-body-sm text-text-tertiary">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="hidden flex-col border-l-2 border-border pl-6 sm:flex">
                        <strong className="font-display text-4xl font-black leading-none tracking-tight text-ink">
                          {event.date.toLocaleDateString(undefined, { day: '2-digit' })}
                        </strong>
                        <span className="mono-label mt-1.5 text-text-tertiary">
                          {event.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 justify-self-end text-accent">
                        <span className="hidden mono-label text-text-tertiary md:inline">
                          VIEW POST
                        </span>
                        <ChevronRight size={24} className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-t-2 border-border-strong">
              {upcomingEvents.slice(0, 3).map((event, index) => {
                const isPost = event.isPost;
                const href = event.permalinkUrl ?? `/events/detail/?id=${event.id}`;
                return (
                /* Event rows slide in from the left, each with its own delay. */
                <motion.div
                  key={event.id}
                  initial={{ x: -70 }}
                  whileInView={{ x: 0 }}
                  viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 border-b-2 border-border-strong py-7 transition-colors duration-300 hover:bg-secondary sm:grid-cols-[70px_1fr_auto_auto] sm:gap-x-8 sm:px-4"
                    href={href}
                    {...(isPost ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <div className="mono-label text-text-tertiary transition-colors group-hover:text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="mono-label flex items-center gap-2 text-accent">
                        {isPost ? 'FACEBOOK POST' : 'CLUB EVENT'}
                        {isPost && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.62rem] text-accent">
                            ACCRC
                          </span>
                        )}
                      </p>
                      <h3 className="mt-2 font-display text-display-xs font-extrabold tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1.5">
                        {event.name}
                      </h3>
                      <p className="mt-1 text-body-sm text-text-secondary">{event.location}</p>
                      {isPost && event.description && (
                        <p className="mt-2 line-clamp-2 max-w-xl text-body-sm text-text-tertiary">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="hidden flex-col border-l-2 border-border pl-6 sm:flex">
                      <strong className="font-display text-4xl font-black leading-none tracking-tight text-ink">
                        {event.date.toLocaleDateString(undefined, { day: '2-digit' })}
                      </strong>
                      <span className="mono-label mt-1.5 text-text-tertiary">
                        {event.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 justify-self-end text-accent sm:justify-self-end">
                      <span className="hidden mono-label text-text-tertiary md:inline">
                        {isPost
                          ? 'VIEW POST'
                          : event.registrationOpensAt && event.registrationOpensAt > new Date()
                            ? 'REGISTRATION OPENS SOON'
                            : 'VIEW DETAILS'}
                      </span>
                      <ChevronRight size={24} className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
                    </div>
                  </a>
                </motion.div>
                );
              })}
            </div>
          )}
            </div>

            <ScrollSlide
              axis="y"
              from={90}
              to={-16}
              className={
                upcomingEvents.length === 0 && recentEvents.length === 0
                  ? 'mx-auto w-full'
                  : 'xl:sticky xl:top-28'
              }
            >
              <FacebookTimeline compact={upcomingEvents.length > 0 || recentEvents.length > 0} />
            </ScrollSlide>
          </div>
        </div>
      </section>

      <Achievements />

      {/* ═══ RECRUITMENT ANNOUNCEMENT ═══ */}
      <section className="section-padding" id="news">
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
                    layers={['#2be0d2', '#0e8a80', '#0d1b18']}
                    bgColor="#0d1b18"
                    textColor="#2be0d2"
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
            <motion.div
              initial={{ y: 70 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.2, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard className="overflow-hidden rounded-3xl border-2 border-border-strong bg-ink text-[#e8fffb] shadow-[0_30px_80px_-40px_rgba(13,27,24,0.8)]">
                <div className="relative flex min-h-[240px] flex-col items-start justify-between gap-8 p-10 sm:flex-row sm:items-center sm:p-14">
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
            </motion.div>
          </ScrollSlide>
        </div>
      </section>

      {/* ═══ JOIN ═══ */}
      <section className="border-t-2 border-border-strong bg-secondary section-padding" id="join">
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
                    layers={['#0d1b18', '#0e8a80', '#2be0d2']}
                    bgColor="#0e8a80"
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
              <motion.form
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
                      <motion.label
                        key={field.name}
                        className="flex flex-col gap-2"
                        initial={{ y: 28 }}
                        whileInView={{ y: 0 }}
                        viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
                        transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className="mono-label text-text-tertiary">{field.label}</span>
                        <input
                          className="rounded-xl border-2 border-border bg-primary px-4 py-3.5 text-body-md text-ink transition-all duration-200 placeholder:text-text-tertiary/70 focus:border-accent focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,138,128,0.12)]"
                          name={field.name}
                          required
                          type={field.type}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                        />
                      </motion.label>
                    ))}
                  </div>
                  <motion.label
                    className="flex flex-col gap-2"
                    initial={{ y: 28 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
                    transition={{ duration: 0.55, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mono-label text-text-tertiary">WHY DO YOU WANT TO JOIN?</span>
                    <textarea
                      className="rounded-xl border-2 border-border bg-primary px-4 py-3.5 text-body-md text-ink transition-all duration-200 placeholder:text-text-tertiary/70 focus:border-accent focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,138,128,0.12)]"
                      name="motivation"
                      required
                      rows={4}
                      placeholder="Tell us why you want to join ACCRC..."
                    />
                  </motion.label>
                  {formError && (
                    <p className="m-0 text-body-sm font-bold text-danger" role="alert">
                      {formError}
                    </p>
                  )}
                  <button
                    className="inline-flex w-fit items-center gap-2.5 rounded-full bg-accent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_14px_36px_-12px_rgba(14,138,128,0.8)] transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:cursor-wait disabled:opacity-65"
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                    {submitting ? 'Registering...' : 'Register & get club ID'}
                  </button>
              </motion.form>
            )}
          </div>
          </ScrollSlide>
        </div>
      </section>
      </div>
    </main>
  );
}
