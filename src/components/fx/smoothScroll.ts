/**
 * Inertia ("buttery") scrolling for mouse and trackpad users, via Lenis.
 *
 * Desktop only: phones already scroll on their own compositor thread with
 * native momentum, which no script can beat, so touch devices, reduced-motion
 * visitors and the admin area keep plain native scrolling. Lenis is loaded
 * lazily, so it never costs anything on phones.
 *
 * It only eases the native scroll position, so the CSS scroll-driven
 * animations, sticky hero and scroll engine all keep working unchanged.
 */
export function startSmoothScroll(): () => void {
  const wanted =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!wanted) return () => undefined;

  let stopped = false;
  let destroy = () => undefined as void;

  void import('lenis').then(({ default: Lenis }) => {
    if (stopped) return;
    const lenis = new Lenis({
      lerp: 0.12,
      wheelMultiplier: 1,
      // Pages lock scrolling (menu, dialogs) by hiding body overflow.
      virtualScroll: () => document.body.style.overflow !== 'hidden',
      // Let scrollable panels inside dialogs scroll themselves.
      prevent: (node: HTMLElement) => Boolean(node.closest('[role="dialog"], [data-lenis-prevent]')),
    });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    destroy = () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  });

  return () => {
    stopped = true;
    destroy();
  };
}
