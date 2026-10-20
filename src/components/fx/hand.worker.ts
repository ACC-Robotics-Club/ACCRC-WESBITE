/// <reference lib="webworker" />
/**
 * Draws the hero's 3D hand entirely off the main thread, on an OffscreenCanvas.
 *
 * Drawn from the page, every hand frame also made the browser run a full page
 * update (style, pre-paint, layer commit) on the main thread: on a mid-range
 * phone that kept the main thread ~85% busy while the hero was on screen, so
 * scrolling and taps had to queue behind it. From a worker, finished frames go
 * straight to the compositor and the main thread only sends size, pointer and
 * play/pause messages.
 *
 * Same scene, pose, materials and motion as RobotSceneR3F.tsx (the fallback for
 * browsers without WebGL in workers); keep the two in step.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { HAND_CONFIG as CONFIG, cameraDistance } from './handConfig';

type Message =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      dpr: number;
      maxDpr: number;
      reduced: boolean;
      finePointer: boolean;
      still: boolean;
      modelUrl: string;
    }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'run'; on: boolean };

export type HandWorkerReply = { type: 'unsupported' } | { type: 'ready' } | { type: 'mode'; mode: Mode };

type Mode = 'full' | 'half' | 'still';

const THEME_WHITE = new THREE.Color('#eae6dd');

let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.PerspectiveCamera;
const scene = new THREE.Scene();
const root = new THREE.Group(); // anchored top-right; pointer rotation
const orient = new THREE.Group(); // fixed pose
root.add(orient);
root.visible = false;
scene.add(root);

let mixer: THREE.AnimationMixer | null = null;
let size = { width: 1, height: 1 };
let dpr = 1;
let env = { reduced: false, finePointer: false };
let mode: Mode = 'full';
let running = true;
let ready = false;
const pointer = { x: 0, y: 0 };
const clock = new THREE.Clock(false);
let elapsed = 0;

const post = (reply: HandWorkerReply) => (self as DedicatedWorkerGlobalScope).postMessage(reply);

/* rAF exists in dedicated workers that own an OffscreenCanvas (Chrome, Firefox,
   Safari 16.4+); a timer is the fallback. */
const raf: (cb: () => void) => number =
  typeof self.requestAnimationFrame === 'function'
    ? (cb) => self.requestAnimationFrame(cb)
    : (cb) => self.setTimeout(cb, 1000 / 60) as unknown as number;
const caf: (id: number) => void =
  typeof self.cancelAnimationFrame === 'function' ? (id) => self.cancelAnimationFrame(id) : (id) => self.clearTimeout(id);

function applySize() {
  if (!renderer) return;
  renderer.setPixelRatio(dpr);
  renderer.setSize(size.width, size.height, false);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
}

function toonify(model: THREE.Object3D) {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const origMat = mesh.material as THREE.MeshStandardMaterial;
    let baseColor = THEME_WHITE.clone();
    // An emissive floor in each part's own hue keeps shadowed faces light.
    let emissiveColor = THEME_WHITE.clone().multiplyScalar(0.55);
    let emissiveIntensity = 1;
    if (origMat) {
      const matName = (origMat.name || '').toLowerCase();
      if (matName.includes('blue') || matName.includes('teal')) {
        baseColor = new THREE.Color(0xc8432c);
        emissiveColor = baseColor.clone().multiplyScalar(0.55);
      } else if (matName.includes('red') || matName.includes('coral')) {
        baseColor = new THREE.Color(0xff7a59);
        emissiveColor = baseColor.clone().multiplyScalar(0.55);
      } else if (origMat.color) {
        const hsl = { h: 0, s: 0, l: 0 };
        origMat.color.getHSL(hsl);
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
  });
}

/** Per-frame pose: anchor, responsive scale, pointer / idle sway. */
function update(delta: number) {
  const speed = env.reduced || mode === 'still' ? 0 : 1;
  const a = 0.5 * CONFIG.viewHeight;
  const aspect = size.width / size.height;
  const c = a * aspect;
  const [d, p] = CONFIG.offset;
  root.position.set(c, a, 0);
  root.scale.setScalar(Math.min(1, Math.max(CONFIG.minScale, aspect / CONFIG.compactAspect)));
  orient.position.set(d - c, p - a, 0);

  let px = pointer.x;
  let py = pointer.y;
  if (!env.finePointer) {
    px = Math.sin(elapsed * 0.45) * 0.55;
    py = Math.sin(elapsed * 0.9) * 0.3;
  }
  root.rotation.y = THREE.MathUtils.damp(root.rotation.y, px * CONFIG.pointer.yaw * speed, CONFIG.pointer.ease, delta);
  root.rotation.x = THREE.MathUtils.damp(root.rotation.x, py * CONFIG.pointer.pitch * speed, CONFIG.pointer.ease, delta);
  if (mixer && mode !== 'still') mixer.update(delta);
}

/* ── Frame loop with adaptive quality ───────────────────────────────────────
   full: every display frame. If a sustained stretch averages under 30fps,
   drop to 1x pixels, then to drawing 30 times a second (half). If even that
   averages under 12fps, show a still hand. Steps never go back up on their
   own: each change can cause a visible hitch. Judging starts after 4s, once
   loading has settled. */
let frameId = 0;
let lastDraw = 0;
const JUDGE_AFTER_MS = 4000;
const WINDOW_MS = 2500;
let startedAt = 0;
let windowStart = 0;
let windowFrames = 0;

function setMode(next: Mode) {
  mode = next;
  windowStart = 0;
  windowFrames = 0;
  post({ type: 'mode', mode });
}

function judge(now: number) {
  if (now - startedAt < JUDGE_AFTER_MS || mode === 'still') return;
  if (!windowStart) {
    windowStart = now;
    windowFrames = 0;
    return;
  }
  windowFrames++;
  const span = now - windowStart;
  if (span < WINDOW_MS) return;
  const fps = (windowFrames * 1000) / span;
  windowStart = now;
  windowFrames = 0;
  if (mode === 'full' && fps < 30) {
    if (dpr > 1) {
      dpr = 1;
      applySize();
    } else {
      setMode('half');
    }
  } else if (mode === 'half' && fps < 12) {
    setMode('still');
  }
}

function frame() {
  frameId = 0;
  if (!running || !renderer) return;
  const now = performance.now();
  if (mode === 'half' && now - lastDraw < 1000 / 30 - 2) {
    frameId = raf(frame);
    return;
  }
  lastDraw = now;
  const delta = Math.min(clock.getDelta(), 0.1);
  elapsed += delta;
  update(delta);
  renderer.render(scene, camera);
  judge(now);
  // A still hand renders once more (layout settles) and then stops.
  if (mode !== 'still') frameId = raf(frame);
}

function start() {
  if (frameId || !running || !ready) return;
  clock.start();
  clock.getDelta();
  windowStart = 0;
  frameId = raf(frame);
  if (mode === 'still') raf(() => renderer?.render(scene, camera));
}

function stop() {
  if (frameId) caf(frameId);
  frameId = 0;
  clock.stop();
}

async function init(msg: Extract<Message, { type: 'init' }>) {
  env = { reduced: msg.reduced, finePointer: msg.finePointer };
  size = { width: Math.max(1, msg.width), height: Math.max(1, msg.height) };
  dpr = Math.min(msg.dpr, msg.maxDpr);
  mode = msg.still ? 'still' : 'full';

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: msg.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch {
    post({ type: 'unsupported' });
    return;
  }
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  camera = new THREE.PerspectiveCamera(10, size.width / size.height, 1, 20);
  camera.position.set(0, 0, cameraDistance(CONFIG.viewHeight, 10));
  applySize();

  // Kept dim on purpose: the emissive tint supplies the base brightness.
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const key = new THREE.DirectionalLight(0xffffff, 0.18);
  key.position.set(CONFIG.shading.light.x, CONFIG.shading.light.y, CONFIG.shading.light.z);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.05);
  fill.position.set(-2, 3, 2);
  scene.add(fill);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(msg.modelUrl);
  const model = gltf.scene;
  toonify(model);
  model.rotation.y = CONFIG.pose.flip;
  orient.rotation.set(CONFIG.pose.x, CONFIG.pose.y, CONFIG.pose.z);
  orient.add(model);
  if (gltf.animations[0]) {
    mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(gltf.animations[0]).reset().play();
  }

  // Compile shaders before the first frame so the hand appears without a hitch.
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  root.visible = true;
  ready = true;
  startedAt = performance.now();
  post({ type: 'ready' });
  start();
}

self.onmessage = (event: MessageEvent<Message>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    void init(msg).catch((error) => {
      console.error('3D hand failed to load.', error);
      post({ type: 'unsupported' });
    });
    return;
  }
  if (msg.type === 'resize') {
    size = { width: Math.max(1, msg.width), height: Math.max(1, msg.height) };
    // Never climb back above a lowered pixel ratio.
    dpr = Math.min(dpr, msg.dpr);
    applySize();
    if (mode === 'still' && ready && running) renderer?.render(scene, camera);
  } else if (msg.type === 'pointer') {
    pointer.x = msg.x;
    pointer.y = msg.y;
  } else if (msg.type === 'run') {
    running = msg.on;
    if (running) start();
    else stop();
  }
};
