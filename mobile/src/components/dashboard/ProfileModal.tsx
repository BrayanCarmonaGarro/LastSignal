import {
  Modal,
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
  Text,
  Image,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
import { createStyles } from "./ProfileModal.styles";
import type { DashboardUser } from "@/services/api/dashboard.api";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  view: "menu" | "edit";
  onSwitchToEdit: () => void;
  onBackToMenu: () => void;
  onLogout: () => void;
  username: string;
  onUsernameChange: (t: string) => void;
  inputError: string | null;
  isValid: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  user: DashboardUser | undefined;
}

export function ProfileModal({
  visible,
  onClose,
  view,
  onSwitchToEdit,
  onBackToMenu,
  onLogout,
  username,
  onUsernameChange,
  inputError,
  isValid,
  isLoading,
  onSubmit,
  user,
}: ProfileModalProps) {
  const theme = useTheme();
  const { colors, iconSizes } = theme;
  const s = createStyles(theme, { inputHasError: !!inputError });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={s.overlay}>
          <TouchableOpacity activeOpacity={1} style={s.panel}>
            {view === "menu" ? (
              <>
                <View style={s.avatarSection}>
                  {user?.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={s.avatarLarge}
                    />
                  ) : (
                    <View style={s.avatarFallbackLarge}>
                      <Text style={s.avatarFallbackText}>
                        {(user?.username ?? "?").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={s.displayName}>
                    {user?.username ?? user?.display_name ?? "—"}
                  </Text>
                  <Text style={s.levelInfo}>
                    {"Nivel " + (user?.level ?? "-") + "  ·  Base Camp"}
                  </Text>
                </View>

                <View style={s.divider}>
                  <TouchableOpacity
                    onPress={onSwitchToEdit}
                    style={s.menuRowBordered}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={iconSizes.sm}
                      color={colors.textSecondary}
                    />
                    <Text style={s.menuText}>Cambiar nombre de usuario</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onLogout} style={s.menuRow}>
                    <Ionicons
                      name="power-outline"
                      size={iconSizes.sm}
                      color={colors.danger}
                    />
                    <Text style={s.dangerText}>Abandonar base</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={s.editHeader}>
                  <TouchableOpacity
                    onPress={onBackToMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="arrow-back-outline"
                      size={iconSizes.sm}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                  <Text style={s.editTitle}>Nuevo nombre de usuario</Text>
                </View>

                <View style={s.editForm}>
                  <TextInput
                    value={username}
                    onChangeText={onUsernameChange}
                    placeholder={user?.username ?? "nombre de usuario"}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    style={s.textInput}
                  />
                  {inputError ? (
                    <Text style={s.inputErrorText}>{inputError}</Text>
                  ) : null}
                </View>

                <View style={s.confirmRow}>
                  <TouchableOpacity
                    onPress={onSubmit}
                    disabled={!isValid || isLoading}
                    style={[
                      s.confirmButton,
                      { opacity: isValid && !isLoading ? 1 : 0.4 },
                    ]}
                  >
                    <Text style={s.confirmText}>
                      {isLoading ? "Guardando..." : "Confirmar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
