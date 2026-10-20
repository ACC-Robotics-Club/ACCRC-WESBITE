'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { isLowPowerDevice } from '@/lib/perf';

/**
 * Large statement whose colour fills in as it scrolls through the viewport —
 * a muted base layer with an accent layer revealed by a clip-path wipe.
 */
export function ScrollFillText({
  children,
  className = '',
  fill = '#C8432C',
  base = 'rgba(28,25,23,0.22)',
}: {
  children: ReactNode;
  className?: string;
  fill?: string;
  base?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion() || (typeof window !== 'undefined' && isLowPowerDevice());
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.25'],
  });
  const clip = useTransform(scrollYProgress, [0, 1], ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']);

  return (
    <p ref={ref} className={`relative ${className}`} data-scroll-fill>
      <span className="block" style={{ color: base }} aria-hidden>
        {children}
      </span>
      <motion.span
        className="absolute inset-0 block"
        style={reduce ? { color: fill } : { clipPath: clip, color: fill }}
        aria-hidden
      >
        {children}
      </motion.span>
      <span className="sr-only">{children}</span>
    </p>
  );
}
