export function getAuctionDisplayStatus(status: string, startTime?: string, endTime?: string): string {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'closed') return 'closed';
  if (normalized === 'paused') return 'paused';
  if (normalized === 'draft') return 'draft';

  const now = Date.now();
  const startMs = startTime ? new Date(startTime).getTime() : null;
  const endMs = endTime ? new Date(endTime).getTime() : null;

  if (endMs !== null && endMs <= now) return 'closed';
  if (normalized === 'upcoming' || (startMs !== null && startMs > now)) return 'upcoming';
  if (normalized === 'active' || (startMs !== null && startMs <= now && (endMs === null || endMs > now))) return 'active';

  return normalized || 'upcoming';
}

export function getCountdown(targetTime: string): string {
  const end = new Date(targetTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

export function formatAuctionCountdown(endTime: string, status: string, startTime?: string): string {
  const displayStatus = getAuctionDisplayStatus(status, startTime, endTime);

  if (displayStatus === 'paused') return 'Paused';
  if (displayStatus === 'draft') return 'Draft';
  if (displayStatus === 'closed') return 'Ended';
  if (displayStatus === 'upcoming') return `Starts in ${getCountdown(startTime || endTime)}`;
  return `Ends in ${getCountdown(endTime)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
