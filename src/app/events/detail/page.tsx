'use client'

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { subscribeToEvent, type FirestoreEvent } from '@/lib/publicData';
import { EventStatus } from '@/components/events/EventStatus';
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm';
import { Countdown } from '@/components/events/Countdown';
import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function EventDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [event, setEvent] = useState<FirestoreEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToEvent(id, (data) => {
      if (data) {
        setEvent(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <div className="text-text-secondary animate-pulse">Loading event details...</div>;
  }

  if (error || !event) {
    return <div className="text-danger">Event not found.</div>;
  }

  const openAt = event.registrationOpensAt ? new Date(event.registrationOpensAt) : undefined;
  const closeAt = event.registrationClosesAt ? new Date(event.registrationClosesAt) : undefined;
  const hasRegistrationWindow = Boolean(openAt && closeAt);
  let status = 'closed';
  if (openAt && closeAt && now < openAt) status = 'upcoming';
  else if (openAt && closeAt && now >= openAt && now < closeAt) status = 'open';

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/events" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">{event.name}</h1>
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <span className="font-mono text-text-secondary">
            {new Date(event.date).toLocaleString(undefined, { 
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </span>
          <div className="flex items-center text-text-secondary">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{event.location}</span>
          </div>
        </div>
        <EventStatus registrationOpensAt={openAt} registrationClosesAt={closeAt} />
      </div>

      <div className="prose prose-invert max-w-none mb-16 text-text-secondary">
        <p className="whitespace-pre-wrap">{event.description}</p>
      </div>

      <div className="border-t border-border pt-12">
        {status === 'open' && (
          <EventRegistrationForm eventId={event.id} eventName={event.name} />
        )}
        
        {status === 'upcoming' && openAt && (
          <div className="bg-secondary border border-border p-8 text-center max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-text-primary mb-4">Registration Opens Soon</h3>
            <div className="flex justify-center">
              <Countdown targetDate={openAt} />
            </div>
          </div>
        )}

        {hasRegistrationWindow && status === 'closed' && (
          <div className="bg-secondary border border-border p-8 text-center max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-text-secondary mb-2">Registration Closed</h3>
            <p className="text-text-tertiary">Registration for this event has closed.</p>
          </div>
        )}

        {!hasRegistrationWindow && (
          <div className="bg-secondary border border-border p-8 text-center max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-text-secondary mb-2">Registration details coming soon</h3>
            <p className="text-text-tertiary">Please follow ACCRC for registration announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <div className="pt-24 min-h-screen bg-primary px-4 sm:px-6 lg:px-8 pb-20">
      <Suspense fallback={<div className="text-text-secondary max-w-4xl mx-auto pt-10">Loading...</div>}>
        <EventDetailContent />
      </Suspense>
    </div>
  );
}
