// src/components/trips/TripEquipmentSheet.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { resourcesApi } from "@/services/api/resources.api";
import {
  useTripStore,
  RESOURCE_IDS,
  type TripPackItem,
} from "@/store/tripStore";
import type { InventoryResourceFull } from "@/types/trip_pack.types";

const OXYGEN_MAX_TRIP = 100;

const RESOURCE_CONFIG: Record<
  string,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    step: number;
    unit: string;
  }
> = {
  Oxígeno:        { icon: "air",               color: "#00d4ff", step: 5,   unit: "%"    },
  Agua:           { icon: "water-drop",        color: "#38bdf8", step: 0.5, unit: "L"    },
  Raciones:       { icon: "lunch-dining",      color: "#f59e0b", step: 100, unit: "kcal" },
  Combustible:    { icon: "local-gas-station", color: "#f97316", step: 1,   unit: "L"    },
  Botiquín:       { icon: "medical-services",  color: "#22c55e", step: 1,   unit: "u"    },
  Baterías:       { icon: "bolt",              color: "#facc15", step: 1,   unit: "u"    },
  "Píldoras Radio": { icon: "radio",           color: "#a78bfa", step: 1,   unit: "u"    },
};

interface ResourceRow extends InventoryResourceFull {
  selected: number;
  max: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TripEquipmentSheet({ visible, onClose, onConfirm }: Props) {
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const setTripPack = useTripStore((s) => s.setTripPack);

  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadResources();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await resourcesApi.getAll()) as unknown as InventoryResourceFull[];
      const mapped: ResourceRow[] = data.map((r) => {
        const isOxygen = r.base_resource_id === RESOURCE_IDS.OXIGENO;
        const max = isOxygen
          ? Math.min(r.current_amount, OXYGEN_MAX_TRIP)
          : r.current_amount;
        return { ...r, max, selected: max };
      });
      setRows(mapped);
    } catch {
      setError("No se pudo cargar el inventario");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjust = useCallback((id: string, delta: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const cfg = RESOURCE_CONFIG[r.name];
        const step = cfg?.step ?? 1;
        const next = Math.min(r.max, Math.max(0, r.selected + delta * step));
        const snapped = Math.round(next / step) * step;
        return { ...r, selected: parseFloat(snapped.toFixed(2)) };
      }),
    );
  }, []);

  const handleConfirm = useCallback(() => {
    const pack: TripPackItem[] = rows.map((r) => ({
      base_resource_id: r.base_resource_id,
      name: r.name,
      unit: r.unit,
      amount: r.selected,
      initial: r.selected,
    }));
    setTripPack(pack);
    onConfirm();
  }, [rows, setTripPack, onConfirm]);

  // ── Calculado antes del return para usarlo en el botón ──
  const oxyRow = rows.find((r) => r.base_resource_id === RESOURCE_IDS.OXIGENO);
  const oxyTooLow = !oxyRow || oxyRow.selected <= 20;

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <MaterialIcons name="backpack" size={22} color="#00d4ff" />
            </View>
            <View style={s.headerText}>
              <Text style={s.title}>Equipamiento</Text>
              <Text style={s.subtitle}>Elige qué llevar al viaje</Text>
            </View>
          </View>

          <View style={s.divider} />

          {isLoading ? (
            <View style={s.centered}>
              <ActivityIndicator color="#00d4ff" />
              <Text style={s.loadingText}>Cargando inventario...</Text>
            </View>
          ) : error ? (
            <View style={s.centered}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadResources}>
                <Text style={s.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={s.list}>
              {rows.map((row) => {
                const cfg = RESOURCE_CONFIG[row.name];
                const color = cfg?.color ?? "#8888aa";
                const icon = cfg?.icon ?? "inventory";
                const unit = cfg?.unit ?? row.unit.toLowerCase();
                const pct = row.max > 0 ? row.selected / row.max : 0;

                return (
                  <View key={row.id} style={s.resourceRow}>
                    <View style={[s.resIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                      <MaterialIcons name={icon} size={18} color={color} />
                    </View>

                    <View style={s.resInfo}>
                      <View style={s.resTopRow}>
                        <Text style={s.resName}>{row.name}</Text>
                        <Text style={[s.resAmount, { color }]}>
                          {row.selected} <Text style={s.resUnit}>{unit}</Text>
                        </Text>
                      </View>

                      <View style={s.barTrack}>
                        <Animated.View
                          style={[
                            s.barFill,
                            { backgroundColor: color, width: `${Math.round(pct * 100)}%` },
                          ]}
                        />
                      </View>

                      <Text style={s.resMax}>
                        Disponible: {row.max} {unit}
                        {row.name === "Oxígeno" && row.current_amount > OXYGEN_MAX_TRIP
                          ? ` (máx. ${OXYGEN_MAX_TRIP} para viaje)`
                          : ""}
                      </Text>
                    </View>

                    <View style={s.controls}>
                      <TouchableOpacity
                        style={s.controlBtn}
                        onPress={() => adjust(row.id, -1)}
                        disabled={row.selected <= 0}
                      >
                        <Text style={[s.controlText, row.selected <= 0 && s.controlDisabled]}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.controlBtn}
                        onPress={() => adjust(row.id, 1)}
                        disabled={row.selected >= row.max}
                      >
                        <Text style={[s.controlText, row.selected >= row.max && s.controlDisabled]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={s.divider} />

          {/* Advertencia O₂ si lleva poco */}
          {!isLoading && !error && oxyRow && oxyRow.selected < 30 && (
            <View style={s.warning}>
              <MaterialIcons name="warning" size={14} color="#f59e0b" />
              <Text style={s.warningText}>
                O₂ bajo ({oxyRow.selected}%) — el viaje será muy corto
              </Text>
            </View>
          )}

          {/* Bloqueo total si O₂ <= 20 */}
          {!isLoading && !error && oxyTooLow && (
            <View style={s.errorBanner}>
              <MaterialIcons name="block" size={14} color="#ef4444" />
              <Text style={s.errorBannerText}>
                O₂ insuficiente — necesitas más de 20% para iniciar
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity style={s.ghostBtn} onPress={onClose}>
              <Text style={s.ghostBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, (isLoading || oxyTooLow) && s.disabledBtn]}
              onPress={handleConfirm}
              disabled={isLoading || !!error || oxyTooLow}
            >
              <MaterialIcons name="rocket-launch" size={16} color="#00d4ff" />
              <Text style={s.confirmBtnText}>Iniciar viaje</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000077",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0d0d1f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ffffff12",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 14,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ffffff20",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#00d4ff15",
    borderWidth: 1,
    borderColor: "#00d4ff30",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: "#dde0ff", fontSize: 17, fontWeight: "700" },
  subtitle: { color: "#8888aa", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#ffffff0a" },
  centered: { paddingVertical: 32, alignItems: "center", gap: 10 },
  loadingText: { color: "#8888aa", fontSize: 13 },
  errorText: { color: "#ff8888", fontSize: 13, textAlign: "center" },
  retryText: { color: "#00d4ff", fontSize: 13, fontWeight: "700" },
  list: { maxHeight: 420 },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff06",
  },
  resIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resInfo: { flex: 1, gap: 4 },
  resTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resName: { color: "#dde0ff", fontSize: 13, fontWeight: "600" },
  resAmount: { fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  resUnit: { fontSize: 10, fontWeight: "400", color: "#8888aa" },
  barTrack: {
    height: 4,
    backgroundColor: "#ffffff10",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: 4, borderRadius: 2 },
  resMax: { color: "#8888aa", fontSize: 10 },
  controls: { flexDirection: "row", gap: 4 },
  controlBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#ffffff0a",
    borderWidth: 1,
    borderColor: "#ffffff15",
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { color: "#dde0ff", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  controlDisabled: { color: "#ffffff25" },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f59e0b10",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f59e0b20",
  },
  warningText: { color: "#f59e0b", fontSize: 12 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef444415",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ef444430",
  },
  errorBannerText: { color: "#ef4444", fontSize: 12 },
  actions: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff15",
  },
  ghostBtnText: { color: "#8888aa", fontSize: 14, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#00d4ff15",
    borderColor: "#00d4ff55",
  },
  confirmBtnText: { color: "#00d4ff", fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  disabledBtn: { opacity: 0.4 },
});