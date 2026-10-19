'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { track } from './scrollEngine';

/**
 * Soft entrance for cards and panels: rises a short distance, fades and
 * settles from a hair below full size. It plays once, as a CSS transition on
 * transform and opacity only, so it runs on the compositor and stays smooth on
 * phones. Siblings that enter together cascade automatically (`stagger`).
 *
 * The hidden state is applied only after the engine has registered the
 * element, so content is never invisible before JavaScript runs.
 */
export function RiseIn({
  children,
  className = '',
  distance = 36,
  stagger = true,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Travel in px. */
  distance?: number;
  /** Cascade with siblings that enter the viewport in the same frame. */
  stagger?: boolean;
  as?: ElementType;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: ['start 1', 'start 0'], reveal: true });
  }, []);

  return (
    <Tag
      ref={ref}
      className={`fx-rise ${className}`}
      style={{ '--ry': `${distance}px` } as CSSProperties}
      data-stagger={stagger ? '' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
