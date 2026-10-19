import { SectionReveal } from '@/components/ui/SectionReveal';

export function MissionSection() {
  return (
    <section className="section-padding bg-primary border-b border-border">
      <div className="container-content">
        <SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5 flex flex-col">
              <span className="font-mono text-mono-sm tracking-widest uppercase text-text-tertiary mb-4 block">
                OUR MISSION
              </span>
              <div className="w-12 h-px bg-accent mb-6"></div>
              <h2 className="text-display-md font-bold text-text-primary leading-tight">
                Building Tomorrow&apos;s Engineers
              </h2>
            </div>
            <div className="md:col-span-7 flex items-center">
              <p className="text-body-lg text-text-secondary leading-relaxed">
                {/* CUSTOMIZE */}
                ACCRC — the Adamjee Cantonment College Robotics Club — exists to ignite curiosity and build real engineering skill among students. We design, build, and program robots. We compete in national and regional competitions. We run workshops on electronics, embedded systems, and computational thinking. Every member leaves with hands-on experience that textbooks alone cannot provide.
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
