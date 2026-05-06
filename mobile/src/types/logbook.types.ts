export type LifeFormCategory =
  | 'ANIMAL'
  | 'PLANT'
  | 'RESOURCE'
  | 'MINERAL'
  | 'FUNGI'
  | 'UNKNOWN_ORGANISM';

export type DangerLevel = 'DANGEROUS' | 'FRIENDLY' | 'UNKNOWN';
export type SyncStatus  = 'SYNCED' | 'PENDING' | 'FAILED';

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

export interface LogbookEntry extends DashboardLogbookEntry {
  similar_findings: any;
  user_id: string;
  sync_status: SyncStatus;
  is_downloaded: boolean;
  downloaded_until: string | null;
}

export interface LogbookListParams {
  page?: number;
  limit?: number;
  classification?: LifeFormCategory;
  danger?: DangerLevel;
}

export interface LogbookListResponse {
  items: LogbookEntry[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
