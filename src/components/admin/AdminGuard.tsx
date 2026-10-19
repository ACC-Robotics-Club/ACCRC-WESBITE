'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { adminSessionReady, auth } from '@/lib/firebaseAuth';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setError('Firebase Auth is not configured.');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void adminSessionReady
      .then(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
            window.location.href = '/admin/login';
          }
          setLoading(false);
        }, (err) => {
          setError(err.message);
          setLoading(false);
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to initialise secure authentication.');
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-danger bg-danger/10 p-4 rounded-sm border border-danger/20 font-mono">
          Configuration Error: {error}
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Redirect is handled in useEffect
  }

  return <>{children}</>;
}
