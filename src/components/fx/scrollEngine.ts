/**
 * One shared driver for every scroll effect on the page.
 *
 * Each ScrollSlide / Parallax / Reveal used to own a framer-motion `useScroll`
 * subscription — around eighty of them on the home page, each measuring its
 * own target every frame and pushing a JS-driven transform. That is what made
 * scrolling stutter on phones.
 *
 * Here there is a single passive scroll listener and a single rAF. An
 * IntersectionObserver keeps track of which elements are actually near the
 * viewport, and only those are measured (all reads first, then all writes, so
 * there is no layout thrashing). Each element just receives a `--p` progress
 * value; the transform itself is computed in CSS from that.
 *
 * On touch devices and narrow screens the scroll-linked mode is replaced by a
 * one-shot reveal: when the element enters the viewport `--p` jumps to 1 and
 * a CSS transition carries it there on the compositor. Phones scroll on a
 * separate thread, and main-thread scroll-linked transforms always trail the
 * finger a frame behind — a one-shot transition does not.
 */

export type EdgeOffset = [string, string];

type Mode = 'scrub' | 'reveal' | 'pin';

type Entry = {
  el: HTMLElement;
  /** Always a one-shot entrance, even where scrubbing is allowed. */
  once: boolean;
  /** Where scrubbing is not allowed: pin `--p` here instead of revealing. */
  pinAt: number | null;
  /** [element edge (0 = top, 1 = bottom), viewport fraction] for p = 0 and p = 1. */
  start: [number, number];
  end: [number, number];
  mode: Mode | null;
  active: boolean;
  revealed: boolean;
  last: number;
};

const entries = new Map<HTMLElement, Entry>();
let observer: IntersectionObserver | null = null;
let revealObserver: IntersectionObserver | null = null;
let scrubQuery: MediaQueryList | null = null;
let reducedQuery: MediaQueryList | null = null;
let rafId = 0;
let listening = false;

/* Reveal zones. Chrome re-checks every observed element on every rendered
   frame, and with ~100 pending reveals that was a steady cost on phones while
   the 3D hand animates. So pending reveals are grouped by their section, and
   only sections within ~1.5 screens have their elements observed. */
let zoneObserver: IntersectionObserver | null = null;
const zones = new Map<Element, Set<HTMLElement>>();
const zoneOf = new WeakMap<HTMLElement, Element>();
const activeZones = new Set<Element>();

function watchReveal(el: HTMLElement) {
  const zone = el.closest('section, footer');
  if (!zone || !zoneObserver) {
    revealObserver?.observe(el);
    return;
  }
  zoneOf.set(el, zone);
  let members = zones.get(zone);
  if (!members) {
    members = new Set();
    zones.set(zone, members);
    zoneObserver.observe(zone);
  }
  members.add(el);
  if (activeZones.has(zone)) revealObserver?.observe(el);
}

function unwatchReveal(el: HTMLElement) {
  revealObserver?.unobserve(el);
  const zone = zoneOf.get(el);
  if (!zone) return;
  const members = zones.get(zone);
  members?.delete(el);
  if (members && members.size === 0) {
    zones.delete(zone);
    activeZones.delete(zone);
    zoneObserver?.unobserve(zone);
  }
}

const EDGE: Record<string, number> = { start: 0, center: 0.5, end: 1 };

function parsePoint(value: string): [number, number] {
  const [edge = 'start', at = '1'] = value.trim().split(/\s+/);
  const viewport = at in EDGE ? EDGE[at] : Number.parseFloat(at);
  return [EDGE[edge] ?? 0, Number.isFinite(viewport) ? viewport : 1];
}

let lastFrame = 0;

function measure(now: number) {
  rafId = 0;
  const vh = window.innerHeight;
  const updates: Array<[Entry, number]> = [];
  let settling = false;

  /* Scrubbed values glide toward their target instead of snapping to it. A
     mouse wheel moves the page ~100px per notch, and snapping makes scroll-
     linked motion visibly step; easing over a few frames reads as smooth. The
     factor is frame-rate independent so 120Hz screens feel the same. */
  const dt = lastFrame ? Math.min(64, now - lastFrame) : 16.67;
  lastFrame = now;
  const ease = 1 - Math.pow(1 - 0.2, dt / 16.67);

  // Reads first…
  entries.forEach((entry) => {
    if (entry.mode !== 'scrub' || !entry.active) return;
    const rect = entry.el.getBoundingClientRect();
    const from = rect.top + rect.height * entry.start[0] - vh * entry.start[1];
    const to = rect.top + rect.height * entry.end[0] - vh * entry.end[1];
    const span = from - to;
    const target = span === 0 ? (from <= 0 ? 1 : 0) : Math.min(1, Math.max(0, from / span));
    // First measurement lands exactly, so nothing animates in from a wrong spot.
    const next = entry.last < 0 ? target : entry.last + (target - entry.last) * ease;
    const settled = Math.abs(target - next) < 0.001;
    const value = settled ? target : next;
    if (!settled) settling = true;
    if (Math.abs(value - entry.last) > 0.0002) updates.push([entry, value]);
  });

  // …then writes.
  for (const [entry, p] of updates) {
    entry.last = p;
    entry.el.style.setProperty('--p', p.toFixed(4));
  }

  if (settling) schedule();
  else lastFrame = 0;
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(measure);
}

/** Puts an entry into the mode the current device and settings call for. */
function apply(entry: Entry) {
  const reduced = reducedQuery?.matches ?? false;
  const scrub = (scrubQuery?.matches ?? false) && !reduced;
  const mode: Mode = reduced
    ? 'pin'
    : entry.once
      ? 'reveal'
      : scrub
        ? 'scrub'
        : entry.pinAt !== null
          ? 'pin'
          : 'reveal';
  if (mode === entry.mode) return;

  const { el } = entry;
  entry.mode = mode;
  entry.active = false;
  entry.last = -1;
  observer?.unobserve(el);
  unwatchReveal(el);
  el.classList.remove('is-scrub', 'is-reveal', 'is-static');

  if (mode === 'pin') {
    el.classList.add('is-static');
    el.style.setProperty('--p', String(entry.pinAt ?? 1));
  } else if (mode === 'reveal') {
    el.classList.add('is-reveal');
    if (entry.revealed) el.style.setProperty('--p', '1');
    else watchReveal(el);
  } else {
    el.classList.add('is-scrub');
    observer?.observe(el);
    // Measure on the next frame so nothing renders at the wrong offset.
    entry.active = true;
    schedule();
  }
}

function ensureListeners() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  /* Re-evaluated live, so resizing a window or rotating a tablet across the
     breakpoint switches every effect over without a reload. */
  scrubQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
  reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reapply = () => entries.forEach(apply);
  scrubQuery.addEventListener('change', reapply);
  reducedQuery.addEventListener('change', reapply);

  observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const entry = entries.get(record.target as HTMLElement);
        if (entry) entry.active = record.isIntersecting;
      }
      schedule();
    },
    // Generous margin so an element is already being tracked before it shows.
    { rootMargin: '50% 0px 50% 0px' },
  );

  zoneObserver = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const zone = record.target;
        const members = zones.get(zone);
        if (record.isIntersecting) {
          activeZones.add(zone);
          members?.forEach((el) => revealObserver?.observe(el));
        } else {
          activeZones.delete(zone);
          members?.forEach((el) => revealObserver?.unobserve(el));
        }
      }
    },
    { rootMargin: '150% 0px 150% 0px' },
  );

  /* The root is stretched far upward, so "intersecting" means "at or above
     the reveal line". An element the reader has jumped past (anchor link,
     reload part-way down) therefore reveals too — instantly, since it is off
     screen — instead of sitting invisible until they scroll back up. */
  revealObserver = new IntersectionObserver(
    (records) => {
      /* Elements that enter in the same batch (a row of cards, a grid that
         just mounted) cascade one after another instead of popping at once.
         Opt-in via `data-stagger`; the step is capped so a long batch never
         keeps the last card waiting. */
      let k = 0;
      const ordered = records
        .filter((record) => record.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      for (const record of ordered) {
        const el = record.target as HTMLElement;
        const entry = entries.get(el);
        if (entry) entry.revealed = true;
        const offScreenAbove = record.boundingClientRect.bottom <= 0;
        if (offScreenAbove) {
          el.style.setProperty('--delay', '0s');
        } else if (el.dataset.stagger !== undefined) {
          el.style.setProperty('--delay', `${Math.min(k, 6) * 0.07}s`);
          k++;
        }
        el.style.setProperty('--p', '1');
        unwatchReveal(el);
      }
    },
    { rootMargin: '100000px 0px -8% 0px', threshold: 0 },
  );
}

/**
 * Registers an element and returns its cleanup. Where scrubbing is not
 * allowed (touch, narrow, reduced motion) the effect plays as a one-shot
 * entrance instead — or, when `pinAt` is given, simply holds `--p` at that
 * value (parallax holds still on phones). `reveal` forces the one-shot
 * entrance everywhere.
 */
export function track(
  el: HTMLElement,
  {
    offset,
    reveal = false,
    pinAt = null,
  }: { offset: EdgeOffset; reveal?: boolean; pinAt?: number | null },
) {
  ensureListeners();

  const entry: Entry = {
    el,
    once: reveal,
    pinAt,
    start: parsePoint(offset[0]),
    end: parsePoint(offset[1]),
    mode: null,
    active: false,
    revealed: false,
    last: -1,
  };
  entries.set(el, entry);
  apply(entry);

  return () => {
    entries.delete(el);
    observer?.unobserve(el);
    unwatchReveal(el);
  };
}
