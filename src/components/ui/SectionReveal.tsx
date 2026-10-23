"use client";

import React from "react";
import { Reveal } from "@/components/fx/Reveal";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

/** Slides a block into place — no fade, matching the rest of the site. */
export function SectionReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: SectionRevealProps) {
  return (
    <Reveal className={className} delay={delay} direction={direction}>
      {children}
    </Reveal>
  );
}