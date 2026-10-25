'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Layered "fan" tag — a pill badge that reveals through multiple colored layers
 * in sequence, inspired by Mind Robotics' heading tags. Each layer slides in
 * with a cascading delay, creating a rich, textured reveal.
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
  const sizeClasses = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-10 px-5 text-base',
    // em-based so the pill scales with the heading font it sits inside
    // (text = ½ the heading size, pill ≈ 1.15× the heading line).
    lg: 'h-[2.3em] px-[0.85em] text-[0.5em] leading-none',
  };

  return (
    <motion.span
      className={`relative inline-flex items-center overflow-hidden rounded-full font-display font-black ${sizeClasses[size]} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5, margin: '0px 0px -5% 0px' }}
    >
      {/* Base (grey) background */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: 'var(--color-tertiary)' }}
        aria-hidden="true"
      />

      {/* Cascading colour layers */}
      {layers.map((color, i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
          variants={{
            hidden: { x: '-100%' },
            visible: {
              x: '0%',
              transition: {
                duration: 0.6,
                delay: delay + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        />
      ))}

      {/* Final layer with text */}
      <motion.span
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor, color: textColor }}
        aria-hidden="true"
        variants={{
          hidden: { x: '-100%' },
          visible: {
            x: '0%',
            transition: {
              duration: 0.6,
              delay: delay + layers.length * 0.08,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      >
        <span className="whitespace-nowrap tracking-tight">{children}</span>
      </motion.span>

      {/* Visible but invisible text for layout sizing */}
      <span className="relative whitespace-nowrap tracking-tight opacity-0" aria-hidden="true">
        {children}
      </span>
    </motion.span>
  );
}
