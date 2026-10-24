'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import {
  getFestSegments,
  createFestSegment,
  updateFestSegment,
  deleteFestSegment,
  getFestRegistrations,
  updateFestRegistrationStatus,
  deleteFestRegistration,
  getFestSchedule,
  createFestScheduleItem,
  deleteFestScheduleItem,
  getFestAnnouncements,
  createFestAnnouncement,
  deleteFestAnnouncement,
  getFestConfig,
  updateFestConfig,
  type FestSegment,
  type FestRegistration,
  type FestScheduleItem,
  type FestAnnouncement,
  type FestConfig,
  DEFAULT_FEST_CONFIG,
} from '@/lib/firestore';
import { QrCheckInScanner } from '@/components/fest/QrCheckInScanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { isSafeHttpsUrl } from '@/lib/safeUrl';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Users,
  Search,
  Loader2,
  Download,
  Settings,
  QrCode,
  Calendar,
  Bell,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

function getFestConfigWriteError(error: unknown, fallback: string): string {
  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'permission-denied'
  ) {
    return 'Firestore denied this settings change. Deploy the repository firestore.rules to the app’s Firebase project and confirm you are signed in with an admin account.';
  }
  return error instanceof Error ? error.message : fallback;
}

export default function AdminFest() {
  const [activeTab, setActiveTab] = useState<
    'launcher' | 'registrations' | 'scanner' | 'segments' | 'schedule' | 'announcements'
  >('registrations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fest Settings & Launcher State
  const [festConfig, setFestConfig] = useState<FestConfig>(DEFAULT_FEST_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  // Data states
  const [segments, setSegments] = useState<FestSegment[]>([]);
  const [registrations, setRegistrations] = useState<FestRegistration[]>([]);
  const [schedule, setSchedule] = useState<FestScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<FestAnnouncement[]>([]);

  // Filtering & Sorting
  const [regSearch, setRegSearch] = useState('');
  const [regSegmentFilter, setRegSegmentFilter] = useState('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'teamName' | 'segmentTitle' | 'status' | 'date'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (field: 'teamName' | 'segmentTitle' | 'status' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    type: 'segment' | 'registration' | 'schedule' | 'announcement';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Segment create/edit form
  const [isSegmentFormOpen, setIsSegmentFormOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentFormData, setSegmentFormData] = useState({
    title: '',
    category: 'Robotics',
    description: '',
    teamMin: '1',
    teamMax: '4',
    registrationFee: '1000',
    prizePool: '',
    rulesUrl: '',
    venue: '',
    scheduleTime: '',
    customBkashNumber: '',
    customBkashType: '' as '' | 'Personal' | 'Merchant' | 'Rocket' | 'Nagad',
    requiresSubmissionLink: false,
    isOpen: true,
  });

  // Schedule create form
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    day: 'Day 1',
    time: '09:00 AM - 12:00 PM',
    segmentTitle: '',
    stage: 'Preliminary Round',
    venue: 'Main Arena',
    status: 'upcoming' as const,
  });

  // Announcement create form
  const [isAnnounceFormOpen, setIsAnnounceFormOpen] = useState(false);
  const [announceFormData, setAnnounceFormData] = useState<{
    title: string;
    body: string;
    tag: 'Notice' | 'Result' | 'Schedule' | 'Urgent';
  }>({
    title: '',
    body: '',
    tag: 'Notice',
  });

  useEffect(() => {
    fetchFestData();
  }, []);

  async function fetchFestData() {
    setLoading(true);
    setError(null);
    try {
      const [cfg, segs, regs, sch, ann] = await Promise.all([
        getFestConfig(),
        getFestSegments(),
        getFestRegistrations(),
        getFestSchedule(),
        getFestAnnouncements(),
      ]);
      setFestConfig(cfg);
      setSegments(segs);
      setRegistrations(regs);
      setSchedule(sch);
      setAnnouncements(ann);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fest data');
    } finally {
      setLoading(false);
    }
  }

  // Direct toggle fest portal launch (isLaunched)
  const handleToggleLaunch = async () => {
    const nextVal = !festConfig.isLaunched;
    setFestConfig((prev) => ({ ...prev, isLaunched: nextVal }));
    setError(null);
    setConfigSaving(true);
    try {
      await updateFestConfig({ isLaunched: nextVal });
      setSaveSuccess(`Fest portal ${nextVal ? 'launched & public' : 'set to Unlaunched (Coming Soon mode)'}`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setError(getFestConfigWriteError(err, 'Failed to update launch status'));
      setFestConfig((prev) => ({ ...prev, isLaunched: !nextVal }));
    } finally {
      setConfigSaving(false);
    }
  };

  // Direct toggle registration window (registrationOpen)
  const handleToggleRegistrationWindow = async () => {
    const nextVal = !festConfig.registrationOpen;
    setFestConfig((prev) => ({ ...prev, registrationOpen: nextVal }));
    setError(null);
    setConfigSaving(true);
    try {
      await updateFestConfig({ registrationOpen: nextVal });
      setSaveSuccess(`Fest registrations ${nextVal ? 'opened for teams' : 'closed'}`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setError(getFestConfigWriteError(err, 'Failed to update registration status'));
      setFestConfig((prev) => ({ ...prev, registrationOpen: !nextVal }));
    } finally {
      setConfigSaving(false);
    }
  };

  // Direct toggle bulletin feed (bulletinActive)
  const handleToggleBulletin = async () => {
    const nextVal = festConfig.bulletinActive === false;
    setFestConfig((prev) => ({ ...prev, bulletinActive: nextVal }));
    setError(null);
    setConfigSaving(true);
    try {
      await updateFestConfig({ bulletinActive: nextVal });
      setSaveSuccess(`Bulletin feed ${nextVal ? 'activated' : 'hidden'}`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setError(getFestConfigWriteError(err, 'Failed to update bulletin status'));
      setFestConfig((prev) => ({ ...prev, bulletinActive: !nextVal }));
    } finally {
      setConfigSaving(false);
    }
  };

  // Direct toggle participant passes & gate check-in (passGeneration)
  const handleTogglePasses = async () => {
    const nextVal = festConfig.passGeneration === false;
    setFestConfig((prev) => ({ ...prev, passGeneration: nextVal }));
    setError(null);
    setConfigSaving(true);
    try {
      await updateFestConfig({ passGeneration: nextVal });
      setSaveSuccess(`Participant passes ${nextVal ? 'enabled' : 'disabled site-wide'}`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setError(getFestConfigWriteError(err, 'Failed to update pass generation status'));
      setFestConfig((prev) => ({ ...prev, passGeneration: !nextVal }));
    } finally {
      setConfigSaving(false);
    }
  };

  // Save Fest Launcher Settings
  const handleSaveFestConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      await updateFestConfig(festConfig);
      setSaveSuccess('Fest launcher configuration successfully updated!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: unknown) {
      setError(getFestConfigWriteError(err, 'Failed to update fest configuration'));
    } finally {
      setConfigSaving(false);
    }
  };

  // Quick toggle segment registration
  const handleToggleSegmentOpen = async (segment: FestSegment) => {
    try {
      await updateFestSegment(segment.id, { isOpen: !segment.isOpen });
      setSegments((prev) =>
        prev.map((s) => (s.id === segment.id ? { ...s, isOpen: !segment.isOpen } : s))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update segment status');
    }
  };

  // Segment handlers
  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: segmentFormData.title.trim(),
        category: segmentFormData.category.trim(),
        description: segmentFormData.description.trim(),
        teamMin: parseInt(segmentFormData.teamMin, 10) || 1,
        teamMax: parseInt(segmentFormData.teamMax, 10) || 1,
        registrationFee: parseInt(segmentFormData.registrationFee, 10) || 0,
        prizePool: segmentFormData.prizePool.trim(),
        rulesUrl: segmentFormData.rulesUrl.trim(),
        venue: segmentFormData.venue.trim(),
        scheduleTime: segmentFormData.scheduleTime.trim(),
        customBkashNumber: segmentFormData.customBkashNumber.trim(),
        customBkashType: segmentFormData.customBkashNumber.trim() ? segmentFormData.customBkashType : '',
        requiresSubmissionLink: segmentFormData.requiresSubmissionLink,
        isOpen: segmentFormData.isOpen,
      };

      /* These mirrors of the Firestore security rules keep misconfigured
         segments from being saved: rules cap fees at 0-100,000 and member
         counts at 9 (plus the leader), so a segment outside those bounds
         would accept admin edits but reject every public registration. */
      if (payload.teamMin < 1 || payload.teamMax < payload.teamMin || payload.teamMax > 10) {
        setError('Team size limits must allow 1-10 members (rules cap registrations at 9 teammates plus the leader).');
        return;
      }
      if (payload.registrationFee < 0 || payload.registrationFee > 100000) {
        setError('Registration fee must be between 0 and 100,000.');
        return;
      }

      if (editingSegmentId) {
        await updateFestSegment(editingSegmentId, payload);
      } else {
        await createFestSegment(payload);
      }
      setIsSegmentFormOpen(false);
      setEditingSegmentId(null);
      await fetchFestData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save segment');
    }
  };

  const handleEditSegment = (seg: FestSegment) => {
    setSegmentFormData({
      title: seg.title,
      category: seg.category,
      description: seg.description,
      teamMin: String(seg.teamMin),
      teamMax: String(seg.teamMax),
      registrationFee: String(seg.registrationFee),
      prizePool: seg.prizePool || '',
      rulesUrl: seg.rulesUrl || '',
      venue: seg.venue || '',
      scheduleTime: seg.scheduleTime || '',
      customBkashNumber: seg.customBkashNumber || '',
      customBkashType: seg.customBkashType || '',
      requiresSubmissionLink: seg.requiresSubmissionLink === true,
      isOpen: seg.isOpen,
    });
    setEditingSegmentId(seg.id);
    setIsSegmentFormOpen(true);
  };

  // Schedule handler
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFestScheduleItem({
        day: scheduleFormData.day,
        time: scheduleFormData.time,
        segmentTitle: scheduleFormData.segmentTitle,
        stage: scheduleFormData.stage,
        venue: scheduleFormData.venue,
        status: scheduleFormData.status,
      });
      setIsScheduleFormOpen(false);
      await fetchFestData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule slot');
    }
  };

  // Announcement handler
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFestAnnouncement({
        title: announceFormData.title,
        body: announceFormData.body,
        tag: announceFormData.tag,
        isLive: true,
      });
      setIsAnnounceFormOpen(false);
      setAnnounceFormData({ title: '', body: '', tag: 'Notice' });
      await fetchFestData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post announcement');
    }
  };

  // Registration status toggle
  const handleUpdateRegStatus = async (id: string, status: FestRegistration['status']) => {
    try {
      await updateFestRegistrationStatus(id, status);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update registration status');
    }
  };

  // Delete modal confirm
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'segment') {
        await deleteFestSegment(deleteTarget.id);
        setSegments((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'registration') {
        await deleteFestRegistration(deleteTarget.id);
        setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'schedule') {
        await deleteFestScheduleItem(deleteTarget.id);
        setSchedule((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'announcement') {
        await deleteFestAnnouncement(deleteTarget.id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export registrations to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const headers = [
      'Participant ID',
      'Team Name',
      'Segment',
      'Institution',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'Members Count',
      'Member Names',
      'Payment Method',
      'TrxID',
      'Amount',
      'Status',
      'Checked In',
      'Checked In At',
      'Submission Link',
      'Registration Date',
    ];

    const rows = filteredRegistrations.map((r) => {
      const memberNames = r.members ? r.members.map((m) => m.name).join('; ') : '';
      return [
        `"${r.participantId || ''}"`,
        `"${(r.teamName || '').replace(/"/g, '""')}"`,
        `"${(r.segmentTitle || '').replace(/"/g, '""')}"`,
        `"${(r.institution || '').replace(/"/g, '""')}"`,
        `"${(r.leaderName || '').replace(/"/g, '""')}"`,
        `"${r.leaderEmail || ''}"`,
        `"${r.leaderPhone || ''}"`,
        (r.members?.length || 0) + 1,
        `"${memberNames.replace(/"/g, '""')}"`,
        `"${r.paymentMethod || ''}"`,
        `"${r.transactionId || ''}"`,
        r.amountPaid || 0,
        `"${r.status || 'pending'}"`,
        r.checkedIn ? 'YES' : 'NO',
        `"${r.checkedInAt || ''}"`,
        `"${(r.submissionLink || '').replace(/"/g, '""')}"`,
        `"${r.createdAt ? new Date(r.createdAt).toISOString() : ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ACCRC_Fest_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & sorted registrations
  const filteredRegistrations = registrations
    .filter((r) => {
      const term = regSearch.toLowerCase();
      const matchesSearch =
        r.teamName.toLowerCase().includes(term) ||
        (r.participantId && r.participantId.toLowerCase().includes(term)) ||
        r.leaderName.toLowerCase().includes(term) ||
        r.institution.toLowerCase().includes(term) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(term));

      const matchesSegment = regSegmentFilter === 'ALL' || r.segmentId === regSegmentFilter;
      const matchesStatus =
        regStatusFilter === 'ALL'
          ? true
          : regStatusFilter === 'checkedIn'
          ? (r.checkedIn || r.checkInStatus)
          : r.status === regStatusFilter;

      return matchesSearch && matchesSegment && matchesStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'teamName') {
        cmp = a.teamName.localeCompare(b.teamName);
      } else if (sortField === 'segmentTitle') {
        cmp = a.segmentTitle.localeCompare(b.segmentTitle);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'date') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        cmp = timeA - timeB;
      }
      return sortAsc ? cmp : -cmp;
    });

  return (
    <AdminGuard>
      <div className="container-content py-10 min-h-screen text-[#141210]">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-[#6b6258] hover:text-[#c94030] font-mono text-xs uppercase tracking-wider inline-flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Admin Hub
          </Link>
        </div>

        {/* ═══ HEADER & STATS ═══ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-[#cfc9bc] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-6 h-6 text-[#c94030]" />
              <h1 className="text-3xl font-extrabold text-[#141210]">Fest Management & Launcher</h1>
            </div>
            <p className="text-xs text-[#3a3530]">
              Toggle public fest visibility, configure registrations and payments, manage teams, and scan entry passes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleLaunch}
              disabled={loading || configSaving}
              aria-pressed={festConfig.isLaunched}
              aria-label={festConfig.isLaunched ? 'Turn fest portal off' : 'Turn fest portal on'}
              className="bg-[#ede7da] border border-[#cfc9bc] px-3.5 py-2 text-left rounded disabled:cursor-wait disabled:opacity-60"
            >
              <span className="font-mono text-[10px] text-[#6b6258] uppercase block">Fest Portal</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${festConfig.isLaunched ? 'text-emerald-700' : 'text-[#6b6258]'}`}>
                {festConfig.isLaunched ? <ToggleRight size={17} aria-hidden /> : <ToggleLeft size={17} aria-hidden />}
                {loading ? 'Loading...' : festConfig.isLaunched ? 'Public' : 'Coming Soon'}
              </span>
            </button>
            <div className="bg-[#ede7da] border border-[#cfc9bc] px-3.5 py-2 text-center rounded">
              <span className="font-mono text-[10px] text-[#6b6258] uppercase block">Total Teams</span>
              <strong className="text-base font-bold text-[#141210]">{registrations.length}</strong>
            </div>
            <div className="bg-[#ede7da] border border-[#cfc9bc] px-3.5 py-2 text-center rounded">
              <span className="font-mono text-[10px] text-emerald-700 uppercase block">Verified</span>
              <strong className="text-base font-bold text-emerald-700">
                {registrations.filter((r) => r.status === 'verified').length}
              </strong>
            </div>
            <div className="bg-[#ede7da] border border-[#cfc9bc] px-3.5 py-2 text-center rounded">
              <span className="font-mono text-[10px] text-[#c94030] uppercase block">Pending</span>
              <strong className="text-base font-bold text-[#c94030]">
                {registrations.filter((r) => r.status === 'pending').length}
              </strong>
            </div>
            <div className="bg-[#ede7da] border border-[#cfc9bc] px-3.5 py-2 text-center rounded">
              <span className="font-mono text-[10px] text-indigo-700 uppercase block">Checked-In</span>
              <strong className="text-base font-bold text-indigo-700">
                {registrations.filter((r) => r.checkedIn).length}
              </strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#c72c2c]/10 border border-[#c72c2c]/20 text-[#c72c2c] font-mono text-xs rounded">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono text-xs rounded flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* ═══ TABS ═══ */}
        <div className="flex border-b border-[#cfc9bc] mb-6 overflow-x-auto gap-0.5 pb-0">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'registrations'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Users size={13} /> Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('launcher')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'launcher'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Settings size={13} /> Settings
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <QrCode size={13} /> Gate Check-In
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'segments'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Flame size={13} /> Segments ({segments.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Calendar size={13} /> Timetable ({schedule.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'border-[#c94030] text-[#c94030] bg-[#ede7da]'
                : 'border-transparent text-[#6b6258] hover:text-[#141210]'
            }`}
          >
            <Bell size={13} /> Notices ({announcements.length})
          </button>
        </div>

        {/* ═══ TAB 1: REGISTRATIONS & SUBMISSIONS ═══ */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {/* Filters & Export */}
            <div className="bg-[#ede7da] border border-[#cfc9bc] p-4 flex flex-col md:flex-row gap-3 items-center justify-between rounded">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#6b6258] absolute left-3 top-3" />
                <Input
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search team, ID, leader, TrxID..."
                  className="pl-9 text-xs bg-[#f6f0e7] text-[#141210] w-full"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                <select
                  value={regSegmentFilter}
                  onChange={(e) => setRegSegmentFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-mono bg-[#f6f0e7] border border-[#cfc9bc] text-[#141210] rounded"
                >
                  <option value="ALL">All Segments</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <select
                  value={regStatusFilter}
                  onChange={(e) => setRegStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-mono bg-[#f6f0e7] border border-[#cfc9bc] text-[#141210] rounded"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="checkedIn">Checked-In Only</option>
                </select>

                <Button
                  onClick={handleExportCSV}
                  disabled={registrations.length === 0}
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <Download size={14} /> Export CSV
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#c94030]" />
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[#cfc9bc] bg-[#ede7da] rounded">
                <Users className="w-8 h-8 mx-auto text-[#c94030] mb-2" />
                <p className="font-bold text-[#141210]">No team registrations found</p>
                <p className="text-xs font-mono text-[#6b6258] mt-1">
                  Registrations submitted via the fest page will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#cfc9bc] bg-[#ede7da] rounded">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141210] text-white uppercase">
                    <tr>
                      <th
                        className="p-3 cursor-pointer hover:bg-black/80 transition-colors select-none"
                        onClick={() => toggleSort('teamName')}
                        title="Click to sort by Team Name"
                      >
                        <span className="flex items-center gap-1">
                          ID & Team {sortField === 'teamName' && (sortAsc ? '▲' : '▼')}
                        </span>
                      </th>
                      <th className="p-3">Institution</th>
                      <th className="p-3">Leader Contact</th>
                      <th className="p-3">Members</th>
                      <th className="p-3">Payment / TrxID</th>
                      <th className="p-3">Submissions</th>
                      <th
                        className="p-3 cursor-pointer hover:bg-black/80 transition-colors select-none"
                        onClick={() => toggleSort('status')}
                        title="Click to sort by Status"
                      >
                        <span className="flex items-center gap-1">
                          Status / Gate {sortField === 'status' && (sortAsc ? '▲' : '▼')}
                        </span>
                      </th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cfc9bc]">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#e6dfd1]/60 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-[#c94030] font-bold block">
                            {reg.participantId || 'PENDING-ID'}
                          </span>
                          <strong className="text-sm font-sans font-bold text-[#141210] block">
                            {reg.teamName}
                          </strong>
                          <span className="text-[#6b6258] text-[11px]">{reg.segmentTitle}</span>
                        </td>
                        <td className="p-3 text-[#3a3530] max-w-[140px] truncate" title={reg.institution}>
                          {reg.institution}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#141210]">{reg.leaderName}</div>
                          <div className="text-[#6b6258]">{reg.leaderPhone}</div>
                          <div className="text-[#6b6258] text-[10px] truncate max-w-[120px]">{reg.leaderEmail}</div>
                        </td>
                        <td className="p-3 text-[#3a3530]">
                          <span className="font-bold">{1 + (reg.members?.length || 0)} Total</span>
                          {reg.members && reg.members.length > 0 && (
                            <div className="text-[10px] text-[#6b6258] mt-1 max-w-[120px] truncate" title={reg.members.map((m) => m.name).join(', ')}>
                              {reg.members.map((m) => m.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-[10px] text-[#6b6258] uppercase">{reg.paymentMethod || 'bKash'}</div>
                          <div className="text-[#141210] font-bold">{reg.transactionId || 'None'}</div>
                          {reg.amountPaid && <div className="text-[#c94030] text-[10px]">৳ {reg.amountPaid}</div>}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            {isSafeHttpsUrl(reg.submissionLink) ? (
                              <a
                                href={reg.submissionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-[150px] items-center gap-1 px-2 py-1 bg-[#c94030] text-white hover:bg-[#a83228] rounded font-bold text-[10px] transition-colors break-all"
                                title={reg.submissionLink}
                              >
                                <ExternalLink size={10} />
                                <span>Open project link</span>
                              </a>
                            ) : (
                              <span className="text-[#9a9088] text-[10px]">No link submitted</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                reg.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : reg.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {reg.status}
                            </span>
                            {reg.checkedIn && (
                              <span className="block text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                Checked-In
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Verify */}
                            {reg.status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRegStatus(reg.id!, 'verified')}
                                title="Approve / Mark Verified"
                                className="p-1.5 bg-[#f6f0e7] hover:bg-emerald-600 hover:text-white border border-[#cfc9bc] rounded text-emerald-700 transition-colors"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                            )}

                            {/* Reject */}
                            {reg.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRegStatus(reg.id!, 'rejected')}
                                title="Reject"
                                className="p-1.5 bg-[#f6f0e7] hover:bg-red-600 hover:text-white border border-[#cfc9bc] rounded text-red-700 transition-colors"
                              >
                                <XCircle size={13} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: reg.id!,
                                  title: `Team ${reg.teamName} (${reg.participantId})`,
                                  type: 'registration',
                                })
                              }
                              title="Delete Registration"
                              className="p-1.5 bg-[#f6f0e7] hover:bg-[#c72c2c] hover:text-white border border-[#cfc9bc] rounded text-[#c72c2c] transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 2: LAUNCHER & BKASH CONTROLS ═══ */}
        {activeTab === 'launcher' && (
          <form onSubmit={handleSaveFestConfig} className="bg-[#ede7da] border border-[#cfc9bc] p-6 rounded space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-[#cfc9bc] pb-4">
              <span className="font-mono text-xs uppercase font-bold text-[#c94030]">Master Launcher Controls</span>
              <h2 className="text-2xl font-bold text-[#141210] mt-1">Fest Portal & Payment Settings</h2>
              <p className="text-xs text-[#3a3530] mt-0.5">
                Toggle public fest registration, configure customizable event headers, and manage dynamic bKash credentials.
              </p>
            </div>

            {/* Master Toggles */}
            <div className="grid grid-cols-1 gap-4 bg-[#f6f0e7] p-4 border border-[#cfc9bc] rounded">
              <div className="flex items-center justify-between p-3 bg-[#ede7da] border border-[#cfc9bc] rounded">
                <div>
                  <span className="font-bold text-sm text-[#141210] block">Registration Window</span>
                  <span className="text-[11px] text-[#6b6258] font-mono">
                    {festConfig.registrationOpen ? 'Open for Teams' : 'Registrations Closed'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRegistrationWindow}
                  disabled={configSaving}
                  className="p-1 text-[#c94030] disabled:opacity-50 transition-opacity"
                  aria-label="Toggle registration window"
                >
                  {festConfig.registrationOpen ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#9a9088]" />
                  )}
                </button>
              </div>
              {/* Granular feature flags: the bulletin feed and the pass module */}
              <div className="flex items-center justify-between p-3 bg-[#ede7da] border border-[#cfc9bc] rounded">
                <div>
                  <span className="font-bold text-sm text-[#141210] block">Bulletin Feed</span>
                  <span className="text-[11px] text-[#6b6258] font-mono">
                    {festConfig.bulletinActive !== false ? 'Announcements visible on the fest page' : 'Announcements hidden'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBulletin}
                  disabled={configSaving}
                  className="p-1 text-[#c94030] disabled:opacity-50 transition-opacity"
                  aria-label="Toggle bulletin feed"
                >
                  {festConfig.bulletinActive !== false ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#9a9088]" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#ede7da] border border-[#cfc9bc] rounded">
                <div>
                  <span className="font-bold text-sm text-[#141210] block">Participant Passes & Gate Check-in</span>
                  <span className="text-[11px] text-[#6b6258] font-mono">
                    {festConfig.passGeneration !== false ? 'Digital passes enabled' : 'Passes disabled site-wide'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePasses}
                  disabled={configSaving}
                  className="p-1 text-[#c94030] disabled:opacity-50 transition-opacity"
                  aria-label="Toggle participant passes and gate check-in"
                >
                  {festConfig.passGeneration !== false ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#9a9088]" />
                  )}
                </button>
              </div>
            </div>

            {/* Event Metadata */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-[#c94030]">Event Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Fest Title *</label>
                  <Input
                    value={festConfig.festTitle}
                    onChange={(e) => setFestConfig({ ...festConfig, festTitle: e.target.value })}
                    required
                    className="bg-[#f6f0e7] text-xs font-sans text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Fest Subtitle</label>
                  <Input
                    value={festConfig.festSubtitle}
                    onChange={(e) => setFestConfig({ ...festConfig, festSubtitle: e.target.value })}
                    className="bg-[#f6f0e7] text-xs font-sans text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Event Dates</label>
                  <Input
                    value={festConfig.festDates}
                    onChange={(e) => setFestConfig({ ...festConfig, festDates: e.target.value })}
                    placeholder="e.g. November 20-22, 2026"
                    className="bg-[#f6f0e7] text-xs font-mono text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Registration Deadline</label>
                  <Input
                    value={festConfig.registrationDeadline}
                    onChange={(e) => setFestConfig({ ...festConfig, registrationDeadline: e.target.value })}
                    placeholder="e.g. November 12, 2026"
                    className="bg-[#f6f0e7] text-xs font-mono text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Venue</label>
                  <Input
                    value={festConfig.venue}
                    onChange={(e) => setFestConfig({ ...festConfig, venue: e.target.value })}
                    className="bg-[#f6f0e7] text-xs font-sans text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Total Prize Pool</label>
                  <Input
                    value={festConfig.prizePool}
                    onChange={(e) => setFestConfig({ ...festConfig, prizePool: e.target.value })}
                    placeholder="e.g. ৳ 1,50,000+"
                    className="bg-[#f6f0e7] text-xs font-mono text-[#141210]"
                  />
                </div>
              </div>
            </div>

            {/* Customizable bKash & Payment Settings */}
            <div className="space-y-4 border-t border-[#cfc9bc] pt-4">
              <h3 className="text-xs font-mono font-bold uppercase text-[#c94030]">Dynamic bKash Payment Credentials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Account Mode</label>
                  <select
                    value={festConfig.bkashAccountType}
                    onChange={(e) =>
                      setFestConfig({
                        ...festConfig,
                        bkashAccountType: e.target.value as 'Merchant' | 'Personal' | 'Rocket' | 'Nagad',
                      })
                    }
                    className="w-full h-10 px-3 border border-[#cfc9bc] bg-[#f6f0e7] text-xs font-mono text-[#141210] rounded"
                  >
                    <option value="Personal">Personal (Send Money)</option>
                    <option value="Merchant">Merchant (Payment)</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Nagad">Nagad</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">
                    Official bKash / Payment Number *
                  </label>
                  <Input
                    value={festConfig.bkashNumber}
                    onChange={(e) => setFestConfig({ ...festConfig, bkashNumber: e.target.value })}
                    placeholder="e.g. 017XXXXXXXX"
                    required
                    className="bg-[#f6f0e7] text-xs font-mono text-[#141210]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">Payment Instructions</label>
                  <textarea
                    rows={3}
                    value={festConfig.bkashInstructions}
                    onChange={(e) => setFestConfig({ ...festConfig, bkashInstructions: e.target.value })}
                    className="w-full p-2.5 bg-[#f6f0e7] border border-[#cfc9bc] text-xs font-sans text-[#141210] rounded"
                  />
                </div>
              </div>
            </div>

            {/* Custom Messaging & Rulebook */}
            <div className="space-y-4 border-t border-[#cfc9bc] pt-4">
              <h3 className="text-xs font-mono font-bold uppercase text-[#c94030]">Messaging & Official Rulebook</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">
                    Placeholder Message when Registration is Closed
                  </label>
                  <Input
                    value={festConfig.closedMessage}
                    onChange={(e) => setFestConfig({ ...festConfig, closedMessage: e.target.value })}
                    className="bg-[#f6f0e7] text-xs font-sans text-[#141210]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[#141210] font-bold">
                    Official Rulebook PDF URL
                  </label>
                  <Input
                    value={festConfig.rulesUrl || ''}
                    onChange={(e) => setFestConfig({ ...festConfig, rulesUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#f6f0e7] text-xs font-mono text-[#141210]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={configSaving} className="font-mono text-xs uppercase tracking-wider">
                {configSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                {configSaving ? 'Saving...' : 'Save Fest Configuration'}
              </Button>
            </div>
          </form>
        )}

        {/* ═══ TAB 3: ON-SITE QR SCANNER ═══ */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto">
            <QrCheckInScanner onCheckInSuccess={fetchFestData} />
          </div>
        )}

        {/* ═══ TAB 4: SEGMENTS ═══ */}
        {activeTab === 'segments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#ede7da] p-4 border border-[#cfc9bc] rounded">
              <div>
                <h3 className="font-bold text-sm text-[#141210]">Fest Competition Segments</h3>
                <p className="text-xs text-[#6b6258] mt-0.5">
                  Configure segment limits, fees, custom payment numbers, and rulebook files.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingSegmentId(null);
                  setSegmentFormData({
                    title: '',
                    category: 'Robotics',
                    description: '',
                    teamMin: '1',
                    teamMax: '4',
                    registrationFee: '1000',
                    prizePool: '',
                    rulesUrl: '',
                    venue: '',
                    scheduleTime: '',
                    customBkashNumber: '',
                    customBkashType: '',
                    requiresSubmissionLink: false,
                    isOpen: true,
                  });
                  setIsSegmentFormOpen(true);
                }}
                size="sm"
                className="font-mono text-xs uppercase"
              >
                <Plus size={14} className="mr-1" /> Add Segment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((seg) => (
                <div key={seg.id} className="border border-[#cfc9bc] bg-[#ede7da] p-5 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#c94030] bg-[#f6f0e7] px-2 py-0.5 border border-[#cfc9bc] rounded">
                      {seg.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSegmentOpen(seg)}
                      className={`text-xs font-mono font-bold flex items-center gap-1 ${
                        seg.isOpen ? 'text-emerald-700' : 'text-[#c72c2c]'
                      }`}
                    >
                      {seg.isOpen ? '● Open' : '● Closed'}
                    </button>
                  </div>

                  <h4 className="text-lg font-bold text-[#141210]">{seg.title}</h4>
                  <p className="text-xs text-[#3a3530] line-clamp-2">{seg.description}</p>

                  <div className="text-xs font-mono space-y-1 bg-[#f6f0e7] p-2.5 border border-[#cfc9bc] rounded text-[#6b6258]">
                    <div className="flex justify-between">
                      <span>Fee:</span>
                      <strong className="text-[#141210]">
                        {seg.registrationFee === 0 ? 'FREE' : `৳ ${seg.registrationFee}`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Team:</span>
                      <strong className="text-[#141210]">
                        {seg.teamMin === seg.teamMax ? `${seg.teamMin}` : `${seg.teamMin}–${seg.teamMax}`} members
                      </strong>
                    </div>
                    {seg.customBkashNumber && (
                      <div className="flex justify-between text-[11px] text-[#c94030]">
                        <span>Custom bKash:</span>
                        <strong>{seg.customBkashNumber}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#cfc9bc]">
                    <Button variant="outline" size="sm" onClick={() => handleEditSegment(seg)}>
                      <Edit2 size={13} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: seg.id, title: seg.title, type: 'segment' })}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 5: SCHEDULE ═══ */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#ede7da] p-4 border border-[#cfc9bc] rounded">
              <h3 className="font-bold text-sm text-[#141210]">Event Timetable Slots</h3>
              <Button onClick={() => setIsScheduleFormOpen(true)} size="sm" className="font-mono text-xs uppercase">
                <Plus size={14} className="mr-1" /> Add Timetable Slot
              </Button>
            </div>

            <div className="divide-y divide-[#cfc9bc] border border-[#cfc9bc] bg-[#ede7da] rounded">
              {schedule.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-[#c94030] mr-2">[{item.day} · {item.time}]</span>
                    <strong className="text-[#141210] font-sans text-sm">{item.segmentTitle}</strong>
                    <span className="text-[#6b6258] ml-2">Stage: {item.stage} · {item.venue}</span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: item.id!, title: item.segmentTitle, type: 'schedule' })}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 6: ANNOUNCEMENTS ═══ */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#ede7da] p-4 border border-[#cfc9bc] rounded">
              <h3 className="font-bold text-sm text-[#141210]">Live Match Results & Notices</h3>
              <Button onClick={() => setIsAnnounceFormOpen(true)} size="sm" className="font-mono text-xs uppercase">
                <Plus size={14} className="mr-1" /> Post Announcement
              </Button>
            </div>

            <div className="space-y-3">
              {announcements.map((post) => (
                <div key={post.id} className="bg-[#ede7da] border border-[#cfc9bc] p-4 rounded flex items-start justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 bg-[#c94030] text-white font-mono text-[10px] uppercase font-bold rounded">
                      {post.tag}
                    </span>
                    <h4 className="text-base font-bold text-[#141210] mt-1">{post.title}</h4>
                    <p className="text-xs text-[#3a3530] mt-1 whitespace-pre-wrap">{post.body}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: post.id!, title: post.title, type: 'announcement' })}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SEGMENT FORM MODAL ═══ */}
        {isSegmentFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-[#ede7da] border border-[#cfc9bc] w-full max-w-lg p-6 rounded relative my-auto shadow-2xl">
              <button
                onClick={() => setIsSegmentFormOpen(false)}
                className="absolute top-4 right-4 text-[#6b6258] hover:text-[#141210]"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4 text-[#141210]">
                {editingSegmentId ? 'Edit Segment' : 'Create Segment'}
              </h3>
              <form onSubmit={handleSaveSegment} className="space-y-3 text-xs">
                <div>
                  <label className="font-mono font-bold block mb-1">Segment Title *</label>
                  <Input
                    value={segmentFormData.title}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, title: e.target.value })}
                    required
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono font-bold block mb-1">Category</label>
                    <Input
                      value={segmentFormData.category}
                      onChange={(e) => setSegmentFormData({ ...segmentFormData, category: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                  <div>
                    <label className="font-mono font-bold block mb-1">Registration Fee (৳)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100000}
                      value={segmentFormData.registrationFee}
                      onChange={(e) => setSegmentFormData({ ...segmentFormData, registrationFee: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono font-bold block mb-1">Min Members</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={segmentFormData.teamMin}
                      onChange={(e) => setSegmentFormData({ ...segmentFormData, teamMin: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                  <div>
                    <label className="font-mono font-bold block mb-1">Max Members</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={segmentFormData.teamMax}
                      onChange={(e) => setSegmentFormData({ ...segmentFormData, teamMax: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={segmentFormData.description}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, description: e.target.value })}
                    className="w-full p-2 bg-[#f6f0e7] border border-[#cfc9bc] rounded text-[#141210]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Prize Pool / Rewards</label>
                  <Input
                    value={segmentFormData.prizePool}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, prizePool: e.target.value })}
                    placeholder="e.g. ৳ 35,000"
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Custom Segment Payment Number (optional override)</label>
                  <Input
                    value={segmentFormData.customBkashNumber}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, customBkashNumber: e.target.value })}
                    placeholder="Leave blank to use main fest payment number"
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                  {segmentFormData.customBkashNumber.trim() !== '' && (
                    <>
                      <label className="font-mono font-bold block mb-1 mt-3">Account mode for this number</label>
                      <select
                        value={segmentFormData.customBkashType}
                        onChange={(e) => setSegmentFormData({ ...segmentFormData, customBkashType: e.target.value as typeof segmentFormData.customBkashType })}
                        className="w-full h-10 px-3 border border-[#cfc9bc] bg-[#f6f0e7] text-xs font-mono text-[#141210] rounded"
                      >
                        <option value="">Same as main fest payment setting</option>
                        <option value="Personal">Personal (Send Money)</option>
                        <option value="Merchant">Merchant (Payment)</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Nagad">Nagad</option>
                      </select>
                    </>
                  )}
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Rulebook PDF URL</label>
                  <Input
                    value={segmentFormData.rulesUrl}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, rulesUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="segIsOpen"
                    checked={segmentFormData.isOpen}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, isOpen: e.target.checked })}
                    className="accent-[#c94030]"
                  />
                  <label htmlFor="segIsOpen" className="font-mono text-xs">
                    Registration is currently open for this segment
                  </label>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="requiresSubmissionLink"
                    checked={segmentFormData.requiresSubmissionLink}
                    onChange={(e) => setSegmentFormData({ ...segmentFormData, requiresSubmissionLink: e.target.checked })}
                    className="accent-[#c94030] mt-0.5"
                  />
                  <label htmlFor="requiresSubmissionLink" className="font-mono text-xs leading-relaxed">
                    Require a Google Drive, presentation, repository, or video link during registration
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#cfc9bc]">
                  <Button type="button" variant="secondary" onClick={() => setIsSegmentFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Segment</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══ SCHEDULE FORM MODAL ═══ */}
        {isScheduleFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#ede7da] border border-[#cfc9bc] w-full max-w-md p-6 rounded relative shadow-2xl">
              <button
                onClick={() => setIsScheduleFormOpen(false)}
                className="absolute top-4 right-4 text-[#6b6258] hover:text-[#141210]"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4 text-[#141210]">Add Timetable Slot</h3>
              <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
                <div>
                  <label className="font-mono font-bold block mb-1">Day</label>
                  <Input
                    value={scheduleFormData.day}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, day: e.target.value })}
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Time Slot</label>
                  <Input
                    value={scheduleFormData.time}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Segment / Competition *</label>
                  <Input
                    value={scheduleFormData.segmentTitle}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, segmentTitle: e.target.value })}
                    required
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono font-bold block mb-1">Stage</label>
                    <Input
                      value={scheduleFormData.stage}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, stage: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                  <div>
                    <label className="font-mono font-bold block mb-1">Venue</label>
                    <Input
                      value={scheduleFormData.venue}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, venue: e.target.value })}
                      className="bg-[#f6f0e7] text-[#141210]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#cfc9bc]">
                  <Button type="button" variant="secondary" onClick={() => setIsScheduleFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Slot</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══ ANNOUNCEMENT FORM MODAL ═══ */}
        {isAnnounceFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#ede7da] border border-[#cfc9bc] w-full max-w-md p-6 rounded relative shadow-2xl">
              <button
                onClick={() => setIsAnnounceFormOpen(false)}
                className="absolute top-4 right-4 text-[#6b6258] hover:text-[#141210]"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4 text-[#141210]">Post Notice / Match Result</h3>
              <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
                <div>
                  <label className="font-mono font-bold block mb-1">Tag</label>
                  <select
                    value={announceFormData.tag}
                    onChange={(e) => setAnnounceFormData({ ...announceFormData, tag: e.target.value as 'Notice' | 'Result' | 'Schedule' | 'Urgent' })}
                    className="w-full h-10 px-3 border border-[#cfc9bc] bg-[#f6f0e7] text-[#141210] rounded"
                  >
                    <option value="Notice">Notice</option>
                    <option value="Result">Result</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Title *</label>
                  <Input
                    value={announceFormData.title}
                    onChange={(e) => setAnnounceFormData({ ...announceFormData, title: e.target.value })}
                    required
                    className="bg-[#f6f0e7] text-[#141210]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold block mb-1">Message Body *</label>
                  <textarea
                    rows={4}
                    value={announceFormData.body}
                    onChange={(e) => setAnnounceFormData({ ...announceFormData, body: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#f6f0e7] border border-[#cfc9bc] rounded text-[#141210]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#cfc9bc]">
                  <Button type="button" variant="secondary" onClick={() => setIsAnnounceFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Post Notice</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
        <DeleteModal
          isOpen={deleteTarget !== null}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteTarget?.title || ''}`}
          description={`This will permanently remove "${deleteTarget?.title || ''}". This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      </div>
    </AdminGuard>
  );
}
