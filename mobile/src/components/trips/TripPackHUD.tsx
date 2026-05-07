// src/components/trips/TripPackHUD.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTripStore, RESOURCE_IDS } from "@/store/tripStore";

// ─── Config visual por recurso ─────────────────────────────
const PACK_CONFIG: Record<string, {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  unit: string;
  decimals: number;
}> = {
  [RESOURCE_IDS.OXIGENO]:        { icon: "air",               color: "#00d4ff", unit: "%",    decimals: 1 },
  [RESOURCE_IDS.AGUA]:           { icon: "water-drop",        color: "#38bdf8", unit: "L",    decimals: 1 },
  [RESOURCE_IDS.RACIONES]:       { icon: "lunch-dining",      color: "#f59e0b", unit: "kcal", decimals: 0 },
  [RESOURCE_IDS.COMBUSTIBLE]:    { icon: "local-gas-station", color: "#f97316", unit: "L",    decimals: 1 },
  [RESOURCE_IDS.BOTIQUIN]:       { icon: "medical-services",  color: "#22c55e", unit: "u",    decimals: 0 },
  [RESOURCE_IDS.BATERIAS]:       { icon: "bolt",              color: "#facc15", unit: "u",    decimals: 0 },
  [RESOURCE_IDS.PILDORAS_RADIO]: { icon: "radio",             color: "#a78bfa", unit: "u",    decimals: 0 },
};

export function TripPackHUD() {
  const tripPack = useTripStore((s) => s.tripPack);
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  if (tripPack.length === 0) return null;

  const toggle = () => {
    const toHeight = expanded ? 0 : tripPack.length * 44;
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: toHeight,
        damping: 20,
        stiffness: 200,
        overshootClamping: true, // evitar rebotes
        useNativeDriver: false, // height no soporta native driver
      }),
      Animated.timing(rotateAnim, {
        toValue: expanded ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Recursos críticos para mostrar en el botón cuando está cerrado
  const oxygenItem = tripPack.find((r) => r.base_resource_id === RESOURCE_IDS.OXIGENO);
  const oxygenPct = oxygenItem
    ? Math.round((oxygenItem.amount / oxygenItem.initial) * 100)
    : 0;
  const criticalCount = tripPack.filter((r) => {
    const pct = r.initial > 0 ? r.amount / r.initial : 0;
    return pct < 0.2 && r.base_resource_id !== RESOURCE_IDS.OXIGENO;
  }).length;

  return (
    <View style={s.container}>
      {/* Panel expandible */}
      <Animated.View style={[s.panel, { height: heightAnim, overflow: "hidden" }]}>
        {tripPack.map((item) => {
          const cfg = PACK_CONFIG[item.base_resource_id];
          if (!cfg) return null;

          const pct = item.initial > 0 ? item.amount / item.initial : 0;
          const isLow = pct < 0.2;
          const isMed = pct >= 0.2 && pct < 0.5;
          const barColor = isLow ? "#ef4444" : isMed ? "#f59e0b" : cfg.color;

          return (
            <View key={item.base_resource_id} style={s.resourceRow}>
              <MaterialIcons name={cfg.icon} size={14} color={cfg.color} style={s.rowIcon} />
              <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text style={[s.rowAmount, isLow && s.rowAmountCritical]}>
                {item.amount.toFixed(cfg.decimals)}{cfg.unit}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Botón toggle */}
      <TouchableOpacity style={s.toggleBtn} onPress={toggle} activeOpacity={0.8}>
        {/* Ícono mochila */}
        <View style={s.btnLeft}>
          <MaterialIcons name="backpack" size={16} color="#00d4ff" />
          <Text style={s.btnLabel}>Mochila</Text>
          {criticalCount > 0 && (
            <View style={s.criticalBadge}>
              <Text style={s.criticalBadgeText}>{criticalCount}</Text>
            </View>
          )}
        </View>

        {/* O₂ rápido */}
        <View style={s.btnRight}>
          <MaterialIcons name="air" size={12} color="#00d4ff" />
          <Text style={[
            s.oxygenQuick,
            oxygenPct < 20 && s.oxygenCritical,
            oxygenPct >= 20 && oxygenPct < 50 && s.oxygenWarning,
          ]}>
            {oxygenPct}%
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="expand-less" size={18} color="#8888aa" />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    backgroundColor: "#0a0a1aee",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff10",
    overflow: "hidden",
  },
  panel: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff06",
  },
  rowIcon: { width: 16 },
  rowName: {
    color: "#8888aa",
    fontSize: 11,
    fontWeight: "600",
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#ffffff10",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  rowAmount: {
    color: "#dde0ff",
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    width: 48,
    textAlign: "right",
  },
  rowAmountCritical: { color: "#ef4444" },

  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  btnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnLabel: {
    color: "#dde0ff",
    fontSize: 13,
    fontWeight: "700",
  },
  criticalBadge: {
    backgroundColor: "#ef444430",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#ef444460",
  },
  criticalBadgeText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "800",
  },
  btnRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  oxygenQuick: {
    color: "#00d4ff",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  oxygenWarning: { color: "#f59e0b" },
  oxygenCritical: { color: "#ef4444" },
});