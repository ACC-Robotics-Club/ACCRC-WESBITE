"use client";

import { useEffect, useState } from "react";
import { MapPin, Mail, ArrowUpRight } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import {
  subscribeToFestConfig,
  subscribeToPortalConfig,
  type FestConfig,
  type PortalConfig,
} from "@/lib/publicData";
import { club } from "@/lib/club";
import { Marquee } from "@/components/fx/Marquee";

export function Footer() {
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [festConfig, setFestConfig] = useState<FestConfig | null>(null);

  useEffect(() => {
    const unsubscribeFest = subscribeToFestConfig(setFestConfig, (error) => {
      console.warn('Unable to read fest visibility for footer navigation:', error);
    });
    const unsubscribePortal = subscribeToPortalConfig(setPortalConfig);
    return () => {
      unsubscribeFest();
      unsubscribePortal();
    };
  }, []);

  const leadershipApplicationsOpen = Boolean(
    portalConfig?.execOpen || portalConfig?.prefectOpen || portalConfig?.subExecOpen
  );

  return (
    <footer className="site-footer cv-auto bg-ink text-[#F7F5EE]">
      {/* Tagline marquee */}
      <div className="border-b border-white/10 py-6">
        <Marquee speed={26}>
          {["BUILD", "LEARN", "COMPETE", "REPEAT"].map((word) => (
            <span key={word} className="mx-6 flex items-center gap-6">
              <span className="font-display text-display-sm font-extrabold tracking-display text-glow">
                {word}
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-glow/60" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container-content py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/accrc-logo-sm.webp"
                width={48}
                height={48}
                decoding="async"
                alt="ACCRC Logo"
                className="h-12 w-12 rounded-full object-cover border border-glow/60"
              />
              <div>
                <h3 className="font-display text-xl font-extrabold tracking-display">
                  ACCRC
                </h3>
                <p className="font-mono text-mono-sm text-white/50 tracking-widest uppercase">
                  {club.name} · Adamjee Cantonment College
                </p>
              </div>
            </div>
            <p className="text-white/65 text-body-sm leading-relaxed max-w-sm">
              A student-led robotics community where we build, learn, and compete
              together through robotics, electronics, and computational thinking.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="mono-label mb-4 text-glow">Navigation</h4>
            <ul className="flex flex-col md:gap-2.5">
              {[
                { href: "/events/", label: "Events" },
                { href: "/#achievements", label: "Achievements" },
                { href: "/panels/", label: "Panels" },
                { href: "/social/", label: "Instagram" },
                { href: "/membership/", label: "Membership" },
                { href: "/news/", label: "News" },
                { href: "/about/", label: "About" },
                ...(festConfig?.isLaunched === true ? [{ href: "/fest/", label: "Fest" }] : []),
                ...(leadershipApplicationsOpen ? [{ href: "/portal/", label: "Leadership" }] : []),
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex min-h-11 items-center gap-1.5 text-body-sm text-white/65 hover:text-glow transition-colors duration-200 md:min-h-0"
                  >
                    {link.label}
                    <ArrowUpRight
                      size={13}
                      className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="mono-label mb-4 text-glow">Contact</h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-body-sm text-white/65">
                <MapPin size={16} className="mt-0.5 text-glow/70 shrink-0" />
                <span>{club.location}</span>
              </li>
              <li className="flex items-center gap-2.5 text-body-sm text-white/65">
                <Mail size={16} className="text-glow/70 shrink-0" aria-hidden />
                <a
                  href={`mailto:${club.officialEmail}`}
                  className="inline-flex min-h-11 items-center break-all hover:text-glow transition-colors md:min-h-0"
                >
                  {club.officialEmail}
                </a>
              </li>
              <li className="text-body-sm text-white/65">
                <a
                  href={club.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center hover:text-glow transition-colors md:min-h-0"
                >
                  Message {club.name} on Instagram
                </a>
              </li>
            </ul>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: FaFacebook, href: club.socials.facebook, label: `${club.name} on Facebook` },
                { icon: FaInstagram, href: club.socials.instagram, label: `${club.name} on Instagram` },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-11 w-11 place-items-center text-white/60 border border-white/15 rounded-full transition-all duration-200 hover:text-glow hover:border-glow/50 hover:-translate-y-0.5"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className="mt-14 select-none" aria-hidden="true">
          <p className="font-display text-display-xl font-black tracking-display leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(247,245,238,0.2)]">
            ACCRC
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-mono-sm text-white/40">
            © 2019 {club.shortName} — {club.name}
          </p>
          <p className="font-mono text-mono-sm text-white/40">
            Dhaka, Bangladesh · Built by the club
          </p>
        </div>
      </div>
    </footer>
  );
}
