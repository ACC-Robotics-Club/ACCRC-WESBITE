'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { track, type EdgeOffset } from './scrollEngine';

/**
 * Bottom-to-top scroll slide: content rises from below into its resting place
 * as it is scrolled into view.
 *
 * On desktop the travel is scrubbed by scroll position. The default range is
 * front-loaded (`start 0.9` → `start 0.35`): once the element's top passes 35%
 * of the viewport the value has reached `to` and stays there, so content can
 * never be left parked at an offset further down the page. For a container
 * taller than the viewport, pass a range ending on its `end` so the travel
 * spans the container's own height.
 *
 * On phones and touch screens the same travel plays once, as a CSS transition,
 * when the element enters the viewport (see scrollEngine.ts for why).
 */
export function ScrollSlide({
  children,
  className = '',
  axis = 'y',
  from = 90,
  to = -25,
  offset = ['start 0.9', 'start 0.35'],
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  axis?: 'x' | 'y';
  /** Resting offset before the slide begins (px). */
  from?: number;
  /** Final offset once the slide has played (px). */
  to?: number;
  offset?: EdgeOffset;
  /** Extra delay for the one-shot (touch) entrance, in seconds. */
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [start, end] = offset;

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: [start, end] });
  }, [start, end]);

  const style = {
    '--from': `${from}px`,
    '--to': `${to}px`,
    '--delay': `${delay}s`,
  } as CSSProperties;

  return (
    <Tag ref={ref} className={`fx-slide relative ${className}`} data-axis={axis} style={style}>
      <div className="fx-slide__inner h-full">{children}</div>
    </Tag>
  );
}
