export type LifeFormCategory = 'ANIMAL' | 'PLANT' | 'RESOURCE' | 'MINERAL' | 'FUNGI' | 'UNKNOWN_ORGANISM';
export type DangerLevel = 'DANGEROUS' | 'FRIENDLY' | 'UNKNOWN';

export interface DashboardLogbookEntry {
  id: string;
  description: string;
  classification: LifeFormCategory;
  danger_level: DangerLevel;
  photo_url: string;
  created_at: string;
  is_ai_reviewed: boolean;
  audio_url: string | null;
  ai_confidence: number | null;
}
