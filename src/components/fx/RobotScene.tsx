'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { HAND_CONFIG, startStill } from './handConfig';
import type { HandWorkerReply } from './hand.worker';

/* Only downloaded where WebGL can't run in a worker. */
const RobotSceneR3F = dynamic(() => import('./RobotSceneR3F'), { ssr: false });

/**
 * The hero's 3D hand. Rendered by hand.worker.ts on an OffscreenCanvas, so its
 * frames never touch the page's main thread: scrolling and taps stay smooth
 * while it animates. Browsers without WebGL in workers get the same scene
 * rendered on the main thread (RobotSceneR3F).
 */
export default function RobotScene({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof Worker === 'undefined' || !('transferControlToOffscreen' in canvas)) {
      setFallback(true);
      return;
    }

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    /* Phones render at 1x: the hand is soft cel-shading, so the difference is
       invisible on a small screen, but it is half or less of the pixel work. */
    const maxDpr = coarse ? 1 : 2;
    const dpr = () => Math.min(window.devicePixelRatio || 1, maxDpr);

    let offscreen: OffscreenCanvas;
    try {
      offscreen = canvas.transferControlToOffscreen();
    } catch {
      setFallback(true);
      return;
    }
    const worker = new Worker(new URL('./hand.worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<HandWorkerReply>) => {
      if (event.data.type === 'unsupported') setFallback(true);
    };
    worker.onerror = () => setFallback(true);
    worker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        dpr: dpr(),
        maxDpr,
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        finePointer,
        still: startStill(),
        modelUrl: new URL(HAND_CONFIG.url, window.location.href).href,
      },
      [offscreen],
    );

    /* Layout size only (offsetWidth), and only on real resizes: the hero's
       scroll-driven scale must not count as a resize. */
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        worker.postMessage({ type: 'resize', width: canvas.offsetWidth, height: canvas.offsetHeight, dpr: dpr() });
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    /* Mouse parallax, at most once per frame. Touch screens idle instead. */
    let pointerFrame = 0;
    let px = 0;
    let py = 0;
    const onPointer = (e: PointerEvent) => {
      const halfW = 0.5 * window.innerWidth;
      const halfH = 0.5 * window.innerHeight;
      px = (e.clientX - halfW) / halfW;
      py = (e.clientY - halfH) / halfH;
      if (!pointerFrame) {
        pointerFrame = requestAnimationFrame(() => {
          pointerFrame = 0;
          worker.postMessage({ type: 'pointer', x: px, y: py });
        });
      }
    };
    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(pointerFrame);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /* Pause while the hero is covered or the tab is hidden. */
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const sync = () => worker.postMessage({ type: 'run', on: !paused && !document.hidden });
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [paused, fallback]);

  if (fallback) return <RobotSceneR3F paused={paused} />;
  return <canvas ref={canvasRef} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }} />;
}
