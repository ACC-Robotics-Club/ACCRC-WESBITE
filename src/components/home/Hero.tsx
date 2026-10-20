'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { isLowPowerDevice } from '@/lib/perf';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CalendarDays, ChevronDown } from 'lucide-react';
import { Magnetic } from '@/components/fx/Magnetic';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { ParticleCanvas } from '@/components/fx/ParticleCanvas';
import { useWebGL } from '@/lib/perf';

/* WebGL scene is client-only; a gradient fallback sits underneath it. */
const RobotScene = dynamic(() => import('@/components/fx/RobotScene'), {
  ssr: false,
  loading: () => null,
});

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};
const item = {
  hidden: { y: 34 },
  visible: { y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();
  /* The hand now renders on phones too (user request); only devices without
     WebGL, or browsers with a reduced-motion preference, skip it. */
  const webgl = useWebGL();

  /* The 3D hand is the single most expensive thing on the page. Once the
     opaque content sheet has swept fully over the sticky hero (~one viewport
     of scroll) it is invisible, so the WebGL frame loop is stopped entirely. */
  const [scenePaused, setScenePaused] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const covered = window.scrollY > window.innerHeight * 1.1;
      setScenePaused((prev) => (prev === covered ? prev : covered));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Depth-curtain scroll: the hero stays pinned behind the page while content
     slides over it (the sheet in page.tsx). Progress is measured in viewport
     heights so all the depth effects finish within the first screen of scroll —
     exactly while the sheet is sweeping over the hero. */
  const { scrollY } = useScroll();
  /* Depth values turn into their resting state on weak devices, which lets
     framer-motion drop every one of these per-frame transform listeners
     instead of repainting seven motion values on each scroll event. */
  const depth = (from: number, to: number) => (reduceMotion || isLowPowerDevice() ? from : to);

  const curtain = useTransform(scrollY, (y) =>
    Math.min(1, y / (typeof window === 'undefined' ? 800 : window.innerHeight)),
  );

  const contentY = useTransform(curtain, [0, 1], [0, depth(0, -80)]);
  const contentScale = useTransform(curtain, [0, 1], [1, depth(1, 0.86)]);
  const contentOpacity = useTransform(curtain, [0, 0.9], [1, depth(1, 0.15)]);
  const handY = useTransform(curtain, [0, 1], [0, depth(0, 110)]);
  const handScale = useTransform(curtain, [0, 1], [1, depth(1, 1.14)]);
  const handOpacity = useTransform(curtain, [0, 0.85], [1, depth(1, 0.3)]);
  const bgY = useTransform(curtain, [0, 1], [0, depth(0, 60)]);
  const cueOpacity = useTransform(curtain, [0, 0.2], [1, depth(1, 0)]);

  return (
    <section
      id="top"
      className="sticky top-0 z-0 flex min-h-[100svh] items-center overflow-hidden bg-primary pt-28 pb-24 sm:pt-32"
    >
      {/* ── Parallax backdrop layer (drifts down = deeper) ── */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-[1]" aria-hidden>
        <div className="absolute inset-0" aria-hidden>
          <ParticleCanvas
            className="absolute inset-0 w-full h-full"
            particleCount={60}
            particleColor="200, 67, 44"
            lineColor="200, 67, 44"
            maxLineDistance={140}
            mouseRadius={130}
          />
        </div>

        {/* Architectural grid & backdrop decorations matching reference image */}
        <div className="line-grid absolute inset-0 opacity-80" aria-hidden />
        <div className="hero-3d-fallback" aria-hidden />

      {/* Organic blobs — enhanced with warm glow effects */}
      <motion.div
        className="absolute -left-24 top-1/4 z-[1] h-72 w-72 rounded-full bg-secondary/80 animate-float-slow"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <motion.div
        className="absolute -right-16 bottom-16 z-[1] h-56 w-56 rounded-3xl bg-secondary/80 animate-float-slow [animation-delay:-4s]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <motion.div
        className="absolute left-[38%] top-12 z-[1] h-24 w-24 rounded-full bg-glow/20 animate-float-slow [animation-delay:-2s]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      {/* Extra decorative glow orb */}
        <motion.div
          className="absolute right-[15%] top-[18%] h-48 w-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,67,44,0.18) 0%, transparent 65%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      </motion.div>

      {/* ── 3D hand — recedes deepest of all layers ── */}
      <motion.div
        style={{ y: handY, scale: handScale, opacity: handOpacity }}
        className="pointer-events-none absolute inset-0 z-[2]"
        aria-hidden
      >
        <motion.div
          className="absolute inset-0 h-full w-full overflow-hidden"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {webgl && <RobotScene paused={scenePaused} />}
        </motion.div>
      </motion.div>

      {/* ── Copy — sinks, shrinks and fades first (nearest to the viewer) ── */}
      <motion.div
        style={{ y: contentY, scale: contentScale, opacity: contentOpacity }}
        className="relative z-10 w-full"
      >
      <motion.div
        className="container-content relative z-10"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={item} className="mono-label mb-6 flex items-center gap-3 text-text-secondary text-xs font-bold tracking-widest">
          <span className="inline-block h-0.5 w-7 bg-accent" aria-hidden />
          EST. 2019 · DHAKA, BANGLADESH
        </motion.p>

        <SplitReveal
          as="h1"
          delay={0.15}
          className="font-display text-display-xl font-black text-ink"
          lines={[
            <>BUILD</>,
            <>WHAT&apos;S</>,
            <>NEXT.</>,
          ]}
        />

        <motion.p
          variants={item}
          className="mt-7 max-w-md text-body-lg text-text-secondary"
        >
          Adamjee Cantonment College Robotics Club is a student-led community where we build, learn, and compete together.
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
          <Magnetic strength={0.2}>
            <a
              href="#join"
              className="inline-flex items-center gap-2.5 rounded-lg bg-accent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_24px_-6px_rgba(200,67,44,0.45)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_14px_30px_-6px_rgba(200,67,44,0.6)] active:scale-95"
            >
              Become a member <ArrowRight size={16} aria-hidden />
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a
              href="#events"
              className="inline-flex items-center gap-2.5 rounded-lg border-2 border-border-strong bg-transparent px-8 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-ink transition-all duration-200 hover:bg-secondary/70 active:scale-95"
            >
              View events <CalendarDays size={16} aria-hidden />
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>
      </motion.div>

      {/* Decorative floating lines — inspired by the organic shapes on mindrobotics.com */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-[3] h-40 pointer-events-none"
        aria-hidden
      >
        {/* Large pill shape at bottom-left */}
        <motion.div
          className="absolute -bottom-8 -left-4 h-20 w-[28%] rounded-full bg-secondary/90"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Circle shape at bottom-center */}
        <motion.div
          className="absolute -bottom-4 left-[35%] h-16 w-16 rounded-full bg-glow/15"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>

      {/* Coordinates + scroll cue */}
      <div className="mono-label absolute bottom-24 right-6 z-10 hidden text-right leading-7 text-text-tertiary lg:block" aria-hidden>
        23°49&apos;N<br />90°25&apos;E
      </div>
      <motion.a
        href="#mission"
        style={{ opacity: cueOpacity }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-text-tertiary hover:text-accent transition-colors"
        initial={{ y: 12 }}
        animate={{ y: [0, 8, 0] }}
        transition={{ delay: 1.4, duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Scroll to mission"
      >
        <ChevronDown size={26} />
      </motion.a>
    </section>
  );
}
