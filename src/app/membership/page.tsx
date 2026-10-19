import { MembershipForm } from '@/components/membership/MembershipForm';
import { Check } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { ScrollSlide } from '@/components/fx/ScrollSlide';

const benefits = [
  'Access to workshops, tools, and lab resources',
  'Opportunity to compete in national robotics competitions',
  'Hands-on experience with electronics, programming, and mechanical design',
  'A community of like-minded student engineers',
];

export default function MembershipPage() {
  return (
    <div className="bg-primary pt-32 min-h-screen">
      <div className="container-content py-12 md:py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-8 items-start">
          {/* Left Column: Info */}
          <div>
            <Reveal>
              <p className="mono-label mb-4 flex items-center gap-3 text-accent">
                <span className="inline-block h-px w-10 bg-accent" aria-hidden />
                MEMBERSHIP
              </p>
            </Reveal>
            <SplitReveal
              delay={0.1}
              className="font-display text-display-md font-black text-ink"
              lines={[
                <>Join the</>,
                <><span className="text-accent">Mission.</span></>,
              ]}
            />

            <Reveal delay={0.2}>
              <p className="mb-8 mt-7 text-body-lg text-text-secondary">
                Ready to build the future? The Adamjee Cantonment College Robotics Club is looking for passionate students to join our ranks.
              </p>
            </Reveal>

            <div className="space-y-6">
              <Reveal delay={0.24}>
                <h3 className="font-display text-display-xs font-extrabold tracking-tight text-ink">
                  What ACCRC membership gives you:
                </h3>
              </Reveal>
              <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                  <ScrollSlide key={benefit} as="li" axis="y" from={60 + i * 18} to={-12} delay={i * 0.05}>
                    <div className="flex items-start gap-4 rounded-2xl border-2 border-border bg-secondary p-4 transition-colors duration-300 hover:border-accent">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white" aria-hidden>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-body-sm text-text-secondary">{benefit}</span>
                    </div>
                  </ScrollSlide>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Form */}
          <ScrollSlide axis="y" from={120} to={-16}>
            <div className="lg:mt-0">
              <MembershipForm />
            </div>
          </ScrollSlide>
        </div>
      </div>
    </div>
  );
}
