'use client'

import { useState, useEffect } from 'react';
import { formatCountdown } from '@/lib/utils';

interface CountdownProps {
  targetDate: Date;
  onComplete?: () => void;
}

export function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetDate.getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetDate.getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        onComplete?.();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  // Attempt to use formatCountdown, fallback if it returns a string or errors
  let days = 0, hours = 0, minutes = 0, seconds = 0;
  try {
    const res = formatCountdown(timeLeft);
    if (typeof res === 'object' && res !== null) {
      ({ days, hours, minutes, seconds } = res as any);
    } else {
      throw new Error("Not an object");
    }
  } catch {
    const r = Math.max(0, timeLeft);
    days = Math.floor(r / (1000 * 60 * 60 * 24));
    hours = Math.floor((r / (1000 * 60 * 60)) % 24);
    minutes = Math.floor((r / 1000 / 60) % 60);
    seconds = Math.floor((r / 1000) % 60);
  }

  return (
    <div className="flex flex-row gap-3">
      {[ 
        { label: 'DAYS', value: days },
        { label: 'HRS', value: hours },
        { label: 'MIN', value: minutes },
        { label: 'SEC', value: seconds }
      ].map(unit => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="font-mono text-[0.875rem] md:text-[1rem] text-[#141210]">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="mono-label text-[#6b6258] text-xs mt-1">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
