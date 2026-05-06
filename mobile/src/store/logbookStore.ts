import { create } from 'zustand';
import { readStorage, writeStorage } from '@/utils/storage';
import { logbookApi } from '@/services/api/logbook.api';
import type {
  LogbookEntry,
  LifeFormCategory,
  DangerLevel,
} from '@/types/logbook.types';

const PAGE_SIZE = 20;
const CACHE_KEY = 'last-signal-logbook-cache';

type RawResponse = LogbookEntry[] | { items: LogbookEntry[]; has_more?: boolean; page?: number };

function normalize(res: RawResponse, page: number) {
  if (Array.isArray(res)) {
    return { items: res, hasMore: false, nextPage: page + 1 };
  }
  return {
    items:    res.items    ?? [],
    hasMore:  res.has_more ?? false,
    nextPage: (res.page    ?? page) + 1,
  };
}

const saveCache = (entries: LogbookEntry[]) => writeStorage(CACHE_KEY, entries);
const loadCache = async (): Promise<LogbookEntry[]> => (await readStorage<LogbookEntry[]>(CACHE_KEY)) ?? [];

interface LogbookFilter {
  classification?: LifeFormCategory;
  danger?: DangerLevel;
}

interface LogbookState {
  entries: LogbookEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isSearchingRAG: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  filter: LogbookFilter;
  isDownloadingAll: boolean;
  downloadAllDone: boolean;
  downloadAllError: string | null;
  cameFromCache: boolean;

  fetch:         (reset?: boolean) => Promise<void>;
  refresh:       ()                => Promise<void>;
  loadMore:      ()                => Promise<void>;
  searchRAG:     (query: string)   => Promise<void>;
  setFilter:     (f: LogbookFilter) => void;
  downloadAll:   ()                => Promise<void>;
  loadFromCache: ()                => Promise<void>;
  deleteEntry:   (id: string)      => Promise<void>;
  clear:         ()                => void;
  clearSearch:   ()                => void;
}

export const useLogbookStore = create<LogbookState>((set, get) => ({
  entries:          [],
  isLoading:        false,
  isRefreshing:     false,
  isLoadingMore:    false,
  isSearchingRAG:   false,
  error:            null,
  page:             1,
  hasMore:          true,
  filter:           {},
  isDownloadingAll: false,
  downloadAllDone:  false,
  downloadAllError: null,
  cameFromCache:    false,

  fetch: async (reset = true) => {
    if (get().isLoading) return;
    const page = reset ? 1 : get().page;
    set({ isLoading: true, error: null, ...(reset ? { entries: [], page: 1, hasMore: true, cameFromCache: false } : {}) });
    try {
      const raw = await logbookApi.getAll({ page, limit: PAGE_SIZE, ...get().filter });
      const { items, hasMore, nextPage } = normalize(raw as RawResponse, page);
      const entries = reset ? items : [...get().entries, ...items];
      set({ entries, isLoading: false, page: nextPage, hasMore });
      if (reset) saveCache(entries);
    } catch (e: unknown) {
      const cached = await loadCache();
      if (cached.length > 0) {
        set({ entries: cached, isLoading: false, hasMore: false, cameFromCache: true, error: null });
      } else {
        set({ isLoading: false, error: (e as Error).message ?? 'Error al cargar bitácora' });
      }
    }
  },

  refresh: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true, error: null, cameFromCache: false });
    try {
      const raw = await logbookApi.getAll({ page: 1, limit: PAGE_SIZE, ...get().filter });
      const { items, hasMore } = normalize(raw as RawResponse, 1);
      set({ entries: items, isRefreshing: false, page: 2, hasMore });
      saveCache(items);
    } catch (e: unknown) {
      const cached = await loadCache();
      if (cached.length > 0) {
        set({ entries: cached, isRefreshing: false, hasMore: false, cameFromCache: true, error: null });
      } else {
        set({ isRefreshing: false, error: (e as Error).message ?? 'Error al actualizar' });
      }
    }
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore) return;
    set({ isLoadingMore: true });
    try {
      const raw = await logbookApi.getAll({ page: state.page, limit: PAGE_SIZE, ...state.filter });
      const { items, hasMore, nextPage } = normalize(raw as RawResponse, state.page);
      set({ entries: [...state.entries, ...items], isLoadingMore: false, page: nextPage, hasMore });
    } catch {
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
    set({ isDownloadingAll: true, downloadAllDone: false, downloadAllError: null });
    try {
      const all: LogbookEntry[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const raw = await logbookApi.getAll({ page, limit: 100 });
        const { items, hasMore: more, nextPage } = normalize(raw as RawResponse, page);
        all.push(...items);
        hasMore = more;
        page = nextPage;
      }

      await saveCache(all);
      set({ entries: all, isDownloadingAll: false, downloadAllDone: true, hasMore: false });
      setTimeout(() => set({ downloadAllDone: false }), 2000);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Error al descargar';
      set({ isDownloadingAll: false, downloadAllError: msg });
      setTimeout(() => set({ downloadAllError: null }), 300);
    }
  },

  loadFromCache: async () => {
    const cached = await loadCache();
    if (cached.length > 0) {
      set({ entries: cached, cameFromCache: true, hasMore: false });
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

  clearSearch: () => set({ isSearchingRAG: false }),

  clear: () => set({ entries: [], error: null, page: 1, hasMore: true, filter: {}, cameFromCache: false }),
}));
