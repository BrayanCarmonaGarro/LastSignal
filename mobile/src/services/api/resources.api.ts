// src/services/api/resources.api.ts
import { apiRequest } from "./client";
import type { Resource, BaseResource } from "@/types/resource.types";

export type { Resource, BaseResource };

export const resourcesApi = {
  getAll: (): Promise<Resource[]> => apiRequest<Resource[]>("/inventory"),

  getBaseResources: (): Promise<BaseResource[]> =>
    apiRequest<BaseResource[]>("/inventory/base-resources"),

  // Actualiza current_amount directamente (retorno exitoso)
  updateAmount: (inventoryId: string, currentAmount: number): Promise<Resource> =>
    apiRequest<Resource>(`/inventory/${inventoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ current_amount: currentAmount }),
    }),

  // Registra gasto/ingreso vía log (más limpio para auditoría)
  addLog: (
    inventoryId: string,
    type: "INTAKE" | "CONSUMPTION",
    amount: number,
    reason: string,
    tripId?: string,
  ): Promise<void> =>
    apiRequest<void>(`/inventory/${inventoryId}/logs`, {
      method: "POST",
      body: JSON.stringify({ type, amount, reason, trip_id: tripId }),
    }),
};