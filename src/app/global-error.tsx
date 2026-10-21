'use client';

import './globals.css';
import { useEffect } from 'react';
import { ErrorScreen, ErrorButton } from '@/components/ErrorScreen';

/**
 * Last line of defence: replaces the whole page (including the header) when
 * even the site layout fails. Without it, visitors saw a blank
 * "Application error: a client-side exception has occurred".
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Site crashed:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-primary text-ink antialiased">
        <ErrorScreen
          code="500"
          label="SOMETHING BROKE"
          title="Something went wrong."
          message={<p>It&apos;s not you. Try again, or reload the page.</p>}
          actions={
            <>
              <ErrorButton onClick={reset}>Try again</ErrorButton>
              <ErrorButton onClick={() => window.location.reload()} variant="outline">
                Reload
              </ErrorButton>
            </>
          }
        />
      </body>
    </html>
  );
}
