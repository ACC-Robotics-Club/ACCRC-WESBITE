'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { getAllEvents, createEvent, updateEvent, deleteEvent, getRegistrations, deleteRegistration, FirestoreEvent, Registration } from '@/lib/firestore';
import { getEventStatus } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react';
import { DeleteModal } from '@/components/admin/DeleteModal';

export default function AdminEvents() {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreEvent | null>(null);
  const [registrationDeleteTarget, setRegistrationDeleteTarget] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    registrationOpensAt: '',
    registrationClosesAt: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(eventId: string) {
    if (registrations[eventId]) {
      setExpandedEventId(expandedEventId === eventId ? null : eventId);
      return;
    }
    
    try {
      const regs = await getRegistrations({ eventId });
      setRegistrations(prev => ({ ...prev, [eventId]: regs }));
      setExpandedEventId(expandedEventId === eventId ? null : eventId);
    } catch (err) {
      console.error('Failed to load registrations', err);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      date: '',
      location: '',
      registrationOpensAt: '',
      registrationClosesAt: '',
      imageUrl: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const toDatetimeLocal = (date: Date) => {
    if (!date) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleEdit = (event: FirestoreEvent) => {
    setFormData({
      name: event.name,
      description: event.description,
      date: toDatetimeLocal(event.date),
      location: event.location,
      registrationOpensAt: event.registrationOpensAt ? toDatetimeLocal(event.registrationOpensAt) : '',
      registrationClosesAt: event.registrationClosesAt ? toDatetimeLocal(event.registrationClosesAt) : '',
      imageUrl: event.imageUrl || ''
    });
    setEditingId(event.id);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const deletedEvent = deleteTarget;
    setIsDeleting(true);
    setEvents((prev) => prev.filter((event) => event.id !== deletedEvent.id));
    setExpandedEventId((current) => current === deletedEvent.id ? null : current);
    try {
      await deleteEvent(deletedEvent.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setEvents((prev) => [...prev, deletedEvent].sort((a, b) => b.date.getTime() - a.date.getTime()));
      setError('Failed to delete event: ' + err.message);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRegistrationDelete = async () => {
    if (!registrationDeleteTarget?.id) return;
    const registration = registrationDeleteTarget;
    const registrationId = registration.id!;
    setIsDeleting(true);
    setRegistrations((current) => ({
      ...current,
      [registration.eventId ?? '']: (current[registration.eventId ?? ''] ?? []).filter((item) => item.id !== registration.id),
    }));
    try {
      await deleteRegistration(registrationId);
      setRegistrationDeleteTarget(null);
    } catch (err: any) {
      if (registration.eventId) {
        const refreshed = await getRegistrations({ eventId: registration.eventId });
        setRegistrations((current) => ({ ...current, [registration.eventId!]: refreshed }));
      }
      setError(err.message || 'Failed to delete registration');
      setRegistrationDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const {
        date,
        registrationOpensAt,
        registrationClosesAt,
        ...eventDetails
      } = formData;
      const payload = {
        ...eventDetails,
        date: new Date(date),
        registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt) : undefined,
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt) : undefined,
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        setToastMessage('Event updated successfully!');
      } else {
        await createEvent(payload);
        setToastMessage('Event created and published on the site.');
      }
      setTimeout(() => setToastMessage(null), 4000);
      await fetchEvents();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleEventLaunch = async (event: FirestoreEvent) => {
    try {
      // isLaunched defaults to true when undefined, so we explicitly check the stored value.
      // A new event has isLaunched === undefined (treated as launched), so toggling it
      // correctly sets it to false (unlaunched).
      const nextVal = !event.isLaunched;
      await updateEvent(event.id, { isLaunched: nextVal });
      setToastMessage(nextVal ? 'Event is now public on the site.' : 'Event is now hidden from the site.');
      setTimeout(() => setToastMessage(null), 3500);
      await fetchEvents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle launch state');
    }
  };

  const handleToggleEventRegistration = async (event: FirestoreEvent) => {
    try {
      const now = new Date();
      const statusInfo = getEventStatus(event.registrationOpensAt, event.registrationClosesAt);
      if (statusInfo.status === 'open') {
        const closesAt = new Date(now.getTime() - 60000);
        await updateEvent(event.id, { registrationClosesAt: closesAt });
      } else {
        const opensAt = new Date(now.getTime() - 60000);
        const closesAt = new Date(event.date);
        await updateEvent(event.id, { registrationOpensAt: opensAt, registrationClosesAt: closesAt });
      }
      setToastMessage('Event registration window updated.');
      setTimeout(() => setToastMessage(null), 3000);
      await fetchEvents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle event registration');
    }
  };

  return (
    <AdminGuard>
      <div className="pt-8 container-content min-h-screen pb-16 text-[#141210]">
        <div className="mb-6">
          <Link href="/admin" className="text-[#6b6258] hover:text-[#c94030] font-mono text-sm flex items-center inline-flex">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
          <div>
            <h1 className="text-3xl font-sans font-bold text-[#141210]">Manage Events</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#3a3530]">Public events with a future date appear under Upcoming Events on the home page and the Events page. Hidden events stay off the site.</p>
          </div>
          <Button onClick={() => setIsFormOpen(!isFormOpen)} variant={isFormOpen ? 'secondary' : 'primary'}>
            {isFormOpen ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Create New Event</>}
          </Button>
        </div>

        {toastMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-sm rounded shadow-xs flex items-center justify-between">
            <span>✓ {toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#c72c2c]/10 border border-[#c72c2c]/20 text-[#c72c2c] font-mono text-sm rounded">
            {error}
          </div>
        )}

        {isFormOpen && (
          <div className="bg-[#ede7da] border border-[#cfc9bc] p-6 mb-8 rounded shadow-xs">
            <h2 className="text-xl font-sans font-bold mb-4 border-b border-[#cfc9bc] pb-2 text-[#141210]">
              {editingId ? 'Edit Event' : 'Create New Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} required className="w-full text-[#141210]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Location</label>
                  <Input name="location" value={formData.location} onChange={handleInputChange} required className="w-full text-[#141210]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Event Date/Time</label>
                  <Input type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} required className="w-full bg-[#f6f0e7] border-[#cfc9bc] text-[#141210]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Image URL (Optional)</label>
                  <Input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="w-full text-[#141210]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Registration Opens (optional)</label>
                  <Input type="datetime-local" name="registrationOpensAt" value={formData.registrationOpensAt} onChange={handleInputChange} className="w-full bg-[#f6f0e7] border-[#cfc9bc] text-[#141210]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Registration Closes (optional)</label>
                  <Input type="datetime-local" name="registrationClosesAt" value={formData.registrationClosesAt} onChange={handleInputChange} className="w-full bg-[#f6f0e7] border-[#cfc9bc] text-[#141210]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#141210] font-bold uppercase tracking-wider">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full h-32 bg-[#f6f0e7] border border-[#cfc9bc] p-3 text-[#141210] rounded focus:border-[#c94030] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {formLoading ? 'Saving...' : 'Save Event'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#c94030]" />
          </div>
        ) : (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-[#cfc9bc] bg-[#ede7da] rounded px-6">
                <Calendar className="mx-auto h-9 w-9 text-[#c94030] mb-3" aria-hidden />
                <h3 className="font-bold text-lg text-[#141210]">No events published yet</h3>
                <p className="mt-1 text-sm text-[#3a3530]">Use the Create New Event button above to publish your first club event.</p>
              </div>
            ) : (
              events.map((event) => {
                const statusInfo = getEventStatus(event.registrationOpensAt, event.registrationClosesAt);
                const isExpanded = expandedEventId === event.id;
                const eventRegs = registrations[event.id] || [];

                return (
                  <div key={event.id} className="border border-[#cfc9bc] bg-[#ede7da] overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-sans font-bold text-[#c94030]">{event.name}</h3>
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            event.isLaunched !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {event.isLaunched !== false ? '● Public' : '○ Hidden'}
                          </span>
                          {event.date.getTime() < Date.now() && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border bg-[#f6f0e7] text-[#6b6258] border-[#cfc9bc]">Past</span>
                          )}
                        </div>
                        <div className="text-sm text-[#3a3530] font-mono mt-1 space-x-4">
                          <span>Date: <strong className="text-[#141210]">{new Date(event.date).toLocaleDateString()}</strong></span>
                          <span>Reg: <span className="font-semibold text-[#141210]">{statusInfo.label}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        <Button
                          variant={event.isLaunched !== false ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleEventLaunch(event)}
                          className="font-mono text-xs"
                          title={event.isLaunched !== false ? 'Hide this event from the public site' : 'Show this event on the public site'}
                        >
                          {event.isLaunched !== false ? 'Hide from site' : 'Publish'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEventRegistration(event)}
                          className="font-mono text-xs"
                          title="Toggle registration open/closed"
                        >
                          {statusInfo.status === 'open' ? 'Close registration' : 'Open registration'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => loadRegistrations(event.id)}>
                          {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                          {isExpanded ? 'Hide Regs' : 'View Regs'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(event)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(event)} aria-label={`Delete event ${event.name}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#cfc9bc] bg-[#ede7da] p-4 sm:p-6">
                        <h4 className="font-mono text-sm uppercase text-[#141210] font-bold mb-3">Registrations ({eventRegs.length})</h4>
                        {eventRegs.length === 0 ? (
                          <div className="text-sm text-[#6b6258] font-mono italic">No registrations yet.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs font-mono uppercase bg-[#141210] text-white">
                                <tr>
                                  <th className="px-4 py-2 border-b border-[#cfc9bc]">Name</th>
                                  <th className="px-4 py-2 border-b border-[#cfc9bc]">Email</th>
                                  <th className="px-4 py-2 border-b border-[#cfc9bc]">Class/Sec</th>
                                  <th className="px-4 py-2 border-b border-[#cfc9bc]">Submitted</th>
                                  <th className="px-4 py-2 border-b border-[#cfc9bc]">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {eventRegs.map((reg) => (
                                  <tr key={reg.id} className="border-b border-[#cfc9bc]/50 hover:bg-[#e6dfd1]/60 font-mono text-xs transition-colors">
                                    <td className="px-4 py-2 text-[#141210] font-bold">{reg.name}</td>
                                    <td className="px-4 py-2 text-[#3a3530]">{reg.email}</td>
                                    <td className="px-4 py-2 text-[#3a3530]">{reg.classSection || '-'}</td>
                                    <td className="px-4 py-2 text-[#6b6258]">
                                      {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        aria-label={`Delete registration from ${reg.name}`}
                                        onClick={() => setRegistrationDeleteTarget(reg)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete event?"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <DeleteModal
        isOpen={!!registrationDeleteTarget}
        title="Delete event registration?"
        description={registrationDeleteTarget ? `Are you sure you want to permanently delete the registration from "${registrationDeleteTarget.name}"? This action cannot be undone.` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmRegistrationDelete}
        onCancel={() => setRegistrationDeleteTarget(null)}
      />
    </AdminGuard>
  );
}
