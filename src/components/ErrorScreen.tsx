import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * One branded screen for every error the site can show: 401 (no access),
 * 404 (no such page) and unexpected crashes. Big status code, a short plain
 * explanation, and a way back.
 */
export function ErrorScreen({
  code,
  label,
  title,
  message,
  actions,
}: {
  code: string;
  label: string;
  title: string;
  message: ReactNode;
  /** Defaults to Home + Contact. */
  actions?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-[100svh] items-center overflow-hidden bg-primary pb-20 pt-32">
      <div className="dot-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="container-content relative">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/accrc-logo-128.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-8 h-16 w-16 rounded-full bg-white object-contain p-1 shadow-[0_8px_30px_-12px_rgba(28,25,23,0.35)]"
          />
          <p className="mono-label mb-4 flex items-center justify-center gap-3 text-accent">
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
            ERROR {code} / {label}
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          </p>
          <p
            className="font-display text-[clamp(6rem,24vw,13rem)] font-black leading-none tracking-tight text-ink"
            aria-hidden
          >
            {code.split('').map((digit, i) => (
              <span key={i} className={i === 1 ? 'text-accent' : undefined}>
                {digit}
              </span>
            ))}
          </p>
          <h1 className="mt-4 font-display text-display-xs font-extrabold tracking-tight text-ink sm:text-display-sm">
            {title}
          </h1>
          <div className="mx-auto mt-4 max-w-md text-body-md text-text-secondary">{message}</div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {actions ?? (
              <>
                <ErrorLink href="/">Back to home</ErrorLink>
                <ErrorLink href="/events/" variant="outline">
                  See events
                </ErrorLink>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const buttonBase =
  'inline-flex items-center justify-center rounded px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94030]';
const buttonVariants = {
  primary: 'bg-[#c94030] text-white hover:bg-[#a83228]',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-primary',
};

export function ErrorLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]}`}>
      {children}
    </Link>
  );
}

export function ErrorButton({
  onClick,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button type="button" onClick={onClick} className={`${buttonBase} ${buttonVariants[variant]}`}>
      {children}
    </button>
  );
}
