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
      // Hidden events are not public, even with a direct link.
      if (data && data.isLaunched !== false) {
        setEvent(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <div className="text-[#3a3530] animate-pulse">Loading event details...</div>;
  }

  if (error || !event) {
    return <div className="text-[#c72c2c]">Event not found.</div>;
  }

  const openAt = event.registrationOpensAt ? new Date(event.registrationOpensAt) : undefined;
  const closeAt = event.registrationClosesAt ? new Date(event.registrationClosesAt) : undefined;
  const hasRegistrationWindow = Boolean(openAt && closeAt);
  let status = 'closed';
  if (openAt && closeAt && now < openAt) status = 'upcoming';
  else if (openAt && closeAt && now >= openAt && now < closeAt) status = 'open';

  return (
    <div className="motion-intro max-w-4xl mx-auto">
      <Link href="/events" className="inline-flex items-center text-sm text-[#3a3530] hover:text-ink mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-[#141210] mb-4">{event.name}</h1>
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <span className="font-mono text-[#3a3530]">
            {new Date(event.date).toLocaleString(undefined, { 
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </span>
          <div className="flex items-center text-[#3a3530]">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{event.location}</span>
          </div>
        </div>
        <EventStatus registrationOpensAt={openAt} registrationClosesAt={closeAt} />
      </div>

      <div className="max-w-none mb-16 text-[#3a3530]">
        <p className="whitespace-pre-wrap">{event.description}</p>
      </div>

      <div className="motion-rise border-t border-[#cfc9bc] pt-12">
        {event.isLaunched === false ? (
          <div className="bg-[#ede7da] border border-[#cfc9bc] p-8 text-center max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-[#3a3530] mb-2">Registrations Closed</h3>
            <p className="text-[#6b6258]">Registration for this event is currently not open or has not been launched.</p>
          </div>
        ) : (
          <>
            {status === 'open' && (
              <EventRegistrationForm eventId={event.id} eventName={event.name} eventFields={event.formFields} />
            )}

            {status === 'upcoming' && openAt && (
              <div className="bg-[#ede7da] border border-[#cfc9bc] p-8 text-center max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-[#141210] mb-4">Registration Opens Soon</h3>
                <div className="flex justify-center">
                  <Countdown targetDate={openAt} />
                </div>
              </div>
            )}

            {hasRegistrationWindow && status === 'closed' && (
              <div className="bg-[#ede7da] border border-[#cfc9bc] p-8 text-center max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-[#3a3530] mb-2">Registration Closed</h3>
                <p className="text-[#6b6258]">Registration for this event has closed.</p>
              </div>
            )}

            {!hasRegistrationWindow && (
              <div className="bg-[#ede7da] border border-[#cfc9bc] p-8 text-center max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-[#3a3530] mb-2">Registration details coming soon</h3>
                <p className="text-[#6b6258]">Please follow ACCRC for registration announcements.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <div className="pt-32 min-h-screen bg-[#f6f0e7] px-4 sm:px-6 lg:px-8 pb-20">
      <Suspense fallback={<div className="text-[#3a3530] max-w-4xl mx-auto pt-10">Loading...</div>}>
        <EventDetailContent />
      </Suspense>
    </div>
  );
}
