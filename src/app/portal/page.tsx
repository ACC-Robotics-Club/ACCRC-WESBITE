'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SectionReveal } from '@/components/ui/SectionReveal';
import { Card } from '@/components/ui/Card';
import { ApplicationForm } from '@/components/portal/ApplicationForm';
import { subscribeToPortalConfig, type PortalConfig } from '@/lib/publicData';
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
          <div className="mono-label mb-4 flex items-center justify-center gap-3 text-accent">
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
            LEADERSHIP APPLICATIONS
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          </div>
          <h1 className="mb-4 font-display text-display-md font-black tracking-display text-ink">
            Help shape ACCRC
          </h1>
          <p className="text-body-lg text-text-secondary">
            Leadership applications are shown only while their application window is open. Membership applications remain available year-round.
          </p>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <Card className="p-12 text-center text-text-secondary animate-pulse">Loading application windows...</Card>
          ) : availableApplications.length === 0 ? (
            <Card className="p-10 sm:p-14 text-center">
              <Lock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h2 className="text-display-xs font-bold text-text-primary mb-2">Leadership applications are closed</h2>
              <p className="text-body-sm text-text-secondary max-w-md mx-auto">
                Please check back when an Executive, Prefect, or Sub-Executive application window opens.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap border-b border-border mb-8" role="tablist" aria-label="Leadership application type">
                {availableApplications.map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={activeApplication === type}
                    onClick={() => { setActiveApplication(type); setSuccess(false); }}                      className={`flex-1 min-w-40 py-4 px-3 text-center mono-label transition-colors ${
                      activeApplication === type
                        ? 'border-b-2 border-accent text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {APPLICATIONS[type].label}
                  </button>
                ))}
              </div>

              <Card className="p-6 sm:p-8">
                {success ? (
                  <motion.div
                    initial={{ y: 32 }}
                    animate={{ y: 0 }}
                    className="text-center py-12"
                  >
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h2 className="text-display-xs font-bold text-text-primary mb-2">Application submitted</h2>
                    <p className="text-body-sm text-text-secondary">Thank you. The ACCRC team will review your application.</p>
                    <button type="button" onClick={() => setSuccess(false)} className="mt-6 text-accent hover:underline text-body-sm">
                      Submit another application
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-display-xs font-bold text-text-primary mb-2">{application.label}</h2>
                    <p className="text-body-sm text-text-secondary mb-8">{application.description}</p>
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
