'use client';

import { useEffect, useRef } from 'react';
import { createParticleSim, type ParticleOptions } from './particleSim';

type Controller = {
  resize: (w: number, h: number, dpr: number) => void;
  pointer: (x: number, y: number) => void;
  run: (on: boolean) => void;
  dispose: () => void;
};

/**
 * Interactive particle network, inspired by the canvas effect on
 * mindrobotics.com. Particles drift and connect when nearby, creating an
 * organic tech-mesh backdrop for the hero.
 *
 * The simulation runs in a Web Worker on an OffscreenCanvas, so it costs the
 * main thread nothing — on a budget phone it used to take a steady slice of
 * every frame and delay taps and scrolls while the hero was on screen.
 * Browsers without OffscreenCanvas fall back to the same code on the main
 * thread. Phones run it at 30fps; the drift is slow enough that it reads the
 * same.
 */
export function ParticleCanvas({
  className = '',
  particleCount = 80,
  particleColor = '200, 67, 44',
  lineColor = '200, 67, 44',
  maxLineDistance = 150,
  mouseRadius = 120,
  paused = false,
}: {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  lineColor?: string;
  maxLineDistance?: number;
  mouseRadius?: number;
  /** Set while the canvas is covered by other content (e.g. the hero sheet). */
  paused?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const pausedRef = useRef(paused);
  const visibleRef = useRef(true);

  const sync = () => {
    controllerRef.current?.run(!pausedRef.current && visibleRef.current && !document.hidden);
  };

  useEffect(() => {
    pausedRef.current = paused;
    sync();
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const opts: ParticleOptions = {
      particleCount,
      particleColor,
      lineColor,
      maxLineDistance,
      mouseRadius,
      fps: finePointer ? 60 : 30,
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
    const dprFor = () => Math.min(window.devicePixelRatio || 1, finePointer ? 2 : 1.5);

    /* The canvas is created here rather than rendered by React: a canvas can
       be handed to a worker only once, so each mount needs a fresh one. */
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(canvas);
    const box = host.getBoundingClientRect();

    let controller: Controller;
    if (typeof Worker !== 'undefined' && 'transferControlToOffscreen' in canvas) {
      const offscreen = canvas.transferControlToOffscreen();
      const worker = new Worker(new URL('./particles.worker.ts', import.meta.url));
      worker.postMessage(
        { type: 'init', canvas: offscreen, width: box.width, height: box.height, dpr: dprFor(), opts },
        [offscreen],
      );
      controller = {
        resize: (width, height, dpr) => worker.postMessage({ type: 'resize', width, height, dpr }),
        pointer: (x, y) => worker.postMessage({ type: 'pointer', x, y }),
        run: (on) => worker.postMessage({ type: 'run', on }),
        dispose: () => worker.terminate(),
      };
    } else {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sim = createParticleSim(canvas, ctx, opts);
      sim.resize(box.width, box.height, dprFor());
      controller = { ...sim, dispose: () => sim.run(false) };
    }
    controllerRef.current = controller;

    const resizeObserver = new ResizeObserver(([entry]) => {
      controller.resize(entry.contentRect.width, entry.contentRect.height, dprFor());
    });
    resizeObserver.observe(host);

    const visibility = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      sync();
    });
    visibility.observe(host);
    document.addEventListener('visibilitychange', sync);

    /* The canvas sits underneath the hero copy, so it never receives pointer
       events itself — track the pointer on the window instead (mouse only). */
    const onPointer = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      controller.pointer(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onLeave = () => controller.pointer(-9999, -9999);
    if (finePointer) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }

    sync();

    return () => {
      controllerRef.current = null;
      controller.dispose();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleCount, particleColor, lineColor, maxLineDistance, mouseRadius]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
