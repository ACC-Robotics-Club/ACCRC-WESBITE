'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { track } from './scrollEngine';

/**
 * Scroll-linked parallax. Drifts the content against the page as it passes
 * through the viewport. `speed` is the drift in percent of the element's own
 * height. Purely decorative, so on touch screens it simply holds still.
 */
export function Parallax({
  children,
  className = '',
  speed = 12,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Drift distance in percent (positive = down, negative = up). */
  speed?: number;
  'aria-hidden'?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: ['start end', 'end start'], pinAt: 0.5 });
  }, []);

  return (
    <div
      ref={ref}
      /* Only default to `relative` when the caller hasn't positioned it —
         `relative` alongside `absolute` won the cascade and dropped decorative
         layers into the layout flow. */
      className={`fx-parallax ${/\b(absolute|fixed|sticky)\b/.test(className) ? '' : 'relative'} ${className}`}
      style={{ '--speed': `${speed}%` } as CSSProperties}
      aria-hidden={rest['aria-hidden']}
    >
      <div className="fx-parallax__inner">{children}</div>
    </div>
  );
}
