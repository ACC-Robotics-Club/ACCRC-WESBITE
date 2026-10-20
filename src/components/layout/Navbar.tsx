"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowUpRight, HelpCircle } from "lucide-react";
import {
  subscribeToFestConfig,
  subscribeToPortalConfig,
  type FestConfig,
  type PortalConfig,
} from "@/lib/publicData";
import { Magnetic } from "@/components/fx/Magnetic";

const navLinks = [
  { href: "/#mission", label: "MISSION" },
  { href: "/events/", label: "EVENTS" },
  { href: "/#achievements", label: "ACHIEVEMENTS" },
  { href: "/panels/", label: "PANELS" },
  { href: "/news/", label: "UPDATES" },
];

export function Navbar({
  onHelpClick,
  topOffset = 0,
}: {
  /** Opens the site guide; shows a help button when provided. */
  onHelpClick?: () => void;
  /** Height of the global event banner above the navbar. */
  topOffset?: number;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* The closed menu stays mounted for its CSS exit transition; `inert` keeps
     it out of the tab order and away from screen readers meanwhile. */
  useEffect(() => {
    menuRef.current?.toggleAttribute("inert", !isOpen);
  }, [isOpen]);
  const [scrolled, setScrolled] = useState(false);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [festConfig, setFestConfig] = useState<FestConfig | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Lock scrolling only while the menu is open. This used to clear the body's
     overflow on mount too, which released the page loader's scroll lock. */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [isOpen]);

  useEffect(() => {
    const unsubscribeFest = subscribeToFestConfig(setFestConfig, (error) => {
      console.warn('Unable to read fest visibility for site navigation:', error);
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
  const links = [
    ...navLinks,
    ...(festConfig?.isLaunched === true ? [{ href: "/fest/", label: "FEST" }] : []),
    ...(leadershipApplicationsOpen ? [{ href: "/portal/", label: "LEADERSHIP" }] : []),
  ];

  return (
    <header
      className="fixed left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5"
      style={{ top: `${topOffset}px`, "--nav-offset": `${topOffset}px` } as React.CSSProperties}
    >
      <nav
        /* Always on its own light panel, so the header stays readable on every
           page, including ones that open on a dark section (e.g. /panels/).
           Scrolling only adds the shadow. */
        className={`container-content flex items-center justify-between gap-4 rounded-xl border border-border bg-primary/95 px-3 py-2 transition-[box-shadow] duration-300 lg:backdrop-blur-xl sm:px-5 sm:py-2.5 ${
          scrolled || isOpen ? "shadow-[0_12px_36px_-18px_rgba(28,25,23,0.18)]" : ""
        }`}
        aria-label="Main navigation"
      >
        {/* Logo / Wordmark */}
        <a href="/" className="flex items-center gap-3 group" aria-label="ACCRC Home">
          <img
            src="/accrc-logo-sm.webp"
            width={40}
            height={40}
            alt="ACCRC Logo"
            className="h-10 w-10 rounded-full object-cover border border-border-strong transition-transform duration-300 group-hover:rotate-12"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-black tracking-tight text-ink">
              ACCRC
            </span>
            <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase leading-none tracking-normal text-text-secondary min-[360px]:tracking-wider">
              Adamjee Cantonment College
            </span>
            <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase leading-none tracking-normal text-text-secondary min-[360px]:tracking-wider">
              Robotics Club
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-mono font-bold tracking-widest text-ink hover:text-accent transition-colors duration-200 uppercase"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          {onHelpClick && (
            <button
              type="button"
              onClick={onHelpClick}
              aria-label="How it works — open site guide"
              title="How it works"
              className="grid h-10 w-10 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-tertiary hover:text-accent"
            >
              <HelpCircle size={18} aria-hidden />
            </button>
          )}
          <Magnetic strength={0.25}>
            <a
              href="/membership/"
              className="inline-flex items-center rounded-lg bg-accent px-5 py-2 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_rgba(200,67,44,0.45)] transition-all duration-200 hover:bg-accent-hover active:scale-95"
            >
              Join us
            </a>
          </Magnetic>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden flex h-11 w-11 items-center justify-center rounded-lg border border-border-strong bg-secondary text-text-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu — always mounted and animated with CSS transitions (see
          .mobile-menu in globals.css), so opening it costs no JavaScript
          animation work. `inert` keeps the closed menu out of tab order. */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setIsOpen(false)}
        className="mobile-menu-backdrop lg:hidden fixed inset-0 -z-10 cursor-default bg-ink/30"
        data-open={isOpen}
      />
      <div
        id="mobile-menu"
        className="mobile-menu lg:hidden fixed inset-x-4 top-[calc(5.25rem+var(--nav-offset,0px))] z-40 max-h-[calc(100svh-6.5rem-var(--nav-offset,0px))] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-secondary p-5 shadow-[0_30px_80px_-30px_rgba(28,25,23,0.35)] sm:inset-x-6 sm:top-[calc(6rem+var(--nav-offset,0px))] sm:p-6"
        data-open={isOpen}
        ref={menuRef}
      >
        <div className="flex flex-col">
          {[
            { href: "/", label: "Home" },
            ...links,
          ].map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{ "--i": i } as React.CSSProperties}
              className="mobile-menu__item flex items-center justify-between border-b border-border py-3 text-[1.6rem] font-extrabold leading-tight tracking-display transition-colors last:border-0 hover:text-accent active:text-accent"
            >
              {link.label}
              <ArrowUpRight size={22} className="text-text-tertiary" aria-hidden />
            </a>
          ))}
          {onHelpClick && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onHelpClick();
              }}
              style={{ "--i": 7 } as React.CSSProperties}
              className="mobile-menu__item flex min-h-11 items-center gap-2 py-3 text-left font-mono text-mono-sm font-bold uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
            >
              <HelpCircle size={18} aria-hidden />
              How it works
            </button>
          )}
          <a
            href="/membership/"
            onClick={() => setIsOpen(false)}
            style={{ "--i": 8 } as React.CSSProperties}
            className="mobile-menu__item mt-5 inline-flex items-center justify-center rounded-full bg-accent px-6 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white"
          >
            Join us
          </a>
        </div>
      </div>
    </header>
  );
}
