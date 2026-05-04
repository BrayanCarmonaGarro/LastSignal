const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;

export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

export function formatElapsed(startedAt: string): string {
  const diffMs = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(diffMs / MS_PER_HOUR);
  const m = Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function getDuration(start: string, end?: string | null): number {
  if (!end) return 0;
  return Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000,
  );
}
