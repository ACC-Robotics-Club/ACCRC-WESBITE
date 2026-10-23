'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Calendar,
  MapPin,
  Trophy,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  X,
  Plus,
  Trash2,
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  getFestSegments,
  subscribeToFestSegments,
  submitFestRegistration,
  getFestSchedule,
  subscribeToFestAnnouncements,
  subscribeToFestConfig,
  type FestSegment,
  type FestRegistration,
  type FestScheduleItem,
  type FestAnnouncement,
  type FestMember,
  type FestConfig,
  DEFAULT_FEST_CONFIG,
} from '@/lib/firestore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isSafeHttpsUrl } from '@/lib/safeUrl';

const DEFAULT_GUIDELINES = [
  {
    step: 'Step 1: Registration & bKash Payment',
    details: 'Complete team roster and send the exact entry fee to the designated bKash account. Keep the 10-character Transaction ID (TrxID) handy.',
  },
  {
    step: 'Step 2: Registration Confirmation',
    details: 'Receive your unique Participant ID and retain it for registration support and on-site verification.',
  },
  {
    step: 'Step 3: Presentation Link',
    details: 'For applicable segments, provide a shareable Google Drive, slide deck, or video link during registration.',
  },
  {
    step: 'Step 4: On-Site Presentation',
    details: 'Present your Participant ID at the Adamjee Cantonment College entrance gate for verification and arena access.',
  },
];

export default function FestPage() {
  const [festConfig, setFestConfig] = useState<FestConfig>(DEFAULT_FEST_CONFIG);
  const [segments, setSegments] = useState<FestSegment[]>([]);
  const [schedule, setSchedule] = useState<FestScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<FestAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'segments' | 'schedule' | 'guidelines' | 'announcements'>('segments');

  // Expanded guidelines accordion on segment cards
  const [expandedGuidelines, setExpandedGuidelines] = useState<Record<string, boolean>>({});

  // Registration modal state
  const [selectedSegment, setSelectedSegment] = useState<FestSegment | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<FestRegistration | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Registration form
  const [teamName, setTeamName] = useState('');
  const [institution, setInstitution] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderWhatsapp, setLeaderWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [members, setMembers] = useState<FestMember[]>([]);

  useEffect(() => {
    setLoading(true);

    const unsubConfig = subscribeToFestConfig((cfg) => {
      setFestConfig(cfg);
    });

    const unsubSegments = subscribeToFestSegments((data) => {
      setSegments(data);
      setLoading(false);
    });

    const unsubAnnouncements = subscribeToFestAnnouncements((data) => {
      setAnnouncements(data);
    });

    getFestSchedule()
      .then((sch) => setSchedule(sch))
      .catch((error: unknown) => {
        console.warn('Unable to load the fest schedule:', error);
      });

    return () => {
      unsubConfig();
      unsubSegments();
      unsubAnnouncements();
    };
  }, []);

  const toggleGuidelines = (segId: string) => {
    setExpandedGuidelines((prev) => ({ ...prev, [segId]: !prev[segId] }));
  };

  const openRegistration = (segment: FestSegment) => {
    if (!festConfig.isLaunched || !festConfig.registrationOpen || !segment.isOpen) {
      return;
    }
    setSelectedSegment(segment);
    setTeamName('');
    setInstitution('');
    setLeaderName('');
    setLeaderEmail('');
    setLeaderPhone('');
    setLeaderWhatsapp('');
    setTransactionId('');
    setSubmissionLink('');
    setPaymentMethod(festConfig.bkashAccountType === 'Nagad' ? 'Nagad' : festConfig.bkashAccountType === 'Rocket' ? 'Rocket' : 'bKash');
    setMembers([]);
    setRegisteredTeam(null);
    setRegError(null);
  };

  const addMember = () => {
    if (!selectedSegment) return;
    const maxAllowed = Math.max(0, selectedSegment.teamMax - 1);
    if (members.length < maxAllowed) {
      setMembers([...members, { name: '', institution: '', phone: '', email: '' }]);
    }
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof FestMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment) return;

    if (!festConfig.isLaunched || !festConfig.registrationOpen || !selectedSegment.isOpen) {
      setRegError(festConfig.closedMessage || 'Registrations are currently closed.');
      return;
    }

    if (!teamName.trim() || !institution.trim() || !leaderName.trim() || !leaderEmail.trim() || !leaderPhone.trim()) {
      setRegError('Please fill in all required fields marked with *.');
      return;
    }

    if (selectedSegment.registrationFee > 0 && !transactionId.trim()) {
      setRegError('Please provide your bKash / Payment Transaction ID (TrxID) for verification.');
      return;
    }

    if (selectedSegment.requiresSubmissionLink && !submissionLink.trim()) {
      setRegError('Please provide a shareable Drive, presentation, or video link for this segment.');
      return;
    }

    if (submissionLink.trim() && !isSafeHttpsUrl(submissionLink.trim())) {
      setRegError('The project link must be a valid HTTPS URL.');
      return;
    }

    setRegSubmitting(true);
    setRegError(null);

    try {
      const regPayload: Omit<FestRegistration, 'id' | 'createdAt'> = {
        segmentId: selectedSegment.id,
        segmentTitle: selectedSegment.title,
        teamName: teamName.trim(),
        institution: institution.trim(),
        leaderName: leaderName.trim(),
        leaderEmail: leaderEmail.trim(),
        leaderPhone: leaderPhone.trim(),
        leaderWhatsapp: leaderWhatsapp.trim() || leaderPhone.trim(),
        members: members.filter((m) => m.name.trim().length > 0),
        transactionId: transactionId.trim().toUpperCase(),
        paymentMethod: selectedSegment.registrationFee > 0 ? paymentMethod : 'Free',
        amountPaid: selectedSegment.registrationFee,
        status: 'pending',
        submissionLink: submissionLink.trim(),
        checkedIn: false,
        checkedInAt: null,
      };

      const result = await submitFestRegistration(regPayload);

      // Create local object for immediate Pass Card rendering
      const newRegistration: FestRegistration = {
        ...regPayload,
        id: result.id,
        participantId: result.participantId,
        verificationHash: result.verificationHash,
        createdAt: new Date(),
      };

      setRegisteredTeam(newRegistration);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please check your network and try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  // Dynamic bKash number per segment or global
  const activeBkashNumber = selectedSegment?.customBkashNumber || festConfig.bkashNumber || '01712345678';
  const activeBkashType = selectedSegment?.customBkashType || festConfig.bkashAccountType || 'Personal';

  return (
    <div className="min-h-screen flex flex-col flex-grow bg-[#f6f0e7] pt-24 pb-20 text-[#141210]">
      {/* ═══ HERO SECTION ═══ */}
      <section className="container-content mb-12">
        <div className="border border-[#cfc9bc] bg-[#ede7da] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#c94030]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="motion-intro max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c94030]/10 border border-[#c94030]/20 rounded-full mb-4">
              <Flame className="w-4 h-4 text-[#c94030]" aria-hidden />
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#c94030]">
                {festConfig.festTitle}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#141210] leading-[1.15] sm:leading-[1.1] mb-4 break-words overflow-wrap-anywhere min-h-fit">
              {festConfig.festSubtitle.includes('.') ? (
                <>
                  {festConfig.festSubtitle.split('.')[0]}.<br />
                  <span className="text-[#c94030]">{festConfig.festSubtitle.split('.').slice(1).join('.')}</span>
                </>
              ) : (
                festConfig.festSubtitle
              )}
            </h1>

            <p className="text-base md:text-lg text-[#3a3530] leading-relaxed max-w-2xl mb-8">
              Welcome to the premier robotics competition organized by{' '}
              <strong className="text-[#141210]">Adamjee Cantonment College Robotics Club</strong>.
              Uniting high school, college, and university robotics innovators across Bangladesh.
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-mono uppercase tracking-wider text-[#6b6258] mb-8">
              <div className="flex items-center gap-2 bg-[#f6f0e7] px-3.5 py-2 border border-[#cfc9bc]">
                <Calendar className="w-4 h-4 text-[#c94030]" />
                <span>{festConfig.festDates}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f6f0e7] px-3.5 py-2 border border-[#cfc9bc]">
                <MapPin className="w-4 h-4 text-[#c94030]" />
                <span>{festConfig.venue}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f6f0e7] px-3.5 py-2 border border-[#cfc9bc]">
                <Trophy className="w-4 h-4 text-[#c94030]" />
                <span>Prize Pool: {festConfig.prizePool}</span>
              </div>
            </div>

            {festConfig.isLaunched && (
              <div className="flex flex-wrap items-center gap-3">
                {isSafeHttpsUrl(festConfig.rulesUrl) && (
                  <a
                    href={festConfig.rulesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-bold border border-[#cfc9bc] bg-[#f6f0e7] hover:border-[#141210] text-[#3a3530] transition-colors rounded-sm"
                  >
                    <Download size={15} /> Download Official Guidelines
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {!festConfig.isLaunched ? (
        <section className="motion-rise container-content mb-12">
          <div className="border border-amber-300 bg-amber-50 p-8 text-center text-amber-950 sm:p-12">
            <Clock className="mx-auto mb-4 h-10 w-10 text-amber-700" aria-hidden />
            <h2 className="text-2xl font-bold">Fest Portal Coming Soon</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              {festConfig.festTitle} has not launched yet. Please check back for competition details, announcements, and registration.
            </p>
            {festConfig.festDates && (
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
                {festConfig.festDates}
              </p>
            )}
          </div>
        </section>
      ) : (
        <>
      {!festConfig.registrationOpen && (
        <section className="motion-rise container-content mb-8">
          <div className="border border-[#c72c2c]/30 bg-[#c72c2c]/10 p-4 flex items-center gap-3 text-[#c72c2c] font-mono text-xs">
            <ShieldAlert className="w-5 h-5 text-[#c72c2c] shrink-0" />
            <div>
              <strong>Notice:</strong> {festConfig.closedMessage}
            </div>
          </div>
        </section>
      )}

      {/* ═══ LIVE NOTICES / TICKER (IF ANY) ═══ */}
      {announcements.length > 0 && (
        <section className="motion-rise container-content mb-8">
          <div className="border border-[#c94030]/30 bg-[#c94030]/5 p-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#c94030] shrink-0 animate-pulse" />
            <div className="text-sm font-mono overflow-hidden whitespace-nowrap text-ellipsis">
              <span className="font-bold text-[#c94030] mr-2">[{announcements[0].tag}]:</span>
              <span className="text-[#141210]">{announcements[0].title} — {announcements[0].body}</span>
            </div>
          </div>
        </section>
      )}

      {/* ═══ NAVIGATION TABS ═══ */}
      <section className="motion-rise container-content mb-8">
        <div className="flex border-b border-[#cfc9bc] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('segments')}
            className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'segments'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Flame size={14} /> Competitions & Segments ({segments.length})
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'guidelines'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <FileText size={14} /> Rules & Procedure Guide
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Clock size={14} /> Event Timetable
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Bell size={14} /> Notices & Results ({announcements.length})
          </button>
        </div>
      </section>

      {/* ═══ TAB CONTENT: SEGMENTS ═══ */}
      {activeTab === 'segments' && (
        <section className="motion-rise container-content">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#c94030]" />
            </div>
          ) : segments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#cfc9bc] bg-[#ede7da]">
              <p className="font-mono text-sm text-[#6b6258]">
                No fest segments are currently listed. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segments.map((segment) => {
                const isRegAvailable = festConfig.isLaunched && festConfig.registrationOpen && segment.isOpen;
                const showGuidelines = expandedGuidelines[segment.id];

                return (
                  <div
                    key={segment.id}
                    className="border border-[#cfc9bc] bg-[#ede7da] p-6 flex flex-col justify-between hover:border-[#c94030] transition-colors relative group rounded"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#f6f0e7] border border-[#cfc9bc] text-[#c94030]">
                          {segment.category}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            isRegAvailable ? 'text-emerald-700' : 'text-[#c72c2c]'
                          }`}
                        >
                          {isRegAvailable ? '● Registration Open' : '● Closed'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#141210] mb-2 leading-snug group-hover:text-[#c94030] transition-colors">
                        {segment.title}
                      </h3>
                      <p className="text-xs text-[#3a3530] leading-relaxed mb-4">
                        {segment.description}
                      </p>

                      <div className="space-y-1.5 border-t border-[#cfc9bc]/60 pt-3 text-xs font-mono text-[#6b6258]">
                        <div className="flex justify-between">
                          <span>Team Size:</span>
                          <strong className="text-[#141210]">
                            {segment.teamMin === segment.teamMax
                              ? `${segment.teamMin} member`
                              : `${segment.teamMin}–${segment.teamMax} members`}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Registration Fee:</span>
                          <strong className="text-[#141210]">
                            {segment.registrationFee === 0 ? 'FREE' : `৳ ${segment.registrationFee}`}
                          </strong>
                        </div>
                        {segment.prizePool && (
                          <div className="flex justify-between">
                            <span>Prize Pool:</span>
                            <strong className="text-[#c94030]">{segment.prizePool}</strong>
                          </div>
                        )}
                        {segment.venue && (
                          <div className="flex justify-between">
                            <span>Venue:</span>
                            <span className="text-[#141210]">{segment.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Accordion Toggle for Segment Guidelines */}
                      <div className="mt-4 pt-3 border-t border-[#cfc9bc]">
                        <button
                          type="button"
                          onClick={() => toggleGuidelines(segment.id)}
                          className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#6b6258] hover:text-[#c94030] transition-colors py-1"
                        >
                          <span>Rules & Procedure</span>
                          {showGuidelines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showGuidelines && (
                          <div className="mt-2 p-3 bg-[#f6f0e7] border border-[#cfc9bc] rounded text-xs space-y-2">
                            {DEFAULT_GUIDELINES.map((g, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <span className="font-bold text-[#141210] block text-[11px] font-mono">
                                  {g.step}
                                </span>
                                <p className="text-[11px] text-[#3a3530] leading-relaxed">
                                  {g.details}
                                </p>
                              </div>
                            ))}
                            {isSafeHttpsUrl(segment.rulesUrl) && (
                              <div className="pt-2 border-t border-[#cfc9bc]">
                                <a
                                  href={segment.rulesUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#c94030] hover:underline"
                                >
                                  <Download size={12} /> Download Official Segment Rulebook
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#cfc9bc] flex items-center justify-between gap-3">
                      {isSafeHttpsUrl(segment.rulesUrl) ? (
                        <a
                          href={segment.rulesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#6b6258] hover:text-[#141210] transition-colors"
                        >
                          <Download size={14} /> Guidelines
                        </a>
                      ) : (
                        <span className="text-[11px] font-mono text-[#9a9088]">Rules on venue</span>
                      )}

                      <Button
                        onClick={() => openRegistration(segment)}
                        disabled={!isRegAvailable}
                        size="sm"
                        className="font-mono text-xs uppercase tracking-wider"
                      >
                        {isRegAvailable ? 'Register Team' : 'Registrations Closed'}{' '}
                        {isRegAvailable && <ChevronRight size={14} className="ml-1" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ TAB CONTENT: GUIDELINES ═══ */}
      {activeTab === 'guidelines' && (
        <section className="motion-rise container-content">
          <div className="bg-[#ede7da] border border-[#cfc9bc] p-6 sm:p-8 rounded space-y-8 max-w-4xl mx-auto">
            <div>
              <span className="font-mono text-xs uppercase font-bold text-[#c94030] tracking-wider block">
                Official Protocol
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#141210] mt-1">
                Fest Registration & Participation Guide
              </h2>
              <p className="text-sm text-[#3a3530] mt-1 leading-relaxed">
                Follow this 4-step procedure from online team entry to on-site competition check-in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_GUIDELINES.map((item, idx) => (
                <div key={idx} className="bg-[#f6f0e7] p-5 border border-[#cfc9bc] rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#141210] text-white flex items-center justify-center font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-[#141210]">{item.step}</h3>
                  </div>
                  <p className="text-xs text-[#3a3530] leading-relaxed pl-8">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>

            {/* bKash Payment Instructions Card */}
            <div className="bg-[#f6f0e7] border-2 border-[#cfc9bc] p-6 rounded space-y-3">
              <h3 className="font-mono text-sm font-bold text-[#c94030] uppercase flex items-center gap-2">
                <CreditCard size={16} /> Official bKash Payment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#6b6258] block">Payment Number ({festConfig.bkashAccountType})</span>
                  <strong className="text-base text-[#141210]">{festConfig.bkashNumber}</strong>
                </div>
                <div>
                  <span className="text-[#6b6258] block">Account Mode</span>
                  <strong className="text-[#141210]">
                    {festConfig.bkashAccountType === 'Merchant' ? 'Payment (Counter 1)' : 'Send Money'}
                  </strong>
                </div>
              </div>
              <p className="text-xs text-[#3a3530] leading-relaxed pt-2 border-t border-[#cfc9bc]">
                {festConfig.bkashInstructions}
              </p>
            </div>

            {isSafeHttpsUrl(festConfig.rulesUrl) && (
              <div className="pt-2 flex justify-center">
                <a
                  href={festConfig.rulesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold bg-[#141210] text-white hover:bg-[#c94030] transition-colors rounded"
                >
                  <Download size={16} /> Download Official Fest Rulebook (PDF)
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ TAB CONTENT: SCHEDULE ═══ */}
      {activeTab === 'schedule' && (
        <section className="motion-rise container-content">
          {schedule.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#cfc9bc] bg-[#ede7da]">
              <Clock className="w-8 h-8 mx-auto text-[#c94030] mb-3" />
              <p className="font-bold text-[#141210] text-base mb-1">Official Timetable Announcing Soon</p>
              <p className="font-mono text-xs text-[#6b6258]">
                Event schedules and arena slots will be published prior to competition day.
              </p>
            </div>
          ) : (
            <div className="border border-[#cfc9bc] bg-[#ede7da] divide-y divide-[#cfc9bc] rounded overflow-hidden">
              {schedule.map((item, idx) => (
                <div key={item.id || idx} className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f6f0e7] border border-[#cfc9bc] px-3 py-2 text-center min-w-[90px] rounded">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#c94030] block">{item.day}</span>
                      <span className="font-mono text-xs font-bold text-[#141210] block">{item.time}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#141210]">{item.segmentTitle}</h4>
                      <p className="text-xs text-[#6b6258] font-mono mt-0.5">
                        Stage: <strong className="text-[#3a3530]">{item.stage}</strong> · Venue: <span className="text-[#3a3530]">{item.venue}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 font-mono text-[10px] uppercase tracking-wider font-semibold border border-[#cfc9bc] bg-[#f6f0e7] text-[#3a3530] rounded">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ TAB CONTENT: ANNOUNCEMENTS ═══ */}
      {activeTab === 'announcements' && (
        <section className="motion-rise container-content">
          {announcements.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#cfc9bc] bg-[#ede7da]">
              <p className="font-mono text-sm text-[#6b6258]">No announcements posted yet. Check back during the fest!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((post) => (
                <div key={post.id} className="border border-[#cfc9bc] bg-[#ede7da] p-6 rounded">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-0.5 font-mono text-[10px] uppercase font-bold bg-[#c94030] text-white rounded">
                      {post.tag}
                    </span>
                    <span className="font-mono text-xs text-[#6b6258]">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#141210] mb-2">{post.title}</h3>
                  <p className="text-sm text-[#3a3530] leading-relaxed whitespace-pre-wrap">{post.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
        </>
      )}

      {/* ═══ REGISTRATION MODAL ═══ */}
      {selectedSegment && festConfig.isLaunched && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden sm:p-4">
          <div className="bg-[#ede7da] border border-[#cfc9bc] w-full sm:max-w-3xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col relative shadow-2xl sm:rounded">
            {/* Close button */}
            <button
              onClick={() => setSelectedSegment(null)}
              className="absolute top-4 right-4 z-10 text-[#6b6258] hover:text-[#141210] p-1.5 rounded transition-colors bg-[#ede7da]"
              aria-label="Close registration modal"
            >
              <X size={20} />
            </button>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-12 sm:p-8">
            <ErrorBoundary fallbackTitle="Registration Form Error">
            {!festConfig.isLaunched || !festConfig.registrationOpen || !selectedSegment.isOpen ? (
              <div className="p-8 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-[#c94030] mx-auto" />
                <h3 className="text-2xl font-bold text-[#141210]">Registrations Closed</h3>
                <p className="text-sm text-[#3a3530] max-w-md mx-auto leading-relaxed">
                  {festConfig.closedMessage || 'Registration for this competition is currently closed or has not been launched.'}
                </p>
                <div className="pt-2">
                  <Button variant="secondary" onClick={() => setSelectedSegment(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : registeredTeam ? (
              <div className="py-4 space-y-6">
                <div className="text-center space-y-2 border-b border-[#cfc9bc] pb-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-2xl font-black text-[#141210]">Team Registration Confirmed!</h3>
                  <p className="text-xs text-[#3a3530] max-w-lg mx-auto">
                    Your team <strong className="text-[#141210]">{registeredTeam.teamName}</strong> has been registered.
                    Save your Participant ID for support and on-site verification.
                  </p>
                </div>

                <div className="border border-[#cfc9bc] bg-[#f6f0e7] p-5 text-center rounded">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#6b6258] block">Participant ID</span>
                  <strong className="mt-1 block break-all font-mono text-lg text-[#c94030]">
                    {registeredTeam.participantId}
                  </strong>
                  {isSafeHttpsUrl(registeredTeam.submissionLink) && (
                    <a
                      href={registeredTeam.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-mono font-bold text-[#c94030] hover:underline"
                    >
                      <ExternalLink size={13} /> Open submitted project link
                    </a>
                  )}
                </div>

                <div className="pt-4 flex justify-end items-center border-t border-[#cfc9bc]">
                  <Button onClick={() => setSelectedSegment(null)}>Done</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 border-b border-[#cfc9bc] pb-4">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#c94030]">
                    Registration Form
                  </span>
                  <h2 className="text-2xl font-bold text-[#141210] mt-1">{selectedSegment.title}</h2>
                  <p className="text-xs text-[#6b6258] font-mono mt-1">
                    Fee: {selectedSegment.registrationFee === 0 ? 'FREE' : `৳ ${selectedSegment.registrationFee}`} · Team Size: up to {selectedSegment.teamMax}
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 bg-[#c72c2c]/10 border border-[#c72c2c]/20 text-[#c72c2c] text-xs font-mono rounded flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form id="reg-form" onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Basic Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-bold uppercase text-[#141210]">Team Name *</label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Apex Sparks"
                        required
                        className="text-[#141210] bg-[#f6f0e7]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-bold uppercase text-[#141210]">Institution / College *</label>
                      <Input
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Adamjee Cantonment College"
                        required
                        className="text-[#141210] bg-[#f6f0e7]"
                      />
                    </div>
                  </div>

                  {/* Leader Details */}
                  <div className="border-t border-[#cfc9bc] pt-3">
                    <h4 className="font-mono text-xs uppercase font-bold text-[#c94030] mb-2">Team Leader Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#6b6258]">Leader Name *</label>
                        <Input
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          placeholder="Full Name"
                          required
                          className="text-[#141210] bg-[#f6f0e7]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#6b6258]">Email *</label>
                        <Input
                          type="email"
                          value={leaderEmail}
                          onChange={(e) => setLeaderEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                          className="text-[#141210] bg-[#f6f0e7]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-[#6b6258]">Phone (WhatsApp) *</label>
                        <Input
                          value={leaderPhone}
                          onChange={(e) => {
                            setLeaderPhone(e.target.value);
                            if (!leaderWhatsapp) setLeaderWhatsapp(e.target.value);
                          }}
                          placeholder="+880 1XXX-XXXXXX"
                          required
                          className="text-[#141210] bg-[#f6f0e7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Members */}
                  {selectedSegment.teamMax > 1 && (
                    <div className="border-t border-[#cfc9bc] pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-mono text-xs uppercase font-bold text-[#141210]">
                          Additional Members ({members.length}/{selectedSegment.teamMax - 1})
                        </h4>
                        {members.length < selectedSegment.teamMax - 1 && (
                          <button
                            type="button"
                            onClick={addMember}
                            className="inline-flex items-center gap-1 font-mono text-xs text-[#c94030] hover:underline"
                          >
                            <Plus size={14} /> Add Member
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {members.map((mem, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#f6f0e7] p-2 border border-[#cfc9bc] rounded">
                            <Input
                              value={mem.name}
                              onChange={(e) => updateMember(idx, 'name', e.target.value)}
                              placeholder={`Member ${idx + 2} Name`}
                              className="text-xs bg-white text-[#141210] flex-1"
                              required
                            />
                            <Input
                              value={mem.phone || ''}
                              onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                              placeholder="Phone (optional)"
                              className="text-xs bg-white text-[#141210] w-36"
                            />
                            <button
                              type="button"
                              onClick={() => removeMember(idx)}
                              className="text-[#c72c2c] p-1.5 hover:bg-[#ede7da] rounded"
                              aria-label="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSegment.requiresSubmissionLink && (
                    <div className="border-t border-[#cfc9bc] pt-3">
                      <label className="text-xs font-mono font-bold uppercase text-[#141210] block mb-1" htmlFor="submission-link">
                        Project / Presentation Link *
                      </label>
                      <p className="text-[11px] leading-relaxed text-[#6b6258] mb-2">
                        Share a Google Drive folder, slide deck, GitHub repository, or YouTube/video link that organizers can open.
                      </p>
                      <Input
                        id="submission-link"
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        required
                        className="text-[#141210] bg-[#f6f0e7]"
                      />
                    </div>
                  )}

                  {/* Payment Verification with DYNAMIC bKash number */}
                  {selectedSegment.registrationFee > 0 && (
                    <div className="border-t border-[#cfc9bc] pt-3 bg-[#f6f0e7] p-4 border border-dashed rounded space-y-3">
                      <h4 className="font-mono text-xs uppercase font-bold text-[#c94030]">
                        Payment Verification ({paymentMethod})
                      </h4>
                      <p className="text-xs text-[#3a3530] leading-relaxed">
                        Send registration fee <strong>৳ {selectedSegment.registrationFee}</strong> to our{' '}
                        <strong className="text-[#141210]">{activeBkashType}</strong> number:{' '}
                        <strong className="text-[#c94030] font-mono text-sm bg-white px-2 py-0.5 border border-[#cfc9bc] rounded inline-block">
                          {activeBkashNumber}
                        </strong>{' '}
                        ({activeBkashType === 'Merchant' ? 'Payment' : 'Send Money'}) and enter the Transaction ID below:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#6b6258] block mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'bKash' | 'Nagad' | 'Rocket')}
                            className="w-full h-10 px-3 border border-[#cfc9bc] bg-white text-xs font-mono text-[#141210] rounded"
                          >
                            <option value="bKash">bKash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Rocket">Rocket</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#6b6258] block mb-1">
                            Transaction ID (TrxID) *
                          </label>
                          <Input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. 9J4K2L8MN"
                            required
                            className="text-xs font-mono bg-white text-[#141210] uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
            </ErrorBoundary>
            </div>

            {/* Sticky footer action bar — always visible regardless of scroll position */}
            {festConfig.isLaunched && festConfig.registrationOpen && selectedSegment.isOpen && !registeredTeam && (
              <div className="shrink-0 border-t border-[#cfc9bc] bg-[#ede7da] px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setSelectedSegment(null)} disabled={regSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="reg-form"
                  disabled={regSubmitting}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  {regSubmitting ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Send size={16} className="mr-2" />
                  )}
                  {regSubmitting ? 'Registering...' : 'Complete Registration'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
