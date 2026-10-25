'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { isLowPowerDevice } from '@/lib/perf';

/**
 * Framer's scroll-range tuple, derived from `useScroll` itself so it always
 * matches the installed version (the type is declared but not exported).
 */
type ScrollOffset = NonNullable<
  NonNullable<Parameters<typeof useScroll>[0]>['offset']
>;

/**
 * Bottom-to-top scroll slide: content rises from below into its resting place
 * as it is scrolled into view.
 *
 * The default scroll range is front-loaded (`start 0.9` → `start 0.35`): once
 * the element's top passes 35% of the viewport the value has already reached
 * `to` and stays there for the rest of the scroll. That guarantees the
 * animation always finishes, so content can never be left parked at an offset
 * (and therefore effectively hidden) further down the page.
 *
 * That range is tied to the element's *top*, so for a container taller than
 * the viewport it completes almost immediately and everything below sits
 * static. Pass a range ending on the element's `end` for tall containers —
 * that spreads the travel across the container's own height.
 */
export function ScrollSlide({
  children,
  className = '',
  axis = 'y',
  from = 90,
  to = -25,
  offset = ['start 0.9', 'start 0.35'] as ScrollOffset,
}: {
  children: ReactNode;
  className?: string;
  axis?: 'x' | 'y';
  /** Resting offset before the slide begins (px). */
  from?: number;
  /** Final offset once the slide has played (px). */
  to?: number;
  offset?: ScrollOffset;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() || (typeof window !== 'undefined' && isLowPowerDevice());
  const { scrollYProgress } = useScroll({ target: ref, offset });

  const value = useTransform(scrollYProgress, [0, 1], [from, to], { clamp: true });
  const style = axis === 'x' ? { x: value } : { y: value };

  return (
    <div ref={ref} className={`relative ${className}`} data-scroll-slide={axis}>
      <motion.div data-scroll-slide-motion className="h-full" style={reduce ? undefined : style}>
        {children}
      </motion.div>
    </div>
  );
}