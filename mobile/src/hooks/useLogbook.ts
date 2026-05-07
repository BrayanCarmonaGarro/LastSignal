import { useEffect } from 'react';
import { useLogbookStore } from '@/store/logbookStore';
import type { LifeFormCategory } from '@/types/logbook.types';

export function useLogbook() {
  const {
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSearchingRAG,
    error,
    hasMore,
    filter,
    isDownloadingAll,
    downloadAllDone,
    downloadAllError,
    cameFromCache,
    fetch,
    clearSearch,
    refresh,
    loadMore,
    searchRAG,
    setFilter,
    downloadAll,
    deleteEntry,
  } = useLogbookStore();

  useEffect(() => {
    fetch(true);
  }, []);

  return {
    clearSearch,
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSearchingRAG,
    error,
    hasMore,
    filter,
    isDownloadingAll,
    downloadAllDone,
    downloadAllError,
    cameFromCache,
    refresh,
    loadMore,
    searchRAG,
    setFilter,
    downloadAll,
    deleteEntry,
  };
}

export function useLogbookFilterByClassification(classification: LifeFormCategory | undefined) {
  const setFilter = useLogbookStore((s) => s.setFilter);
  return () =>
    setFilter(classification ? { classification } : {});
}