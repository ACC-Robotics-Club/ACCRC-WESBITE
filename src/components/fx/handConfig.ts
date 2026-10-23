/**
 * The hero hand's pose and framing, shared by the worker renderer
 * (hand.worker.ts) and the main-thread fallback (RobotSceneR3F.tsx).
 */
export const HAND_CONFIG = {
  url: '/models/hand.glb',
  viewHeight: 0.8,
  shading: {
    light: { x: 1, y: -1, z: 0.53 },
  },
  offset: [0.415, 0.44] as [number, number],
  pose: {
    flip: 0.51,
    x: -0.22,
    y: -0.12,
    z: -0.81,
  },
  pointer: {
    yaw: 0.215,
    pitch: 0.475,
    ease: 4,
  },
  /* On portrait screens the hand is sized against the (tall) view height, so
     it would swamp the copy. Below this aspect ratio it shrinks toward its
     top-right anchor instead. */
  compactAspect: 1.25,
  minScale: 0.52,
};

/** Telephoto narrow-FOV camera distance for a given view height. */
export function cameraDistance(viewHeight: number, fov: number) {
  return (0.5 * viewHeight) / Math.tan(0.5 * ((fov * Math.PI) / 180));
}

/**
 * Start with a still hand only when it's certain to struggle: very little
 * memory, or the visitor asked to save data. Core counts are not used: iPhones
 * and many fast Androids report few cores, which wrongly froze the hand.
 * Every other device starts animated and is judged on its real frame rate.
 */
export function startStill() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData === true;
}
