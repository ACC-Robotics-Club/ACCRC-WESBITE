'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

const FILM_SRC = '/media/accrc-launch-film.mp4';

/**
 * The launch film as a design element: a muted, looping frame that grows from
 * an inset card to near full-bleed as it scrolls into view. It only fetches
 * and plays while on screen, so the 25 MB file never costs a visitor who
 * doesn't scroll this far.
 */
export function LaunchFilm() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  // Once the viewer pauses, scrolling back into view must not restart it.
  const userPaused = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 1 : 0.82, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 24 : 48, 24]);
  const captionY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 60, 0]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused.current) video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => setPlaying(false));
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    // Turning sound on is a request to watch: start from the top.
    if (!next) {
      video.currentTime = 0;
      userPaused.current = false;
      video.play().catch(() => setPlaying(false));
    }
  };

  return (
    <section
      ref={sectionRef}
      id="film"
      aria-label="ACCRC launch film"
      className="relative overflow-hidden bg-ink py-16 sm:py-24"
    >
      <div className="dot-grid-light absolute inset-0 opacity-10" aria-hidden />

      <motion.div style={{ y: captionY }} className="container-content relative mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="mono-label mb-3 flex items-center gap-3 text-glow">
            <span className="inline-block h-px w-10 bg-glow" aria-hidden />
            LAUNCH FILM / 2026
          </p>
          <h2 className="font-display text-display-md font-black tracking-display text-[#e8fffb]">
            This is <span className="text-glow">ACCRC.</span>
          </h2>
        </div>
        <p className="max-w-sm text-body-sm text-white/60">
          Forty seconds inside the lab: the people, the builds, and the season ahead.
        </p>
      </motion.div>

      <div className="relative px-4 sm:px-6">
        <motion.div
          style={{ scale, borderRadius: radius }}
          className="relative mx-auto aspect-video max-w-[1600px] overflow-hidden border border-white/10 bg-black shadow-[0_40px_120px_-40px_rgba(43,224,210,0.35)]"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={FILM_SRC}
            muted
            loop
            playsInline
            preload="none"
            controls={false}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-label="ACCRC launch film"
          />

          {/* Shade so the controls stay legible over bright frames. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />

          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 grid place-items-center"
              aria-label="Play launch film"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-glow text-ink shadow-[0_0_0_10px_rgba(43,224,210,0.18)] transition-transform duration-300 hover:scale-110 sm:h-24 sm:w-24">
                <Play size={34} className="translate-x-0.5" aria-hidden />
              </span>
            </button>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
            <span className="mono-label hidden rounded-full border border-white/20 bg-black/40 px-4 py-2 text-white/80 backdrop-blur sm:inline">
              ACCRC &mdash; Launch Film
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:bg-glow hover:text-ink"
                aria-label={playing ? 'Pause film' : 'Play film'}
              >
                {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white backdrop-blur transition-colors hover:bg-glow hover:text-ink"
                aria-pressed={!muted}
              >
                {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
                {muted ? 'Sound on' : 'Mute'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
