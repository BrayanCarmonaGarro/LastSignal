import { apiRequest } from './client';
import type { Resource, BaseResource } from '@/types/resource.types';

export type { Resource, BaseResource };

export const resourcesApi = {
  getAll: (): Promise<Resource[]> =>
    apiRequest<Resource[]>('/resources'),

  getBaseResources: (): Promise<BaseResource[]> =>
    apiRequest<BaseResource[]>('/resources/base'),
};
