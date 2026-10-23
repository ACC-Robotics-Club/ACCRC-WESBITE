'use client';

import { useRef, type ReactNode } from 'react';

/**
 * CSS-3D tilt card. Rotates in perspective toward the cursor and slides a
 * teal glare across itself. Pure transforms — cheap on low-end devices.
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 7,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxTilt}deg) rotateY(${(px - 0.5) * maxTilt}deg) translateY(-3px)`;
    el.style.setProperty('--shine-x', `${px * 100}%`);
    el.style.setProperty('--shine-y', `${py * 100}%`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
  };

  return (
    <div
      ref={ref}
      className={`tilt-card relative ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div className="tilt-shine" aria-hidden="true" />
      {children}
    </div>
  );
}
