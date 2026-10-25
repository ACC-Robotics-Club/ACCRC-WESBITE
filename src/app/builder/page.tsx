import type { Metadata } from 'next';
import {
  ArrowUpRight,
  Box,
  CircuitBoard,
  ClipboardList,
  Code,
  CornerDownLeft,
  Library,
  ListOrdered,
  NotebookPen,
  Zap,
} from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';

export const metadata: Metadata = {
  title: 'Builder — ACCRC',
  description:
    'Describe a robot in one prompt and AetherLabs Forge returns the CAD, code, BOM, circuit diagram and a step-by-step build guide.',
};

const BUILDER_URL = 'https://aetherlabsforge.vercel.app';

const outputs = ['CAD', 'Code', 'BOM', 'Circuit', 'Build steps'];

const features = [
  {
    icon: Box,
    title: 'CAD',
    body: 'A 3D model of the chassis and mounts, ready to inspect, tweak and print.',
  },
  {
    icon: Code,
    title: 'Code',
    body: 'Firmware for your board, written for the exact sensors and motors in the build.',
  },
  {
    icon: ClipboardList,
    title: 'BOM',
    body: 'A full bill of materials: every part, quantity and spec you need to source.',
  },
  {
    icon: CircuitBoard,
    title: 'Circuit diagram',
    body: 'A wiring diagram that shows how every pin, sensor and power line connects.',
  },
  {
    icon: ListOrdered,
    title: 'Step-by-step builder',
    body: 'Assembly broken into clear steps, from the first screw to the first test run.',
  },
  {
    icon: Library,
    title: 'Research base',
    body: 'Grounded in references and prior builds, so you can see why each choice was made.',
  },
  {
    icon: NotebookPen,
    title: 'Gemini notebook',
    body: 'A notebook powered by Google Gemini: ask questions about your build, keep notes and log every iteration in one place.',
    wide: true,
  },
];

export default function BuilderPage() {
  return (
    <main className="bg-primary">
      <section className="relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44">
        <div
          className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_70%_at_50%_30%,black,transparent)]"
          aria-hidden
        />

        <div className="container-content relative">
          <Reveal>
            <p className="mono-label mb-5 text-accent">ACCRC × AetherLabs</p>
            <h1 className="font-display text-display-xl font-black text-ink">
              Builder<span className="text-accent">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-text-secondary">
              One prompt in, a whole robot out. Describe what you want to build and AetherLabs
              Forge gives you the CAD, code, BOM, circuit diagram and a step-by-step guide to put
              it together.
            </p>
          </Reveal>

          {/* Launch panel */}
          <Reveal delay={0.1} className="mt-12 sm:mt-16">
            <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-ink p-6 text-white sm:p-10 lg:p-14">
              <div className="line-grid absolute inset-0 opacity-20" aria-hidden />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full text-white/15"
                viewBox="0 0 800 400"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden
              >
                <path d="M0 60 H180 L230 110 H420" stroke="currentColor" strokeWidth="1.5" />
                <path d="M800 320 H600 L550 270 H430" stroke="currentColor" strokeWidth="1.5" />
                <path d="M640 0 V90 L700 150 H800" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="420" cy="110" r="4" fill="currentColor" />
                <circle cx="430" cy="270" r="4" fill="currentColor" />
                <circle cx="700" cy="150" r="4" fill="currentColor" />
              </svg>

              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 font-mono text-mono-sm font-bold uppercase tracking-wider text-glow">
                    <span className="h-1.5 w-1.5 rounded-full bg-glow animate-pulse-dot" aria-hidden />
                    Live
                  </span>
                  <h2 className="mt-5 font-display text-display-md font-black">
                    Prompt it. Build it.
                  </h2>

                  {/* Sample prompt */}
                  <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
                    <p className="font-mono text-mono-sm uppercase tracking-wider text-white/40">
                      Prompt
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <p className="text-body-md text-white/85">
                        A line-following robot with an ESP32, two IR sensors and a 3D-printed
                        chassis.
                      </p>
                      <CornerDownLeft size={18} className="mt-1 shrink-0 text-glow" aria-hidden />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      {outputs.map((o) => (
                        <span
                          key={o}
                          className="rounded-full bg-white/10 px-3 py-1 font-mono text-mono-sm font-bold uppercase tracking-wider text-white/80"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <a
                  href={BUILDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 self-start rounded-2xl bg-accent px-8 py-5 font-mono text-body-sm font-bold uppercase tracking-wider text-white shadow-[0_16px_40px_-12px_rgba(200,67,44,0.6)] transition-all duration-200 hover:bg-accent-hover active:scale-95 lg:self-center"
                >
                  <Zap size={18} aria-hidden />
                  Open Builder
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </div>
          </Reveal>

          {/* What you get */}
          <Reveal delay={0.1} className="mt-16 sm:mt-20">
            <p className="mono-label text-accent">What one prompt gives you</p>
            <h2 className="mt-3 font-display text-display-sm font-black text-ink">
              Everything to go from idea to robot.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body, wide }, i) => (
              <Reveal
                key={title}
                delay={0.1 + (i % 4) * 0.06}
                className={wide ? 'sm:col-span-2' : undefined}
              >
                <div className="h-full rounded-2xl border border-border bg-secondary p-6 transition-colors duration-200 hover:border-border-strong">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary text-accent">
                      <Icon size={20} aria-hidden />
                    </div>
                    <span className="font-mono text-mono-sm font-bold text-text-tertiary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-display-xs font-extrabold text-ink">{title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* From AetherLabs */}
          <Reveal delay={0.2} className="mt-16 sm:mt-20">
            <a
              href={BUILDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-auto flex w-fit items-center gap-4 rounded-2xl border border-border bg-secondary py-3 pl-3 pr-6 transition-colors duration-200 hover:border-border-strong"
            >
              <img
                src="/aetherlabs-logo.webp"
                alt="AetherLabs logo"
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl"
              />
              <div className="leading-tight">
                <span className="mono-label text-text-tertiary">from</span>
                <p className="font-display text-display-xs font-black text-ink">AetherLabs</p>
              </div>
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
