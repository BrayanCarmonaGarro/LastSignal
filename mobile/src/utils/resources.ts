import { MAX_AMOUNTS } from '@/constants/resources';

export function calcResourcePct(name: string, amount: number): number {
  const max = MAX_AMOUNTS[name];
  if (!max) return 0;
  return Math.min(100, Math.max(0, Math.round((amount / max) * 100)));
}
