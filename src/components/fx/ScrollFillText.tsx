'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { track } from './scrollEngine';

/**
 * Large statement whose colour fills in as it scrolls through the viewport —
 * a muted base layer with an accent layer revealed by a clip-path wipe.
 * Scrubbed on desktop; a one-shot wipe on touch screens.
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

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: ['start 0.85', 'start 0.25'] });
  }, []);

  return (
    <p ref={ref} className={`fx-fill relative ${className}`}>
      <span className="block" style={{ color: base }} aria-hidden>
        {children}
      </span>
      <span className="fx-fill__ink absolute inset-0 block" style={{ color: fill }} aria-hidden>
        {children}
      </span>
      <span className="sr-only">{children}</span>
    </p>
  );
}
