import type { Metadata } from 'next';
import { InstagramPage } from '@/components/events/SocialFeed';

export const metadata: Metadata = {
  title: 'Instagram — ACCRC',
  description: 'Builds, competitions and club life from the ACCRC Instagram.',
};

export default function SocialPage() {
  return <InstagramPage />;
}
