'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  getFestRegistrationById,
  getFestRegistrationByParticipantId,
  checkInFestRegistration,
  type FestRegistration,
} from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { isSafeHttpsUrl } from '@/lib/safeUrl';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  ShieldCheck,
  User,
  Building,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function QrCheckInScanner({ onCheckInSuccess }: { onCheckInSuccess?: () => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedTeam, setScannedTeam] = useState<FestRegistration | null>(null);
  const [checkInState, setCheckInState] = useState<{
    success?: boolean;
    message?: string;
    time?: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'accrc-qr-reader';

  // Sound generator using Web Audio API
  const playBeep = (type: 'success' | 'warn') => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // AudioContext unavailable in silent environments
    }
  };

  const handleLookupId = async (idToLookup: string, autoCheckIn = false) => {
    if (!idToLookup.trim()) return;
    setLoading(true);
    setScannerError(null);
    setCheckInState(null);

    try {
      // Query registrations by teamId (doc ID) or participantId
      let team = await getFestRegistrationById(idToLookup.trim());
      if (!team) {
        team = await getFestRegistrationByParticipantId(idToLookup.trim());
      }

      if (!team) {
        setScannedTeam(null);
        setScannerError(`No registration found matching "${idToLookup.trim()}". Please verify the pass ID.`);
        playBeep('warn');
      } else {
        setScannedTeam(team);
        playBeep('success');

        // If scanned via QR and not yet checked in, auto-check-in per Section 5 spec
        if (autoCheckIn && !team.checkedIn && !team.checkInStatus && team.id) {
          try {
            const res = await checkInFestRegistration(team.id, 'Scanned and Verified at Entry Gate');
            setCheckInState({
              success: res.success,
              message: res.message,
              time: res.checkedInAt,
            });
            if (res.success) {
              setScannedTeam({
                ...team,
                checkedIn: true,
                checkInStatus: true,
                checkedInAt: res.checkedInAt,
                status: 'verified',
              });
              onCheckInSuccess?.();
            }
          } catch (autoErr) {
            console.warn('Auto check-in error:', autoErr);
          }
        }
      }
    } catch (err: unknown) {
      setScannerError(err instanceof Error ? err.message : 'Error retrieving team records.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      let lookupId = decodedText.trim();
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        try {
          const parsed = JSON.parse(decodedText);
          lookupId = parsed.teamId || parsed.pid || parsed.participantId || lookupId;
        } catch {
          // treat as plain text
        }
      }

      await handleLookupId(lookupId, true);
    } catch (err) {
      console.error('QR decode handling error', err);
    }
  };

  const startScanner = async () => {
    setScannerError(null);
    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      setScannerError(
        err instanceof Error
          ? err.message
          : 'Unable to access camera. Please verify camera permissions or use manual ID entry.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  const handleConfirmCheckIn = async () => {
    if (!scannedTeam || !scannedTeam.id) return;
    setLoading(true);
    try {
      const res = await checkInFestRegistration(scannedTeam.id, 'Verified at Gate Entry');
      setCheckInState({
        success: res.success,
        message: res.message,
        time: res.checkedInAt,
      });

      if (res.success) {
        playBeep('success');
        setScannedTeam({
          ...scannedTeam,
          checkedIn: true,
          checkedInAt: res.checkedInAt,
          status: 'verified',
        });
        onCheckInSuccess?.();
      } else {
        playBeep('warn');
      }
    } catch (err: unknown) {
      setScannerError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ede7da] border border-[#cfc9bc] p-6 rounded space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#cfc9bc] pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-[#c94030] tracking-wider block">
            On-Site Verification
          </span>
          <h3 className="text-xl font-bold text-[#141210]">Participant Pass QR Scanner</h3>
          <p className="text-xs text-[#3a3530] mt-0.5">
            Scan competitor pass badges at Adamjee Cantonment College gates for instant check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isScanning ? (
            <Button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider"
            >
              <Camera size={15} /> Start Camera Scanner
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={stopScanner}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#c72c2c] border-[#c72c2c]"
            >
              <CameraOff size={15} /> Stop Camera
            </Button>
          )}
        </div>
      </div>

      {scannerError && (
        <div className="p-3.5 bg-[#c72c2c]/10 border border-[#c72c2c]/20 text-[#c72c2c] text-xs font-mono rounded flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{scannerError}</span>
        </div>
      )}

      {/* Camera Viewport */}
      <div
        className={`bg-black rounded overflow-hidden max-w-sm mx-auto border-2 border-[#cfc9bc] relative ${
          isScanning ? 'block' : 'hidden'
        }`}
      >
        <div id={readerElementId} className="w-full" />
        <div className="absolute top-2 right-2 bg-black/70 text-white font-mono text-[10px] px-2 py-0.5 rounded">
          LIVE SCANNER
        </div>
      </div>

      {/* Manual Input Fallback */}
      <div className="bg-[#f6f0e7] p-4 border border-[#cfc9bc] rounded space-y-2">
        <label className="block text-xs font-mono font-bold uppercase text-[#141210]">
          Manual Participant / Pass ID Entry
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6b6258] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. ACCRC-FEST26-TM-1420"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupId(manualId);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#ede7da] border border-[#cfc9bc] rounded text-[#141210] uppercase"
            />
          </div>
          <Button
            type="button"
            disabled={loading || !manualId.trim()}
            onClick={() => handleLookupId(manualId)}
            size="sm"
            className="text-xs font-mono uppercase tracking-wider shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search Pass'}
          </Button>
        </div>
      </div>

      {/* Scanned Team Result Display */}
      {scannedTeam && (
        <div className="border-2 border-[#c94030] bg-[#f6f0e7] p-6 rounded shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cfc9bc] pb-3">
            <div>
              <span className="font-mono text-xs font-bold text-[#c94030] uppercase">
                {scannedTeam.segmentTitle}
              </span>
              <h4 className="text-2xl font-black text-[#141210]">{scannedTeam.teamName}</h4>
              <p className="text-xs text-[#6b6258] font-mono mt-0.5">
                Participant ID: <strong className="text-[#141210]">{scannedTeam.participantId}</strong>
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {scannedTeam.checkedIn ? (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold uppercase rounded">
                    <CheckCircle2 size={14} /> CHECKED IN
                  </span>
                  <p className="text-[10px] font-mono text-[#6b6258] mt-1">
                    At: {scannedTeam.checkedInAt ? new Date(scannedTeam.checkedInAt).toLocaleTimeString() : 'Earlier'}
                  </p>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 font-mono text-xs font-bold uppercase rounded">
                  Awaiting Entry Gate Check-In
                </span>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#ede7da] p-3 border border-[#cfc9bc] rounded space-y-1">
              <span className="text-[#6b6258] block uppercase text-[10px]">Institution & Leader</span>
              <p className="font-bold text-[#141210] text-sm">{scannedTeam.institution}</p>
              <p className="text-[#3a3530] font-sans">
                Leader: <strong>{scannedTeam.leaderName}</strong> ({scannedTeam.leaderPhone})
              </p>
              <p className="text-[#6b6258]">{scannedTeam.leaderEmail}</p>
            </div>

            <div className="bg-[#ede7da] p-3 border border-[#cfc9bc] rounded space-y-1">
              <span className="text-[#6b6258] block uppercase text-[10px]">Payment & Security</span>
              <p className="font-bold text-[#141210]">
                Method: {scannedTeam.paymentMethod || 'bKash'}
              </p>
              <p className="text-[#3a3530]">
                TrxID: <span className="font-bold text-[#c94030]">{scannedTeam.transactionId || 'N/A'}</span>
              </p>
              <p className="text-[10px] text-[#6b6258] truncate">
                Hash: {scannedTeam.verificationHash}
              </p>
            </div>

            {scannedTeam.members && scannedTeam.members.length > 0 && (
              <div className="sm:col-span-2 bg-[#ede7da] p-3 border border-[#cfc9bc] rounded">
                <span className="text-[#6b6258] block uppercase text-[10px] mb-1">
                  Team Members ({scannedTeam.members.length})
                </span>
                <p className="text-[#141210] font-sans">
                  {scannedTeam.members.map((m) => m.name).join(', ')}
                </p>
              </div>
            )}

            {isSafeHttpsUrl(scannedTeam.submissionLink) && (
              <div className="sm:col-span-2 bg-[#ede7da] p-3 border border-[#cfc9bc] rounded">
                <span className="text-[#6b6258] block uppercase text-[10px] mb-1">
                  Project / Presentation Link
                </span>
                <a
                  href={scannedTeam.submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f6f0e7] hover:bg-[#141210] hover:text-white border border-[#cfc9bc] rounded text-xs text-[#141210] transition-colors mt-1 break-all"
                >
                  <span>Open submitted project link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Alert if already checked in */}
          {scannedTeam.checkedIn && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs font-mono rounded flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0 text-red-600" />
              <span>
                <strong>NOTICE:</strong> This participant pass has already been scanned for entry at{' '}
                {scannedTeam.checkedInAt ? new Date(scannedTeam.checkedInAt).toLocaleString() : 'an earlier session'}.
                Verify physical badge to prevent duplicate entry.
              </span>
            </div>
          )}

          {checkInState && (
            <div
              className={`p-3 text-xs font-mono rounded flex items-center gap-2 ${
                checkInState.success
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                  : 'bg-amber-100 border border-amber-300 text-amber-800'
              }`}
            >
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{checkInState.message}</span>
            </div>
          )}

          {/* Check-In Action Button */}
          {!scannedTeam.checkedIn && (
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleConfirmCheckIn}
                disabled={loading}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase tracking-wider py-3 px-6"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <ShieldCheck size={16} className="mr-2" />
                )}
                Confirm On-Site Entry Check-In
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
