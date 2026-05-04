import React, { useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '@/constants/theme';
import { useLogin } from '@/hooks/auth/useLogin';
import { useLoginAnimations } from '@/hooks/useLoginAnimations';
import { UsernameSetupScreen } from '@/components/auth/UsernameSetupScreen';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { makeStyles } from '@/styles/loginStyles';

export default function LoginScreen() {
  const theme   = useTheme();
  const styles  = makeStyles(theme);
  const { colors } = theme;

  const { request, promptAsync, showUsernameSetup } = useLogin();
  const { sweepRotation, pulseOpacity, pulseScale, nebulaAnim, glowAnim, dotAnim, scanAnim, stars, time } = useLoginAnimations();

  const [pressed, setPressed] = useState(false);

  if (showUsernameSetup) return <UsernameSetupScreen />;

  return (
    <View style={styles.root}>

      {/* Stars */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((star, i) => (
          <Animated.View
            key={i}
            style={{
              position:        'absolute',
              left:            star.x,
              top:             star.y,
              width:           star.size,
              height:          star.size,
              borderRadius:    star.size / 2,
              backgroundColor: colors.textPrimary,
              opacity:         star.anim,
            }}
          />
        ))}
      </View>

      {/* Nebula overlay */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: nebulaAnim }]}>
        <View style={styles.nebula1} />
        <View style={styles.nebula2} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{time}</Text>
          <Text style={styles.statusText}>SYS OK ▸▸▸</Text>
        </View>

        <View style={[styles.badge, { borderColor: colors.success + '50', backgroundColor: colors.success + '18' }]}>
          <Animated.View style={[styles.badgeDot, { backgroundColor: colors.success, opacity: dotAnim }]} />
          <Text style={[styles.badgeText, { color: colors.success }]}>MISIÓN ACTIVA</Text>
        </View>

        {/* Radar logo */}
        <View style={styles.logoWrap}>
          <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
            <Circle cx={60} cy={60} r={55} stroke={colors.oxygen}       strokeWidth={1}   fill="none" opacity={0.5} />
            <Circle cx={60} cy={60} r={40} stroke={colors.primaryLight} strokeWidth={1}   fill="none" opacity={0.35} />
            <Circle cx={60} cy={60} r={25} stroke={colors.oxygen}       strokeWidth={0.5} fill="none" opacity={0.25} />
            <Circle cx={60} cy={60} r={20} fill={colors.bgSecondary} />
            <Path d="M53 63 Q60 53 67 63"   stroke={colors.primaryLight} strokeWidth={2}   fill="none" strokeLinecap="round" />
            <Path d="M48 68 Q60 47 72 68"   stroke={colors.primaryLight} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.8} />
            <Path d="M43 73 Q60 41 77 73"   stroke={colors.oxygen}       strokeWidth={1}   fill="none" strokeLinecap="round" opacity={0.5} />
          </Svg>

          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: sweepRotation }] }]}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Defs>
                <SvgLinearGradient id="sweepGrad" x1="0.5" y1="1" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.primaryLight} stopOpacity="0" />
                  <Stop offset="1" stopColor={colors.primaryLight} stopOpacity="0.4" />
                </SvgLinearGradient>
              </Defs>
              <Path d="M 60 60 L 60 5 A 55 55 0 0 1 107.6 32.5 Z" fill="url(#sweepGrad)" />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          >
            <Svg width={120} height={120}>
              <Circle cx={60} cy={60} r={57} stroke={colors.primaryLight} strokeWidth={1.5} fill="none" />
            </Svg>
          </Animated.View>
        </View>

        {/* Title */}
        <View style={styles.wordmarkWrap}>
          <Animated.Text
            style={[
              styles.wordmarkBase,
              {
                color:            colors.primaryLight,
                opacity:          glowAnim,
                textShadowColor:  colors.primaryLight,
                textShadowRadius: 20,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            LAST SIGNAL
          </Animated.Text>
          <Text style={[styles.wordmarkBase, styles.wordmarkTop, { color: colors.primaryLight }]}>
            LAST SIGNAL
          </Text>
        </View>

        <Text style={styles.subtitle}>SISTEMA DE SUPERVIVENCIA</Text>

        <Svg width={280} height={2} style={styles.divider}>
          <Defs>
            <SvgLinearGradient id="divGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor={colors.oxygen}       stopOpacity="0" />
              <Stop offset="0.3" stopColor={colors.oxygen}       stopOpacity="0.7" />
              <Stop offset="0.5" stopColor={colors.success}      stopOpacity="1" />
              <Stop offset="0.7" stopColor={colors.oxygen}       stopOpacity="0.7" />
              <Stop offset="1"   stopColor={colors.oxygen}       stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0.5} width={280} height={1} fill="url(#divGrad)" />
        </Svg>

        <Text style={styles.authLabel}>AUTENTICACIÓN REQUERIDA</Text>

        <TouchableOpacity
          disabled={!request}
          onPress={() => promptAsync()}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={1}
          style={[
            styles.btn,
            {
              backgroundColor: pressed ? colors.bgElevated  : colors.bgTertiary,
              borderColor:     pressed ? colors.primaryLight : colors.borderDefault,
            },
          ]}
        >
          {!request ? (
            <ActivityIndicator size="small" color={colors.primaryLight} />
          ) : (
            <>
              <GoogleLogo size={20} />
              <Text style={[styles.btnText, { color: colors.textPrimary }]}>
                CONTINUAR CON GOOGLE
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Animated.View style={[styles.scanBar, { backgroundColor: colors.primaryLight, opacity: scanAnim }]} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>14°15'N 87°12'W · ALT 2.847 KM</Text>
          <Text style={styles.footerText}>LAST SIGNAL DS v2.0 · SPACE EDITION</Text>
        </View>

      </ScrollView>
    </View>
  );
}
