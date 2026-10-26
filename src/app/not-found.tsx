import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/ErrorScreen';

export const metadata: Metadata = {
  title: '404: Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      label="PAGE NOT FOUND"
      title="This page wandered off the build table."
      message={<p>The link may be old or mistyped. Head back home, or check out what&apos;s coming up.</p>}
    />
  );
}
