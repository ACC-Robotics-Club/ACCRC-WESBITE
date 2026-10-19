'use client';

import { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

// Warm ivory paper-matched light tone for the 3D hand
const THEME_WHITE = new THREE.Color('#eae6dd');

// Exact Mind Robotics configuration & viewport mapping
const CONFIG = {
  url: '/models/hand.glb',
  viewHeight: 0.8,
  shading: {
    light: { x: 1, y: -1, z: 0.53 },
  },
  offset: [0.415, 0.44],
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

/* Telephoto narrow-FOV camera distance calculation */
function cameraDistance(viewHeight: number, fov: number) {
  return (0.5 * viewHeight) / Math.tan(0.5 * THREE.MathUtils.degToRad(fov));
}

function MindRoboticsHand() {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, camera, invalidate } = useThree();
  /* Compiling the toon shaders inside the first frame blocked the main thread
     for ~80ms on a mid-range phone — a visible hitch right as the hand
     appeared. compileAsync lets the GPU driver compile in parallel (where
     KHR_parallel_shader_compile exists) and the hand is shown once done. */
  const [compiled, setCompiled] = useState(false);
  const orientRef = useRef<THREE.Group>(null);
  const normalizedPointer = useRef({ x: 0, y: 0 });
  /* Read once rather than calling matchMedia every frame. */
  const env = useMemo(
    () => ({
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      finePointer: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    }),
    [],
  );

  // Load exact model and animation
  const { scene, animations } = useGLTF(CONFIG.url);
  const { actions } = useAnimations(animations, groupRef);

  // Auto-play default hand animation
  useEffect(() => {
    const actionList = Object.values(actions);
    if (actionList.length > 0 && actionList[0]) {
      const active = actionList[0];
      active.reset().play();
    }
  }, [actions]);

  // Window pointer tracking
  useEffect(() => {
    let halfW = 0.5 * window.innerWidth;
    let halfH = 0.5 * window.innerHeight;

    const handlePointer = (e: PointerEvent) => {
      normalizedPointer.current.x = (e.clientX - halfW) / halfW;
      normalizedPointer.current.y = (e.clientY - halfH) / halfH;
    };

    const handleResize = () => {
      halfW = 0.5 * window.innerWidth;
      halfH = 0.5 * window.innerHeight;
    };

    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clone scene and apply pristine cel/toon shaders with terracotta & warm ivory materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        const origMat = mesh.material as THREE.MeshStandardMaterial;
        let baseColor = THEME_WHITE.clone();
        // Every recoloured part carries an emissive floor in its OWN hue. That
        // lifts shadowed faces well clear of the light budget, so the white
        // stays light and blue and the accents stay vivid instead of being
        // crushed to near-black by the dim lights.
        let emissiveColor = THEME_WHITE.clone().multiplyScalar(0.55);
        let emissiveIntensity = 1;

        if (origMat) {
          const matName = (origMat.name || '').toLowerCase();
          if (matName.includes('blue') || matName.includes('teal')) {
            baseColor = new THREE.Color(0xc8432c); // Signature Terracotta accent
            emissiveColor = baseColor.clone().multiplyScalar(0.55);
          } else if (matName.includes('red') || matName.includes('coral')) {
            baseColor = new THREE.Color(0xff7a59); // Warm Ember Coral accent
            emissiveColor = baseColor.clone().multiplyScalar(0.55);
          } else if (origMat.color) {
            const hsl = { h: 0, s: 0, l: 0 };
            origMat.color.getHSL(hsl);
            // Only recolor near-white parts; keep darker model colors (joints,
            // creases) so the hand keeps its definition.
            if (hsl.l > 0.75) {
              baseColor = THEME_WHITE.clone();
            } else {
              baseColor = origMat.color.clone();
              emissiveIntensity = 0;
            }
          }
        }

        mesh.material = new THREE.MeshToonMaterial({
          color: baseColor,
          emissive: emissiveColor,
          emissiveIntensity,
          side: THREE.DoubleSide,
        });
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setCompiled(true);
    };
    if (typeof gl.compileAsync === 'function') {
      gl.compileAsync(clonedScene, camera).then(done, done);
    } else {
      done();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, camera, clonedScene]);

  /* On-demand canvases (the low-end still frame) need a frame once shown. */
  useEffect(() => {
    if (compiled) invalidate();
  }, [compiled, invalidate]);

  useFrame((state, delta) => {
    const r = groupRef.current;
    const s = orientRef.current;
    if (!r || !s) return;

    const speed = env.reduced ? 0 : 1;

    // Viewport calculations matching Mind Robotics
    const a = 0.5 * CONFIG.viewHeight;
    const aspect = state.size.width / state.size.height;
    const c = a * aspect;
    const [d, p] = CONFIG.offset;

    // Anchor r directly to the TOP RIGHT of the screen viewport
    r.position.set(c, a, 0);
    r.scale.setScalar(
      Math.min(1, Math.max(CONFIG.minScale, aspect / CONFIG.compactAspect)),
    );

    // Position s relative to top right: moves wrist right to the top edge and angles down-left around title
    s.position.set(d - c, p - a, 0);
    s.rotation.set(CONFIG.pose.x, CONFIG.pose.y, CONFIG.pose.z);

    clonedScene.rotation.y = CONFIG.pose.flip;

    /* Pointer parallax rotation with smooth damping. Touch screens have no
       hovering pointer, so the hand idles in a slow figure-eight instead. */
    let px = normalizedPointer.current.x;
    let py = normalizedPointer.current.y;
    if (!env.finePointer) {
      const t = state.clock.elapsedTime;
      px = Math.sin(t * 0.45) * 0.55;
      py = Math.sin(t * 0.9) * 0.3;
    }
    const targetY = px * CONFIG.pointer.yaw * speed;
    const targetX = py * CONFIG.pointer.pitch * speed;

    r.rotation.y = THREE.MathUtils.damp(r.rotation.y, targetY, CONFIG.pointer.ease, delta);
    r.rotation.x = THREE.MathUtils.damp(r.rotation.x, targetX, CONFIG.pointer.ease, delta);
  });

  return (
    <group ref={groupRef} visible={compiled}>
      <group ref={orientRef}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

useGLTF.preload(CONFIG.url);

/**
 * Low-end phones get one still frame of the hand instead of an animation: it
 * renders a couple of frames once the model is in, then the GPU and main
 * thread are left completely free. Mounted inside the same Suspense boundary
 * as the hand, so it runs only after the model has loaded.
 */
function StillFrame() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      invalidate();
      second = requestAnimationFrame(() => invalidate());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [invalidate]);
  return null;
}

/** Few cores or little memory on a touch device: a budget phone. */
function isLowEndPhone(coarse: boolean) {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory ?? 8;
  return coarse && (cores <= 4 || memory <= 3);
}

export default function RobotScene({ paused = false }: { paused?: boolean }) {
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const lowEnd = useMemo(() => isLowEndPhone(coarse), [coarse]);
  const dist = cameraDistance(CONFIG.viewHeight, 10);
  /* Phones get a lower pixel-ratio ceiling: the hand is soft cel-shading, so
     the difference is invisible, but the fill-rate saving is large. */
  /* Never above the screen's own density: a fixed dpr does not clamp. */
  const maxDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  /* If a device cannot hold a steady frame rate, drop to 1x pixels (and back
     up when it recovers) rather than skipping frames. */
  const [dpr, setDpr] = useState(maxDpr);

  return (
    <Canvas
      dpr={dpr}
      /* Stop rendering entirely while the hero is covered by the page. */
      /* Every device that animates renders every display frame, so the hand
         moves as smoothly as the page scrolls. Low-end phones render one
         still frame on demand. Nothing renders while the hero is covered. */
      frameloop={paused ? 'never' : lowEnd ? 'demand' : 'always'}
      /* By default the canvas re-measures itself on every scroll stop using
         getBoundingClientRect, which includes the hero's scroll-driven scale.
         So every scroll "resized" it and reallocated the WebGL buffer — a
         ~175ms freeze on a low-end phone. Measure layout size only, and only
         on real resizes. */
      resize={{ scroll: false, offsetSize: true, debounce: { scroll: 0, resize: 150 } }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      flat /* NoToneMapping — stops ACES from desaturating the blue tint to grey */
      camera={{
        fov: 10,
        near: 1,
        far: 20,
        position: [0, 0, dist],
      }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      {/* Kept dim on purpose: the emissive tint already supplies the base
          brightness, so total irradiance stays under 1 and lit faces keep the
          blue tint instead of clipping to white. */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[CONFIG.shading.light.x, CONFIG.shading.light.y, CONFIG.shading.light.z]} intensity={0.18} />
      <directionalLight position={[-2, 3, 2]} intensity={0.05} />

      {!lowEnd && (
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(maxDpr)}
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
      )}
      <Suspense fallback={null}>
        <MindRoboticsHand />
        {lowEnd && <StillFrame />}
      </Suspense>
    </Canvas>
  );
}
