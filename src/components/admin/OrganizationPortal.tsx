'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type OrganizationPortal = 'sub-executive' | 'executive' | 'prefect';

/**
 * The old per-role portal pages were only signposts. Everything for these
 * roles (open/close, roles, reviewing applications) lives on the
 * applications page, so old links and bookmarks go straight to the right tab.
 */
export function OrganizationPortal({ portal }: { portal: OrganizationPortal }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/portal/?tab=${portal}`);
  }, [portal, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f0e7]">
      <Loader2 className="h-8 w-8 animate-spin text-[#c94030]" aria-label="Opening applications" />
    </div>
  );
}
