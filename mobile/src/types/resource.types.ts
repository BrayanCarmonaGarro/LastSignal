export const CATEGORY_ORDER = ['VITAL', 'FOOD', 'MEDICAL', 'EQUIPMENT', 'FUEL'] as const;
export type ResourceCategory = typeof CATEGORY_ORDER[number];
export type ResourceUnit = 'LITERS' | 'KILOGRAMS' | 'UNITS' | 'PERCENTAGE' | 'GRAMS' | 'CALORIES';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  current_amount: number;
  min_threshold: number;
  is_critical: boolean;
}

export interface BaseResource {
  id: string;
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  min_threshold: number;
  is_critical: boolean;
}

export interface DashboardResource {
  id: string;
  base_resource_id: string;
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  current_amount: number;
  min_threshold: number;
  ship_base_id: string;
}

export interface DashboardResourceGroup {
  category: ResourceCategory;
  resources: DashboardResource[];
  critical_count: number;
}

export type ResourceStatus = 'CRITICAL' | 'LOW' | 'NORMAL';

export interface UIResource extends Resource {
  percentage: number;
  status: ResourceStatus;
  trend: 'up' | 'down';
  displayUnit: string;
  filledBlocks: number;
}
