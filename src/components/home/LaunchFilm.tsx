'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { track } from '@/components/fx/scrollEngine';

const FILM_SRC = '/media/accrc-launch-film.mp4';
/* The film's own first frame, so the frame isn't an empty black box while the
   video loads and playback starts without a visible jump. */
const FILM_POSTER = '/media/accrc-launch-film-poster.jpg';

/**
 * The launch film as a design element: a silent, looping frame that always
 * plays and can't be clicked, paused or opened full screen. On desktop it
 * grows from an inset card to near full-bleed as it scrolls into view.
 *
 * It starts loading just before it comes into view and plays only while on
 * screen (paused off screen, so it costs no battery or CPU there). The video is
 * fetched only by visitors who scroll this far.
 */
export function LaunchFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    return track(sectionRef.current, { offset: ['start end', 'center center'] });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    /* Browsers can pause a muted inline video on their own (iOS Low Power
       Mode, a tab coming back from the background). Try again whenever it's
       on screen. */
    let onScreen = false;
    const play = () => {
      if (onScreen && video.paused) void video.play().catch(() => undefined);
    };

    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && video.preload !== 'auto') {
          video.preload = 'auto';
          video.load();
        }
      },
      { rootMargin: '25% 0px' },
    );
    const visible = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) play();
        else video.pause();
      },
      { threshold: 0.2 },
    );
    nearby.observe(video);
    visible.observe(video);
    video.addEventListener('canplay', play);
    video.addEventListener('pause', play);
    document.addEventListener('visibilitychange', play);
    return () => {
      nearby.disconnect();
      visible.disconnect();
      video.removeEventListener('canplay', play);
      video.removeEventListener('pause', play);
      document.removeEventListener('visibilitychange', play);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="film"
      aria-label="ACCRC launch film"
      className="relative overflow-hidden bg-ink py-16 sm:py-24"
    >
      <div className="dot-grid-light absolute inset-0 opacity-10" aria-hidden />

      <div
        className="container-content relative mb-8 flex flex-wrap items-end justify-between gap-4 will-change-transform sm:mb-10"
        style={{ transform: 'translateY(calc((1 - var(--p, 1)) * 60px))' } as CSSProperties}
      >
        <div>
          <p className="mono-label mb-3 flex items-center gap-3 text-glow">
            <span className="inline-block h-px w-10 bg-glow" aria-hidden />
            LAUNCH FILM / 2026
          </p>
          <h2 className="font-display text-display-md font-black tracking-display text-[#F7F5EE]">
            This is <span className="text-glow">ACCRC.</span>
          </h2>
        </div>
        <p className="max-w-sm text-body-sm text-white/60">
          Forty seconds inside the lab: the people, the builds, and the season ahead.
        </p>
      </div>

      <div className="relative px-4 sm:px-6">
        <div
          className="film-frame pointer-events-none relative mx-auto aspect-video max-w-[1600px] select-none overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_40px_120px_-40px_rgba(255,122,89,0.3)]"
          style={{ '--film-scale': 'calc(0.82 + 0.18 * var(--p, 1))' } as CSSProperties}
        >
          <video
            ref={videoRef}
            className="pointer-events-none h-full w-full select-none object-cover"
            src={FILM_SRC}
            poster={FILM_POSTER}
            muted
            loop
            playsInline
            preload="none"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="pointer-events-none absolute bottom-4 left-4 sm:bottom-6 sm:left-6" aria-hidden>
            <span className="mono-label hidden rounded-full border border-white/20 bg-black/40 px-4 py-2 text-white/80 sm:inline">
              ACCRC &mdash; Launch Film
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
