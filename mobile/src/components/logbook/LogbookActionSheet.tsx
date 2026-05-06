import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarField } from '@/components/ui/StarField';
import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS } from '@/constants/labels';
import type { LogbookEntry } from '@/types/logbook.types';

interface Props {
  entry:             LogbookEntry | null;
  onClose:           () => void;
  onViewDetail:      () => void;
  onPlayAudio:       () => void;
  isGeneratingAudio: boolean;
}

export function LogbookActionSheet({
  entry,
  onClose,
  onViewDetail,
  onPlayAudio,
  isGeneratingAudio,
}: Props) {
  const { colors, fonts } = useTheme();

  const translateY = useRef(new Animated.Value(300)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (entry) {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0,   duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [entry]);

  if (!entry) return null;

  const title = CLASSIFICATION_LABELS[entry.classification] ?? entry.classification;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <Animated.View style={[
          s.sheet,
          {
            backgroundColor: colors.bgSecondary,
            borderColor:     colors.borderDefault,
            transform:       [{ translateY }],
          },
        ]}>
          <StarField />

          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.borderStrong }]} />

          {/* Entry header */}
          <Text style={{ fontFamily: fonts.display, fontSize: 20, letterSpacing: 3, color: colors.primary }} numberOfLines={1}>
            {title.toUpperCase()}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textSecondary }} numberOfLines={2}>
            {entry.description}
          </Text>

          <View style={[s.divider, { backgroundColor: colors.borderDefault }]} />

          {/* Ver detalle */}
          <TouchableOpacity style={s.row} onPress={onViewDetail} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` }]}>
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary }}>
              Ver detalle
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Escuchar audio */}
          <TouchableOpacity style={s.row} onPress={onPlayAudio} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}50` }]}>
              <Ionicons name="musical-notes-outline" size={20} color={colors.textSuccess} />
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary }}>
              {isGeneratingAudio ? 'Generando...' : 'Escuchar audio'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[s.divider, { backgroundColor: colors.borderDefault }]} />

          {/* Cancelar */}
          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: colors.borderDefault }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: 15, letterSpacing: 0.5, color: colors.textMuted }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent:  'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    borderTopWidth:   1,
    borderLeftWidth:  1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom:    40,
    paddingTop:       12,
    gap:              10,
    overflow:         'hidden',
  },
  handle: {
    width:        36,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginBottom: 6,
  },
  divider: {
    height:        1,
    marginVertical: 2,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    paddingVertical: 10,
  },
  iconBox: {
    width:          40,
    height:         40,
    borderRadius:   12,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems:      'center',
    borderRadius:    12,
    borderWidth:     1,
    marginTop:       4,
  },
});
