import { Resource } from '@/services/api/resources.api';

export type ResourceStatus = 'CRITICAL' | 'LOW' | 'NORMAL';

export interface UIResource extends Resource {
  percentage: number;
  status: ResourceStatus;
  trend: 'up' | 'down';
  displayUnit: string;
  filledBlocks: number;
}
