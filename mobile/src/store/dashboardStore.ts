import { create } from 'zustand';
import { dashboardApi, DashboardData } from '@/services/api/dashboard.api';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchedAt: null,

  fetch: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardApi.get();
      set({ data, isLoading: false, lastFetchedAt: Date.now() });
    } catch (e: unknown) {
      set({ isLoading: false, error: (e as Error).message ?? 'Error al cargar datos' });
    }
  },

  refresh: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true, error: null });
    try {
      const data = await dashboardApi.get();
      set({ data, isRefreshing: false, lastFetchedAt: Date.now() });
    } catch (e: unknown) {
      set({ isRefreshing: false, error: (e as Error).message ?? 'Error al actualizar' });
    }
  },

  clear: () => set({ data: null, error: null, lastFetchedAt: null, isLoading: false, isRefreshing: false }),
}));
