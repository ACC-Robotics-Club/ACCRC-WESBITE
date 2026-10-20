'use client';

import { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
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
};

/* Telephoto narrow-FOV camera distance calculation */
function cameraDistance(viewHeight: number, fov: number) {
  return (0.5 * viewHeight) / Math.tan(0.5 * THREE.MathUtils.degToRad(fov));
}

function MindRoboticsHand() {
  const groupRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const normalizedPointer = useRef({ x: 0, y: 0 });
  // Cached once (media queries are not cheap enough to run per render frame).
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = mq.matches;
    };
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

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

    const handlePointer = (e: MouseEvent) => {
      normalizedPointer.current.x = (e.clientX - halfW) / halfW;
      normalizedPointer.current.y = (e.clientY - halfH) / halfH;
    };

    const handleResize = () => {
      halfW = 0.5 * window.innerWidth;
      halfH = 0.5 * window.innerHeight;
    };

    window.addEventListener('mousemove', handlePointer, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clone scene and apply pristine cel/toon shaders with terracotta & warm ivory materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const origMat = mesh.material as THREE.MeshStandardMaterial;
        let baseColor = THEME_WHITE.clone();
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

  useFrame((state, delta) => {
    const r = groupRef.current;
    const s = orientRef.current;
    if (!r || !s) return;

    const speed = reducedMotionRef.current ? 0 : 1;

    // Viewport calculations matching Mind Robotics
    const a = 0.5 * CONFIG.viewHeight;
    const c = (a * state.size.width) / state.size.height;
    const [d, p] = CONFIG.offset;

    // Anchor r directly to the TOP RIGHT of the screen viewport
    r.position.set(c, a, 0);

    // Position s relative to top right: moves wrist right to the top edge and angles down-left around title
    s.position.set(d - c, p - a, 0);
    s.rotation.set(CONFIG.pose.x, CONFIG.pose.y, CONFIG.pose.z);

    clonedScene.rotation.y = CONFIG.pose.flip;

    // Pointer parallax rotation with smooth damping
    const targetY = normalizedPointer.current.x * CONFIG.pointer.yaw * speed;
    const targetX = normalizedPointer.current.y * CONFIG.pointer.pitch * speed;

    r.rotation.y = THREE.MathUtils.damp(r.rotation.y, targetY, CONFIG.pointer.ease, delta);
    r.rotation.x = THREE.MathUtils.damp(r.rotation.x, targetX, CONFIG.pointer.ease, delta);
  });

  return (
    <group ref={groupRef}>
      <group ref={orientRef}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

useGLTF.preload(CONFIG.url);

export default function RobotScene({ paused = false }: { paused?: boolean }) {
  const dist = cameraDistance(CONFIG.viewHeight, 10);
  /* Lower render resolution on small viewports: the hand occupies roughly the
     same fraction of the screen everywhere, so a phone needs fewer pixels to
     look identical. Capping DPR is the single biggest GPU saving. */
  const [dprCap, setDprCap] = useState(1.5);
  useEffect(() => {
    const small = Math.min(window.innerWidth, window.innerHeight) < 640;
    setDprCap(small ? 1 : 1.5);
  }, []);

  return (
    <Canvas
      /* 'never' fully stops the WebGL frame loop: the GPU sits idle instead of
         rendering a hand that is covered by the opaque content sheet. */
      frameloop={paused ? 'never' : 'always'}
      dpr={[1, dprCap]}
      /* This scene is stylised flat shading — MSAA adds little and costs a
         lot on integrated/mobile GPUs. */
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
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

      <Suspense fallback={null}>
        <MindRoboticsHand />
      </Suspense>
    </Canvas>
  );
}
