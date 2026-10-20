'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { club } from '@/lib/club';

/**
 * The club's Instagram posts, from a Juicer feed (juicer.io).
 *
 * Set NEXT_PUBLIC_JUICER_FEED_ID in Vercel to the feed's name from the Juicer
 * dashboard. Only Instagram posts are shown, even if the feed also has other
 * sources (Juicer filters by network).
 *
 * Juicer's script and styles are only fetched once a feed is about to scroll
 * into view, so they never compete with the hero or slow down scrolling near
 * the top of the page.
 */
export const JUICER_FEED_ID = process.env.NEXT_PUBLIC_JUICER_FEED_ID?.trim();
const SCRIPT_SRC = 'https://assets.juicer.io/embed.js';
const STYLE_HREF = 'https://assets.juicer.io/embed.css';
const PREVIEW_COUNT = 6;

function loadJuicer() {
  if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.appendChild(link);
  }
  if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.charset = 'UTF-8';
    document.body.appendChild(script);
  }
}

/** Loads Juicer when the element comes within 600px of the viewport. */
function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!JUICER_FEED_ID || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (near) loadJuicer();
  }, [near]);

  return [ref, near] as const;
}

function Placeholder({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-tertiary" />
      ))}
    </div>
  );
}

/**
 * The Juicer list. `count` posts per page; `paged` lets Juicer show its own
 * "Load more" button for the rest.
 */
function InstagramGrid({ count, paged }: { count: number; paged: boolean }) {
  const [ref, near] = useNearViewport<HTMLDivElement>();
  return (
    /* Reserve space so the page doesn't jump when the posts arrive. The home
       preview shows only the first three posts on phones (one column). */
    <div ref={ref} className={`social-feed min-h-[420px] ${paged ? '' : 'social-feed--preview'}`}>
      {near ? (
        <ul
          className="juicer-feed"
          data-feed-id={JUICER_FEED_ID}
          data-filter="Instagram"
          data-per={count}
          data-truncate="180"
          {...(paged ? {} : { 'data-pages': '1' })}
        />
      ) : (
        <Placeholder count={Math.min(count, 6)} />
      )}
    </div>
  );
}

function FollowButton() {
  return (
    <a
      href={club.socials.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border-strong px-4 py-2 mono-label text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <FaInstagram size={14} aria-hidden /> Follow on Instagram
    </a>
  );
}

/** Home page: the latest few posts and a button to /social/. */
export function SocialFeed() {
  if (!JUICER_FEED_ID) return null;

  return (
    <section className="cv-auto section-padding border-t-2 border-border-strong" id="social" aria-labelledby="social-title">
      <div className="container-content">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mono-label mb-4 flex items-center gap-3 text-accent">
              <span className="inline-block h-px w-10 bg-accent" aria-hidden />
              FROM OUR INSTAGRAM
            </p>
            <h2 id="social-title" className="font-display text-display-md font-black tracking-tight text-ink">
              Latest posts
            </h2>
          </div>
          <FollowButton />
        </div>

        <InstagramGrid count={PREVIEW_COUNT} paged={false} />

        <div className="mt-10 flex justify-center">
          <a
            href="/social/"
            className="group inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-accent px-7 py-3.5 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_14px_36px_-12px_rgba(200,67,44,0.45)] transition-all duration-200 hover:bg-accent-hover active:scale-95"
          >
            See all posts
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

/** /social/: every Instagram post, with Juicer's own "Load more". */
export function InstagramPage() {
  return (
    <div className="min-h-screen bg-primary pt-32">
      <div className="container-content py-12 md:py-16">
        <p className="mono-label mb-4 flex items-center gap-3 text-accent">
          <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          INSTAGRAM
        </p>
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-display-lg font-black text-ink">
              From the <span className="text-text-tertiary">lab.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-body-md text-text-secondary">
              Builds, competitions and club life, straight from ACCRC&rsquo;s Instagram.
            </p>
          </div>
          <FollowButton />
        </div>

        {JUICER_FEED_ID ? (
          <InstagramGrid count={18} paged />
        ) : (
          <div className="flex flex-col gap-5 rounded-3xl border-2 border-border-strong bg-secondary p-7 sm:flex-row sm:items-center sm:p-10">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent" aria-hidden>
              <FaInstagram size={26} />
            </span>
            <div>
              <p className="font-display text-display-xs font-extrabold text-ink">See our posts on Instagram.</p>
              <p className="mt-1.5 text-body-sm text-text-secondary">
                Photos from builds, competitions and events are posted on the club&rsquo;s Instagram.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
