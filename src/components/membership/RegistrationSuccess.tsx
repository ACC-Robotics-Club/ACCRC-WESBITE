'use client';

import { useState } from 'react';

import { Check, Copy, MailCheck, MailWarning } from 'lucide-react';
import type { RegistrationResult } from '@/lib/registerMember';

/** Shown after a successful registration: the new club ID and email status. */
export function RegistrationSuccess({ result, email }: { result: RegistrationResult; email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (clubId: string) => {
    try {
      await navigator.clipboard.writeText(clubId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard can be blocked; the ID is still on screen to copy by hand. */
    }
  };

  if (result.status === 'received') {
    return (
      <div
        className="success-rise flex flex-col gap-3 rounded-3xl border-2 border-border-strong bg-tertiary/50 p-8 sm:p-10"
        role="status"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white" aria-hidden>
          <Check size={26} />
        </span>
        <h3 className="mt-2 font-display text-display-xs font-extrabold text-ink">Application received.</h3>
        <p className="text-body-sm text-text-secondary">
          Thanks for joining ACCRC. We&apos;ll review your registration and reach out at{' '}
          <strong className="text-ink">{email}</strong>.
        </p>
      </div>
    );
  }

  if (result.status === 'existing') {
    return (
      <div
        className="success-rise flex flex-col gap-3 rounded-3xl border-2 border-border-strong bg-tertiary/50 p-8 sm:p-10"
        role="status"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white" aria-hidden>
          <MailCheck size={26} />
        </span>
        <h3 className="mt-2 font-display text-display-xs font-extrabold text-ink">You&apos;re already a member.</h3>
        <p className="text-body-sm text-text-secondary">
          {result.emailSent
            ? <>We&apos;ve re-sent your club ID to <strong className="text-ink">{email}</strong>. Check your inbox (and the spam folder).</>
            : 'This email is already registered, but we could not re-send your club ID right now. Please contact the club on Facebook.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="success-rise flex flex-col gap-4 rounded-3xl border-2 border-border-strong bg-tertiary/50 p-8 sm:p-10"
      role="status"
    >
      <p className="mono-label text-accent">Registration confirmed</p>
      <h3 className="font-display text-display-xs font-extrabold text-ink">Welcome to the build.</h3>

      <div className="rounded-2xl border-2 border-dashed border-accent bg-primary p-6 text-center">
        <p className="mono-label text-text-tertiary">Your club ID</p>
        <p className="mt-2 break-all font-mono text-3xl font-bold tracking-wider text-ink sm:text-4xl">{result.clubId}</p>
        <button
          type="button"
          onClick={() => copy(result.clubId)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-2 font-mono text-mono-sm font-bold uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? 'Copied' : 'Copy ID'}
        </button>
      </div>

      <p className="flex items-start gap-3 text-body-sm text-text-secondary">
        {result.emailSent ? (
          <>
            <MailCheck size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>A confirmation email with your club ID is on its way to <strong className="text-ink">{email}</strong>.</span>
          </>
        ) : (
          <>
            <MailWarning size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
            <span>You&apos;re registered, but we couldn&apos;t send the confirmation email. Save your club ID now.</span>
          </>
        )}
      </p>
    </div>
  );
}
