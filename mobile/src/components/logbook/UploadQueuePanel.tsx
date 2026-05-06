import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { usePhotoQueueStore } from '@/services/offline/queue';
import { QueueItem } from './QueueItem';

const PANEL_HEIGHT = 340;

export function UploadQueuePanel() {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths } = useTheme();
  const items = usePhotoQueueStore(s => s.items);
  const [visible, setVisible] = useState(false);
  const panelY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  const activeCount = items.filter(i => i.status !== 'done').length;

  useEffect(() => {
    if (items.length === 0 && visible) close();
  }, [items.length]);

  const open = () => {
    setVisible(true);
    Animated.spring(panelY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  };

  const close = () => {
    Animated.timing(panelY, {
      toValue: PANEL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Collapsed pill — always visible when there are items and panel is closed */}
      {!visible && (
        <View style={{ position: 'absolute', bottom: 88, right: spacing.lg }}>
          <TouchableOpacity
            onPress={open}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.bgPrimary,
              borderWidth: borderWidths.base,
              borderColor: colors.primaryLight,
              borderRadius: radii.full,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.md,
            }}
          >
            <Ionicons name="cloud-upload-outline" size={14} color={colors.primaryLight} />
            <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.caption, color: colors.primaryLight }}>
              {activeCount} pendiente{activeCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded panel via Modal — renders above all navigation layers */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Sliding panel */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: PANEL_HEIGHT,
            backgroundColor: colors.bgSecondary,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            borderTopWidth: borderWidths.base,
            borderColor: colors.borderDefault,
            transform: [{ translateY: panelY }],
            overflow: 'hidden',
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={colors.primaryLight} />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.heading,
                fontSize: fontSizes.body,
                color: colors.textPrimary,
                marginLeft: spacing.sm,
              }}
            >
              Cola de sincronización
            </Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              height: borderWidths.base,
              backgroundColor: colors.borderDefault,
              marginHorizontal: spacing.lg,
            }}
          />

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.sm }}>
            {items.map(item => (
              <QueueItem key={item.id} item={item} />
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}
