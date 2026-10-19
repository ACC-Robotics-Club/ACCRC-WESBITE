'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { track } from './scrollEngine';

type Direction = 'up' | 'down' | 'left' | 'right';

const vectors: Record<Direction, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [1, 0],
  right: [-1, 0],
};

/**
 * Slide-in entrance. Content stays fully opaque the whole way — it travels
 * from an offset into place instead of fading, so sections read as panels
 * sliding over each other rather than dissolving in.
 *
 * Runs as a single CSS transition triggered by the shared observer, so dozens
 * of these cost nothing while scrolling.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  /** Travel distance in px. Defaults to 56px vertically, 64px horizontally. */
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vx, vy] = vectors[direction];
  const travel = distance ?? (vy ? 56 : 64);

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: ['start 1', 'start 0'], reveal: true });
  }, []);

  const style = {
    '--rx': `${vx * travel}px`,
    '--ry': `${vy * travel}px`,
    '--delay': `${delay}s`,
  } as CSSProperties;

  return (
    <div ref={ref} className={`fx-reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
