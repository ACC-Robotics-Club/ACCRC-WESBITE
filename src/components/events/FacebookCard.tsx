import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { club } from '@/lib/club';

const FACEBOOK_PAGE = club.socials.facebook;
const MESSENGER = `https://m.me/${new URL(FACEBOOK_PAGE).pathname.replace(/\//g, '')}`;

/**
 * Where the club posts day-to-day news. A plain card instead of Facebook's
 * embedded page widget: the widget often showed an empty feed (browsers block
 * its cookies), loaded megabytes of script, and stuttered scrolling on phones.
 * This loads nothing from Facebook and always looks the same.
 */
export function FacebookCard() {
  return (
    <aside className="relative w-full overflow-hidden rounded-3xl border-2 border-ink bg-ink p-6 text-[#F7F5EE] shadow-[0_40px_100px_-50px_rgba(28,25,23,0.5)] sm:p-8">
      <div className="dot-grid-light absolute inset-0 opacity-20" aria-hidden />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.2),transparent_68%)]"
        aria-hidden
      />

      <div className="relative">
        <p className="mono-label mb-5 flex items-center gap-3 text-glow">
          <span className="inline-block h-px w-8 bg-glow" aria-hidden />
          LATEST UPDATES
        </p>

        <div className="flex items-center gap-4">
          <span className="relative shrink-0">
            <img
              src="/accrc-logo-128.png"
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 rounded-full border-2 border-white/15 bg-white object-contain"
            />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-[#1877F2] text-white" aria-hidden>
              <FaFacebook size={12} />
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight">{club.shortName} on Facebook</h2>
            <p className="truncate font-mono text-xs text-[#F7F5EE]/55">{FACEBOOK_PAGE.replace(/^https?:\/\/(www\.)?/, '')}</p>
          </div>
        </div>

        <p className="mt-5 text-body-sm text-[#F7F5EE]/70">
          Announcements, event photos, results, and last-minute changes are posted on our official page first.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={FACEBOOK_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-glow px-5 py-3 font-mono text-mono-sm font-bold uppercase tracking-wider text-ink transition-transform duration-200 active:scale-95"
          >
            <FaFacebook size={15} aria-hidden />
            Follow on Facebook
            <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </a>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={MESSENGER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-[#F7F5EE] transition-colors hover:border-glow hover:text-glow"
            >
              <MessageCircle size={14} aria-hidden />
              Message
            </a>
            <a
              href={club.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-[#F7F5EE] transition-colors hover:border-glow hover:text-glow"
            >
              <FaInstagram size={14} aria-hidden />
              Instagram
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
