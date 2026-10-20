'use client';

import { User } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { Counter } from '@/components/fx/Counter';
import { ScrollFillText } from '@/components/fx/ScrollFillText';
import { Parallax } from '@/components/fx/Parallax';
import { ScrollSlide } from '@/components/fx/ScrollSlide';

const stats = [
  { value: 50, suffix: '+', label: 'Active Members' },
  { value: 10, suffix: '+', label: 'Competitions' },
  { value: 20, suffix: '+', label: 'Workshops Held' },
  { value: 2019, suffix: '', label: 'Established' },
];

const history =
  'The Adamjee Cantonment College Robotics Club was founded by a group of students who believed that engineering skills should not wait until university. What started as informal tinkering sessions in a classroom has grown into one of the most active student-led technical clubs in Dhaka. Today, ACCRC competes in national robotics olympiads, runs hands-on workshops open to all students, and maintains a growing inventory of components, tools, and project platforms.';

const team = [
  { name: '[President Name]', role: 'PRESIDENT', bio: 'Leads club strategy and external partnerships.' },
  { name: '[VP Name]', role: 'VICE PRESIDENT', bio: 'Oversees operations and event coordination.' },
  { name: '[Tech Lead]', role: 'TECHNICAL LEAD', bio: 'Guides all technical projects and R&D.' },
  { name: '[Secretary]', role: 'SECRETARY', bio: 'Manages communications and documentation.' },
];

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

          {/* Editorial rule + section index rail */}
          <div className="mt-14 flex items-end gap-8">
            <span className="h-px flex-1 bg-border-strong" aria-hidden />
            <span className="mono-label text-text-tertiary" aria-hidden>
              01 — 02
            </span>
          </div>
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
                className="pointer-events-none absolute -right-10 bottom-8 h-64 w-64 rounded-full bg-glow/15 blur-3xl"
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

          <div className="grid content-start gap-5 sm:grid-cols-2 lg:col-span-5">
            {stats.map((stat, i) => (
              <ScrollSlide
                key={stat.label}
                axis="y"
                from={80 + i * 30}
                to={-14}
                className={i === stats.length - 1 ? 'sm:col-span-2' : ''}
              >
                <TiltCard className="h-full rounded-2xl border-2 border-border-strong bg-secondary p-7">
                  <span className="mono-label mb-3 block text-text-tertiary" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="font-display text-display-md font-black tracking-display text-accent">
                    <Counter value={stat.value} suffix={stat.suffix} duration={1600} />
                  </div>
                  <div className="mono-label mt-2 text-text-secondary">{stat.label}</div>
                </TiltCard>
              </ScrollSlide>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section className="relative border-t-2 border-border-strong bg-tertiary/50 section-padding">
        <div
          className="dot-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
          aria-hidden
        />
        <div className="container-content relative">
          <div className="mb-14 grid items-end gap-6 md:grid-cols-12">
            <ScrollSlide axis="y" from={90} to={-16} className="md:col-span-8">
              <p className="mono-label mb-5 flex items-center gap-3 text-accent">
                <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                LEADERSHIP
              </p>
              <h2 className="font-display text-display-md font-black tracking-display text-ink">
                Meet the Team
              </h2>
            </ScrollSlide>
            <ScrollSlide axis="y" from={70} to={-16} className="md:col-span-4 md:text-right">
              <span className="mono-label text-text-tertiary" aria-hidden>
                02 — 02
              </span>
            </ScrollSlide>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <ScrollSlide key={member.name} axis="y" from={90 + i * 30} to={-14}>
                <TiltCard className="h-full rounded-2xl border-2 border-border-strong bg-secondary p-7 text-center">
                  <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center">
                    <span
                      className="absolute inset-0 rounded-full border-2 border-border"
                      aria-hidden
                    />
                    <span
                      className="absolute inset-0 rounded-full bg-glow/20 animate-pulse-dot"
                      aria-hidden
                    />
                    <User className="relative h-8 w-8 text-accent" aria-hidden />
                  </div>
                  <h3 className="font-display text-body-md font-extrabold text-ink">
                    {member.name}
                  </h3>
                  <div className="mono-label mt-2 text-accent">{member.role}</div>
                  <p className="mt-3 text-body-xs text-text-secondary">{member.bio}</p>
                </TiltCard>
              </ScrollSlide>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
