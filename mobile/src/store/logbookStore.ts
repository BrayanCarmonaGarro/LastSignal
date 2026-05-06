import { create } from 'zustand';
import { logbookApi } from '@/services/api/logbook.api';
import type {
  LogbookEntry,
  LifeFormCategory,
  DangerLevel,
} from '@/types/logbook.types';

const PAGE_SIZE = 20;

type RawResponse = LogbookEntry[] | { items: LogbookEntry[]; has_more?: boolean; page?: number };

function normalize(res: RawResponse, page: number) {
  if (Array.isArray(res)) {
    return { items: res, hasMore: false, nextPage: page + 1 };
  }
  return {
    items:    res.items   ?? [],
    hasMore:  res.has_more ?? false,
    nextPage: (res.page   ?? page) + 1,
  };
}

interface LogbookFilter {
  classification?: LifeFormCategory;
  danger?: DangerLevel;
}

interface LogbookState {
  entries: LogbookEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isSearchingRAG: boolean; // NUEVO
  error: string | null;
  page: number;
  hasMore: boolean;
  filter: LogbookFilter;
  isDownloadingAll: boolean;
  downloadAllDone: boolean;

  fetch:        (reset?: boolean)        => Promise<void>;
  refresh:      ()                       => Promise<void>;
  loadMore:     ()                       => Promise<void>;
  searchRAG:    (query: string)          => Promise<void>; // NUEVO
  setFilter:    (f: LogbookFilter)       => void;
  downloadAll:  ()                       => Promise<void>;
  deleteEntry:  (id: string)             => Promise<void>;
  clear:        ()                       => void;
  clearSearch: ()                       => void; // NUEVO
}

export const useLogbookStore = create<LogbookState>((set, get) => ({
  entries:           [],
  isLoading:         false,
  isRefreshing:      false,
  isLoadingMore:     false,
  isSearchingRAG:    false, // NUEVO
  error:             null,
  page:              1,
  hasMore:           true,
  filter:            {},
  isDownloadingAll:  false,
  downloadAllDone:   false,

  fetch: async (reset = true) => {
    if (get().isLoading) return;
    const page = reset ? 1 : get().page;
    set({ isLoading: true, error: null, ...(reset ? { entries: [], page: 1, hasMore: true } : {}) });
    try {
      const raw = await logbookApi.getAll({ page, limit: PAGE_SIZE, ...get().filter });
      const { items, hasMore, nextPage } = normalize(raw as RawResponse, page);
      set({
        entries:   reset ? items : [...get().entries, ...items],
        isLoading: false,
        page:      nextPage,
        hasMore,
      });
    } catch (e: unknown) {
      set({ isLoading: false, error: (e as Error).message ?? 'Error al cargar bitácora' });
    }
  },

  refresh: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true, error: null });
    try {
      const raw = await logbookApi.getAll({ page: 1, limit: PAGE_SIZE, ...get().filter });
      const { items, hasMore } = normalize(raw as RawResponse, 1);
      set({ entries: items, isRefreshing: false, page: 2, hasMore });
    } catch (e: unknown) {
      set({ isRefreshing: false, error: (e as Error).message ?? 'Error al actualizar' });
    }
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore) return;
    set({ isLoadingMore: true });
    try {
      const raw = await logbookApi.getAll({ page: state.page, limit: PAGE_SIZE, ...state.filter });
      const { items, hasMore, nextPage } = normalize(raw as RawResponse, state.page);
      set({
        entries:       [...state.entries, ...items],
        isLoadingMore: false,
        page:          nextPage,
        hasMore,
      });
    } catch (e: unknown) {
      set({ isLoadingMore: false });
    }
  },

  searchRAG: async (query: string) => {
    if (!query.trim()) return;
    set({ isSearchingRAG: true, error: null });
    try {
      const items = await logbookApi.searchRAG(query); 
      set({ entries: items, hasMore: false, isSearchingRAG: false });
    } catch (e: any) {
      set({ isSearchingRAG: false, error: e.message || 'Error en búsqueda IA' });
    }
  },

  setFilter: (filter) => {
    set({ filter });
    get().fetch(true);
  },

  downloadAll: async () => {
    if (get().isDownloadingAll) return;
    set({ isDownloadingAll: true, downloadAllDone: false });
    try {
      await logbookApi.downloadAll();
      set({ isDownloadingAll: false, downloadAllDone: true });
      setTimeout(() => set({ downloadAllDone: false }), 2000);
    } catch (e: unknown) {
      set({ isDownloadingAll: false });
    }
  },

  deleteEntry: async (id: string) => {
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    try {
      await logbookApi.delete(id);
    } catch {
      get().fetch(true);
    }
  },

  clearSearch: () => {
      set({ isSearchingRAG: false });
  },

  clear: () =>
    set({ entries: [], error: null, page: 1, hasMore: true, filter: {} }),
}));