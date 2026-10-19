'use client'

import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { submitRegistration } from '@/lib/firestore';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function MembershipForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', whatsapp: '', classSection: '', collegeId: '', motivation: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleNext = () => {
    // Basic client validation
    if (step === 1 && (!formData.name || !formData.email || !formData.whatsapp)) return;
    if (step === 2 && (!formData.classSection || !formData.collegeId)) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.motivation) return;
    
    setStatus('loading');
    try {
      await submitRegistration({ type: 'membership', ...formData });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 border border-[#cfc9bc] bg-[#ede7da] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-16 h-16 text-[#c94030] mb-6" />
        </motion.div>
        <h3 className="text-2xl font-bold text-[#141210] mb-3">Application Submitted</h3>
        <p className="text-[#3a3530] mb-8 max-w-md">
          Thank you for applying to ACCRC. We will review your application and contact you soon via email.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="border border-[#cfc9bc] bg-[#ede7da] p-6 md:p-10 w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-border z-0" />
        {[1, 2, 3].map((num) => (
          <div key={num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono transition-all duration-300
              ${step > num ? 'bg-[#c94030] text-[#141210] border-[#c94030]' : 
                step === num ? 'bg-ink text-[#c94030] border-[#c94030] shadow-[0_0_10px_rgba(10,132,255,0.5)]' : 
                'bg-[#ede7da] text-[#6b6258] border-[#cfc9bc]'} border`}
            >
              {num}
            </div>
            <span className={`text-xs absolute -bottom-6 whitespace-nowrap ${step >= num ? 'text-[#3a3530]' : 'text-[#6b6258]'}`}>
              {num === 1 ? 'Personal' : num === 2 ? 'Academic' : 'Motivation'}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input required type="tel" autoComplete="tel" placeholder="WhatsApp number (e.g. +880 1XXX-XXXXXX)" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input required placeholder="Class/Section" value={formData.classSection} onChange={e => setFormData({...formData, classSection: e.target.value})} />
                <Input required placeholder="College ID" value={formData.collegeId} onChange={e => setFormData({...formData, collegeId: e.target.value})} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Textarea 
                required 
                placeholder="Why do you want to join ACCRC? What do you hope to learn or build?" 
                rows={5} 
                value={formData.motivation} 
                onChange={e => setFormData({...formData, motivation: e.target.value})} 
              />
              {status === 'error' && <p className="text-[#c72c2c] text-sm">{errorMsg}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-10 pt-6 border-t border-[#cfc9bc]">
          <Button type="button" onClick={handleBack} disabled={step === 1 || status === 'loading'} className="opacity-50 hover:opacity-100 transition-opacity">
            Back
          </Button>
          
          {step < 3 ? (
            <Button type="button" onClick={handleNext} disabled={status === 'loading'}>Next Step</Button>
          ) : (
            <Button type="submit" loading={status === 'loading'} className="min-w-[140px]">
              {status === 'loading' ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
