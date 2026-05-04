// src/hooks/trip/useTripSummary.ts
import { useMemo, useState, useCallback } from "react";
import { Alert } from "react-native";

import { useTrip } from "@/hooks/trip/useTrip";
import { useSupplies } from "@/hooks/trip/useSupplies";
import { offlineQueue } from "@/services/trip/offlineQueue";
import { useTripStore } from "@/store/tripStore";
import type { SupplyDropItem } from "@/store/tripStore";
import { formatDuration, getDuration } from "@/utils/formatters";

function summarizeItems(items: SupplyDropItem[]) {
  const map = new Map<
    string,
    { resourceId: string; name: string; quantity: number; unit: string }
  >();

  for (const item of items) {
    const key = item.base_resource_id;
    const name = item.base_resource?.name ?? "Recurso";
    const unit = item.base_resource?.unit ?? "u";
    const existing = map.get(key);

    if (existing) {
      existing.quantity += item.amount;
    } else {
      map.set(key, { resourceId: key, name, quantity: item.amount, unit });
    }
  }

  return Array.from(map.values());
}

export function useTripSummary() {
  const { activeTrip, completeReturn } = useTrip();
  const { collectedDrops } = useSupplies();
  const routePoints = useTripStore((s) => s.routePoints);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = activeTrip
    ? getDuration(activeTrip.started_at, activeTrip.ended_at)
    : 0;

  const allItems = activeTrip
    ? collectedDrops
        .filter((d) => d.trip_id === activeTrip.id)
        .flatMap((d) => d.items)
    : [];

  const resources = useMemo(() => summarizeItems(allItems), [allItems]);
  const totalItems = resources.reduce((s, i) => s + i.quantity, 0);

  const handleFinish = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await offlineQueue.flush();
    } catch {
      Alert.alert(
        "Sin conexión",
        "Los datos se sincronizarán cuando haya internet.",
      );
    } finally {
      setIsSubmitting(false);
      completeReturn();
    }
  }, [isSubmitting, completeReturn]);

  return {
    activeTrip,
    routePoints,
    formattedDuration: formatDuration(duration),
    resources,
    totalItems,
    isSubmitting,
    handleFinish,
  };
}
