'use client';

import { useEffect } from 'react';
import { ErrorScreen, ErrorButton, ErrorLink } from '@/components/ErrorScreen';

/** Shown instead of a blank "Application error" when a page crashes. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page crashed:', error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      label="SOMETHING BROKE"
      title="Something went wrong on this page."
      message={<p>It&apos;s not you. Try again, and if it keeps happening, refresh the page or come back in a bit.</p>}
      actions={
        <>
          <ErrorButton onClick={reset}>Try again</ErrorButton>
          <ErrorLink href="/" variant="outline">
            Back to home
          </ErrorLink>
        </>
      }
    />
  );
}
