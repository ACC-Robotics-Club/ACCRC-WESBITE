'use client'

import { useMemo, useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { submitRegistration } from '@/lib/publicData';
import { DEFAULT_EVENT_FORM_FIELDS, type FormField } from '@/lib/firestore';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * The event's registration form, rendered from the questions the admin chose
 * in the events portal (`event.formFields`). Missing/empty list keeps the
 * club's standard seven-question form so older events keep working.
 */
export function EventRegistrationForm({
  eventId,
  eventName,
  eventFields,
}: {
  eventId: string,
  eventName: string,
  eventFields?: FormField[],
}) {
  const fields = useMemo<FormField[]>(
    () => (eventFields && eventFields.length > 0 ? eventFields : DEFAULT_EVENT_FORM_FIELDS),
    [eventFields],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const findValue = (needle: string): string => {
    const field = fields.find((f) => f.label.toLowerCase().trim() === needle);
    return field ? (answers[field.id] || '') : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await submitRegistration({
        type: 'event',
        eventId,
        /* Keep the shared columns populated when the admin kept standard
           questions, so the events portal's table works out of the box. */
        name: findValue('full name') || findValue('name') || '',
        email: findValue('email') || findValue('email address') || '',
        phone: findValue('phone number') || findValue('phone') || '',
        classSection: findValue('class/section') || findValue('class') || '',
        motivation: findValue('motivation') || '',
        /* Every answer, including the ones above plus custom questions. */
        answers: fields.map((f) => ({ id: f.id, label: f.label, value: answers[f.id] || '' })),
      } as Parameters<typeof submitRegistration>[0]);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg((err as Error)?.message || 'An error occurred during registration. Please try again.');
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

      {fields.map((field) => {
        const value = answers[field.id] || '';
        const set = (v: string) => setAnswers((prev) => ({ ...prev, [field.id]: v }));

        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.id}
              required={field.required}
              placeholder={field.placeholder || field.label}
              rows={4}
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          );
        }
        if (field.type === 'select') {
          return (
            <Select
              key={field.id}
              required={field.required}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set(e.target.value)}
              placeholder={field.placeholder || field.label}
              options={(field.options || []).map((o) => ({ value: o, label: o }))}
            />
          );
        }
        return (
          <Input
            key={field.id}
            required={field.required}
            type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder || field.label}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        );
      })}

      {status === 'error' && <p className="text-[#c72c2c] text-sm">{errorMsg}</p>}

      <Button type="submit" loading={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Submitting...' : 'Complete Registration'}
      </Button>
    </form>
  );
}
