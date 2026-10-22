'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/fx/PageLoader';
import { GlobalEventBanner } from '@/components/layout/GlobalEventBanner';
import { pauseOffscreenLoops } from '@/components/fx/pauseOffscreenLoops';
import { startSmoothScroll } from '@/components/fx/smoothScroll';
import { startAutoReveal } from '@/components/fx/autoReveal';

/* The site guide uses an animation library, so it is only downloaded the
   first time someone opens it — not on every page load. */
const GuideModal = dynamic(() => import('@/components/GuideModal').then((m) => m.GuideModal), {
  ssr: false,
});

/**
 * Offscreen sections use `content-visibility: auto` (see .cv-auto in
 * globals.css). Their real heights must be recorded once so in-page links
 * land exactly; `cv-measure` on <html> renders everything for that.
 *
 * Doing it at load cost a full-page layout during startup, so it now happens
 * when the browser is idle — or immediately if the page was opened on a
 * #link (the inline script in layout.tsx keeps the class in that case), or the
 * moment someone taps an in-page link before the idle measure has run.
 */
function useRecordSectionHeights() {
  useEffect(() => {
    const root = document.documentElement;
    let measured = false;
    let frameA = 0;
    let frameB = 0;

    const release = () => {
      // One rendered frame records every section's size, then skipping resumes.
      frameA = requestAnimationFrame(() => {
        frameB = requestAnimationFrame(() => {
          root.classList.remove('cv-measure');
          measured = true;
        });
      });
    };

    const measureNow = () => {
      if (measured) return;
      root.classList.add('cv-measure');
      void document.body.offsetHeight; // lay out at real size before any jump
      release();
    };

    let idleId: number | null = null;
    let timerId: number | null = null;
    if (root.classList.contains('cv-measure')) {
      release(); // opened on a #link: sizes are already real
    } else if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(measureNow, { timeout: 4000 });
    } else {
      timerId = setTimeout(measureNow, 2000) as unknown as number;
    }

    /* In-page link tapped before the idle measure: measure synchronously, so
       the browser computes the jump against real section heights. */
    const onClick = (e: MouseEvent) => {
      if (measured) return;
      const link = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (link && link.pathname === window.location.pathname) measureNow();
    };
    document.addEventListener('click', onClick, true);

    return () => {
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timerId !== null) clearTimeout(timerId);
      document.removeEventListener('click', onClick, true);
    };
  }, []);
}

export function SiteChrome({ children }: { children: ReactNode }) {
  useEffect(() => pauseOffscreenLoops(), []);
  useEffect(() => startAutoReveal(), []);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  useEffect(() => (isAdmin ? undefined : startSmoothScroll()), [isAdmin]);

  /* Site guide: opened from the navbar's help button, or by any page firing
     the 'accrc:open-onboarding' event. Mounted on first open, then kept so its
     close animation can play. */
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideLoaded, setGuideLoaded] = useState(false);
  const openGuide = () => {
    setGuideLoaded(true);
    setIsGuideOpen(true);
  };
  useEffect(() => {
    const handleOpen = () => openGuide();
    window.addEventListener('accrc:open-onboarding', handleOpen);
    return () => window.removeEventListener('accrc:open-onboarding', handleOpen);
  }, []);

  /* Height of the global event banner (0 when hidden). The navbar sits just
     below it and the page is pushed down by the same amount. */
  const [bannerHeight, setBannerHeight] = useState(0);

  useRecordSectionHeights();

  // Admin pages: no site chrome at all.
  if (isAdmin) return <>{children}</>;

  return (
    <div style={{ '--site-banner-height': `${bannerHeight}px` } as CSSProperties}>
      <GlobalEventBanner onHeightChange={setBannerHeight} />
      <Navbar topOffset={bannerHeight} onHelpClick={openGuide} />
      <div style={bannerHeight > 0 ? { paddingTop: `${bannerHeight}px` } : undefined}>{children}</div>
      <Footer />
      {guideLoaded && (
        <GuideModal isOpen={isGuideOpen} setIsOpen={setIsGuideOpen} onClose={() => setIsGuideOpen(false)} />
      )}
      {/* Last, so the first-visit intro overlay sits above the banner. */}
      <PageLoader />
    </div>
  );
}
