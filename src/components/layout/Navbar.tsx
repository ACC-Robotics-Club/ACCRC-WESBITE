"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPortalConfig, type PortalConfig } from "@/lib/firestore";
import { Magnetic } from "@/components/fx/Magnetic";

const navLinks = [
  { href: "/#mission", label: "MISSION" },
  { href: "/events/", label: "EVENTS" },
  { href: "/#achievements", label: "ACHIEVEMENTS" },
  { href: "/panels/", label: "PANELS" },
  { href: "/builder/", label: "BUILDER" },
  { href: "/news/", label: "UPDATES" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => subscribeToPortalConfig(setPortalConfig), []);

  const leadershipApplicationsOpen = Boolean(
    portalConfig?.execOpen || portalConfig?.prefectOpen || portalConfig?.subExecOpen
  );
  const links = leadershipApplicationsOpen
    ? [...navLinks, { href: "/portal/", label: "LEADERSHIP" }]
    : navLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5">
      <nav
        className={`container-content flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled
            ? "border-border bg-primary/95 shadow-[0_12px_36px_-18px_rgba(28,25,23,0.18)] lg:backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
        aria-label="Main navigation"
      >
        {/* Logo / Wordmark */}
        <a href="/" className="flex items-center gap-3 group" aria-label="ACCRC Home">
          <img
            src="/accrc-logo.png"
            alt="ACCRC Logo"
            className="h-10 w-10 rounded-full object-cover border border-border-strong transition-transform duration-300 group-hover:rotate-12"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-black tracking-tight text-ink">
              ACCRC
            </span>
            <span className="font-mono text-[9px] font-bold text-text-secondary tracking-wider uppercase leading-none">
              Adamjee Cantonment College
            </span>
            <span className="font-mono text-[9px] font-bold text-text-secondary tracking-wider uppercase leading-none">
              Robotics Club
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-xs font-mono font-bold tracking-widest text-ink hover:text-accent transition-colors duration-200 uppercase"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <a
            href="/admin/"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-strong bg-secondary px-4 py-2 font-mono text-mono-sm font-bold uppercase tracking-wider text-text-primary transition-all duration-200 hover:bg-tertiary active:scale-95"
          >
            Portal <ArrowUpRight size={14} aria-hidden />
          </a>
          <Magnetic strength={0.25}>
            <a
              href="/membership/"
              className="inline-flex items-center whitespace-nowrap rounded-lg bg-accent px-5 py-2 font-mono text-mono-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_rgba(200,67,44,0.45)] transition-all duration-200 hover:bg-accent-hover active:scale-95"
            >
              Join us
            </a>
          </Magnetic>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border-strong bg-secondary text-text-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -26 }}
            animate={{ y: 0 }}
            exit={{ y: -26 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:hidden fixed inset-x-4 top-24 z-40 rounded-3xl border border-border bg-secondary p-6 shadow-[0_30px_80px_-30px_rgba(28,25,23,0.35)]"
          >
            <div className="flex flex-col">
              {[
                { href: "/", label: "Home" },
                ...links,
                { href: "/admin/", label: "Portals" },
              ].map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  initial={{ x: -34 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                  className="text-display-sm font-extrabold tracking-display py-3 border-b border-border last:border-0 hover:text-accent transition-colors flex items-center justify-between"
                >
                  {link.label}
                  <ArrowUpRight size={22} className="text-text-tertiary" aria-hidden />
                </motion.a>
              ))}
              <motion.a
                href="/membership/"
                onClick={() => setIsOpen(false)}
                initial={{ y: 26 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-6 py-4 font-mono text-mono-sm font-bold uppercase tracking-wider text-white"
              >
                Join us
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
