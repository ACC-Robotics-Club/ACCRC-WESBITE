'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { track } from './scrollEngine';

/**
 * Editorial line-by-line reveal. Pass each visual line of the heading; every
 * line rises out of an overflow mask in a staggered sequence.
 *
 * Pure CSS: below the fold the shared scroll engine flips it on when the
 * heading enters the viewport (a transition per line); with `intro` it plays
 * as a keyframe animation from first paint, for headings already on screen at
 * load. Either way it runs on the compositor, not in JavaScript.
 */
export function SplitReveal({
  lines,
  className = '',
  lineClassName = '',
  delay = 0,
  stagger = 0.12,
  intro = false,
  as: Tag = 'h2',
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Animate immediately on load instead of when scrolled into view. */
  intro?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (intro || !ref.current) return;
    return track(ref.current, { offset: ['start 1', 'start 0'], reveal: true });
  }, [intro]);

  const style = { '--split-delay': `${delay}s`, '--split-stagger': `${stagger}s` } as CSSProperties;

  return (
    <Tag ref={ref} className={`fx-split ${intro ? 'fx-split--intro' : ''} ${className}`} style={style}>
      {lines.map((line, i) => (
        <span className="split-line-mask" key={i}>
          <span className={`fx-split__line block ${lineClassName}`} style={{ '--i': i } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
