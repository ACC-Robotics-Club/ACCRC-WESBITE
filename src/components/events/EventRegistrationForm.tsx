'use client'

import { useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { submitRegistration } from '@/lib/publicData';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function EventRegistrationForm({ eventId, eventName }: { eventId: string, eventName: string }) {
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', classSection: '', rollNumber: '', areaOfInterest: '', motivation: '' 
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await submitRegistration({ type: 'event', eventId, ...formData });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred during registration. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 border border-[#cfc9bc] bg-[#ede7da] text-center"
      >
        <CheckCircle className="w-12 h-12 text-success mb-4" />
        <h3 className="text-xl font-bold text-[#141210] mb-2">Registration Submitted Successfully</h3>
        <p className="text-[#3a3530]">We look forward to seeing you at {eventName}.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl border border-[#cfc9bc] p-6 md:p-8 bg-[#ede7da]">
      <div>
        <h3 className="text-xl font-bold mb-1">Register for {eventName}</h3>
        <p className="text-sm text-[#3a3530] mb-6">Please fill out all required fields below.</p>
      </div>

      <Input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      <Input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input required placeholder="Class/Section" value={formData.classSection} onChange={e => setFormData({...formData, classSection: e.target.value})} />
        <Input required placeholder="Roll Number" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
      </div>

      <Select 
        required 
        value={formData.areaOfInterest} 
        onChange={(e: any) => setFormData({...formData, areaOfInterest: e.target.value})}
        placeholder="Area of Interest"
        options={[
          { value: "Mechanical", label: "Mechanical" },
          { value: "Electronics", label: "Electronics" },
          { value: "Programming", label: "Programming" },
          { value: "Design", label: "Design" }
        ]}
      />

      <Textarea required placeholder="Motivation (Why do you want to join?)" rows={4} value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} />
      
      {status === 'error' && <p className="text-[#c72c2c] text-sm">{errorMsg}</p>}
      
      <Button type="submit" loading={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Submitting...' : 'Complete Registration'}
      </Button>
    </form>
  );
}
