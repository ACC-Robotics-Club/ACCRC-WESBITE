'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { club } from '@/lib/club';

const FACEBOOK_PAGE = club.socials.facebook;

/**
 * Meta's page plugin lays its content out against the `width` query parameter,
 * *not* against the iframe element — `adapt_container_width` only shrinks it,
 * it never grows it. FB also hard-clamps anything above 750px back down to 750.
 *
 * More importantly the plugin only builds a content column as wide as its
 * canonical embed size (500px). Past that it keeps painting its own page
 * background, so widening the frame only adds a dead grey strip *inside* the
 * panel. Widening the feed is therefore not the answer.
 *
 * The answer is to widen the *panel*. It is `w-full`, so it always fills the
 * column it is dropped into (a 380px sidebar on the home page, a 360px rail on
 * /events/, the full row when there is no event list beside it). Once there is
 * enough room for the natural 500px feed plus a readable text column, the panel
 * switches to a two-column banner — header beside the feed instead of above
 * it — so a wide row is filled with real content rather than empty page
 * background around a 500px island.
 *
 * Which layout to use is read off the measured panel width, never the viewport:
 * the same component sits in a narrow rail on one page and the full row on
 * another, and the panel's own width is the only thing both agree on.
 *
 * Measurement still targets the *panel*, never the iframe. The panel's width
 * comes from its parent, so mounting a wide iframe inside it cannot feed back
 * into the measurement. Measuring the iframe is exactly what caused the earlier
 * glitching loop: resize -> rewrite `src` -> reload -> relayout -> resize.
 *
 * The iframe is only mounted once the width is known, so it loads exactly once,
 * already correct — no reflow, no reload, no gutter.
 */
/** The widest content column the plugin actually renders; FB paints bare
 *  background beyond this no matter what `width` is asked for. */
const MAX_PANEL_WIDTH = 500;

/** Below this the feed sits under its own header; at or above it the panel
 *  becomes a banner with the feed in a fixed 500px column beside the text. */
const WIDE_PANEL_MIN = 880;

export function FacebookTimeline({ compact = false }: { compact?: boolean }) {
  const panelRef = useRef<HTMLElement>(null);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const height = compact ? 460 : 520;

  const measure = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    // clientWidth is the padding box: the border is already excluded, so the
    // frame inside can use every remaining pixel with no gutter.
    const next = Math.max(200, Math.floor(el.clientWidth));
    // Width-only guard: the panel's height changes when the feed loads, and
    // reacting to that would restart the loop we just removed.
    setPanelWidth((prev) => (prev === next ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = panelRef.current;
    if (!el) return;
    // ResizeObserver alone can be delayed when the tab is backgrounded, so a
    // window resize listener backstops it and guarantees a correct width even
    // before the observer's next delivery.
    window.addEventListener('resize', measure);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);

  const isWide = panelWidth !== null && panelWidth >= WIDE_PANEL_MIN;
  /* In the banner the feed owns a fixed column, so it is always the plugin's
     natural width. Stacked, it takes whatever the panel has. */
  const pluginWidth =
    panelWidth === null ? null : Math.min(MAX_PANEL_WIDTH, Math.max(200, panelWidth));

  const src =
    `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FACEBOOK_PAGE)}` +
    `&tabs=timeline&width=${pluginWidth ?? 500}` +
    `&height=${height}` +
    '&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false';

  return (
    <aside
      ref={panelRef}
      className="relative w-full overflow-hidden rounded-3xl border-2 border-ink bg-ink text-[#F7F5EE] shadow-[0_40px_100px_-50px_rgba(28,25,23,0.5)]"
    >
      <div className="dot-grid-light absolute inset-0 opacity-20" aria-hidden />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-glow/20 blur-3xl"
        aria-hidden
      />

      <div
        className={`relative grid ${
          isWide ? 'grid-cols-[minmax(0,1fr)_500px]' : 'grid-cols-1'
        }`}
      >
        <div
          className={`relative flex flex-col justify-center border-white/10 p-6 sm:p-8 lg:p-10 ${
            isWide ? 'border-r-2' : 'border-b-2'
          }`}
        >
          <p className="mono-label mb-3 flex items-center gap-3 text-glow">
            <span className="inline-block h-px w-8 bg-glow" aria-hidden />
            LATEST ON FACEBOOK
          </p>
          <h2 className="font-display text-display-xs font-extrabold tracking-tight">
            Official page feed
          </h2>
          <p className="mt-2 text-body-sm text-[#F7F5EE]/65">
            Follow our official page for announcements, event updates, and
            last-minute changes.
          </p>
          <a
            href={FACEBOOK_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex shrink-0 items-center gap-2 self-start rounded-full border-2 border-glow px-5 py-2.5 font-mono text-mono-sm font-bold uppercase tracking-wider text-glow transition-colors duration-200 hover:bg-glow hover:text-ink"
          >
            <FaFacebook size={15} aria-hidden />
            Open ACCRC on Facebook
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        </div>

        {/* No padding and no max-width: the frame is exactly as wide as the
            plugin renders, so there is never a gutter beside the feed. */}
        <div className="relative w-full overflow-hidden bg-primary">
          {pluginWidth === null ? (
            <div
              className="animate-pulse bg-white/[0.04]"
              style={{ height }}
              aria-hidden
            />
          ) : (
            <iframe
              key={pluginWidth}
              title="ACCRC official Facebook page"
              src={src}
              width={pluginWidth}
              height={height}
              className="block border-0 bg-primary"
              style={{ display: 'block' }}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          )}
        </div>
      </div>
    </aside>
  );
}
