'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { track } from './scrollEngine';

/**
 * Layered "fan" tag — a pill badge that reveals through multiple colored layers
 * in sequence, inspired by Mind Robotics' heading tags. Each layer slides in
 * with a cascading delay, creating a rich, textured reveal.
 *
 * CSS transitions triggered by the shared scroll engine; the layers sit in
 * place until the engine registers the tag, so it is never hidden without
 * JavaScript.
 */
export function FanTag({
  children,
  layers = ['#1C1917', '#C8432C', '#FF7A59'],
  textColor = 'white',
  bgColor = '#C8432C',
  className = '',
  delay = 0,
  size = 'md',
}: {
  children: ReactNode;
  layers?: string[];
  textColor?: string;
  bgColor?: string;
  className?: string;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current, { offset: ['start 1', 'start 0'], reveal: true });
  }, []);

  const sizeClasses = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-10 px-5 text-base',
    // em-based so the pill scales with the heading font it sits inside
    // (text = ½ the heading size, pill ≈ 1.15× the heading line).
    lg: 'h-[2.3em] px-[0.85em] text-[0.5em] leading-none',
  };

  const layerStyle = (color: string, i: number) =>
    ({ backgroundColor: color, '--layer-delay': `${delay + i * 0.08}s` }) as CSSProperties;

  return (
    <span
      ref={ref}
      className={`fx-fan relative inline-flex items-center overflow-hidden rounded-full font-display font-black ${sizeClasses[size]} ${className}`}
    >
      {/* Base (grey) background */}
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: 'var(--color-tertiary)' }} aria-hidden="true" />

      {/* Cascading colour layers */}
      {layers.map((color, i) => (
        <span key={i} className="fx-fan__layer absolute inset-0 rounded-full" style={layerStyle(color, i)} aria-hidden="true" />
      ))}

      {/* Final layer with text */}
      <span
        className="fx-fan__layer absolute inset-0 flex items-center justify-center rounded-full"
        style={{ ...layerStyle(bgColor, layers.length), color: textColor }}
        aria-hidden="true"
      >
        <span className="whitespace-nowrap tracking-tight">{children}</span>
      </span>

      {/* Invisible copy for layout sizing */}
      <span className="relative whitespace-nowrap tracking-tight opacity-0" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
