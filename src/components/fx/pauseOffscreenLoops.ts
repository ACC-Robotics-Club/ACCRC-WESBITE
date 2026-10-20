/**
 * Pauses looping CSS animations (marquee, pulsing dots, floating shapes,
 * loading skeletons…) while they are off screen.
 *
 * A running animation is re-styled on the main thread every frame the page
 * renders, including every scroll frame, even when it's nowhere near the
 * viewport. Measured on a phone-class CPU, each loop cost ~150–250ms of style
 * work per 10s of scrolling. Paused, they cost nothing and resume in place.
 *
 * One IntersectionObserver for the whole site; a MutationObserver picks up
 * loops that render later (data loaded, route changes).
 */
const LOOP_SELECTOR = [
  '.marquee-track',
  '.status-dot',
  '.hero-glow-orb',
  '.animate-pulse',
  '.animate-spin-slow',
  '.animate-blink',
  '.animate-bob',
  '.animate-float-slow',
  '.animate-pulse-dot',
].join(',');

export function pauseOffscreenLoops(): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => undefined;

  const watched = new WeakSet<Element>();
  const visibility = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        record.target.classList.toggle('loop-paused', !record.isIntersecting);
      }
    },
    { rootMargin: '100px 0px' },
  );

  const scan = (root: ParentNode) => {
    root.querySelectorAll(LOOP_SELECTOR).forEach((el) => {
      if (watched.has(el)) return;
      watched.add(el);
      visibility.observe(el);
    });
  };
  scan(document);

  let pending = 0;
  const mutations = new MutationObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      scan(document);
    });
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  return () => {
    cancelAnimationFrame(pending);
    mutations.disconnect();
    visibility.disconnect();
  };
}
