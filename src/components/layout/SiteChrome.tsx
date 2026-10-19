'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/fx/PageLoader';

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
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useRecordSectionHeights();

  // Admin is a tool surface — no entrance ceremony there.
  if (isAdmin) return <>{children}</>;

  return (
    <>
      <PageLoader />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
