'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  CreditCard,
  BadgeCheck,
  Link2,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  accentLabel: string;
}

const steps: Step[] = [
  {
    icon: Users,
    title: 'Select Segment & Register Team',
    description:
      'Explore active competitions (Line Follower, Robo Soccer, Project Showcase, Olympiad, etc.). Fill in your institution, leader contact info, and team members.',
    accentLabel: '01 / REGISTRATION',
  },
  {
    icon: CreditCard,
    title: 'bKash & Mobile Payment',
    description:
      'Send the registration fee to the official organizer bKash number (Merchant/Personal/Nagad). Enter the 10-character Transaction ID (TrxID) in the form.',
    accentLabel: '02 / PAYMENT',
  },
  {
    icon: BadgeCheck,
    title: 'Instant Participant ID',
    description:
      'Receive an automatic unique ID (e.g. ACCRC-FEST26-TM-A1B2) to use for registration lookup and on-site verification.',
    accentLabel: '03 / CONFIRMATION',
  },
  {
    icon: Link2,
    title: 'Presentation Link Submission',
    description:
      'Applicable segments collect a shareable Google Drive, slide deck, repository, or demo-video link directly in the registration form.',
    accentLabel: '04 / PROJECT LINK',
  },
  {
    icon: CheckCircle2,
    title: 'On-Site Entry Verification',
    description:
      'Bring your Participant ID to Adamjee Cantonment College on fest day for badge verification and arena check-in.',
    accentLabel: '05 / EVENT DAY',
  },
];

export interface GuideModalProps {
  /**
   * Standard React state control.
   * STRICT CONSTRAINT: Must be controlled purely by React state (isOpen, setIsOpen).
   * NO useEffect auto-opens on page load. Triggered ONLY by explicit onClick on a Guide button.
   */
  isOpen: boolean;
  setIsOpen?: (open: boolean) => void;
  onClose?: () => void;
}

export function GuideModal({ isOpen, setIsOpen, onClose }: GuideModalProps) {
  const [step, setStep] = useState(0);

  const handleClose = useCallback(() => {
    if (setIsOpen) {
      setIsOpen(false);
    }
    onClose?.();
  }, [setIsOpen, onClose]);

  const handleGetStarted = () => {
    handleClose();
  };

  const StepIcon = steps[step].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] bg-[#141210]/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal card — centered on desktop, bottom-sheet on mobile */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Site onboarding guide"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={[
              'fixed z-[1000]',
              /* Mobile: bottom drawer */
              'bottom-0 left-0 right-0',
              /* Desktop: centered card */
              'sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2',
              'w-full sm:max-w-lg',
              'bg-[#f6f0e7] border border-[#cfc9bc]',
              'sm:rounded sm:shadow-[0_24px_64px_rgba(20,18,16,0.18)]',
              /* Mobile: rounded top corners */
              'rounded-t-2xl sm:rounded-b',
              'outline-none',
            ].join(' ')}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <span className="font-mono text-[0.65rem] font-bold tracking-[0.16em] uppercase text-[#c94030]">
                {steps[step].accentLabel}
              </span>
              <button
                onClick={handleClose}
                className="p-1.5 text-[#6b6258] hover:text-[#141210] transition-colors rounded"
                aria-label="Close guide"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="px-6 pt-6 pb-2 min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ede7da] border border-[#cfc9bc] mb-5">
                    <StepIcon className="w-5 h-5 text-[#c94030]" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#141210] leading-snug mb-3 break-words overflow-wrap-anywhere">
                    {steps[step].title}
                  </h2>
                  <p className="text-[#3a3530] leading-relaxed text-[0.9375rem] break-words overflow-wrap-anywhere">
                    {steps[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Step dots ── */}
            <div className="flex items-center gap-1.5 px-6 py-4">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step
                      ? 'bg-[#c94030] w-5'
                      : 'bg-[#cfc9bc] w-1.5 hover:bg-[#9a9088]'
                  }`}
                />
              ))}
              <span className="ml-auto font-mono text-[0.65rem] text-[#9a9088] tracking-wider">
                {step + 1} of {steps.length}
              </span>
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-[#cfc9bc] px-6 py-4 flex items-center justify-end gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#3a3530] border border-[#cfc9bc] bg-[#ede7da] hover:border-[#141210] transition-colors rounded-sm"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-mono text-xs uppercase tracking-wider bg-[#c94030] text-white hover:bg-[#a83228] transition-colors rounded-sm"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-mono text-xs uppercase tracking-wider bg-[#141210] text-white hover:bg-[#3a3530] transition-colors rounded-sm"
                >
                  Get Started
                  <Rocket size={14} />
                </button>
              )}
            </div>

            {/* Mobile drag handle */}
            <div className="flex justify-center pb-3 sm:hidden">
              <div className="w-10 h-1 bg-[#cfc9bc] rounded-full" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GuideModal;
