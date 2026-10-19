'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionReveal } from '@/components/ui/SectionReveal';
import { getLatestNews, type FirestoreNews } from '@/lib/publicData';

export function NewsPreview() {
  const [news, setNews] = useState<FirestoreNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getLatestNews(3);
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <section className="section-padding bg-secondary border-b border-border">
      <div className="container-content">
        <SectionReveal>
          <div className="flex flex-col gap-8">
            <span className="font-mono text-mono-sm tracking-widest uppercase text-text-tertiary">
              LATEST UPDATES
            </span>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-tertiary border-border" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((item) => (
                  <Card key={item.id} hover={true} className="flex flex-col h-full bg-primary">
                    <div className="font-mono text-mono-sm text-text-tertiary mb-3">
                      {item.publishedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <h3 className="text-display-xs font-bold text-text-primary mb-3 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-body-sm text-text-secondary line-clamp-3 mb-6 flex-grow">
                      {item.excerpt}
                    </p>
                    <Link href={`/news/detail/?id=${item.id}`} className="text-accent text-body-sm hover:underline mt-auto inline-block">
                      Read more →
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-border bg-primary rounded">
                <p className="text-text-tertiary font-mono text-mono-sm">No updates yet</p>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Link href="/news/" className="text-accent font-mono text-mono-sm hover:underline">
                View All Updates →
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
