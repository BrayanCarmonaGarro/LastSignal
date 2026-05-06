// src/types/trip_pack.types.ts

// Resource tal como lo devuelve /inventory pero con base_resource_id explícito
export interface InventoryResourceFull {
  id: string;               // inventory_resource.id — para addLog
  base_resource_id: string; // base_resource.id — para matching en tripPack
  name: string;
  unit: string;
  current_amount: number;
}