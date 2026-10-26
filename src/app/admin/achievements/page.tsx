'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit2, Loader2, Plus, Trash2, Trophy } from 'lucide-react';
import { DeleteModal } from '@/components/admin/DeleteModal';
import AdminGuard from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import {
  createAchievement,
  deleteAchievement,
  subscribeToAchievements,
  updateAchievement,
  type FirestoreAchievement,
} from '@/lib/firestore';

type AchievementForm = {
  title: string;
  recipients: string;
  competition: string;
  level: 'Global' | 'National';
  year: string;
};

const emptyForm = (): AchievementForm => ({
  title: '',
  recipients: '',
  competition: '',
  level: 'National',
  year: String(new Date().getFullYear()),
});

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<FirestoreAchievement[]>([]);
  const [formData, setFormData] = useState<AchievementForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreAchievement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAchievements(
      (entries) => {
        setAchievements(entries);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message || 'Unable to load achievements.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const closeForm = () => {
    setFormData(emptyForm());
    setEditingId(null);
    setFormOpen(false);
  };

  const startEdit = (achievement: FirestoreAchievement) => {
    setFormData({
      title: achievement.title,
      recipients: achievement.recipients,
      competition: achievement.competition,
      level: achievement.level,
      year: String(achievement.year),
    });
    setEditingId(achievement.id);
    setFormOpen(true);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year = Number(formData.year);

    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      setError('Enter a valid four-digit year.');
      return;
    }

    setSaving(true);
    setError(null);
    const payload = { ...formData, year };

    try {
      if (editingId) {
        await updateAchievement(editingId, payload);
      } else {
        await createAchievement(payload);
      }
      closeForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the achievement.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const deletedAchievement = deleteTarget;
    setIsDeleting(true);
    setError(null);
    setAchievements((current) => current.filter((achievement) => achievement.id !== deletedAchievement.id));
    try {
      await deleteAchievement(deletedAchievement.id);
      setDeleteTarget(null);
    } catch (deleteError) {
      setAchievements((current) => [...current, deletedAchievement].sort((a, b) => b.year - a.year || b.createdAt.getTime() - a.createdAt.getTime()));
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the achievement.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminGuard>
      <main className="container-content min-h-screen pb-16 pt-24 text-[#141210]">
        <Link href="/admin/" className="inline-flex items-center font-mono text-sm text-[#6b6258] hover:text-[#c94030]">
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden /> Back to Dashboard
        </Link>

        <header className="mb-8 mt-6 flex flex-col gap-5 border-b border-[#cfc9bc] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#c94030]">Public website content</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Manage Achievements</h1>
            <p className="mt-2 max-w-2xl text-[#3a3530]">Entries publish immediately in the matching year on the homepage.</p>
          </div>
          <Button onClick={() => { setFormOpen(true); setError(null); }}>
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Add achievement
          </Button>
        </header>

        {error && <p className="mb-6 border border-[#c72c2c]/30 bg-[#c72c2c]/10 p-4 font-mono text-sm text-[#c72c2c]" role="alert">{error}</p>}

        {formOpen && (
          <section className="mb-8 border border-[#cfc9bc] bg-[#ede7da] p-5 sm:p-6" aria-label={editingId ? 'Edit achievement' : 'Add achievement'}>
            <h2 className="border-b border-[#cfc9bc] pb-3 text-xl font-bold">{editingId ? 'Edit achievement' : 'Add achievement'}</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Award or result" name="title" value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} required />
                <Input label="Recipient or team" name="recipients" value={formData.recipients} onChange={(event) => setFormData((current) => ({ ...current, recipients: event.target.value }))} required />
                <div className="flex flex-col gap-1.5">
                  <label className="mono-label" htmlFor="achievement-level">Recognition level</label>
                  <select id="achievement-level" className="rounded border border-[#cfc9bc] bg-[#ede7da] px-5 py-4 text-lg text-[#141210] focus:border-[#c94030] focus:outline-none" value={formData.level} onChange={(event) => setFormData((current) => ({ ...current, level: event.target.value as AchievementForm['level'] }))}>
                    <option value="National">National</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
                <Input label="Year" name="year" type="number" min="1900" max="9999" inputMode="numeric" value={formData.year} onChange={(event) => setFormData((current) => ({ ...current, year: event.target.value }))} required />
              </div>
              <Textarea label="Competition, event, or context" name="competition" value={formData.competition} onChange={(event) => setFormData((current) => ({ ...current, competition: event.target.value }))} required />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
                <Button type="submit" loading={saving}>{editingId ? 'Save changes' : 'Publish achievement'}</Button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c94030]" /></div>
        ) : achievements.length === 0 ? (
          <div className="border border-dashed border-[#cfc9bc] bg-[#ede7da] px-6 py-14 text-center">
            <Trophy className="mx-auto h-8 w-8 text-[#c94030]" aria-hidden />
            <h2 className="mt-4 text-xl font-bold">No live achievements yet</h2>
            <p className="mt-2 text-[#6b6258]">Use “Add achievement” to publish the first one.</p>
          </div>
        ) : (
          <div className="space-y-3" aria-label="Published achievements">
            {achievements.map((achievement) => (
              <article className="flex flex-col gap-4 border border-[#cfc9bc] bg-[#ede7da] p-5 sm:flex-row sm:items-center sm:justify-between" key={achievement.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
                    <span className="border border-[#c94030]/50 px-2 py-1 text-[#c94030]">{achievement.level}</span>
                    <span className="text-[#6b6258]">{achievement.year}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{achievement.title}</h2>
                  <p className="mt-1 font-medium text-[#141210]">{achievement.recipients}</p>
                  <p className="mt-1 text-sm text-[#5a524a]">{achievement.competition}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(achievement)} aria-label={`Edit ${achievement.title}`}><Edit2 className="h-4 w-4" aria-hidden /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(achievement)} aria-label={`Delete ${achievement.title}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete achievement?"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminGuard>
  );
}
