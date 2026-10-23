'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Flame, Newspaper, Trophy, UserCheck, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { getAllEvents, getApplications, getFestConfig, getRegistrations, type Application, type Registration } from '@/lib/firestore';

interface HubStats {
  pendingApplications: number;
  pendingMemberships: number;
  upcomingEvents: number;
  liveEvents: number;
  festLaunched: boolean;
}

const isPending = (record: Application | Registration) => (record.status ?? 'pending') === 'pending';

const portals = [
  {
    name: 'Events',
    description: 'Create events, publish them to the site, open or close registration, and see who signed up.',
    href: '/admin/events/',
    icon: CalendarDays,
    stat: (s: HubStats) => `${s.upcomingEvents} upcoming · ${s.liveEvents} public`,
  },
  {
    name: 'Fest Launcher & Teams',
    description: 'Launch the fest page, open registration, manage segments, schedule, announcements, and check teams in.',
    href: '/admin/fest/',
    icon: Flame,
    stat: (s: HubStats) => (s.festLaunched ? 'Fest is public' : 'Fest is hidden'),
  },
  {
    name: 'Membership Requests',
    description: 'Review students who asked to join, mark them accepted or rejected, and export the list.',
    href: '/admin/portal/?tab=membership',
    icon: UserCheck,
    stat: (s: HubStats) => `${s.pendingMemberships} waiting for review`,
  },
  {
    name: 'Leadership Applications',
    description: 'Open or close executive, prefect, and sub-executive applications, set the roles, and review applicants.',
    href: '/admin/portal/?tab=executive',
    icon: UsersRound,
    stat: (s: HubStats) => `${s.pendingApplications} waiting for review`,
  },
  {
    name: 'Achievements',
    description: 'Publish, edit, and remove the achievements shown on the home page.',
    href: '/admin/achievements/',
    icon: Trophy,
  },
  {
    name: 'News',
    description: 'Write and publish club updates for the public news page.',
    href: '/admin/news/',
    icon: Newspaper,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<HubStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getApplications(), getRegistrations({ type: 'membership' }), getAllEvents(), getFestConfig()])
      .then(([applications, memberships, events, fest]) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = events.filter((event) => event.date.getTime() >= now);
        setStats({
          pendingApplications: applications.filter(isPending).length,
          pendingMemberships: memberships.filter(isPending).length,
          upcomingEvents: upcoming.length,
          liveEvents: upcoming.filter((event) => event.isLaunched !== false).length,
          festLaunched: fest.isLaunched,
        });
      })
      .catch((error) => console.warn('Could not load hub counts.', error));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#f6f0e7] px-4 py-12 text-[#141210] sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <header className="border-b border-[#cfc9bc] pb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c94030]">ACCRC management system</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-[#141210]">Admin Hub</h1>
            <p className="mt-3 max-w-xl text-[#3a3530]">Everything that changes the public site starts here.</p>
          </header>

          <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Admin workspaces">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.href} href={portal.href} className="group border border-[#cfc9bc] bg-[#ede7da] p-6 transition-colors hover:border-[#c94030] hover:bg-[#e6dfd1] sm:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <Icon className="h-7 w-7 text-[#c94030]" aria-hidden />
                    <ArrowUpRight className="h-5 w-5 text-[#6b6258] transition-colors group-hover:text-[#c94030]" aria-hidden />
                  </div>
                  <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#141210]">{portal.name}</h2>
                  <p className="mt-3 max-w-md text-[#3a3530] leading-relaxed">{portal.description}</p>
                  {portal.stat && (
                    <span className="mt-6 inline-block border border-[#cfc9bc] bg-[#f6f0e7] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#3a3530]">
                      {stats ? portal.stat(stats) : 'Loading…'}
                    </span>
                  )}
                </Link>
              );
            })}
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
