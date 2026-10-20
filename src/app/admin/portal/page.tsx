'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { getPortalConfig, updatePortalConfig, getApplications, getRegistrations, deleteApplication, deleteRegistration, updateApplicationStatus, updateRegistrationStatus, PortalConfig, Application, Registration, ReviewStatus } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, X, Loader2, Search, Trash2, Download } from 'lucide-react';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { acceptMembership, acceptanceEmailReady, sendAcceptanceEmail, type AcceptResult } from '@/lib/memberAcceptance';

type StatusFilter = 'all' | ReviewStatus;

const STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'border-[#cfc9bc] bg-[#f6f0e7] text-[#3a3530]',
  accepted: 'border-[#2f7a4a]/40 bg-[#2f7a4a]/10 text-[#2f7a4a]',
  rejected: 'border-[#c72c2c]/40 bg-[#c72c2c]/10 text-[#c72c2c]',
};

const statusOf = (record: { status?: ReviewStatus }): ReviewStatus => record.status ?? 'pending';

/** Builds a CSV file (Excel-friendly: UTF-8 with BOM) and downloads it. */
function downloadCsv(filename: string, header: string[], rows: (string | number | undefined)[][]) {
  const escape = (value: string | number | undefined) => {
    // A leading = + - @ would make Excel run the cell as a formula.
    const raw = String(value ?? '');
    const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusSelect({ value, disabled, label, onChange }: { value: ReviewStatus; disabled: boolean; label: string; onChange: (status: ReviewStatus) => void }) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.value as ReviewStatus)}
      className={`rounded border px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider disabled:cursor-wait disabled:opacity-60 ${STATUS_STYLES[value]}`}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

export default function AdminPortal() {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [memberships, setMemberships] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sub-executive' | 'executive' | 'prefect' | 'membership'>('sub-executive');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [recordSearch, setRecordSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'application' | 'membership' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [configSaving, setConfigSaving] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [statusSaving, setStatusSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newRoles, setNewRoles] = useState({
    subExecRoles: '',
    execRoles: '',
    prefectRoles: '',
  });

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'membership' || tabParam === 'executive' || tabParam === 'prefect' || tabParam === 'sub-executive') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: 'sub-executive' | 'executive' | 'prefect' | 'membership') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  async function fetchData() {
    try {
      setLoading(true);
      const [conf, apps, mems] = await Promise.all([
        getPortalConfig(),
        getApplications(),
        getRegistrations({ type: 'membership' })
      ]);
      setConfig(conf);
      setApplications(apps);
      setMemberships(mems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch portal data');
    } finally {
      setLoading(false);
    }
  }

  const handleConfigChange = async (section: 'subExecOpen' | 'execOpen' | 'prefectOpen', value: boolean) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      [section]: value
    };
    setConfig(newConfig);
    setConfigSaving(section);
    setError(null);
    try {
      await updatePortalConfig(newConfig);
    } catch (err: any) {
      setError('Failed to update application status: ' + err.message);
      // Revert on error
      fetchData();
    } finally {
      setConfigSaving(null);
    }
  };

  const addRole = async (section: 'subExecRoles' | 'execRoles' | 'prefectRoles') => {
    if (!config) return;
    
    const roleToAdd = newRoles[section].trim();
    if (!roleToAdd) return;
    
    if (config[section].includes(roleToAdd)) {
      setError('That role is already listed.');
      return;
    }
    
    const newConfig = {
      ...config,
      [section]: [...config[section], roleToAdd]
    };
    
    setConfig(newConfig);
    setNewRoles((current) => ({ ...current, [section]: '' }));
    setConfigSaving(section);
    setError(null);
    try {
      await updatePortalConfig(newConfig);
    } catch (err: any) {
      setError('Failed to add role: ' + err.message);
      fetchData();
    } finally {
      setConfigSaving(null);
    }
  };

  const removeRole = async (section: 'subExecRoles' | 'execRoles' | 'prefectRoles', roleToRemove: string) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      [section]: config[section].filter(r => r !== roleToRemove)
    };
    
    setConfig(newConfig);
    setConfigSaving(section);
    setError(null);
    try {
      await updatePortalConfig(newConfig);
    } catch (err: any) {
      setError('Failed to remove role: ' + err.message);
      fetchData();
    } finally {
      setConfigSaving(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const deletedRecord = deleteTarget;
    setIsDeleting(true);
    setError(null);
    try {
      if (deletedRecord.type === 'application') {
        await deleteApplication(deletedRecord.id);
        setApplications((prev) => prev.filter((application) => application.id !== deletedRecord.id));
      } else {
        await deleteRegistration(deletedRecord.id);
        setMemberships((prev) => prev.filter((membership) => membership.id !== deletedRecord.id));
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const reportAcceptance = (member: Registration, result: AcceptResult) => {
    setMemberships((prev) => prev.map((membership) => membership.id === member.id
      ? { ...membership, status: 'accepted', clubId: result.clubId, ...(result.emailSent ? { acceptanceEmailSentAt: new Date() } : {}) }
      : membership));
    setNotice(result.emailSent
      ? `${member.name} is accepted as ${result.clubId}. The welcome email with the club ID was sent to ${member.email}.`
      : null);
    if (!result.emailSent) {
      setError(`${member.name} is accepted as ${result.clubId}, but the email was not sent: ${result.emailProblem} Use "Send email" in their row to try again.`);
    }
  };

  const handleResendEmail = async (member: Registration) => {
    if (!member.clubId) return;
    setStatusSaving(member.id!);
    setError(null);
    setNotice(null);
    try {
      reportAcceptance(member, await sendAcceptanceEmail(member, member.clubId));
    } finally {
      setStatusSaving(null);
    }
  };

  const handleStatusChange = async (id: string, type: 'application' | 'membership', status: ReviewStatus) => {
    setStatusSaving(id);
    setError(null);
    setNotice(null);
    try {
      if (type === 'application') {
        await updateApplicationStatus(id, status);
        setApplications((prev) => prev.map((application) => application.id === id ? { ...application, status } : application));
      } else if (status === 'accepted') {
        // Accepting gives the member a club ID and emails it to them.
        const member = memberships.find((membership) => membership.id === id);
        if (!member) throw new Error('Membership request not found.');
        reportAcceptance(member, await acceptMembership(member));
      } else {
        await updateRegistrationStatus(id, status);
        setMemberships((prev) => prev.map((membership) => membership.id === id ? { ...membership, status } : membership));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? 'Failed to update status: ' + err.message : 'Failed to update status');
    } finally {
      setStatusSaving(null);
    }
  };

  const searchTerm = recordSearch.trim().toLocaleLowerCase();
  const matchesStatus = (record: { status?: ReviewStatus }) => statusFilter === 'all' || statusOf(record) === statusFilter;
  const filteredApps = applications.filter((application) =>
    application.type === activeTab &&
    matchesStatus(application) &&
    [
      application.name,
      application.email,
      application.whatsapp,
      application.idNumber,
      application.section,
      application.roleApplyingFor,
      application.pastExperience,
      application.visionStatement,
    ].some((value) => String(value ?? '').toLocaleLowerCase().includes(searchTerm))
  );
  const filteredMemberships = memberships.filter((membership) =>
    matchesStatus(membership) &&
    [
      membership.clubId,
      membership.name,
      membership.email,
      membership.whatsapp,
      membership.collegeId,
      membership.rollNumber,
      membership.classSection,
      membership.motivation,
      membership.areaOfInterest,
      membership.bloodGroup,
    ].some((value) => String(value ?? '').toLocaleLowerCase().includes(searchTerm))
  );

  const tabRecords: { status?: ReviewStatus }[] = activeTab === 'membership'
    ? memberships
    : applications.filter((application) => application.type === activeTab);
  const countFor = (filter: StatusFilter) => filter === 'all' ? tabRecords.length : tabRecords.filter((record) => statusOf(record) === filter).length;
  const pendingFor = (type: Application['type']) => applications.filter((application) => application.type === type && statusOf(application) === 'pending').length;
  const pendingMemberships = memberships.filter((membership) => statusOf(membership) === 'pending').length;

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    const formatDate = (value?: Date) => value ? new Date(value).toLocaleString() : '';
    if (activeTab === 'membership') {
      downloadCsv(
        `accrc-membership-${date}.csv`,
        ['Status', 'Club ID', 'Name', 'Email', 'WhatsApp', 'Class / Section', 'College ID', 'Area of interest', 'Blood group', 'Reason for joining', 'Submitted'],
        filteredMemberships.map((m) => [statusOf(m), m.clubId, m.name, m.email, m.whatsapp, m.classSection, m.collegeId || m.rollNumber, m.areaOfInterest, m.bloodGroup, m.motivation, formatDate(m.createdAt)]),
      );
    } else {
      downloadCsv(
        `accrc-${activeTab}-applications-${date}.csv`,
        ['Status', 'Name', 'Email', 'WhatsApp', 'ID', 'Section', 'Role', 'Experience', 'Vision', 'Submitted'],
        filteredApps.map((a) => [statusOf(a), a.name, a.email, a.whatsapp, a.idNumber, a.section, a.roleApplyingFor, a.pastExperience, a.visionStatement, formatDate(a.createdAt)]),
      );
    }
  };
  const exportCount = activeTab === 'membership' ? filteredMemberships.length : filteredApps.length;

  return (
    <AdminGuard>
      <div className="pt-8 container-content min-h-screen pb-16 text-[#141210]">
        <div className="mb-6">
          <Link href="/admin" className="text-[#6b6258] hover:text-[#c94030] font-mono text-sm flex items-center inline-flex">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-sans font-bold text-[#141210]">Applications &amp; Membership</h1>
        <p className="mt-2 mb-8 max-w-2xl text-[#3a3530]">Open or close leadership applications, set the roles people can apply for, and review every application and membership request.</p>

        {notice && (
          <div className="mb-6 p-4 bg-[#2f7d4f]/10 border border-[#2f7d4f]/25 text-[#245f3c] font-mono text-sm rounded">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#c72c2c]/10 border border-[#c72c2c]/20 text-[#c72c2c] font-mono text-sm rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#c94030]" />
          </div>
        ) : !config ? (
          <div className="border border-[#c72c2c]/30 bg-[#c72c2c]/10 p-6 text-[#c72c2c]" role="alert">
            Portal settings could not be loaded. Please refresh and try again.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Config Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sub-Executive Config */}
              <div className="border border-[#cfc9bc] bg-[#ede7da] p-6">
                <div className="flex justify-between items-center mb-6 border-b border-[#cfc9bc] pb-4">
                  <h2 className="text-xl font-sans font-bold text-[#141210]">Sub-Executive Portal</h2>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={config.subExecOpen} 
                        disabled={configSaving !== null}
                        aria-label="Toggle sub-executive applications"
                        onChange={(e) => void handleConfigChange('subExecOpen', e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${config.subExecOpen ? 'bg-[#c94030]' : 'bg-[#cfc9bc]'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.subExecOpen ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 font-mono text-sm uppercase text-[#141210] font-semibold">
                      {config.subExecOpen ? 'Open' : 'Closed'}
                    </span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#141210] font-bold mb-3">Available Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {config.subExecRoles.map(role => (
                      <div key={role} className="bg-[#f6f0e7] border border-[#cfc9bc] px-3 py-1 flex items-center text-sm text-[#141210] font-mono">
                        <span>{role}</span>
                        <button type="button" disabled={configSaving !== null} onClick={() => void removeRole('subExecRoles', role)} className="ml-2 text-[#6b6258] hover:text-[#c72c2c] disabled:cursor-wait" aria-label={`Remove ${role}`}>
                          {configSaving === 'subExecRoles' ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : <X className="w-3 h-3" aria-hidden />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newRoles.subExecRoles}
                      onChange={(e) => setNewRoles((current) => ({ ...current, subExecRoles: e.target.value }))}
                      placeholder="Add new role..." 
                      className="flex-1 text-[#141210]"
                      onKeyDown={(e) => e.key === 'Enter' && addRole('subExecRoles')}
                      disabled={configSaving !== null}
                    />
                    <Button type="button" onClick={() => void addRole('subExecRoles')} variant="secondary" loading={configSaving === 'subExecRoles'} disabled={configSaving !== null}>Add</Button>
                  </div>
                </div>
              </div>

              {/* Executive Config */}
              <div className="border border-[#cfc9bc] bg-[#ede7da] p-6">
                <div className="flex justify-between items-center mb-6 border-b border-[#cfc9bc] pb-4">
                  <h2 className="text-xl font-sans font-bold text-[#141210]">Executive Portal</h2>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={config.execOpen} 
                        disabled={configSaving !== null}
                        aria-label="Toggle executive applications"
                        onChange={(e) => void handleConfigChange('execOpen', e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${config.execOpen ? 'bg-[#c94030]' : 'bg-[#cfc9bc]'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.execOpen ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 font-mono text-sm uppercase text-[#141210] font-semibold">
                      {config.execOpen ? 'Open' : 'Closed'}
                    </span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#141210] font-bold mb-3">Available Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {config.execRoles.map(role => (
                      <div key={role} className="bg-[#f6f0e7] border border-[#cfc9bc] px-3 py-1 flex items-center text-sm text-[#141210] font-mono">
                        <span>{role}</span>
                        <button type="button" disabled={configSaving !== null} onClick={() => void removeRole('execRoles', role)} className="ml-2 text-[#6b6258] hover:text-[#c72c2c] disabled:cursor-wait" aria-label={`Remove ${role}`}>
                          {configSaving === 'execRoles' ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : <X className="w-3 h-3" aria-hidden />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newRoles.execRoles}
                      onChange={(e) => setNewRoles((current) => ({ ...current, execRoles: e.target.value }))}
                      placeholder="Add new role..." 
                      className="flex-1 text-[#141210]"
                      onKeyDown={(e) => e.key === 'Enter' && addRole('execRoles')}
                      disabled={configSaving !== null}
                    />
                    <Button type="button" onClick={() => void addRole('execRoles')} variant="secondary" loading={configSaving === 'execRoles'} disabled={configSaving !== null}>Add</Button>
                  </div>
                </div>
              </div>

              {/* Prefect Config */}
              <div className="border border-[#cfc9bc] bg-[#ede7da] p-6">
                <div className="flex justify-between items-center mb-6 border-b border-[#cfc9bc] pb-4">
                  <h2 className="text-xl font-sans font-bold text-[#141210]">Prefect Application</h2>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={config.prefectOpen}
                        disabled={configSaving !== null}
                        aria-label="Toggle prefect applications"
                        onChange={(e) => void handleConfigChange('prefectOpen', e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${config.prefectOpen ? 'bg-[#c94030]' : 'bg-[#cfc9bc]'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.prefectOpen ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 font-mono text-sm uppercase text-[#141210] font-semibold">
                      {config.prefectOpen ? 'Open' : 'Closed'}
                    </span>
                  </label>
                </div>

                <div className="mb-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#141210] font-bold mb-3">Available Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {config.prefectRoles.map(role => (
                      <div key={role} className="bg-[#f6f0e7] border border-[#cfc9bc] px-3 py-1 flex items-center text-sm text-[#141210] font-mono">
                        <span>{role}</span>
                        <button type="button" disabled={configSaving !== null} onClick={() => void removeRole('prefectRoles', role)} className="ml-2 text-[#6b6258] hover:text-[#c72c2c] disabled:cursor-wait" aria-label={`Remove ${role}`}>
                          {configSaving === 'prefectRoles' ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : <X className="w-3 h-3" aria-hidden />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRoles.prefectRoles}
                      onChange={(e) => setNewRoles((current) => ({ ...current, prefectRoles: e.target.value }))}
                      placeholder="Add new role..."
                      className="flex-1 text-[#141210]"
                      onKeyDown={(e) => e.key === 'Enter' && addRole('prefectRoles')}
                      disabled={configSaving !== null}
                    />
                    <Button type="button" onClick={() => void addRole('prefectRoles')} variant="secondary" loading={configSaving === 'prefectRoles'} disabled={configSaving !== null}>Add</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions Section */}
            <div className="border border-[#cfc9bc] bg-[#ede7da] mt-12">
              <div className="flex overflow-x-auto border-b border-[#cfc9bc]" role="tablist" aria-label="Application type">
                <button 
                  role="tab"
                  aria-selected={activeTab === 'sub-executive'}
                  className={`shrink-0 px-4 py-4 font-mono text-xs uppercase tracking-wider sm:px-6 sm:text-sm font-semibold transition-colors ${activeTab === 'sub-executive' ? 'bg-[#141210] text-[#c94030] border-b-2 border-[#c94030]' : 'text-[#141210] hover:bg-[#e6dfd1] border-b-2 border-transparent'}`}
                  onClick={() => handleTabChange('sub-executive')}
                >
                  Sub-Executive ({pendingFor('sub-executive')} pending)
                </button>
                <button 
                  role="tab"
                  aria-selected={activeTab === 'executive'}
                  className={`shrink-0 px-4 py-4 font-mono text-xs uppercase tracking-wider sm:px-6 sm:text-sm font-semibold transition-colors ${activeTab === 'executive' ? 'bg-[#141210] text-[#c94030] border-b-2 border-[#c94030]' : 'text-[#141210] hover:bg-[#e6dfd1] border-b-2 border-transparent'}`}
                  onClick={() => handleTabChange('executive')}
                >
                  Executive ({pendingFor('executive')} pending)
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'prefect'}
                  className={`shrink-0 px-4 py-4 font-mono text-xs uppercase tracking-wider sm:px-6 sm:text-sm font-semibold transition-colors ${activeTab === 'prefect' ? 'bg-[#141210] text-[#c94030] border-b-2 border-[#c94030]' : 'text-[#141210] hover:bg-[#e6dfd1] border-b-2 border-transparent'}`}
                  onClick={() => handleTabChange('prefect')}
                >
                  Prefect ({pendingFor('prefect')} pending)
                </button>
                <button 
                  role="tab"
                  aria-selected={activeTab === 'membership'}
                  className={`shrink-0 px-4 py-4 font-mono text-xs uppercase tracking-wider sm:px-6 sm:text-sm font-semibold transition-colors ${activeTab === 'membership' ? 'bg-[#141210] text-[#c94030] border-b-2 border-[#c94030]' : 'text-[#141210] hover:bg-[#e6dfd1] border-b-2 border-transparent'}`}
                  onClick={() => handleTabChange('membership')}
                >
                  Membership ({pendingMemberships} pending)
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-lg">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[#6b6258]" aria-hidden />
                  <Input
                    type="search"
                    value={recordSearch}
                    onChange={(event) => setRecordSearch(event.target.value)}
                    placeholder={activeTab === 'membership'
                      ? 'Search name, email, WhatsApp, college ID...'
                      : 'Search name, email, ID, section, role...'}
                    aria-label={activeTab === 'membership' ? 'Search membership requests' : 'Search applications'}
                    className="w-full bg-[#f6f0e7] pl-9 text-[#141210]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'pending', 'accepted', 'rejected'] as StatusFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={statusFilter === filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${statusFilter === filter ? 'border-[#141210] bg-[#141210] text-white' : 'border-[#cfc9bc] bg-[#f6f0e7] text-[#3a3530] hover:border-[#141210]'}`}
                    >
                      {filter} ({countFor(filter)})
                    </button>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={handleExport} disabled={exportCount === 0} className="font-mono text-[11px] uppercase">
                    <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Export CSV
                  </Button>
                </div>
                </div>
                {(activeTab === 'sub-executive' || activeTab === 'executive' || activeTab === 'prefect') && (
                  filteredApps.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-[#cfc9bc] rounded bg-[#f6f0e7]">
                      <p className="font-bold text-[#141210] text-base">
                        {searchTerm || statusFilter !== 'all' ? 'No matching applications found.' : 'No applications received yet.'}
                      </p>
                      <p className="mt-1 text-sm text-[#3a3530]">
                        {searchTerm ? 'Try a different name, email, ID, section, or role.' : 'Applications submitted through the public portal will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs font-mono uppercase bg-[#141210] text-white">
                          <tr>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Applicant</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">ID / Section</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">WhatsApp</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Role Applied</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Submitted</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Status</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApps.map(app => (
                            <React.Fragment key={app.id}>
                              <tr className="border-b border-[#cfc9bc] hover:bg-[#e6dfd1]/60 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-[#141210]">{app.name || 'Name not provided'}</div>
                                  <div className="mt-0.5 text-xs text-[#6b6258]">{app.email}</div>
                                </td>
                                <td className="px-4 py-3 font-mono text-[#3a3530]">
                                  {app.idNumber}<br/>{app.section}
                                </td>
                                <td className="px-4 py-3 font-mono text-[#3a3530] text-xs">
                                  {app.whatsapp || '—'}
                                </td>
                                <td className="px-4 py-3 text-[#c94030] font-bold">{app.roleApplyingFor}</td>
                                <td className="px-4 py-3 text-[#6b6258] font-mono text-xs">
                                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusSelect
                                    value={statusOf(app)}
                                    disabled={statusSaving === app.id}
                                    label={`Status of application from ${app.name || app.email}`}
                                    onChange={(status) => void handleStatusChange(app.id!, 'application', status)}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setExpandedAppId(expandedAppId === app.id ? null : (app.id || null))}
                                    >
                                      {expandedAppId === app.id ? 'Hide' : 'View'}
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      aria-label={`Delete application from ${app.name || app.email}`}
                                      onClick={() => setDeleteTarget({ id: app.id!, name: app.name || app.email, type: 'application' })}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              {expandedAppId === app.id && (
                                <tr className="bg-[#e6dfd1]/40">
                                  <td colSpan={7} className="px-6 py-4 border-b border-[#cfc9bc]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#141210]">
                                      <div>
                                        <h4 className="font-mono text-xs uppercase font-bold text-[#141210] mb-2">Contact details</h4>
                                        <div className="bg-[#ede7da] p-3 border border-[#cfc9bc] text-sm leading-relaxed">
                                          <p><span className="font-semibold text-[#6b6258]">Email:</span> {app.email}</p>
                                          <p><span className="font-semibold text-[#6b6258]">WhatsApp:</span> {app.whatsapp || 'Not provided'}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-mono text-xs uppercase font-bold text-[#141210] mb-2">Experience</h4>
                                        <div className="bg-[#ede7da] p-3 border border-[#cfc9bc] whitespace-pre-wrap text-sm text-[#3a3530]">
                                          {app.pastExperience || 'None specified'}
                                        </div>
                                      </div>
                                      <div className="md:col-span-2">
                                        <h4 className="font-mono text-xs uppercase font-bold text-[#141210] mb-2">Vision Statement</h4>
                                        <div className="bg-[#ede7da] p-3 border border-[#cfc9bc] whitespace-pre-wrap text-sm text-[#3a3530]">
                                          {app.visionStatement || 'None specified'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {activeTab === 'membership' && (
                  filteredMemberships.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-[#cfc9bc] rounded bg-[#f6f0e7]">
                      <p className="font-bold text-[#141210] text-base">
                        {searchTerm || statusFilter !== 'all' ? 'No matching membership requests found.' : 'No membership requests received yet.'}
                      </p>
                      <p className="mt-1 text-sm text-[#3a3530]">
                        {searchTerm ? 'Try a different name, email, WhatsApp number, or college ID.' : 'Membership applications submitted by students will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs font-mono uppercase bg-[#141210] text-white">
                          <tr>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Club ID</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Name</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Email</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">WhatsApp</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Class / Section</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">College ID</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Reason for joining</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Status</th>
                            <th className="px-4 py-3 border-b border-[#cfc9bc]">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMemberships.map(mem => (
                            <tr key={mem.id} className="border-b border-[#cfc9bc] hover:bg-[#e6dfd1]/60 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs font-bold text-[#c94030] whitespace-nowrap">
                                {mem.clubId || (statusOf(mem) === 'accepted' ? '' : '—')}
                                {statusOf(mem) === 'accepted' && !mem.clubId && (
                                  /* Accepted before club IDs existed. */
                                  <button
                                    type="button"
                                    disabled={statusSaving === mem.id}
                                    title="Give this member a club ID and email it to them"
                                    onClick={() => void handleStatusChange(mem.id!, 'membership', 'accepted')}
                                    className="block text-[10px] font-semibold uppercase tracking-wider text-[#3a3530] underline underline-offset-2 disabled:cursor-wait disabled:opacity-50"
                                  >
                                    Give ID &amp; email
                                  </button>
                                )}
                                {statusOf(mem) === 'accepted' && mem.clubId && (
                                  mem.acceptanceEmailSentAt ? (
                                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-[#2f7d4f]">Emailed</span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={statusSaving === mem.id || !acceptanceEmailReady}
                                      title={acceptanceEmailReady ? 'Email the club ID to this member' : 'Email sending is not set up yet'}
                                      onClick={() => void handleResendEmail(mem)}
                                      className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-[#3a3530] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Send email
                                    </button>
                                  )
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-[#141210]">{mem.name}</td>
                              <td className="px-4 py-3 text-[#3a3530]">{mem.email}</td>
                              <td className="px-4 py-3 font-mono text-[#3a3530] text-xs">{mem.whatsapp || '—'}</td>
                              <td className="px-4 py-3 text-[#3a3530]">{mem.classSection}</td>
                              <td className="px-4 py-3 font-mono text-[#141210] font-semibold">{mem.collegeId || mem.rollNumber || 'N/A'}</td>
                              <td className="px-4 py-3 text-[#3a3530] max-w-sm whitespace-pre-wrap leading-relaxed">{mem.motivation || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <StatusSelect
                                  value={statusOf(mem)}
                                  disabled={statusSaving === mem.id}
                                  label={`Status of membership request from ${mem.name}`}
                                  onChange={(status) => void handleStatusChange(mem.id!, 'membership', status)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  aria-label={`Delete membership application from ${mem.name}`}
                                  onClick={() => setDeleteTarget({ id: mem.id!, name: mem.name, type: 'membership' })}
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <DeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'application' ? 'Delete application?' : 'Delete membership?'}
        description={deleteTarget ? `Are you sure you want to permanently delete the record for "${deleteTarget.name}"? This action cannot be undone.` : ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminGuard>
  );
}
