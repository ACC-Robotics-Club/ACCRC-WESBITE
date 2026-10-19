'use client';

import { useEffect, useRef, useState } from 'react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { club } from '@/lib/club';

/**
 * Latest Instagram and Facebook posts, from a Juicer feed (juicer.io) that
 * combines the club's Facebook page and Instagram account.
 *
 * Set NEXT_PUBLIC_JUICER_FEED_ID in Vercel to the feed's name from the Juicer
 * dashboard. Without it this section renders nothing.
 *
 * Juicer's script and styles are only fetched once the section is about to
 * scroll into view, so they never compete with the hero or slow down
 * scrolling near the top of the page.
 */
const FEED_ID = process.env.NEXT_PUBLIC_JUICER_FEED_ID?.trim();
const SCRIPT_SRC = 'https://assets.juicer.io/embed.js';
const STYLE_HREF = 'https://assets.juicer.io/embed.css';

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

export function SocialFeed() {
  const sectionRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!FEED_ID || !el) return;
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

  if (!FEED_ID) return null;

  return (
    <section ref={sectionRef} className="cv-auto section-padding border-t-2 border-border-strong" id="social" aria-labelledby="social-title">
      <div className="container-content">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mono-label mb-4 flex items-center gap-3 text-accent">
              <span className="inline-block h-px w-10 bg-accent" aria-hidden />
              FROM OUR SOCIALS
            </p>
            <h2 id="social-title" className="font-display text-display-md font-black tracking-tight text-ink">
              Latest posts
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={club.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border-strong px-4 py-2 mono-label text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <FaFacebook size={14} aria-hidden /> Facebook
            </a>
            <a
              href={club.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border-strong px-4 py-2 mono-label text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <FaInstagram size={14} aria-hidden /> Instagram
            </a>
          </div>
        </div>

        {/* Reserve space so the page doesn't jump when the posts arrive. */}
        <div className="social-feed min-h-[420px]">
          {near ? (
            <ul className="juicer-feed" data-feed-id={FEED_ID} data-per="6" data-pages="1" data-truncate="180" />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-tertiary" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
