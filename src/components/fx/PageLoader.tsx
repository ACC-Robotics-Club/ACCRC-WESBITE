'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Page-entry loader — a "blueprint assembling" sequence.
 *
 * A technical-drawing grid draws itself in, the ACCRC mark traces on like a
 * schematic, then the whole sheet lifts away as a curtain so the page is
 * revealed from behind it. Deliberately typographic/technical rather than a
 * spinner, so it belongs to the robotics-lab identity.
 *
 * Mounted once per app shell; it removes itself from the DOM when finished so
 * it never intercepts pointer events.
 */

const MARK = 'ACCRC';
const DURATION_MS = 1900;
const EXIT_MS = 850;
const SEEN_KEY = 'accrc-loader-seen';

/** Deterministic blueprint geometry — no randomness, so SSR and client match. */
const NODES = [
  { x: 18, y: 30 },
  { x: 82, y: 30 },
  { x: 30, y: 72 },
  { x: 70, y: 72 },
  { x: 50, y: 50 },
];
const LINKS = [
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
  [0, 2],
  [1, 3],
];

export function PageLoader() {
  const reduceMotion = useReducedMotion();

  /* One state machine instead of several cascading effects: 'loading' →
     'exiting' → 'done'. Kept deliberately flat so there is no way for the
     overlay to get stuck on screen and block the page. */
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'done'>('loading');

  useEffect(() => {
    /* Play once per browser session — a reload or client-side navigation should
       not slam a full-screen overlay back up over the content. */
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Storage can be unavailable (private mode); fall back to always playing.
    }
    if (seen) {
      setPhase('done');
      return;
    }

    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore
    }

    const leaveTimer = window.setTimeout(() => setPhase('exiting'), DURATION_MS);
    /* Hard failsafe: the exit animation is 0.8s, so unmount with headroom even
       if the animation never fires (background tab, reduced-motion edge cases). */
    const removeTimer = window.setTimeout(() => setPhase('done'), DURATION_MS + EXIT_MS + 400);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  // Lock the page only while the overlay is actually on screen.
  useEffect(() => {
    if (phase === 'done' || reduceMotion) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase, reduceMotion]);

  if (phase === 'done') return null;

  if (reduceMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[100] bg-primary" aria-hidden>
        <div className="grid h-full place-items-center">
          <p className="mono-label text-accent">ACCRC</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-primary"
      aria-hidden
      initial={{ y: 0 }}
      animate={phase === 'exiting' ? { y: '-101%' } : { y: '0%' }}
      transition={phase === 'exiting' ? { duration: 0.8, ease: [0.76, 0, 0.24, 1] } : { duration: 0.2 }}
    >
      {/* Blueprint grid that draws itself in */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(28,25,23,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(70% 70% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, #000 20%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Scanning highlight */}
      <motion.div
        className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-glow/20 to-transparent"
        initial={{ y: -160 }}
        animate={{ y: '100vh' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      <div className="relative grid h-full place-items-center">
        <div className="relative w-[min(78vw,420px)]">
          {/* Schematic: nodes + links */}
          <svg
            viewBox="0 0 100 100"
            className="absolute -inset-x-10 -inset-y-8 h-[calc(100%+4rem)] w-[calc(100%+5rem)]"
            aria-hidden
          >
            {LINKS.map(([a, b], i) => (
              <motion.line
                key={`link-${i}`}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                stroke="var(--color-accent)"
                strokeWidth="0.4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.55 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.07, ease: 'easeInOut' }}
              />
            ))}
            {NODES.map((n, i) => (
              <motion.circle
                key={`node-${i}`}
                cx={n.x}
                cy={n.y}
                r="1.4"
                fill="var(--color-accent)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: 'backOut' }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
            ))}
          </svg>

          {/* Wordmark, letters assembling in */}
          <div className="relative flex items-center justify-center gap-[0.06em]">
            {MARK.split('').map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                className="font-display text-5xl font-black leading-none text-ink md:text-6xl"
                initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: 0.45 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Status readout */}
          <motion.p
            className="mono-label relative mt-7 text-center text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.95 }}
          >
            Initialising systems
          </motion.p>

          {/* Progress rail */}
          <div className="relative mt-4 h-px w-full overflow-hidden bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 bg-accent"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}