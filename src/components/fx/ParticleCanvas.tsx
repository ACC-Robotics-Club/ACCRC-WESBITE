'use client';

import { useRef, useEffect, useState } from 'react';
import { shouldDisableScrollFx } from '@/lib/perf';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

/**
 * Full-viewport interactive particle network, inspired by the canvas effect
 * on mindrobotics.com. Particles drift and form connections when nearby,
 * creating an organic tech-mesh backdrop for the hero section.
 *
 * Performance budget (this layer is pure decoration, so it must never take
 * cycles away from scrolling or the main thread):
 * - Skipped entirely on low-power devices (perf.ts) — the CSS fallback
 *   gradient underneath covers the hero.
 * - Frame loop is capped at 30fps and pauses completely while the canvas is
 *   scrolled out of the viewport (the old version repainted forever).
 * - Particle count scales with canvas area and the render resolution is
 *   capped (1x DPR on small screens), so the O(n²) line pass stays tiny.
 */
const FRAME_MS = 1000 / 30;

export function ParticleCanvas({
  className = '',
  particleCount = 80,
  particleColor = '200, 67, 44',
  lineColor = '200, 67, 44',
  maxLineDistance = 150,
  mouseRadius = 120,
}: {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  lineColor?: string;
  maxLineDistance?: number;
  mouseRadius?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Weak devices: unmount this layer and let the CSS fallback show.
    if (shouldDisableScrollFx()) {
      setDisabled(true);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = (width: number, height: number) => {
      // Fewer particles on small/lightweight viewports: connections are O(n²),
      // so halving n quarters the line-pass cost.
      const area = width * height;
      const density = Math.min(1, Math.max(0.3, area / (1280 * 720)));
      const count = Math.max(8, Math.round(particleCount * density));
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.15,
        });
      }
      particlesRef.current = particles;
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      // Only paint at 1x resolution on small screens; density-saving, and the
      // backdrop is faded anyway. Cap at 1.5x elsewhere as well.
      const small = Math.min(rect.width, rect.height) < 640;
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Pause all work (not just drawing) while off-screen.
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener('mousemove', handleMouse, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const mouseRadiusSq = mouseRadius * mouseRadius;
    const maxLineDistanceSq = maxLineDistance * maxLineDistance;

    let lastFrame = 0;
    const animate = (t: number) => {
      rafRef.current = requestAnimationFrame(animate);
      // Off-screen: skip every bit of work instead of repainting behind the
      // opaque content sheet.
      if (!visibleRef.current) return;
      const elapsed = t - lastFrame;
      if (elapsed < FRAME_MS) return;
      lastFrame = t;

      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const speed = reducedMotion ? 0 : 1;

      // Update positions
      for (const p of particles) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Bounce off edges
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        // Mouse repulsion (squared threshold — the common case is "far away")
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < mouseRadiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (mouseRadius - dist) / mouseRadius;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }

        // Dampen velocity
        p.vx *= 0.998;
        p.vy *= 0.998;
      }

      // Batched line pass: one style, alpha via globalAlpha — avoids rebuilding
      // the stroke style string (and a style switch) for every segment.
      const range = maxLineDistance;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = lineColor;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxLineDistanceSq) {
            const alpha = (1 - Math.sqrt(distSq) / range) * 0.18;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
        ctx.fill();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      visibilityObserver.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount, particleColor, lineColor, maxLineDistance, mouseRadius]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  );
}
