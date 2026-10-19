'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getNewsPost, type FirestoreNews } from '@/lib/publicData';
import { SectionReveal } from '@/components/ui/SectionReveal';

function NewsDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [post, setPost] = useState<FirestoreNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!id) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      try {
        const data = await getNewsPost(id);
        if (data) {
          setPost(data);
        } else {
          setError('Post not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch post', err);
        setError('Failed to load post.');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="text-[#3a3530] animate-pulse text-center">Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div className="text-center">
        <div className="text-[#c72c2c] mb-4">{error}</div>
        <Link href="/news" className="text-[#c94030] hover:underline">
          &larr; Back to News
        </Link>
      </div>
    );
  }

  const dateStr = post.publishedAt?.toLocaleDateString() || '';

  return (
    <div className="max-w-[720px] mx-auto">
      <Link href="/news" className="inline-block text-[#c94030] text-[0.9375rem] mb-8 hover:underline">
        &larr; Back to News
      </Link>
      
      <div className="font-mono text-[0.75rem] text-[#6b6258]">
        {dateStr}
      </div>
      
      <h1 className="text-[clamp(3.25rem,6.5vw,5.5rem)] font-bold mt-2 text-[#141210] mb-6">
        {post.title}
      </h1>
      
      {post.imageUrl && (
        <div className="w-full mb-8">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full rounded-md border border-[#cfc9bc]" 
          />
        </div>
      )}
      
      <div className="text-[1.0625rem] text-[#3a3530] mt-6 whitespace-pre-wrap">
        {post.body}
      </div>
    </div>
  );
}

export default function NewsDetailPage() {
  return (
    <main className="pt-24 section-padding container-content min-h-screen">
      <SectionReveal>
        <Suspense fallback={<div className="text-center text-[#3a3530]">Loading...</div>}>
          <NewsDetailContent />
        </Suspense>
      </SectionReveal>
    </main>
  );
}
