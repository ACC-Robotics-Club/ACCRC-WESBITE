'use client';

import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { ScrollFillText } from '@/components/fx/ScrollFillText';
import { Parallax } from '@/components/fx/Parallax';
import { ScrollSlide } from '@/components/fx/ScrollSlide';

/* Only facts the club can stand behind: the founding year and what the
   published achievements record shows. No invented figures. */
const history =
  'The Adamjee Cantonment College Robotics Club was founded in 2019 by a group of students who believed that engineering skills should not wait until university. Today, ACCRC members build projects in robotics, electronics, and computational thinking, and represent the college at national and international competitions.';

export default function AboutPage() {
  return (
    <main className="bg-primary">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div
          className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_70%_at_35%_30%,black,transparent)]"
          aria-hidden
        />
        <div
          className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-secondary animate-float-slow"
          aria-hidden
        />
        <div
          className="absolute right-[8%] top-24 h-40 w-40 rounded-3xl bg-tertiary animate-float-slow [animation-delay:-4s]"
          aria-hidden
        />
        <div
          className="absolute bottom-10 left-[46%] h-20 w-20 rounded-full bg-glow/25 animate-float-slow [animation-delay:-2s]"
          aria-hidden
        />

        <div className="container-content relative">
          <ScrollSlide axis="y" from={60} to={-14}>
            <Reveal>
              <p className="mono-label mb-5 flex items-center gap-3 text-accent">
                <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                ABOUT
              </p>
            </Reveal>
          </ScrollSlide>

          <SplitReveal
            delay={0.1}
            className="font-display text-display-lg font-black text-ink"
            lines={[
              <>The Story Behind</>,
              <>
                <span className="text-text-tertiary">ACCRC</span>
              </>,
            ]}
          />

          <div className="mt-14 h-px bg-border-strong" aria-hidden />
        </div>
      </section>

      {/* ═══ HISTORY — ink depth panel + stat cards ═══ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-24">
        <div className="container-content relative grid gap-10 lg:grid-cols-12 lg:gap-12">
          <ScrollSlide axis="y" from={120} to={-16} className="lg:col-span-7">
            <TiltCard
              maxTilt={4}
              className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-9 text-[#F7F5EE] shadow-[0_40px_100px_-50px_rgba(28,25,23,0.5)] sm:p-12"
            >
              <div className="dot-grid-light absolute inset-0 opacity-20" aria-hidden />
              <div
                className="pointer-events-none absolute -right-10 bottom-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.16),transparent_68%)]"
                aria-hidden
              />
              {/* Year watermark lives inside the clipped panel, so it can never
                  collide with the cards in the next column. */}
              <Parallax
                speed={-8}
                className="pointer-events-none absolute -right-8 -top-10 select-none"
                aria-hidden
              >
                <p className="font-display text-[9rem] font-black leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,122,89,0.2)] sm:text-[11rem]">
                  2019
                </p>
              </Parallax>

              <div className="relative">
                <p className="mono-label mb-5 flex items-center gap-3 text-glow">
                  <span className="inline-block h-px w-10 bg-glow" aria-hidden />
                  OUR HISTORY
                </p>
                <h2 className="font-display text-display-md font-black tracking-display">
                  Our History
                </h2>
                <ScrollFillText
                  fill="#FF7A59"
                  base="rgba(247,245,238,0.35)"
                  className="mt-7 text-display-xs font-extrabold leading-snug tracking-tight"
                >
                  {history}
                </ScrollFillText>
              </div>
            </TiltCard>
          </ScrollSlide>

          <div className="grid content-start gap-5 lg:col-span-5">
            <ScrollSlide axis="y" from={80} to={-14}>
              <TiltCard className="h-full rounded-2xl border-2 border-border-strong bg-secondary p-7">
                <div className="font-display text-display-md font-black tracking-display text-accent">2019</div>
                <div className="mono-label mt-2 text-text-secondary">Established</div>
              </TiltCard>
            </ScrollSlide>
            <ScrollSlide axis="y" from={110} to={-14}>
              <a
                href="/#achievements"
                className="group flex h-full items-center justify-between gap-4 rounded-2xl border-2 border-border-strong bg-secondary p-7 transition-colors hover:border-accent"
              >
                <span>
                  <span className="block font-display text-display-xs font-extrabold text-ink">Achievements &amp; leadership</span>
                  <span className="mono-label mt-2 block text-text-secondary">The full record on the home page</span>
                </span>
                <ArrowRight size={22} className="shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </a>
            </ScrollSlide>
          </div>
        </div>
      </section>

    </main>
  );
}
