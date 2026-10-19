'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { submitApplication } from '@/lib/publicData';

interface ApplicationFormProps {
  type: 'sub-executive' | 'executive' | 'prefect';
  roles: string[];
  onSuccess: () => void;
}

export function ApplicationForm({ type, roles, onSuccess }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      type,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      whatsapp: formData.get('whatsapp') as string,
      idNumber: formData.get('idNumber') as string,
      section: formData.get('section') as string,
      roleApplyingFor: formData.get('role') as string,
      pastExperience: formData.get('experience') as string,
      visionStatement: formData.get('vision') as string,
      status: 'pending',
      submittedAt: new Date(),
    };

    try {
      await submitApplication(data);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit application', err);
      setError('An error occurred while submitting your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 border border-danger text-danger bg-danger/10 rounded-md text-body-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-body-sm text-text-secondary mb-2">Full Name</label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-body-sm text-text-secondary mb-2">Email Address</label>
        <Input 
          type="email" 
          id="email" 
          name="email" 
          required 
          autoComplete="email"
          placeholder="your.email@example.com" 
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-body-sm text-text-secondary mb-2">WhatsApp Number</label>
        <Input
          type="tel"
          id="whatsapp"
          name="whatsapp"
          required
          autoComplete="tel"
          placeholder="e.g. +880 1XXX-XXXXXX"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="idNumber" className="block text-body-sm text-text-secondary mb-2">ID Number</label>
          <Input 
            type="text" 
            id="idNumber" 
            name="idNumber" 
            required 
            placeholder="e.g. 23100" 
          />
        </div>
        <div>
          <label htmlFor="section" className="block text-body-sm text-text-secondary mb-2">Section</label>
          <Input 
            type="text" 
            id="section" 
            name="section" 
            required 
            placeholder="e.g. Science - A" 
          />
        </div>
      </div>

      <div>
        <label htmlFor="role" className="block text-body-sm text-text-secondary mb-2">Role Applying For</label>
        <Select 
          id="role" 
          name="role" 
          required 
          placeholder="Select a role..."
          options={roles.map(role => ({ value: role, label: role }))}
        />
      </div>

      <div>
        <label htmlFor="experience" className="block text-body-sm text-text-secondary mb-2">Past Experience</label>
        <Textarea 
          id="experience" 
          name="experience" 
          required 
          rows={4}
          placeholder="Describe any relevant experience in robotics, programming, electronics, or leadership..." 
        />
      </div>

      <div>
        <label htmlFor="vision" className="block text-body-sm text-text-secondary mb-2">Vision Statement</label>
        <Textarea 
          id="vision" 
          name="vision" 
          required 
          rows={4}
          placeholder="What is your vision for ACCRC? How would you contribute in this role?" 
        />
      </div>

      <Button type="submit" loading={loading} className="w-full justify-center">
        {loading ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
}
