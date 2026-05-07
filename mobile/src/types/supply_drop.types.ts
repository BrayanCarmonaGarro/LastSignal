// src/types/supply_drop.types.ts
import type { BaseResource } from './resource.types';

export type SupplyDropStatus = 'AVAILABLE' | 'COLLECTED';

export interface SupplyDropItem {
  id: string;
  base_resource_id: string;
  amount: number;
  base_resource: BaseResource;
}

export interface SupplyDrop {
  id: string;
  latitude: number;
  longitude: number;
  status: SupplyDropStatus;
  trip_id: string | null;
  collected_by: string | null;
  collected_at: string | null;
  created_at: string;
  items: SupplyDropItem[];
}
