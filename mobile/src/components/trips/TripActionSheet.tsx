// src/components/trips/TripActionSheet.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { SupplyDrop, TripDangerZone } from "@/store/tripStore";

// ─── TIPOS ────────────────────────────────────────────────

type SheetVariant = "supply" | "danger" | "confirm";

interface SupplySheetData {
  variant: "supply";
  drop: SupplyDrop;
  onCollect: (drop: SupplyDrop) => void;
}

interface DangerSheetData {
  variant: "danger";
  zone: TripDangerZone;
}

interface ConfirmSheetData {
  variant: "confirm";
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
}

export type SheetData = SupplySheetData | DangerSheetData | ConfirmSheetData;

interface Props {
  data: SheetData | null;
  onClose: () => void;
}

// ─── COLORES POR SEVERIDAD ────────────────────────────────

const SEVERITY_COLOR = {
  LOW: "#f59e0b",
  MEDIUM: "#f97316",
  HIGH: "#ef4444",
};

const SEVERITY_LABEL = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const CATEGORY_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  OXYGEN:    "air",
  WATER:     "water-drop",
  FOOD:      "lunch-dining",
  ENERGY:    "bolt",
  MEDICINE:  "medical-services",
  MATERIAL:  "construction",
};

// ─── COMPONENTE ───────────────────────────────────────────

export function TripActionSheet({ data, onClose }: Props) {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 300,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [data]);

  if (!data) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View
          style={[s.sheet, { transform: [{ translateY }] }]}
        >
          {/* Handle */}
          <View style={s.handle} />

          {data.variant === "supply" && (
            <SupplyContent data={data} onClose={onClose} />
          )}
          {data.variant === "danger" && (
            <DangerContent data={data} onClose={onClose} />
          )}
          {data.variant === "confirm" && (
            <ConfirmContent data={data} onClose={onClose} />
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── SUPPLY CONTENT ───────────────────────────────────────

function SupplyContent({
  data,
  onClose,
}: {
  data: SupplySheetData;
  onClose: () => void;
}) {
  const { drop, onCollect } = data;
  const isCollected = drop.status === "COLLECTED";
  const accentColor = isCollected ? "#22c55e" : "#f59e0b";

  const handleCollect = () => {
    onCollect(drop);
    onClose();
  };

  return (
    <>
      {/* Header */}
      <View style={s.header}>
        <View style={[s.iconWrap, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}>
          <Text style={s.headerIcon}>📦</Text>
        </View>
        <View style={s.headerText}>
          <Text style={s.title}>Suministro</Text>
          <View style={[s.badge, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[s.badgeText, { color: accentColor }]}>
              {isCollected ? "✓ Recolectado" : `${drop.items.length} recurso${drop.items.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.divider} />

      {/* Items */}
      <ScrollView style={s.itemList} showsVerticalScrollIndicator={false}>
        {drop.items.length === 0 ? (
          <Text style={s.emptyText}>Sin contenido registrado</Text>
        ) : (
          drop.items.map((item) => {
            const iconName = CATEGORY_ICON[item.base_resource.category] ?? "inventory";
            return (
              <View key={item.id} style={s.itemRow}>
                <View style={[s.itemIcon, { backgroundColor: "#ffffff0a" }]}>
                  <MaterialIcons name={iconName} size={16} color="#8888aa" />
                </View>
                <View style={s.itemInfo}>
                  <Text style={s.itemName}>{item.base_resource.name}</Text>
                  <Text style={s.itemCategory}>
                    {item.base_resource.category.toLowerCase()}
                  </Text>
                </View>
                <View style={s.itemAmountWrap}>
                  <Text style={s.itemAmount}>{item.amount}</Text>
                  <Text style={s.itemUnit}>
                    {item.base_resource.unit.toLowerCase()}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.ghostBtn} onPress={onClose}>
          <Text style={s.ghostBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            s.primaryBtn,
            { backgroundColor: `${accentColor}18`, borderColor: accentColor },
            isCollected && s.disabledBtn,
          ]}
          onPress={handleCollect}
          disabled={isCollected}
        >
          <Text style={[s.primaryBtnText, { color: isCollected ? "#8888aa" : accentColor }]}>
            {isCollected ? "Ya recolectado" : "✓ Recolectar"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── DANGER CONTENT ───────────────────────────────────────

function DangerContent({
  data,
  onClose,
}: {
  data: DangerSheetData;
  onClose: () => void;
}) {
  const { zone } = data;
  const color = SEVERITY_COLOR[zone.severity];
  const severityLabel = SEVERITY_LABEL[zone.severity];

  return (
    <>
      <View style={s.header}>
        <View style={[s.iconWrap, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
          <MaterialIcons name="warning" size={24} color={color} />
        </View>
        <View style={s.headerText}>
          <Text style={s.title}>Zona de peligro</Text>
          <View style={[s.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[s.badgeText, { color }]}>
              Severidad {severityLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.divider} />

      <View style={[s.dangerCard, { borderColor: `${color}30`, backgroundColor: `${color}08` }]}>
        <Text style={s.dangerDesc}>
          {zone.description ?? "Sin descripción disponible."}
        </Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.primaryBtn, { flex: 1, backgroundColor: `${color}18`, borderColor: color }]}
          onPress={onClose}
        >
          <Text style={[s.primaryBtnText, { color }]}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── CONFIRM CONTENT ──────────────────────────────────────

function ConfirmContent({
  data,
  onClose,
}: {
  data: ConfirmSheetData;
  onClose: () => void;
}) {
  const color = data.confirmColor ?? "#ef4444";

  const handleConfirm = () => {
    data.onConfirm();
    onClose();
  };

  return (
    <>
      <View style={s.header}>
        <View style={[s.iconWrap, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
          <MaterialIcons name="logout" size={24} color={color} />
        </View>
        <View style={s.headerText}>
          <Text style={s.title}>{data.title}</Text>
        </View>
      </View>

      <View style={s.divider} />

      <Text style={s.confirmMessage}>{data.message}</Text>

      <View style={s.actions}>
        <TouchableOpacity style={s.ghostBtn} onPress={onClose}>
          <Text style={s.ghostBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: `${color}18`, borderColor: color }]}
          onPress={handleConfirm}
        >
          <Text style={[s.primaryBtnText, { color }]}>{data.confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000066",
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
    paddingBottom: 36,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ffffff20",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#dde0ff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#ffffff0a",
  },
  itemList: {
    maxHeight: 220,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff08",
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    color: "#dde0ff",
    fontSize: 14,
    fontWeight: "600",
  },
  itemCategory: {
    color: "#8888aa",
    fontSize: 11,
    textTransform: "capitalize",
  },
  itemAmountWrap: {
    alignItems: "flex-end",
    gap: 1,
  },
  itemAmount: {
    color: "#dde0ff",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  itemUnit: {
    color: "#8888aa",
    fontSize: 10,
    textTransform: "lowercase",
  },
  emptyText: {
    color: "#8888aa",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  dangerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  dangerDesc: {
    color: "#c0c0e0",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmMessage: {
    color: "#8888aa",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff15",
  },
  ghostBtnText: {
    color: "#8888aa",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});