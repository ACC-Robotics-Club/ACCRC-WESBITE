'use client';

import React, { useEffect, useState } from 'react';
import { getNewsPosts, type FirestoreNews } from '@/lib/publicData';
import { NewsCard } from '@/components/news/NewsCard';
import { SectionReveal } from '@/components/ui/SectionReveal';

export default function NewsPage() {
  const [news, setNews] = useState<FirestoreNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const posts = await getNewsPosts();
        setNews(posts);
      } catch (err: any) {
        console.error('Failed to fetch news', err);
        setError('Failed to load news updates. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNews();
  }, []);

  return (
    <main className="pt-24 section-padding container-content min-h-screen">
      <SectionReveal>
        <div className="mb-12">
          <p className="mono-label mb-4 flex items-center gap-3 text-accent">
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
            NEWS &amp; UPDATES
          </p>
          <h1 className="font-display text-display-md font-black tracking-display text-ink">
            Stay in the Loop
          </h1>
        </div>
      </SectionReveal>

      <SectionReveal>
        {loading ? (
          <div className="text-text-secondary animate-pulse">Loading updates...</div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : news.length === 0 ? (
          <div className="text-text-secondary">No updates posted yet. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map((post) => (
              <NewsCard key={post.id} news={post} />
            ))}
          </div>
        )}
      </SectionReveal>
    </main>
  );
}
