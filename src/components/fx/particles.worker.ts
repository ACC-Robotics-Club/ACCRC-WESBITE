/// <reference lib="webworker" />
/**
 * Runs the hero particle field entirely off the main thread. The page hands
 * over an OffscreenCanvas once; after that it only sends size, pointer and
 * play/pause messages, so drawing never competes with scrolling or taps.
 */
import { createParticleSim, type ParticleOptions } from './particleSim';

type Message =
  | { type: 'init'; canvas: OffscreenCanvas; width: number; height: number; dpr: number; opts: ParticleOptions }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'run'; on: boolean };

let sim: ReturnType<typeof createParticleSim> | null = null;

self.onmessage = (event: MessageEvent<Message>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    const ctx = msg.canvas.getContext('2d');
    if (!ctx) return;
    sim = createParticleSim(msg.canvas, ctx, msg.opts);
    sim.resize(msg.width, msg.height, msg.dpr);
    return;
  }
  if (!sim) return;
  if (msg.type === 'resize') sim.resize(msg.width, msg.height, msg.dpr);
  else if (msg.type === 'pointer') sim.pointer(msg.x, msg.y);
  else if (msg.type === 'run') sim.run(msg.on);
};
