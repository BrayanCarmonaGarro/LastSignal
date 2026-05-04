import { apiRequest } from './client';
import type { DashboardResource, DashboardResourceGroup } from '@/types/resource.types';
import type { DashboardActiveTrip } from '@/types/trip.types';
import type { DashboardLogbookEntry } from '@/types/logbook.types';

export type { DashboardResource, DashboardResourceGroup, DashboardActiveTrip, DashboardLogbookEntry };

export interface DashboardUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  experience_pts: number;
}

export interface DashboardShipBase {
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
}

export interface DashboardData {
  user: DashboardUser;
  ship_base: DashboardShipBase | null;
  total_logbook_entries: number;
  total_resources: number;
  critical_resources_below_threshold: number;
  active_trip: DashboardActiveTrip | null;
  recent_achievements: Array<{
    id: string;
    earned_at: string;
    achievement: {
      key: string;
      name: string;
      description: string | null;
      icon_url: string | null;
    };
  }>;
  resource_groups: DashboardResourceGroup[];
  recent_logbook_entries: DashboardLogbookEntry[];
}

export const dashboardApi = {
  get: (): Promise<DashboardData> => apiRequest<DashboardData>('/dashboard'),
};
