import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useSwipeTabsGesture } from "@/components/ui/SwipeTabsGesture";
import { TAB_ORDER } from "@/hooks/useSwipeTabsGesture.utils";
import { makeStyles } from "@/styles/dashboardStyles";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CriticalResourceBar } from "@/components/dashboard/CriticalResourceBar";
import { ActiveTripBanner } from "@/components/dashboard/ActiveTripBanner";
import { LogbookRecentRow } from "@/components/dashboard/LogbookRecentRow";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ProfileModal } from "@/components/dashboard/ProfileModal";

export default function DashboardScreen() {
  const theme = useTheme();
  const { colors, iconSizes } = theme;
  const s = makeStyles(theme);

  const { registerRefreshHandler } = useSwipeTabsGesture();

  const {
    router,
    data,
    isLoading,
    isRefreshing,
    error,
    fetch,
    refresh,
    criticalCount,
    criticalResources,
    orderedGroups,
    profileVisible,
    profileView,
    editUsername,
    editLoading,
    editIsValid,
    editInputError,
    openProfile,
    confirmLogout,
    submitUsername,
    setProfileVisible,
    setProfileView,
    setEditUsername,
  } = useDashboard();

  useEffect(() => {
    registerRefreshHandler(TAB_ORDER.indexOf("dashboard"), refresh);
  }, [refresh, registerRefreshHandler]);

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.errorContainer}>
          <Ionicons
            name="warning-outline"
            size={iconSizes.xl}
            color={colors.danger}
          />
          <Text style={s.errorTitle}>No se pudo cargar la base</Text>
          <Text style={s.errorSubtitle}>{error}</Text>
          <TouchableOpacity onPress={fetch} style={s.retryButton}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity
            onPress={openProfile}
            activeOpacity={0.75}
            style={s.profileChip}
          >
            {data?.user.avatar_url ? (
              <Image
                source={{ uri: data.user.avatar_url }}
                style={s.avatarImage}
              />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>
                  {(data?.user.username ?? "?").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flexShrink: 1 }}>
              <Text numberOfLines={1} style={s.username}>
                {data?.user.username ?? data?.user.display_name ?? "Astronauta"}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={s.levelChip}>
            <Text style={s.levelLabel}>Nivel</Text>
            <Text style={s.levelValue}>{data?.user.level ?? "-"}</Text>
          </View>
        </View>

        <View style={s.baseCard}>
          <Text style={s.baseCardTag}>BASE</Text>
          <Text style={s.baseCardName} numberOfLines={2}>
            {data?.ship_base?.name ?? "Base Camp"}
          </Text>
          {data?.ship_base ? (
            <View style={s.baseCardCoordRow}>
              <Ionicons
                name="location-outline"
                size={11}
                color={colors.textMuted}
              />
              <Text style={s.baseCardCoords}>
                {data.ship_base.latitude.toFixed(4)},{"  "}
                {data.ship_base.longitude.toFixed(4)}
              </Text>
            </View>
          ) : null}
        </View>

        {data?.active_trip ? (
          <ActiveTripBanner
            trip={data.active_trip}
            onPress={() => router.push("/(app)/(tabs)/trips/active")}
          />
        ) : null}

        <SectionHeader title="Estado" subtitle="Resumen de la base" />
        <View style={s.metricsRow}>
          <MetricCard
            icon="book-outline"
            value={data?.total_logbook_entries ?? 0}
            label="Entradas"
          />
          <MetricCard
            icon="cube-outline"
            value={data?.total_resources ?? 0}
            label="Recursos"
          />
          <MetricCard
            icon="warning-outline"
            value={criticalCount}
            label="Alertas"
            variant={criticalCount > 0 ? "danger" : "default"}
          />
        </View>

        {criticalCount > 0 ? (
          <>
            <SectionHeader
              title="Recursos Críticos"
              subtitle={`${criticalCount} recurso${criticalCount !== 1 ? "s" : ""} bajo el mínimo`}
            />
            <View style={s.criticalPanel}>
              {criticalResources.map((r) => (
                <CriticalResourceBar
                  key={r.id}
                  name={r.name}
                  category={r.category}
                  current_amount={r.current_amount}
                  min_threshold={r.min_threshold}
                  unit={r.unit}
                  is_critical
                />
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader
          title="Bodega"
          subtitle={
            criticalCount > 0
              ? "Todos los recursos"
              : `${data?.total_resources ?? 0} recursos registrados`
          }
        />
        {orderedGroups.length > 0 ? (
          orderedGroups.map((group) => (
            <View key={group.category} style={s.categoryGroup}>
              <Text style={s.categoryLabel}>
                {group.category}
                {group.critical_count > 0 ? (
                  <Text style={s.categoryDot}> ●</Text>
                ) : null}
              </Text>
              {group.resources.map((r) => (
                <CriticalResourceBar
                  key={r.id}
                  name={r.name}
                  category={r.category}
                  current_amount={r.current_amount}
                  min_threshold={r.min_threshold}
                  unit={r.unit}
                  is_critical={r.current_amount <= r.min_threshold}
                />
              ))}
            </View>
          ))
        ) : (
          <Text style={s.emptyText}>
            Sin recursos registrados. Ve a Recursos para agregar.
          </Text>
        )}

        <SectionHeader
          title="Bitácora Reciente"
          subtitle="Últimas formas de vida registradas"
        />
        {data?.recent_logbook_entries &&
        data.recent_logbook_entries.length > 0 ? (
          <>
            {data.recent_logbook_entries.map((entry) => (
              <LogbookRecentRow
                key={entry.id}
                entry={entry}
                onPress={() =>
                  router.push(`/(app)/(tabs)/logbook/${entry.id}` as never)
                }
              />
            ))}
            <TouchableOpacity
              onPress={() => router.push("/(app)/(tabs)/logbook")}
              style={s.viewAllRow}
            >
              <Text style={s.viewAllText}>Ver todas las entradas</Text>
              <Ionicons
                name="chevron-forward"
                size={iconSizes.xs}
                color={colors.primary}
              />
            </TouchableOpacity>
          </>
        ) : (
          <Text style={s.emptyText}>
            Sin entradas. Usa la cámara para registrar formas de vida.
          </Text>
        )}
      </ScrollView>

      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        view={profileView}
        onSwitchToEdit={() => {
          setEditUsername("");
          setProfileView("edit");
        }}
        onBackToMenu={() => setProfileView("menu")}
        onLogout={confirmLogout}
        username={editUsername}
        onUsernameChange={setEditUsername}
        inputError={editInputError}
        isValid={editIsValid}
        isLoading={editLoading}
        onSubmit={submitUsername}
        user={data?.user}
      />
    </SafeAreaView>
  );
}
