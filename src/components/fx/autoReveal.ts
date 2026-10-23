import { track } from './scrollEngine';

/**
 * Site-wide entrance animations without wrapping every block in <RiseIn>.
 *
 * Elements tagged `motion-rise`, the children of `motion-stagger`, and posts
 * in a `motion-feed` (Instagram, inserted later by Juicer) get the same
 * one-shot rise as RiseIn: when they enter the viewport the scroll engine
 * flips them visible and a CSS transition on transform/opacity carries them
 * in, then they cost nothing. (Scroll-linked CSS animations were tried and
 * measured ~30% more main-thread work while scrolling on phones, because
 * they re-style every frame.)
 */
const SELECTOR = '.motion-rise, .motion-stagger > *, .motion-feed .feed-item';

export function startAutoReveal(): () => void {
  const stops = new Map<HTMLElement, () => void>();

  const register = (el: HTMLElement) => {
    if (stops.has(el) || el.classList.contains('fx-rise')) return;
    el.classList.add('fx-rise');
    el.style.setProperty('--ry', '44px');
    el.dataset.stagger = '';
    stops.set(el, track(el, { offset: ['start 1', 'start 0'], reveal: true }));
  };
  const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);
  scan();

  let pending = 0;
  const mutations = new MutationObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      // Forget elements React removed, then pick up new ones.
      stops.forEach((stop, el) => {
        if (!el.isConnected) {
          stop();
          stops.delete(el);
        }
      });
      scan();
    });
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  return () => {
    cancelAnimationFrame(pending);
    mutations.disconnect();
    stops.forEach((stop) => stop());
    stops.clear();
  };
}
