'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { ArrowUpRight, CalendarDays, Crown, Loader2, LogOut, Newspaper, ShieldCheck, Trophy, UsersRound } from 'lucide-react';
import { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { auth } from '@/lib/firebaseAuth';

const portals = [
  {
    name: 'Events Portal',
    description: 'Create events, control registration windows, and review attendee records.',
    href: '/admin/events/',
    icon: CalendarDays,
  },
  {
    name: 'Achievements Portal',
    description: 'Publish, edit, and remove achievements shown on the public site.',
    href: '/admin/achievements/',
    icon: Trophy,
  },
  {
    name: 'News Portal',
    description: 'Write and publish club updates for the public news feed.',
    href: '/admin/news/',
    icon: Newspaper,
  },
  {
    name: 'Sub-Executive Portal',
    description: 'Prepare and review the next sub-executive application cycle.',
    href: '/admin/sub-executive/',
    icon: UsersRound,
  },
  {
    name: 'Executive Portal',
    description: 'Coordinate executive recruitment and leadership roles.',
    href: '/admin/executive/',
    icon: Crown,
  },
  {
    name: 'Prefect Portal',
    description: 'Manage prefect applications and operational roles.',
    href: '/admin/prefect/',
    icon: ShieldCheck,
  },
];

export default function AdminDashboard() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      window.location.assign('/admin/login/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-primary px-4 py-12 text-text-primary sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">ACCRC management system</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Portal Hub</h1>
              <p className="mt-3 max-w-xl text-text-secondary">Choose a secure workspace for events, recruitment, and club operations.</p>
            </div>
            <button type="button" onClick={() => void handleLogout()} disabled={isSigningOut} aria-busy={isSigningOut} aria-label="Sign out of the administration portal" className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60">
              {isSigningOut ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LogOut size={16} aria-hidden />}
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </header>

          <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Administrative portals">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.href} href={portal.href} className="group border border-border bg-secondary p-6 transition-colors hover:border-accent hover:bg-primary sm:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <Icon className="h-7 w-7 text-accent" aria-hidden />
                    <ArrowUpRight className="h-5 w-5 text-text-tertiary transition-colors group-hover:text-accent" aria-hidden />
                  </div>
                  <h2 className="mt-12 text-2xl font-bold tracking-tight">{portal.name}</h2>
                  <p className="mt-3 max-w-md text-text-secondary">{portal.description}</p>
                  <span className="mt-7 inline-block font-mono text-xs uppercase tracking-widest text-accent">Launch workspace</span>
                </Link>
              );
            })}
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
