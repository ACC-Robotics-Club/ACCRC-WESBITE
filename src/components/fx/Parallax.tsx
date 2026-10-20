'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { isLowPowerDevice } from '@/lib/perf';

/**
 * Scroll-linked parallax. Drifts the content against the page as it passes
 * through the viewport, optionally scaling and tilting in 3D for depth.
 * `speed` is the drift in percent of the element's own height.
 */
export function Parallax({
  children,
  className = '',
  speed = 12,
  scale,
  rotateX,
  perspective = 1200,
  offset = ['start end', 'end start'] as ['start end' | 'center center', 'end start' | 'start start'],
}: {
  children: ReactNode;
  className?: string;
  /** Drift distance in percent (positive = down, negative = up). */
  speed?: number;
  scale?: [number, number];
  rotateX?: [number, number];
  perspective?: number;
  offset?: ['start end' | 'center center', 'end start' | 'start start'];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() || (typeof window !== 'undefined' && isLowPowerDevice());
  const { scrollYProgress } = useScroll({ target: ref, offset });

  const y = useTransform(scrollYProgress, [0, 1], [`${speed}%`, `${-speed}%`]);
  const s = useTransform(
    scrollYProgress,
    [0, 1],
    scale ?? [1, 1]
  );
  const rx = useTransform(
    scrollYProgress,
    [0, 1],
    rotateX ?? [0, 0]
  );

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={perspective ? { perspective } : undefined}
    >
      <motion.div
        style={reduce ? undefined : { y, scale: s, rotateX: rx, transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
