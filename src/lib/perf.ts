'use client';

import { useEffect, useState } from 'react';

type NavigatorPerf = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let cached: boolean | null = null;

/**
 * Heuristic for devices that cannot keep up with heavy continuous animation
 * (small screens, few cores, low device memory, save-data or users who prefer
 * reduced motion). Use it for the *scroll-driven* decorative layers, which per
 * user request stay enabled even on phones.
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (cached !== null) return cached;
  const nav = window.navigator as NavigatorPerf;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 500;
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const fewCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
  const saveData = nav.connection?.saveData === true;
  cached = reducedMotion || smallViewport || lowMemory || fewCores || saveData;
  return cached;
}

/**
 * Should the WebGL hero hand render? Now YES on phones too (user request):
 * only outright incapable situations skip it — reduced-motion preference or
 * missing WebGL support. Checks WebGL support live instead of parsing UA.
 */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/** Should scroll-driven FX be disabled? Wraps isLowPowerDevice. */
export function shouldDisableScrollFx(): boolean {
  return isLowPowerDevice();
}

/** Server-safe: false during SSR/static render and the first hydration frame,
 * so markup matches the server; heavy layers unmount shortly after mount
 * on weak devices instead of causing hydration mismatches. */
export function useLowPower(): boolean {
  const [lowPower, setLowPower] = useState(false);
  useEffect(() => {
    setLowPower(isLowPowerDevice());
  }, []);
  return lowPower;
}

/** Server-safe WebGL support probe: false while SSR'd, real value after mount. */
export function useWebGL(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(hasWebGL());
  }, []);
  return supported;
}
