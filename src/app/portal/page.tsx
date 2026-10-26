'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SectionReveal } from '@/components/ui/SectionReveal';
import { Card } from '@/components/ui/Card';
import { ApplicationForm } from '@/components/portal/ApplicationForm';
import { subscribeToPortalConfig, type PortalConfig } from '@/lib/firestore';
import { CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

type LeadershipApplication = 'executive' | 'prefect' | 'sub-executive';

const APPLICATIONS: Record<LeadershipApplication, { label: string; description: string; rolesKey: keyof PortalConfig; defaultRoles: string[] }> = {
  executive: {
    label: 'Executive Panel',
    description: 'Lead the direction and operations of ACCRC.',
    rolesKey: 'execRoles',
    defaultRoles: ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Technical Director'],
  },
  prefect: {
    label: 'Prefect Application',
    description: 'Help coordinate members, activities, and club operations.',
    rolesKey: 'prefectRoles',
    defaultRoles: ['Club Prefect'],
  },
  'sub-executive': {
    label: 'Sub-Executive Application',
    description: 'Join a working team and help build ACCRC projects and events.',
    rolesKey: 'subExecRoles',
    defaultRoles: [
      'Sub-Executive (Electronics)',
      'Sub-Executive (Programming)',
      'Sub-Executive (Mechanical)',
      'Sub-Executive (Design)',
      'Sub-Executive (Media & PR)',
    ],
  },
};

function isApplicationOpen(config: PortalConfig | null, type: LeadershipApplication) {
  if (!config) return false;
  if (type === 'executive') return config.execOpen;
  if (type === 'prefect') return config.prefectOpen;
  return config.subExecOpen;
}

export default function PortalPage() {
  const [activeApplication, setActiveApplication] = useState<LeadershipApplication>('executive');
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPortalConfig((data) => {
      setConfig(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const availableApplications = useMemo(
    () => (Object.keys(APPLICATIONS) as LeadershipApplication[]).filter((type) => isApplicationOpen(config, type)),
    [config]
  );

  useEffect(() => {
    if (availableApplications.length && !availableApplications.includes(activeApplication)) {
      setActiveApplication(availableApplications[0]);
      setSuccess(false);
    }
  }, [activeApplication, availableApplications]);

  const application = APPLICATIONS[activeApplication];
  const configuredRoles = config?.[application.rolesKey];
  const roles = Array.isArray(configuredRoles) && configuredRoles.length
    ? configuredRoles
    : application.defaultRoles;

  return (
    <main className="pt-24 section-padding container-content min-h-screen">
      <SectionReveal>
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="mono-label text-[#c94030] mb-2">LEADERSHIP APPLICATIONS</div>
          <h1 className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-bold text-[#141210] mb-4">Help shape ACCRC</h1>
          <p className="text-[1.0625rem] text-[#3a3530]">
            Leadership applications are shown only while their application window is open. Membership applications remain available year-round.
          </p>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <Card className="p-12 text-center text-[#3a3530] animate-pulse">Loading application windows...</Card>
          ) : availableApplications.length === 0 ? (
            <Card className="p-10 sm:p-14 text-center">
              <Lock className="w-12 h-12 text-[#6b6258] mx-auto mb-4" />
              <h2 className="text-[clamp(1.25rem,2vw,1.55rem)] font-bold text-[#141210] mb-2">Leadership applications are closed</h2>
              <p className="text-[0.9375rem] text-[#3a3530] max-w-md mx-auto">
                Please check back when an Executive, Prefect, or Sub-Executive application window opens.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap border-b border-[#cfc9bc] mb-8" role="tablist" aria-label="Leadership application type">
                {availableApplications.map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={activeApplication === type}
                    onClick={() => { setActiveApplication(type); setSuccess(false); }}
                    className={`flex-1 min-w-40 py-4 px-3 text-center font-bold text-[0.9375rem] transition-colors ${
                      activeApplication === type
                        ? 'border-b-2 border-[#c94030] text-[#141210]'
                        : 'text-[#6b6258] hover:text-[#3a3530]'
                    }`}
                  >
                    {APPLICATIONS[type].label}
                  </button>
                ))}
              </div>

              <Card className="p-6 sm:p-8">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h2 className="text-[clamp(1.25rem,2vw,1.55rem)] font-bold text-[#141210] mb-2">Application submitted</h2>
                    <p className="text-[0.9375rem] text-[#3a3530]">Thank you. The ACCRC team will review your application.</p>
                    <button type="button" onClick={() => setSuccess(false)} className="mt-6 text-[#c94030] hover:underline text-[0.9375rem]">
                      Submit another application
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-[clamp(1.25rem,2vw,1.55rem)] font-bold text-[#141210] mb-2">{application.label}</h2>
                    <p className="text-[0.9375rem] text-[#3a3530] mb-8">{application.description}</p>
                    <ApplicationForm type={activeApplication} roles={roles} onSuccess={() => setSuccess(true)} />
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </SectionReveal>
    </main>
  );
}
