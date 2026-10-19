'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { adminSessionReady, auth } from '@/lib/firebaseAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock } from 'lucide-react';

function getFriendlyErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily restricted due to repeated failed login attempts. Please try again in a few minutes.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address format.';
  }
  return (err as Error)?.message || 'Authentication failed. Please verify your credentials.';
}

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
      await adminSessionReady.catch((initErr) => {
        console.warn('adminSessionReady notice:', initErr);
      });
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/admin');
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 bg-[#f6f0e7] text-black px-4">
      <div className="max-w-sm w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ede7da] border border-[#cfc9bc] text-[#c94030] mb-3 shadow-xs">
            <Lock className="w-5 h-5" aria-hidden />
          </div>
          <h1 className="text-xl font-bold mb-1.5 text-black tracking-tight">
            Adamjee Cantonment College Robotics Club
          </h1>
          <p className="text-black/80 font-mono text-xs uppercase tracking-widest font-semibold">
            Admin Access Portal
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#ede7da] p-6 sm:p-7 border border-[#cfc9bc] rounded shadow-xs flex flex-col gap-4 text-black"
        >
          {error && (
            <div className="bg-[#c72c2c]/10 text-[#c72c2c] text-xs p-3.5 border border-[#c72c2c]/20 font-mono rounded">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-black font-bold uppercase tracking-wider block">
              Admin Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@accrc.edu"
              required
              className="w-full text-black placeholder:text-[#6b6258] bg-[#f6f0e7] border-[#cfc9bc] focus:border-[#c94030]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-black font-bold uppercase tracking-wider block">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full text-black placeholder:text-[#6b6258] bg-[#f6f0e7] border-[#cfc9bc] focus:border-[#c94030]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full mt-3 font-mono uppercase tracking-wider text-xs py-3"
          >
            {loading ? 'Authenticating...' : 'Login to Admin Hub'}
          </Button>
        </form>
      </div>
    </div>
  );
}

