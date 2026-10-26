'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import {
  subscribeToEvents,
  type FirestoreEvent,
} from '@/lib/publicData';
import { useFestConfig } from '@/components/fest/FestFlagsProvider';

interface GlobalEventBannerProps {
  onHeightChange?: (height: number) => void;
}

export function GlobalEventBanner({ onHeightChange }: GlobalEventBannerProps) {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  /* Shared festival state from the provider in SiteChrome. */
  const { config: festConfig } = useFestConfig();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubEvents = subscribeToEvents(setEvents, (err) => {
      console.warn('Real-time events banner subscription notice:', err);
    });

    return () => {
      unsubEvents();
    };
  }, []);

  // Determine the most active/relevant event to announce
  const now = Date.now();
  const activeEvent = events.find((e) => {
    if (e.isLaunched === false) return false;
    // Event within upcoming window or active
    return e.date.getTime() >= now - 24 * 60 * 60 * 1000;
  }) || events.find((e) => e.isLaunched !== false);

  // If there's an active event or launched fest, determine banner metadata
  let bannerItem: {
    id: string;
    label: string;
    title: string;
    dateText?: string;
    url: string;
    isFest?: boolean;
  } | null = null;

  if (activeEvent) {
    const isRegOpen =
      activeEvent.registrationOpensAt &&
      activeEvent.registrationOpensAt.getTime() <= now &&
      (!activeEvent.registrationClosesAt || activeEvent.registrationClosesAt.getTime() >= now);

    bannerItem = {
      id: `event-${activeEvent.id}`,
      label: isRegOpen ? 'REGISTRATION OPEN' : 'FEATURED EVENT',
      title: activeEvent.name || activeEvent.title || 'Club Robotics Event',
      dateText: activeEvent.date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      url: `/events/detail/?id=${activeEvent.id}`,
      isFest: false,
    };
  } else if (festConfig && festConfig.isLaunched) {
    bannerItem = {
      id: `fest-launch-${festConfig.festDates || '2026'}`,
      label: festConfig.registrationOpen ? 'FEST REGISTRATIONS OPEN' : 'ACCRC FEST 2026',
      title: festConfig.festTitle || 'ACCRC Robotics Carnival',
      dateText: festConfig.festDates || 'Dhaka, Bangladesh',
      url: '/fest',
      isFest: true,
    };
  }

  const currentBannerId = bannerItem?.id ?? null;
  const isDismissed =
    currentBannerId !== null &&
    (dismissedKey === currentBannerId ||
      (typeof window !== 'undefined' &&
        window.sessionStorage.getItem(`accrc-banner-dismissed-${currentBannerId}`) === '1'));

  const isVisible = bannerItem !== null && !isDismissed;

  // Measure banner height and report to layout
  useEffect(() => {
    if (!isVisible || !bannerRef.current) {
      onHeightChange?.(0);
      return;
    }

    const updateHeight = () => {
      if (bannerRef.current) {
        onHeightChange?.(bannerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(bannerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isVisible, onHeightChange, bannerItem?.id]);

  const handleDismiss = () => {
    if (currentBannerId) {
      setDismissedKey(currentBannerId);
      try {
        sessionStorage.setItem(`accrc-banner-dismissed-${currentBannerId}`, '1');
      } catch {
        // ignore sessionStorage errors in restricted environments
      }
      onHeightChange?.(0);
    }
  };

  if (!isVisible || !bannerItem) return null;

  return (
    <aside
      ref={bannerRef}
      role="banner"
      aria-label="Latest Event Announcement"
      className="fixed top-0 left-0 right-0 z-[100] bg-[#141210]/95 backdrop-blur-md border-b border-[#c94030]/60 text-[#f6f0e7] shadow-md transition-all duration-200"
    >
      <div className="container-content flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm">
        {/* Banner Info */}
        <div className="flex flex-1 items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1 bg-[#c94030] text-white font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0">
            <Sparkles size={11} className="shrink-0" />
            {bannerItem.label}
          </span>
          <span className="font-bold text-[#f6f0e7] break-words">
            {bannerItem.title}
          </span>
          {bannerItem.dateText && (
            <span className="text-[#cfc9bc] font-mono text-[10px] sm:text-xs inline-flex items-center gap-1">
              <CalendarDays size={12} className="text-[#c94030] shrink-0" />
              {bannerItem.dateText}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Link
            href={bannerItem.url}
            /* No prefetch: with `output: 'export'` Next emits one prefetch file
               per *route*, not per query (?id=...), so prefetching this link
               only produces a guaranteed 404 per page view. */
            prefetch={false}
            className="inline-flex items-center gap-1 bg-[#c94030] hover:bg-[#a83228] text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors"
          >
            <span>View Event</span>
            <ArrowRight size={12} />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss event banner"
            className="text-[#9a9088] hover:text-white p-1 rounded transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
