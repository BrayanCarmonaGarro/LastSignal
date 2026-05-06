// src/app/(app)/(tabs)/resources/manage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { apiRequest } from "@/services/api/client";
import { shipBasesApi } from "@/services/api/shipBases.api";
import { useResourceStore } from "@/store/resourceStore";
import { resourcesTheme as T } from "@/constants/theme/screens/resources";
import { UNIT_LABELS } from "@/constants/labels";
import { ResourceCategory, ResourceUnit } from "@/types/resource.types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Tipos ────────────────────────────────────────────────────────

interface StorageResource {
  id: string;
  base_resource_id: string;
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  current_amount: number;
  min_threshold: number;
  ship_base_id: string;
}

type TransferDirection = "TO_INVENTORY" | "TO_STORAGE";

interface MatchedResource {
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  inventoryId: string;
  storageId: string;
  inventoryAmount: number;
  storageAmount: number;
  min_threshold: number;
}

// ── Helpers ──────────────────────────────────────────────────────

// Llama al endpoint de logs directamente con el tipo en el formato que espera la API
async function postLog(
  path: string,
  type: "INTAKE" | "EXPENSE",
  amount: number,
  reason: string,
) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify({ type, amount, reason }),
  });
}

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as any;
    if (typeof obj.detail === "string") return obj.detail;
    if (Array.isArray(obj.detail))
      return obj.detail.map((d: any) => d.msg).join(", ");
    if (typeof obj.message === "string") return obj.message;
    return JSON.stringify(obj);
  }
  return String(e);
}

// ── Constantes visuales ──────────────────────────────────────────

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  VITAL: "#C8A951",
  FOOD: "#6BAF7A",
  MEDICAL: "#E07070",
  EQUIPMENT: "#7B9EC8",
  FUEL: "#C87B40",
};

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  VITAL: "VITAL",
  FOOD: "ALIMENTOS",
  MEDICAL: "MÉDICO",
  EQUIPMENT: "EQUIPO",
  FUEL: "COMBUSTIBLE",
};

// ── ResourceAccordion ────────────────────────────────────────────

interface ResourceAccordionProps {
  resource: MatchedResource;
  shipBaseId: string;
  onTransferDone: () => Promise<void>;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
}

function ResourceAccordion({
  resource,
  shipBaseId,
  onTransferDone,
  expandedId,
  onExpand,
}: ResourceAccordionProps) {
  const isOpen = expandedId === resource.inventoryId;
  const color = CATEGORY_COLORS[resource.category];
  const unit = UNIT_LABELS[resource.unit] ?? resource.unit;

  const [direction, setDirection] = useState<TransferDirection>("TO_INVENTORY");
  const [amountText, setAmountText] = useState("");
  const [transferring, setTransferring] = useState(false);

  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const arrowScale = useRef(new Animated.Value(1)).current;
  const confirmPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOpen) {
      setAmountText("");
      setDirection("TO_INVENTORY");
      Animated.parallel([
        Animated.spring(heightAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 140,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpand(isOpen ? null : resource.inventoryId);
  };

  const toggleDirection = () => {
    Animated.sequence([
      Animated.timing(arrowScale, {
        toValue: 1.4,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(arrowScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
    setDirection((d) => (d === "TO_INVENTORY" ? "TO_STORAGE" : "TO_INVENTORY"));
    setAmountText("");
  };

  const sourceAmount =
    direction === "TO_INVENTORY"
      ? resource.storageAmount
      : resource.inventoryAmount;

  const parsedAmount = parseFloat(amountText) || 0;

  const amountError = useMemo(() => {
    if (!amountText) return null;
    if (parsedAmount <= 0) return "Debe ser mayor a 0";
    if (parsedAmount > sourceAmount) return `Máx: ${sourceAmount.toFixed(1)}`;
    return null;
  }, [amountText, parsedAmount, sourceAmount]);

  const canTransfer = parsedAmount > 0 && !amountError && !transferring;

  const handleTransfer = async () => {
    if (!canTransfer) return;
    setTransferring(true);
    Animated.sequence([
      Animated.timing(confirmPulse, {
        toValue: 0.93,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(confirmPulse, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (direction === "TO_INVENTORY") {
        // Descontar del storage
        await postLog(
          `/ship-bases/${shipBaseId}/storage/${resource.storageId}/logs`,
          "EXPENSE",
          parsedAmount,
          "Transferencia al inventario",
        );
        // Agregar al inventario
        await postLog(
          `/inventory/${resource.inventoryId}/logs`,
          "INTAKE",
          parsedAmount,
          "Transferencia desde almacén",
        );
      } else {
        // Descontar del inventario
        await postLog(
          `/inventory/${resource.inventoryId}/logs`,
          "EXPENSE",
          parsedAmount,
          "Transferencia al almacén",
        );
        // Agregar al storage
        await postLog(
          `/ship-bases/${shipBaseId}/storage/${resource.storageId}/logs`,
          "INTAKE",
          parsedAmount,
          "Transferencia desde inventario",
        );
      }

      setAmountText("");
      onExpand(null);
      await onTransferDone();
      Alert.alert(
        "✓ TRANSFERENCIA EXITOSA",
        `${parsedAmount} ${unit} de ${resource.name} transferidos.`,
      );
    } catch (e) {
      Alert.alert("ERROR DE TRANSFERENCIA", extractErrorMessage(e));
    } finally {
      setTransferring(false);
    }
  };

  const panelMaxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 380],
  });

  return (
    <View style={[styles.accordionWrap, isOpen && { borderColor: color }]}>
      {/* ── Fila principal ── */}
      <TouchableOpacity
        style={styles.accordionRow}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={[styles.rowAccent, { backgroundColor: color }]} />
        <View style={styles.rowContent}>
          <Text style={[styles.rowName, isOpen && { color }]}>
            {resource.name}
          </Text>
          <Text style={styles.rowCategory}>
            {CATEGORY_LABELS[resource.category]}
          </Text>
        </View>
        <View style={styles.rowAmounts}>
          <View style={styles.amountCol}>
            <Text style={styles.amountColLabel}>ALM.</Text>
            <Text style={styles.amountColValue}>
              {resource.storageAmount.toFixed(0)}
            </Text>
          </View>
          <View style={styles.amountColDivider} />
          <View style={styles.amountCol}>
            <Text style={styles.amountColLabel}>INV.</Text>
            <Text style={[styles.amountColValue, { color: T.accentGold }]}>
              {resource.inventoryAmount.toFixed(0)}
            </Text>
          </View>
          <Text style={styles.amountColUnit}>{unit}</Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={14}
          color={isOpen ? color : T.textMuted}
          style={{ marginRight: 12 }}
        />
      </TouchableOpacity>

      {/* ── Panel expandible ── */}
      <Animated.View
        style={[
          styles.panel,
          { maxHeight: panelMaxHeight, opacity: opacityAnim },
        ]}
      >
        <View style={[styles.panelInner, { borderTopColor: color + "50" }]}>
          {/* Balances + toggle */}
          <View style={styles.balancesRow}>
            <BalanceBox
              label="ALMACÉN"
              icon="server-outline"
              amount={resource.storageAmount}
              unit={unit}
              highlight={direction === "TO_INVENTORY"}
              color="#7B9EC8"
            />
            <TouchableOpacity
              onPress={toggleDirection}
              activeOpacity={0.7}
              style={styles.arrowBtn}
            >
              <Animated.View
                style={[
                  styles.arrowCircle,
                  { transform: [{ scale: arrowScale }] },
                ]}
              >
                <Ionicons
                  name={
                    direction === "TO_INVENTORY"
                      ? "arrow-forward"
                      : "arrow-back"
                  }
                  size={16}
                  color={T.accentGold}
                />
              </Animated.View>
              <Text style={styles.arrowLabel}>
                {direction === "TO_INVENTORY" ? "AL INV." : "AL ALM."}
              </Text>
            </TouchableOpacity>
            <BalanceBox
              label="INVENTARIO"
              icon="cube-outline"
              amount={resource.inventoryAmount}
              unit={unit}
              highlight={direction === "TO_STORAGE"}
              color={T.accentGold}
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {[0.25, 0.5, 1].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={styles.quickBtn}
                onPress={() =>
                  setAmountText(Math.floor(sourceAmount * pct).toString())
                }
              >
                <Text style={styles.quickBtnText}>
                  {pct === 1 ? "MAX" : `${pct * 100}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          <View
            style={[
              styles.inputWrap,
              amountError ? styles.inputWrapError : null,
            ]}
          >
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={T.textMuted}
              selectionColor={T.accentGold}
            />
            <Text style={styles.inputUnit}>{unit}</Text>
          </View>

          {amountError ? (
            <Text style={styles.errorText}>{amountError}</Text>
          ) : (
            <Text style={styles.availableText}>
              DISPONIBLE:{" "}
              <Text style={{ color: T.accentGold }}>
                {sourceAmount.toFixed(1)}
              </Text>
            </Text>
          )}

          {/* Confirmar */}
          <Animated.View style={{ transform: [{ scale: confirmPulse }] }}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: canTransfer ? color : T.border },
              ]}
              onPress={handleTransfer}
              disabled={!canTransfer}
              activeOpacity={0.85}
            >
              {transferring ? (
                <ActivityIndicator color="#0A0C0F" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={
                      direction === "TO_INVENTORY"
                        ? "arrow-down-circle"
                        : "arrow-up-circle"
                    }
                    size={15}
                    color={canTransfer ? "#0A0C0F" : T.textMuted}
                  />
                  <Text
                    style={[
                      styles.confirmText,
                      { color: canTransfer ? "#0A0C0F" : T.textMuted },
                    ]}
                  >
                    {direction === "TO_INVENTORY"
                      ? "TRANSFERIR AL INVENTARIO"
                      : "TRANSFERIR AL ALMACÉN"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

// ── BalanceBox ───────────────────────────────────────────────────

function BalanceBox({
  label,
  icon,
  amount,
  unit,
  highlight,
  color,
}: {
  label: string;
  icon: any;
  amount: number;
  unit: string;
  highlight: boolean;
  color: string;
}) {
  return (
    <View style={[styles.balanceBox, highlight && { borderColor: color }]}>
      <Ionicons
        name={icon}
        size={12}
        color={highlight ? color : T.textMuted}
        style={{ marginBottom: 3 }}
      />
      <Text style={[styles.balanceLabel, highlight && { color }]}>{label}</Text>
      <Text style={[styles.balanceAmount, highlight && { color }]}>
        {Number.isInteger(amount) ? amount : amount.toFixed(1)}
      </Text>
      <Text style={styles.balanceUnit}>{unit}</Text>
    </View>
  );
}

// ── ScreenHeader ─────────────────────────────────────────────────

function ScreenHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={22} color={T.textPrimary} />
      </TouchableOpacity>
      <View>
        <Text style={styles.title}>TRANSFERENCIA</Text>
        <Text style={styles.subtitle}>Almacén ↔ Inventario</Text>
      </View>
      <View style={{ width: 32 }} />
    </View>
  );
}

// ── CategoryChip ─────────────────────────────────────────────────

function CategoryChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.categoryChip,
        active && { borderColor: color, backgroundColor: color + "18" },
      ]}
      activeOpacity={0.7}
    >
      {active && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text style={[styles.categoryChipText, active && { color }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Pantalla principal ───────────────────────────────────────────

export default function ManageScreen() {
  const router = useRouter();
  const { resources: inventoryResources, fetchResources } = useResourceStore();

  const [storageResources, setStorageResources] = useState<StorageResource[]>(
    [],
  );
  const [shipBaseId, setShipBaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    ResourceCategory | "ALL"
  >("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [base] = await Promise.all([
        shipBasesApi.getMe(),
        fetchResources(),
      ]);
      setShipBaseId(base.id);
      const storage = await apiRequest<StorageResource[]>(
        `/ship-bases/${base.id}/storage`,
      );
      setStorageResources(storage);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const matchedResources = useMemo<MatchedResource[]>(() => {
    return inventoryResources
      .map((inv) => {
        const storage = storageResources.find(
          (s) => s.name.toLowerCase() === inv.name.toLowerCase(),
        );
        if (!storage) return null;
        return {
          name: inv.name,
          category: inv.category,
          unit: inv.unit,
          inventoryId: inv.id,
          storageId: storage.id,
          inventoryAmount: inv.current_amount,
          storageAmount: storage.current_amount,
          min_threshold: inv.min_threshold,
        } as MatchedResource;
      })
      .filter(Boolean) as MatchedResource[];
  }, [inventoryResources, storageResources]);

  const categories = useMemo(
    () => [...new Set(matchedResources.map((r) => r.category))],
    [matchedResources],
  );

  const filteredResources = useMemo(
    () =>
      activeCategory === "ALL"
        ? matchedResources
        : matchedResources.filter((r) => r.category === activeCategory),
    [matchedResources, activeCategory],
  );

  if (loading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
        <ScreenHeader onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={T.accentGold} size="large" />
          <Text style={styles.stateText}>CARGANDO ALMACÉN...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
        <ScreenHeader onBack={() => router.back()} />
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={T.statusCritical}
          />
          <Text style={[styles.stateText, { color: T.statusCritical }]}>
            ERROR DE CONEXIÓN
          </Text>
          <Text style={styles.stateSubText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
            <Text style={styles.retryText}>REINTENTAR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScreenHeader onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="TODOS"
            active={activeCategory === "ALL"}
            color={T.accentGold}
            onPress={() => setActiveCategory("ALL")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={CATEGORY_LABELS[cat]}
              active={activeCategory === cat}
              color={CATEGORY_COLORS[cat]}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>TOCA UN RECURSO PARA TRANSFERIR</Text>

        {filteredResources.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={28} color={T.textMuted} />
            <Text style={styles.stateText}>SIN RECURSOS EMPAREJADOS</Text>
            <Text style={styles.stateSubText}>
              Solo aparecen recursos presentes en inventario y almacén
              simultáneamente.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredResources.map((res) => (
              <ResourceAccordion
                key={res.inventoryId}
                resource={res}
                shipBaseId={shipBaseId!}
                onTransferDone={loadAll}
                expandedId={expandedId}
                onExpand={setExpandedId}
              />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 22,
    letterSpacing: 4,
    color: T.textPrimary,
    textAlign: "center",
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    letterSpacing: 2,
    color: T.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },

  categoryRow: {
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: T.border,
    gap: 5,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  categoryChipText: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.textMuted,
  },

  divider: { height: 1, backgroundColor: T.border, marginBottom: 14 },
  sectionLabel: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    letterSpacing: 2,
    color: T.textMuted,
    marginBottom: 10,
  },

  list: { gap: 6 },

  accordionWrap: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: T.bg,
  },
  accordionRow: { flexDirection: "row", alignItems: "center" },
  rowAccent: { width: 3, alignSelf: "stretch" },
  rowContent: { flex: 1, paddingVertical: 11, paddingLeft: 12 },
  rowName: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 14,
    letterSpacing: 1.5,
    color: T.textPrimary,
  },
  rowCategory: {
    fontFamily: "ShareTechMono",
    fontSize: 8,
    letterSpacing: 1,
    color: T.textMuted,
    marginTop: 2,
  },
  rowAmounts: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 6,
  },
  amountCol: { alignItems: "center", minWidth: 34 },
  amountColLabel: {
    fontFamily: "ShareTechMono",
    fontSize: 7,
    letterSpacing: 1,
    color: T.textMuted,
  },
  amountColValue: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 15,
    color: T.textPrimary,
    letterSpacing: 0.5,
  },
  amountColDivider: { width: 1, height: 22, backgroundColor: T.border },
  amountColUnit: {
    fontFamily: "ShareTechMono",
    fontSize: 7,
    color: T.textMuted,
    letterSpacing: 0.5,
    marginLeft: 2,
  },

  panel: { overflow: "hidden" },
  panelInner: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 10,
  },

  balancesRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceBox: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  balanceLabel: {
    fontFamily: "ShareTechMono",
    fontSize: 7,
    letterSpacing: 2,
    color: T.textMuted,
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 22,
    color: T.textPrimary,
    letterSpacing: 1,
    lineHeight: 24,
  },
  balanceUnit: {
    fontFamily: "ShareTechMono",
    fontSize: 7,
    color: T.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  arrowBtn: { alignItems: "center", gap: 4 },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: T.accentGold,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: T.accentGold + "14",
  },
  arrowLabel: {
    fontFamily: "ShareTechMono",
    fontSize: 7,
    letterSpacing: 1,
    color: T.accentGold,
  },

  quickRow: { flexDirection: "row", gap: 6 },
  quickBtn: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 2,
    alignItems: "center",
  },
  quickBtnText: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    letterSpacing: 1,
    color: T.textSecondary,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapError: { borderColor: T.statusCritical },
  amountInput: {
    flex: 1,
    fontFamily: "BarlowCondensed-700",
    fontSize: 26,
    color: T.textPrimary,
    letterSpacing: 2,
    padding: 0,
  },
  inputUnit: {
    fontFamily: "ShareTechMono",
    fontSize: 10,
    color: T.textMuted,
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    color: T.statusCritical,
    letterSpacing: 1,
  },
  availableText: {
    fontFamily: "ShareTechMono",
    fontSize: 9,
    color: T.textMuted,
    letterSpacing: 1,
  },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 3,
    gap: 7,
    marginTop: 2,
  },
  confirmText: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 12,
    letterSpacing: 3,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontFamily: "BarlowCondensed-700",
    fontSize: 13,
    letterSpacing: 3,
    color: T.textSecondary,
    textAlign: "center",
  },
  stateSubText: {
    fontFamily: "ShareTechMono",
    fontSize: 10,
    color: T.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: T.accentGold,
  },
  retryText: {
    fontFamily: "ShareTechMono",
    fontSize: 10,
    letterSpacing: 2,
    color: T.accentGold,
  },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 10 },
});
