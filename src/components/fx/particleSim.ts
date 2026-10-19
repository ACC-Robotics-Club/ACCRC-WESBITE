/**
 * Particle-network simulation shared by the Web Worker (normal path) and the
 * main-thread fallback. It only touches a 2D context it is handed, so it runs
 * the same on an OffscreenCanvas inside a worker as on a regular canvas.
 */

export type ParticleOptions = {
  particleCount: number;
  particleColor: string;
  lineColor: string;
  maxLineDistance: number;
  mouseRadius: number;
  /** Target frame rate; phones run at 30 to halve the work. */
  fps: number;
  reduced: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; radius: number; opacity: number };

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Surface = { width: number; height: number };

/** Line opacity is quantised into a few buckets so each frame strokes a handful
    of batched paths instead of one path per connection. */
const ALPHA_BUCKETS = 5;

export function createParticleSim(surface: Surface, ctx: Ctx, opts: ParticleOptions) {
  let particles: Particle[] = [];
  let width = 0;
  let height = 0;
  let running = false;
  let handle: number | ReturnType<typeof setTimeout> = 0;
  let last = 0;
  const mouse = { x: -9999, y: -9999 };
  const maxDistSq = opts.maxLineDistance * opts.maxLineDistance;
  const frameMs = 1000 / opts.fps;

  // Workers in some browsers have no requestAnimationFrame; fall back to a timer.
  const raf: (cb: (t: number) => void) => number | ReturnType<typeof setTimeout> =
    typeof requestAnimationFrame === 'function'
      ? (cb) => requestAnimationFrame(cb)
      : (cb) => setTimeout(() => cb(performance.now()), frameMs);
  const caf = (h: number | ReturnType<typeof setTimeout>) =>
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(h as number) : clearTimeout(h);

  const seed = () => {
    const scale = Math.min(1, Math.max(0.32, (width * height) / (1440 * 900)));
    const count = Math.round(opts.particleCount * scale);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.15,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const buckets: Path2D[] = Array.from({ length: ALPHA_BUCKETS }, () => new Path2D());
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= maxDistSq) continue;
        const strength = 1 - Math.sqrt(distSq) / opts.maxLineDistance;
        const bucket = Math.min(ALPHA_BUCKETS - 1, Math.floor(strength * ALPHA_BUCKETS));
        buckets[bucket].moveTo(a.x, a.y);
        buckets[bucket].lineTo(b.x, b.y);
      }
    }
    ctx.lineWidth = 0.6;
    buckets.forEach((path, i) => {
      ctx.strokeStyle = `rgba(${opts.lineColor}, ${(((i + 0.5) / ALPHA_BUCKETS) * 0.18).toFixed(3)})`;
      ctx.stroke(path);
    });
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${opts.particleColor}, ${p.opacity})`;
      ctx.fill();
    }
  };

  const update = (dt: number) => {
    const r2 = opts.mouseRadius * opts.mouseRadius;
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < r2 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (opts.mouseRadius - dist) / opts.mouseRadius;
        p.vx += (dx / dist) * force * 0.3;
        p.vy += (dy / dist) * force * 0.3;
      }
      // Dampen, but keep a floor so the field never freezes after a push.
      p.vx *= 0.985;
      p.vy *= 0.985;
      if (Math.hypot(p.vx, p.vy) < 0.12) {
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
      }
    }
  };

  const loop = (now: number) => {
    if (!running) return;
    handle = raf(loop);
    if (last && now - last < frameMs - 2) return; // frame-rate cap
    // Normalise to 60fps steps so motion speed is the same at any frame rate.
    const dt = last ? Math.min(4, (now - last) / 16.667) : 1;
    last = now;
    update(dt);
    draw();
  };

  return {
    resize(nextW: number, nextH: number, dpr: number) {
      const widthChanged = Math.abs(nextW - width) > 1;
      width = nextW;
      height = nextH;
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // URL-bar show/hide only changes height, so it never reshuffles the field.
      if (widthChanged || particles.length === 0) seed();
      draw();
    },
    pointer(x: number, y: number) {
      mouse.x = x;
      mouse.y = y;
    },
    run(on: boolean) {
      if (opts.reduced) on = false;
      if (on === running) return;
      running = on;
      if (on) {
        last = 0;
        handle = raf(loop);
      } else {
        caf(handle);
      }
    },
  };
}
