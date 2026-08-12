import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatAuctionCountdown, getAuctionDisplayStatus } from '../utils/countdown';
import type { AuctionStatus } from '../data/mockData';

export default function CountdownTimer({
  endTime,
  status,
  startTime,
}: {
  endTime: string;
  status?: AuctionStatus;
  startTime?: string;
}) {
  const normalizedStatus = getAuctionDisplayStatus(status ?? 'upcoming', startTime, endTime);
  const [label, setLabel] = useState(formatAuctionCountdown(endTime, status ?? 'upcoming', startTime));

  useEffect(() => {
    setLabel(formatAuctionCountdown(endTime, status ?? 'upcoming', startTime));
    if (normalizedStatus === 'closed' || normalizedStatus === 'paused' || normalizedStatus === 'draft') return;

    const timer = setInterval(() => {
      setLabel(formatAuctionCountdown(endTime, status ?? 'upcoming', startTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, status, startTime, normalizedStatus]);

  const isActive = normalizedStatus === 'active';
  const isUpcoming = normalizedStatus === 'upcoming';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
      isActive 
        ? 'border-emerald-600 bg-emerald-950 text-emerald-300' 
        : isUpcoming 
          ? 'border-blue-600 bg-blue-950 text-blue-300'
          : 'border-slate-700 bg-slate-950 text-slate-100'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : isUpcoming ? 'text-blue-400' : 'text-slate-400'}`} />
      {label}
    </span>
  );
}
