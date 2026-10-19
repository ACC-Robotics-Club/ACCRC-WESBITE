'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, adminSessionReady } from '@/lib/firebaseAuth';
import { isApprovedAdmin, NOT_APPROVED_MESSAGE } from '@/lib/adminAccess';
import { Loader2, LogOut, Flame, Calendar, Trophy, Newspaper, Users, ShieldCheck, LayoutDashboard } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const adminNavLinks = [
  { href: '/admin', label: 'Hub', icon: LayoutDashboard },
  { href: '/admin/fest', label: 'Fest Launcher & Teams', icon: Flame },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/portal', label: 'Applications', icon: Users },
  { href: '/admin/achievements', label: 'Achievements', icon: Trophy },
  { href: '/admin/news', label: 'News', icon: Newspaper },
];

export function AdminHeader({ user }: { user: User | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push('/admin/login');
    } catch (err) {
      console.error('Sign out error', err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#ede7da] border-b border-[#cfc9bc] shadow-xs">
      <div className="container-content flex items-center justify-between min-h-fit py-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <img
              src="/accrc-logo.png"
              alt="Adamjee Cantonment College Robotics Club Logo"
              className="h-8 w-8 rounded-full object-contain"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[#141210] text-sm tracking-wider leading-none">
                ACCRC
              </span>
              <span className="font-mono text-[9px] font-bold text-[#6b6258] uppercase tracking-wider mt-0.5 hidden sm:inline">
                Adamjee Cantonment College Robotics Club · Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {adminNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-[#c94030] text-white shadow-xs'
                    : 'text-[#3a3530] hover:bg-[#e6dfd1] hover:text-[#141210]'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right - User and Sign Out */}
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden md:inline font-mono text-[11px] text-[#6b6258] max-w-[180px] truncate" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out of Admin Portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f0e7] hover:bg-[#c72c2c] hover:text-white text-[#c72c2c] border border-[#cfc9bc] hover:border-[#c72c2c] rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Sub-nav for mobile/tablets */}
      <div className="lg:hidden border-t border-[#cfc9bc] bg-[#f6f0e7] px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {adminNavLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase tracking-wider ${
                isActive
                  ? 'bg-[#c94030] text-white'
                  : 'text-[#6b6258] hover:text-[#141210]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

export default function AdminProtectedRoute({ children, showHeader = true }: AdminProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setError('Firebase Auth is not initialized');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void adminSessionReady
      .then(() => {
        unsubscribe = onAuthStateChanged(
          auth,
          async (currentUser) => {
            if (currentUser) {
              // Signed in is not enough: the account must be on the admin list.
              if (!(await isApprovedAdmin(currentUser))) {
                await signOut(auth).catch(() => undefined);
                setUser(null);
                setError(NOT_APPROVED_MESSAGE);
                setLoading(false);
                return;
              }
              setUser(currentUser);
              setLoading(false);
            } else {
              setUser(null);
              setLoading(false);
              router.replace('/admin/login');
            }
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to verify authentication');
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f0e7] text-[#141210]">
        <Loader2 className="w-10 h-10 animate-spin text-[#c94030] mb-3" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#6b6258]">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f0e7] p-4">
        <div className="bg-[#ede7da] border border-[#c72c2c] p-6 max-w-md w-full rounded text-center">
          <p className="text-sm font-bold text-[#c72c2c] mb-2">Access denied</p>
          <p className="text-xs text-[#3a3530] font-mono mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="px-4 py-2 bg-[#c94030] text-white text-xs font-mono uppercase tracking-wider rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Prevents any flash of protected UI before redirect completes
  }

  return (
    <div className="min-h-screen bg-[#f6f0e7] text-[#141210] flex flex-col">
      {showHeader && <AdminHeader user={user} />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
