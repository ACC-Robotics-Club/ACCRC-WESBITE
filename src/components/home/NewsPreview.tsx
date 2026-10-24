'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionReveal } from '@/components/ui/SectionReveal';
import { getLatestNews, type FirestoreNews } from '@/lib/firestore';

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
    <section className="section-padding bg-[#ede7da] border-b border-[#cfc9bc]">
      <div className="container-content">
        <SectionReveal>
          <div className="flex flex-col gap-8">
            <span className="font-mono text-[0.75rem] tracking-widest uppercase text-[#6b6258]">
              LATEST UPDATES
            </span>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-[#e6dfd1] border-[#cfc9bc]" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((item) => (
                  <Card key={item.id} hover={true} className="flex flex-col h-full bg-[#f6f0e7]">
                    <div className="font-mono text-[0.75rem] text-[#6b6258] mb-3">
                      {item.publishedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <h3 className="text-[clamp(1.25rem,2vw,1.55rem)] font-bold text-[#141210] mb-3 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[0.9375rem] text-[#3a3530] line-clamp-3 mb-6 flex-grow">
                      {item.excerpt}
                    </p>
                    <Link href={`/news/detail/?id=${item.id}`} prefetch={false} className="text-[#c94030] text-[0.9375rem] hover:underline mt-auto inline-block">
                      Read more →
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-[#cfc9bc] bg-primary rounded">
                <p className="text-[#6b6258] font-mono text-[0.75rem]">No updates yet</p>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Link href="/news/" className="text-[#c94030] font-mono text-[0.75rem] hover:underline">
                View All Updates →
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
