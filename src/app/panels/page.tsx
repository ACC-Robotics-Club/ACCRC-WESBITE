import type { Metadata } from 'next';
import { LeadershipPanels } from '@/components/home/AchievementsAndPanels';

export const metadata: Metadata = {
  title: 'Executive Panels — ACCRC',
  description: 'Every ACCRC executive committee, from the founding team to the current panel.',
};

export default function PanelsPage() {
  return (
    <main>
      <LeadershipPanels />
    </main>
  );
}
