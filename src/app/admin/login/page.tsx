'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { adminSessionReady, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Magnetic } from '@/components/fx/Magnetic';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase Auth is not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminSessionReady;
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-16">
      {/* Backdrop decoration */}
      <div className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_45%,black,transparent)]" aria-hidden />
      <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-secondary animate-float-slow" aria-hidden />
      <div className="absolute -right-16 bottom-16 h-56 w-56 rounded-3xl bg-glow/20 animate-float-slow [animation-delay:-4s]" aria-hidden />

      <motion.div
        initial={{ y: 44 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white">
            <Lock size={26} aria-hidden />
          </span>
          <h1 className="font-display text-display-sm font-black tracking-display text-ink">
            ACCRC
          </h1>
          <p className="mono-label mt-2 text-text-secondary">Admin Access</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 rounded-3xl border-2 border-border-strong bg-secondary p-7 shadow-[0_40px_90px_-55px_rgba(28,25,23,0.35)]"
        >
          {error && (
            <div className="rounded-xl border-2 border-danger/40 bg-danger/10 p-3 font-mono text-body-sm font-bold text-danger">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="mono-label text-text-tertiary">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-label text-text-tertiary">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Magnetic strength={0.18} className="mt-3 w-full">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
          </Magnetic>
        </form>
      </motion.div>
    </div>
  );
}
