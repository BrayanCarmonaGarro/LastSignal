// Operaciones de bitácora
import { useEffect } from 'react';
import { useLogbookStore } from '@/store/logbookStore';
import type { LifeFormCategory } from '@/types/logbook.types';

export function useLogbook() {
  const {
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    filter,
    isDownloadingAll,
    downloadAllDone,
    fetch,
    refresh,
    loadMore,
    setFilter,
    downloadAll,
    deleteEntry,
  } = useLogbookStore();

  useEffect(() => {
    fetch(true);
  }, []);

  return {
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    filter,
    isDownloadingAll,
    downloadAllDone,
    refresh,
    loadMore,
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
