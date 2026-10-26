'use client'

import { useState, useEffect } from 'react';
import { getEventStatus } from '@/lib/utils';
import { Countdown } from './Countdown';

interface EventStatusProps {
  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
}

export function EventStatus({ registrationOpensAt, registrationClosesAt }: EventStatusProps) {
  const [, setTick] = useState(0);
  
  // Re-compute status every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const { status, label } = getEventStatus(registrationOpensAt, registrationClosesAt);

  return (
    <div className="flex flex-col items-start gap-3">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${status === 'upcoming' ? 'bg-[#ede7da] text-[#c94030] border-[#c94030]/30' : 
          status === 'open' ? 'bg-success/10 text-success border-success/30' : 
          'bg-[#ede7da] text-[#6b6258] border-[#cfc9bc]'}
      `}>
        {label}
      </span>
      {status === 'upcoming' && registrationOpensAt && (
        <Countdown targetDate={registrationOpensAt} />
      )}
      {status === 'open' && registrationClosesAt && (
        <div>
          <span className="font-mono text-[10px] tracking-widest text-[#6b6258] mb-1 block">CLOSES IN</span>
          <Countdown targetDate={registrationClosesAt} />
        </div>
      )}
    </div>
  );
}
