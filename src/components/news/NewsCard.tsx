'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { FirestoreNews } from '@/lib/publicData';

interface NewsCardProps {
  news: FirestoreNews;
}

export function NewsCard({ news }: NewsCardProps) {
  // Assuming news.date is a Firebase Timestamp or Date, we format it.
  const dateStr = news.publishedAt?.toLocaleDateString() || '';

  return (
    <Link href={`/news/detail/?id=${news.id}`} className="block h-full">
      <Card hover={true} className="h-full flex flex-col overflow-hidden">
        {news.imageUrl && (
          <div className="w-full aspect-video">
            <img 
              src={news.imageUrl} 
              alt={news.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="font-mono text-[0.75rem] text-[#6b6258]">
            {dateStr}
          </div>
          <h3 className="text-[clamp(1.25rem,2vw,1.55rem)] font-bold mt-2 text-[#141210]">
            {news.title}
          </h3>
          <p className="text-[0.9375rem] text-[#3a3530] mt-2 line-clamp-3 flex-grow">
            {news.excerpt}
          </p>
          <div className="text-[#c94030] text-[0.9375rem] mt-4 font-medium flex items-center">
            Read more <span className="ml-1">→</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
