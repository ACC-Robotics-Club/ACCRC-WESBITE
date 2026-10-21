import type { Metadata } from 'next';
import { ErrorScreen, ErrorLink } from '@/components/ErrorScreen';

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
      message={
        <p>
          This area is for ACCRC admins only. If you&apos;re an admin, sign in with the account that&apos;s on
          the admin list. Otherwise, there&apos;s plenty to explore on the main site.
        </p>
      }
      actions={
        <>
          <ErrorLink href="/admin/login/">Admin sign in</ErrorLink>
          <ErrorLink href="/" variant="outline">
            Back to home
          </ErrorLink>
        </>
      }
    />
  );
}
