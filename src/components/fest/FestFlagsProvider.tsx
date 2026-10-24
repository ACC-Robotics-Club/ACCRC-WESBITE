'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { subscribeToFestConfig, type FestConfig } from '@/lib/publicData';

/**
 * ── Festival Management feature flags ────────────────────────────────────
 *
 * One provider, one Firestore listener for the whole site. Previously the
 * navbar, footer, banner and homepage each opened their own realtime
 * subscription to `fest_settings/global_config`; now every festival-aware
 * component reads the same state from `useFestConfig()`.
 *
 * Kill switches, in order of reach:
 *
 *  1. Master build switch — set `NEXT_PUBLIC_FEST_ENABLED=false` before a
 *     build and the entire module reports OFF everywhere (routing, admin and
 *     core site stay untouched). Unset or any other value = fully enabled.
 *  2. Fest launch — admin's Public/Coming Soon switch (`isLaunched`).
 *  3. Granular sub-modules from the same Firestore config:
 *       • `registrationOpen` — segment registrations window
 *       • `bulletinActive`   — dynamic announcements feed
 *       • `passGeneration`   — digital QR passes + gate check-in
 *
 * Flags are `ready`-gated: until Firestore answers, festPublic is false, so
 * nothing flashes and the site must never advertise a fest that may not be
 * launched.
 */

/** Build-time master switch, inlined by the compiler. */
const MASTER_OFF = process.env.NEXT_PUBLIC_FEST_ENABLED === 'false';

export type RegistrationsState = 'open' | 'closed' | 'disabled';

export interface FestFlags {
  /** 'off' only via the master build switch; every fest UI reads this first. */
  module: 'on' | 'off';
  /** Firestore config answered (or the module is force-off). */
  ready: boolean;
  /** Launched and publicly advertised. */
  festPublic: boolean;
  /** Segment registration window. */
  registrations: RegistrationsState;
  /** Bulletins / announcements feed. */
  bulletin: 'active' | 'inactive';
  /** Digital passes + gate check-in. */
  passes: 'enabled' | 'disabled';
}

export interface FestRuntime {
  /** Live global fest config; null until Firestore answers (or master-off). */
  config: FestConfig | null;
  flags: FestFlags;
}

/** Config-neutral placeholder: shows nothing festival-related until ready. */
function makeFlags(module: 'on' | 'off', ready: boolean, config: FestConfig | null): FestFlags {
  const off = module === 'off';
  const festPublic = !off && ready && config?.isLaunched === true;
  return {
    module,
    ready: off ? true : ready,
    festPublic,
    registrations: festPublic
      ? config?.registrationOpen
        ? 'open'
        : 'closed'
      : 'disabled',
    bulletin: festPublic && config?.bulletinActive !== false ? 'active' : 'inactive',
    passes: festPublic && config?.passGeneration !== false ? 'enabled' : 'disabled',
  };
}

const FestFlagsContext = createContext<FestRuntime | undefined>(undefined);

/** Reads the shared festival state; safe to call outside the provider too. */
export function useFestConfig(): FestRuntime {
  const ctx = useContext(FestFlagsContext);
  if (ctx) return ctx;
  // Outside the provider (admin chrome, edge pages): the master switch still
  // applies, but nothing is subscribed or launched.
  return {
    config: null,
    flags: makeFlags(MASTER_OFF ? 'off' : 'on', false, null),
  };
}

export function FestFlagsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FestConfig | null>(null);
  const [ready, setReady] = useState(false);

  /* The single realtime subscription every festival-aware component shares. */
  useEffect(() => {
    if (MASTER_OFF) return;
    const unsubscribe = subscribeToFestConfig(
      (next) => {
        setConfig(next);
        setReady(true);
      },
      (err) => {
        /* Stay unlaunched-safe: without an answer nothing festival UI shows. */
        console.warn('Festival flag service notice:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const runtime = useMemo<FestRuntime>(
    () => ({
      config,
      flags: makeFlags(MASTER_OFF ? 'off' : 'on', ready, config),
    }),
    [config, ready]
  );

  return <FestFlagsContext.Provider value={runtime}>{children}</FestFlagsContext.Provider>;
}
