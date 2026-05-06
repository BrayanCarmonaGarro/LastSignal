import { MAX_LEVEL, XP_FLOOR_TABLE } from '@/constants/levels';

export function getXpFloor(level: number): number {
  return XP_FLOOR_TABLE[Math.max(1, Math.min(level, MAX_LEVEL))];
}

export function getXpCeiling(level: number): number {
  if (level >= MAX_LEVEL) return XP_FLOOR_TABLE[MAX_LEVEL];
  return XP_FLOOR_TABLE[Math.min(level + 1, MAX_LEVEL)];
}

export function getLevelProgress(level: number, xp: number): number {
  if (level >= MAX_LEVEL) return 1;
  const floor = getXpFloor(level);
  const span = getXpCeiling(level) - floor;
  if (span <= 0) return 1;
  return Math.min(Math.max((xp - floor) / span, 0), 1);
}

export function getXpToNextLevel(level: number, xp: number): number {
  if (level >= MAX_LEVEL) return 0;
  return Math.max(getXpCeiling(level) - xp, 0);
}
