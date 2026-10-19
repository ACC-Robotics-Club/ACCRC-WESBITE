'use client';

import { motion } from 'framer-motion';

/**
 * SVG wordmark with an animated stroke-draw reveal, inspired by the
 * "MIND ROBOTICS" wordmark on mindrobotics.com. Each letter's outline is
 * hand-drawn in one after the other and stays as an outline.
 *
 * There is deliberately no filled-glyph layer on top: the solid letters read
 * as a doubled, misregistered overlay sitting in front of the drawn strokes,
 * so only the stroke animation is kept.
 */
export function StrokeRevealText({
  text = 'ACCRC',
  className = '',
  strokeColor = 'var(--color-accent)',
  delay = 0.3,
  duration = 1.8,
}: {
  text?: string;
  className?: string;
  strokeColor?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      <svg
        viewBox="0 0 520 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-hidden="true"
      >
        {/* A */}
        <motion.path
          d="M0 80 L32 10 L64 80 M14 55 H50"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, delay, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.01, delay },
          }}
        />

        {/* C */}
        <motion.path
          d="M160 20 C120 8 80 30 80 50 C80 70 110 85 155 78"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.01, delay: delay + 0.15 },
          }}
        />

        {/* C */}
        <motion.path
          d="M250 20 C210 8 170 30 170 50 C170 70 200 85 245 78"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.01, delay: delay + 0.3 },
          }}
        />

        {/* R */}
        <motion.path
          d="M270 80 V10 H310 C330 10 340 22 340 32 C340 44 328 52 310 52 H270 L340 80"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, delay: delay + 0.45, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.01, delay: delay + 0.45 },
          }}
        />

        {/* C */}
        <motion.path
          d="M430 20 C390 8 350 30 350 50 C350 70 380 85 425 78"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, delay: delay + 0.6, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.01, delay: delay + 0.6 },
          }}
        />
      </svg>
    </motion.div>
  );
}
