// mobile/src/services/api/resources.api.ts
import { apiRequest } from './client';

export interface Resource {
  id: string;
  name: string;
  category: 'VITAL' | 'FOOD' | 'EQUIPMENT' | 'MEDICAL' | 'FUEL';
  unit: 'LITERS' | 'CALORIES' | 'UNITS' | 'KILOGRAMS' | 'GRAMS' | 'PERCENTAGE';
  current_amount: number;
  min_threshold: number;
  is_critical: boolean;
}

export interface BaseResource {
  id: string;
  name: string;
  category: 'VITAL' | 'FOOD' | 'EQUIPMENT' | 'MEDICAL' | 'FUEL';
  unit: 'LITERS' | 'CALORIES' | 'UNITS' | 'KILOGRAMS' | 'GRAMS' | 'PERCENTAGE';
  min_threshold: number;
  is_critical: boolean;
}

export const resourcesApi = {
  getAll: (): Promise<Resource[]> =>
    apiRequest<Resource[]>('/resources'),

  getBaseResources: (): Promise<BaseResource[]> =>
    apiRequest<BaseResource[]>('/resources/base'),
};
