'use client';

import React from 'react';
import { GuideModal } from '@/components/GuideModal';

export interface OnboardingModalProps {
  forceOpen?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onClose?: () => void;
}

/**
 * OnboardingModal wrapper for GuideModal.
 * Controlled strictly by React state (forceOpen / isOpen).
 * No auto-opening useEffect.
 */
export function OnboardingModal({ forceOpen = false, isOpen, setIsOpen, onClose }: OnboardingModalProps) {
  const activeOpen = isOpen !== undefined ? isOpen : forceOpen;
  return <GuideModal isOpen={activeOpen} setIsOpen={setIsOpen} onClose={onClose} />;
}

export { GuideModal };
export default OnboardingModal;
