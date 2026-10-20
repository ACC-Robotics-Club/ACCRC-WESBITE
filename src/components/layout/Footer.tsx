"use client";

import { useEffect, useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { subscribeToPortalConfig, type PortalConfig } from "@/lib/firestore";
import { club } from "@/lib/club";
import { Marquee } from "@/components/fx/Marquee";

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);

  useEffect(() => subscribeToPortalConfig(setPortalConfig), []);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const leadershipApplicationsOpen = Boolean(
    portalConfig?.execOpen || portalConfig?.prefectOpen || portalConfig?.subExecOpen
  );

  return (
    <footer className="site-footer bg-ink text-[#F7F5EE]">
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
                src="/accrc-logo.png"
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
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/events/", label: "Events" },
                { href: "/#achievements", label: "Achievements" },
                { href: "/membership/", label: "Membership" },
                { href: "/news/", label: "News" },
                { href: "/about/", label: "About" },
                { href: "/admin/", label: "Portals" },
                ...(leadershipApplicationsOpen ? [{ href: "/portal/", label: "Leadership" }] : []),
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-body-sm text-white/65 hover:text-glow transition-colors duration-200"
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
              <li className="text-body-sm text-white/65">
                <a
                  href={club.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-glow transition-colors"
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
                  className="p-2.5 text-white/60 border border-white/15 rounded-full transition-all duration-200 hover:text-glow hover:border-glow/50 hover:-translate-y-0.5"
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
            © {currentYear ? `${currentYear} ` : ''}{club.shortName} — {club.name}
          </p>
          <p className="font-mono text-mono-sm text-white/40">
            Dhaka, Bangladesh · Built by the club
          </p>
        </div>
      </div>
    </footer>
  );
}
