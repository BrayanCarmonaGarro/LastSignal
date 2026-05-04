// src/app/(app)/(tabs)/trips/summary.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrip } from "@/hooks/trip/useTrip";
import { useSupplies } from "@/hooks/trip/useSupplies";
import { offlineQueue } from "@/services/trip/offlineQueue";
import { ResourceCounter } from "@/components/trips/ResourceCounter";
import { useTripStore } from "@/store/tripStore";
import type { SupplyDropItem } from "@/store/tripStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getDuration(start: string, end?: string | null): number {
  if (!end) return 0;
  return Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000,
  );
}

function summarizeItems(items: SupplyDropItem[]) {
  console.log('=== summarizeItems ===');
  console.log('Total items:', items.length);
  items.forEach((item, i) => {
    console.log(`Item ${i}:`, JSON.stringify(item, null, 2));
  });
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
      map.set(key, {
        resourceId: key,
        name,
        quantity: item.amount,
        unit,
      });
    }
  }

  return Array.from(map.values());
}
// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TripSummaryScreen() {
  const insets = useSafeAreaInsets();
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

  if (!activeTrip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay datos del viaje.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen de misión</Text>
        <Text style={styles.subtitle}>Exploración finalizada</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>Duración</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activeTrip.oxygen_consumed}%</Text>
          <Text style={styles.statLabel}>Oxígeno usado</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{routePoints.length}</Text>
          <Text style={styles.statLabel}>Puntos ruta</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Recursos recolectados ({totalItems})
        </Text>
        <ResourceCounter items={resources} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleFinish}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#00d4ff" />
          ) : (
            <Text style={styles.buttonText}>✔ Finalizar misión</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080818",
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ff8888",
    fontSize: 14,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    color: "#dde0ff",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#8888aa",
    fontSize: 12,
    marginTop: 4,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: "#00d4ff",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: "#8888aa",
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: "#8888aa",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 20,
  },
  button: {
    backgroundColor: "#00d4ff15",
    borderWidth: 1,
    borderColor: "#00d4ff40",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#00d4ff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});