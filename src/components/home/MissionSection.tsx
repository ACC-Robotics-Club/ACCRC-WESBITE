
import { SectionReveal } from '@/components/ui/SectionReveal';

export function MissionSection() {
  return (
    <section className="section-padding bg-[#f6f0e7] border-b border-[#cfc9bc]">
      <div className="container-content">
        <SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            <div className="md:col-span-5 flex flex-col">
              <span className="font-mono text-[0.72rem] font-bold tracking-[0.16em] uppercase text-[#6b6258] mb-4 flex items-center gap-2.5">
                <span className="inline-block w-5 h-px bg-[#c94030]" />
                Our Mission
              </span>
              <h2 className="font-black text-[#141210] leading-[0.92] tracking-tight mb-0 mt-2"
                  style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)' }}>
                Building Tomorrow&apos;s<br />Engineers
              </h2>
            </div>
            <div className="md:col-span-7 flex items-center">
              <p className="text-[1.0625rem] leading-[1.78] text-[#3a3530] m-0">
                ACCRC — the Adamjee Cantonment College Robotics Club — exists to ignite curiosity
                and build real engineering skill among students. We design, build, and program robots.
                We compete in national and regional competitions. We run workshops on electronics,
                embedded systems, and computational thinking. Every member leaves with hands-on
                experience that textbooks alone cannot provide.
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
