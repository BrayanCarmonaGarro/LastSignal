// src/hooks/useResources.ts
import { useState, useCallback } from 'react';
import { resourcesApi } from '@/services/api/resources.api';
import type { Resource } from '@/types/resource.types';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resourcesApi.getAll();
      setResources(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar recursos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { resources, isLoading, error, fetch };
}