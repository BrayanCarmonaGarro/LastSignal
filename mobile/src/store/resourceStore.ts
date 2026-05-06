// Zustand - recursos en memoria
import { create } from 'zustand';
import { Resource, resourcesApi } from '@/services/api/resources.api';

interface ResourceState {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  fetchResources: () => Promise<void>;
}

export const useResourceStore = create<ResourceState>((set) => ({
  resources: [],
  loading: true,
  error: null,

  fetchResources: async () => {
    set({ loading: true, error: null });
    try {
      const data = await resourcesApi.getAll();
      set({ resources: data, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar recursos',
        loading: false,
      });
    }
  },
}));
