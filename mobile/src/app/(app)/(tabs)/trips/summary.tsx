import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTripSummary } from "@/hooks/trip/useTripSummary";
import { ResourceCounter } from "@/components/trips/ResourceCounter";

export default function TripSummaryScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeTrip,
    routePoints,
    formattedDuration,
    resources,
    totalItems,
    isSubmitting,
    handleFinish,
  } = useTripSummary();

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
          <Text style={styles.statValue}>{formattedDuration}</Text>
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
