'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, CalendarDays, ChevronDown } from 'lucide-react';
import { Magnetic } from '@/components/fx/Magnetic';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { ParticleCanvas } from '@/components/fx/ParticleCanvas';

/* WebGL scene is client-only; a gradient fallback sits underneath it. */
const RobotScene = dynamic(() => import('@/components/fx/RobotScene'), {
  ssr: false,
  loading: () => null,
});

/** True when the visitor asked the browser to save data. */
function wantsLiteMode() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

/** Stagger index for the CSS entrance (see .hero-intro in globals.css). */
const at = (i: number) => ({ '--i': i }) as CSSProperties;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Depth-curtain scroll: the hero stays pinned behind the page while content
     slides over it (the sheet in page.tsx). Where CSS scroll timelines exist
     the effect is pure CSS on the compositor (.hero-depth-* in globals.css).
     Elsewhere one passive listener writes a single --curtain variable (0 → 1
     over the first screen of scroll) and CSS derives every transform from it.

     The same listener reports when the sheet has fully covered the hero, so it
     stops painting and both render loops pause. The hero is sticky for the
     whole page, so without this the WebGL hand and the particle field would
     keep rendering, unseen, behind every section below. */
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cssTimeline = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');
    const jsDepth = !reduced && !cssTimeline;
    if (jsDepth) el.classList.add('hero-js-depth');

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (jsDepth) el.style.setProperty('--curtain', Math.min(1, y / window.innerHeight).toFixed(4));
      const next = y > el.offsetHeight + 8;
      setCovered((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      el.classList.remove('hero-js-depth');
    };
  }, []);

  /* A sticky element taller than the viewport would pin with its bottom (and
     the buttons) cut off on short phones. Offsetting `top` by the overflow lets
     it scroll fully into view first, then pin. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const fit = () => {
      el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    window.addEventListener('resize', fit, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  /* Mount the WebGL hand only once the main thread is idle, so it never
     competes with first paint and hydration. */
  const [show3D, setShow3D] = useState(false);
  useEffect(() => {
    if (wantsLiteMode()) return;
    const reveal = () => setShow3D(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(reveal, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(reveal, 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="sticky top-0 z-0 flex min-h-[100svh] items-center overflow-hidden bg-primary pt-28 pb-24 sm:pt-32"
      style={{ visibility: covered ? 'hidden' : 'visible' }}
    >
      {/* ── Parallax backdrop layer (drifts down = deeper) ── */}
      <div className="hero-depth-bg absolute inset-0 z-[1]" aria-hidden>
        <div className="absolute inset-0" aria-hidden>
          <ParticleCanvas
            className="absolute inset-0 h-full w-full"
            particleCount={60}
            particleColor="200, 67, 44"
            lineColor="200, 67, 44"
            maxLineDistance={140}
            mouseRadius={130}
            paused={covered}
          />
        </div>

        {/* Backdrop decorations */}
        <div className="line-grid absolute inset-0 opacity-80" aria-hidden />
        <div className="hero-3d-fallback" aria-hidden />

        {/* Organic blobs — tablet and up; on a phone they just crowd the copy. */}
        <div
          className="hero-pop absolute -left-24 top-1/4 z-[1] hidden h-72 w-72 rounded-full bg-secondary/80 animate-float-slow sm:block"
          style={{ '--pop-delay': '0.5s' } as CSSProperties}
          aria-hidden
        />
        <div
          className="hero-pop absolute -right-16 bottom-16 z-[1] hidden h-56 w-56 rounded-3xl bg-secondary/80 animate-float-slow [animation-delay:-4s] sm:block"
          style={{ '--pop-delay': '0.7s' } as CSSProperties}
          aria-hidden
        />
        <div
          className="hero-pop absolute left-[38%] top-12 z-[1] h-16 w-16 rounded-full bg-glow/20 animate-float-slow [animation-delay:-2s] sm:h-24 sm:w-24"
          style={{ '--pop-delay': '0.9s' } as CSSProperties}
          aria-hidden
        />
        {/* Glow orb — a soft radial gradient pulsing on the compositor. */}
        <div className="hero-glow-orb absolute right-[15%] top-[18%] h-48 w-48 rounded-full" aria-hidden />
      </div>

      {/* ── 3D hand — recedes deepest of all layers ── */}
      <div className="hero-depth-hand pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        <div className={`hero-hand-in absolute inset-0 h-full w-full overflow-hidden ${show3D ? 'is-in' : ''}`}>
          {show3D && <RobotScene paused={covered} />}
        </div>
      </div>

      {/* ── Copy — sinks, shrinks and fades first (nearest to the viewer) ── */}
      <div className="hero-depth-content relative z-10 w-full">
        {/* Entrance is pure CSS, so it starts at first paint without waiting
            for JavaScript, and runs on the compositor. */}
        <div className="hero-intro container-content relative z-10">
          <p className="hero-intro__item mono-label mb-6 flex items-center gap-3 text-xs font-bold tracking-widest text-text-secondary" style={at(0)}>
            <span className="inline-block h-0.5 w-7 bg-accent" aria-hidden />
            EST. 2019 · DHAKA, BANGLADESH
          </p>

          <SplitReveal
            as="h1"
            intro
            delay={0.15}
            className="font-display text-display-xl font-black text-ink"
            lines={[
              <>BUILD</>,
              <>WHAT&apos;S</>,
              <>NEXT.</>,
            ]}
          />

          <p className="hero-intro__item mt-6 max-w-md text-body-md text-text-secondary sm:mt-7 sm:text-body-lg" style={at(2)}>
            Adamjee Cantonment College Robotics Club is a student-led community where
            we build, learn, and compete together.
          </p>

          <div className="hero-intro__item mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:mt-10 sm:gap-4" style={at(3)}>
            <Magnetic strength={0.2}>
              <a
                href="#join"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_24px_-6px_rgba(200,67,44,0.45)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-accent-hover hover:shadow-[0_14px_30px_-6px_rgba(200,67,44,0.6)] active:scale-95"
              >
                Become a member <ArrowRight size={16} aria-hidden />
              </a>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a
                href="#events"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border-2 border-border-strong bg-transparent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-ink transition-[background-color,transform] duration-200 hover:bg-secondary/70 active:scale-95"
              >
                View events <CalendarDays size={16} aria-hidden />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Decorative floating shapes along the bottom edge */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] h-40" aria-hidden>
        <div className="hero-slide-in absolute -bottom-8 -left-4 h-20 w-[28%] rounded-full bg-secondary/90" />
        <div
          className="hero-pop absolute -bottom-4 left-[35%] h-16 w-16 rounded-full bg-glow/15"
          style={{ '--pop-delay': '1.4s', '--pop-duration': '0.8s' } as CSSProperties}
        />
      </div>

      {/* Scroll cue */}
      <a
        href="#mission"
        className="hero-depth-cue absolute bottom-5 left-1/2 z-10 -ml-[13px] text-text-tertiary transition-colors hover:text-accent sm:bottom-7"
        aria-label="Scroll to mission"
      >
        <ChevronDown size={26} className="animate-bob" />
      </a>
    </section>
  );
}
