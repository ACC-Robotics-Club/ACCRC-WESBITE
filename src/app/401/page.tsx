import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/ErrorScreen';

export const metadata: Metadata = {
  title: '401: Access denied',
  robots: { index: false, follow: false },
};

export default function Unauthorized() {
  return (
    <ErrorScreen
      code="401"
      label="ACCESS DENIED"
      title="You don't have access to this page."
      message={<p>This page isn&apos;t open to the public. There&apos;s plenty to explore on the main site.</p>}
    />
  );
}
