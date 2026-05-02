// src/services/api/resources.api.ts
import { useAuthStore } from '@/store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_PREFIX = '/api/v1';

async function request<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const tokens = useAuthStore.getState().tokens;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(tokens?.accessToken && {
        Authorization: `Bearer ${tokens.accessToken}`,
      }),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

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
  getAll: (): Promise<Resource[]> => {
    console.log('[resourcesApi] GET /resources');
    return request<Resource[]>('/resources');
  },

  getBaseResources: (): Promise<BaseResource[]> => {
    console.log('[resourcesApi] GET /resources/base');
    return request<BaseResource[]>('/resources/base');
  },
};