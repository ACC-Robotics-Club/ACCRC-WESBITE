'use client';

import { useEffect, useState, type CSSProperties } from 'react';

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
/* Kept short: on a phone every extra moment behind the overlay reads as lag. */
const DURATION_MS = 1300;
const EXIT_MS = 700;
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
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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

  /* Every piece animates with CSS keyframes (.loader-* in globals.css), so the
     intro runs on the compositor while the page boots underneath it. */
  const d = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

  return (
    <div
      className="loader fixed inset-0 z-[100] overflow-hidden bg-primary"
      data-phase={phase}
      style={{ '--exit': `${EXIT_MS}ms` } as CSSProperties}
      aria-hidden
    >
      {/* Blueprint grid that draws itself in */}
      <div
        className="loader-fade absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(28,25,23,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(70% 70% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, #000 20%, transparent 100%)',
        }}
      />

      {/* Scanning highlight */}
      <div className="loader-scan absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-glow/20 to-transparent" />

      <div className="relative grid h-full place-items-center">
        <div className="relative w-[min(78vw,420px)]">
          {/* Schematic: nodes + links */}
          <svg
            viewBox="0 0 100 100"
            className="absolute -inset-x-10 -inset-y-8 h-[calc(100%+4rem)] w-[calc(100%+5rem)]"
            aria-hidden
          >
            {LINKS.map(([a, b], i) => (
              <line
                key={`link-${i}`}
                className="loader-link"
                style={d(0.15 + i * 0.05)}
                pathLength={1}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                stroke="var(--color-accent)"
                strokeWidth="0.4"
                strokeLinecap="round"
              />
            ))}
            {NODES.map((n, i) => (
              <circle
                key={`node-${i}`}
                className="loader-node"
                style={d(0.1 + i * 0.04)}
                cx={n.x}
                cy={n.y}
                r="1.4"
                fill="var(--color-accent)"
              />
            ))}
          </svg>

          {/* Wordmark, letters assembling in */}
          <div className="relative flex items-center justify-center gap-[0.06em]">
            {MARK.split('').map((char, i) => (
              <span
                key={`${char}-${i}`}
                className="loader-letter font-display text-5xl font-black leading-none text-ink md:text-6xl"
                style={d(0.25 + i * 0.06)}
              >
                {char}
              </span>
            ))}
          </div>

          {/* Progress rail */}
          <div className="relative mt-8 h-px w-full overflow-hidden bg-border">
            <div
              className="loader-rail absolute inset-0 origin-left bg-accent"
              style={{ '--rail': `${DURATION_MS}ms` } as CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
