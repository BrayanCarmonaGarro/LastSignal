import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useTheme, getLoginTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { discovery, authRequestConfig } from '@/services/auth/keycloak';
import { useLoginAnimations } from '@/hooks/useLoginAnimations';
import { GoogleLogo } from '@/components/ui/GoogleLogo';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { scheme } = useTheme();
  const c          = getLoginTheme(scheme);
  const setSession = useAuthStore((s) => s.setSession);
  const router     = useRouter();

  console.log('Redirect URI:', AuthSession.makeRedirectUri({ scheme: 'lastsignal', path: 'auth' }));

  const [request, response, promptAsync] = AuthSession.useAuthRequest(authRequestConfig, discovery);
  const [pressed, setPressed] = useState(false);

  const {
    sweepRotation,
    pulseOpacity,
    pulseScale,
    nebulaAnim,
    glowAnim,
    dotAnim,
    scanAnim,
    stars,
    time,
  } = useLoginAnimations();

  useEffect(() => {
    if (response?.type !== 'success') return;
    const { code } = response.params;
    AuthSession.exchangeCodeAsync(
      {
        clientId:    authRequestConfig.clientId,
        code,
        redirectUri: authRequestConfig.redirectUri,
        extraParams: { code_verifier: request!.codeVerifier! },
      },
      discovery,
    )
      .then((tokenResponse) =>
        setSession({
          accessToken:  tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken!,
          idToken:      tokenResponse.idToken!,
        })
      )
      .then(() => router.replace('/(app)/(tabs)/dashboard'))
      .catch(console.error);
  }, [response]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

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
              backgroundColor: c.starColor,
              opacity:         star.anim,
            }}
          />
        ))}
      </View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: nebulaAnim }]}>
        <View style={[styles.nebula1, { backgroundColor: c.nebulaA }]} />
        <View style={[styles.nebula2, { backgroundColor: c.nebulaB }]} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.statusBar}>
          <Text style={[styles.statusText, { color: c.muted }]}>{time}</Text>
          <Text style={[styles.statusText, { color: c.muted }]}>SYS OK ▸▸▸</Text>
        </View>

        <View style={[styles.badge, { borderColor: c.signal + '50', backgroundColor: c.signal + '18' }]}>
          <Animated.View style={[styles.badgeDot, { backgroundColor: c.signal, opacity: dotAnim }]} />
          <Text style={[styles.badgeText, { color: c.signal }]}>MISIÓN ACTIVA</Text>
        </View>

        <View style={styles.logoWrap}>
          <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
            <Circle cx={60} cy={60} r={55} stroke={c.hud}  strokeWidth={1}   fill="none" opacity={0.5} />
            <Circle cx={60} cy={60} r={40} stroke={c.gold} strokeWidth={1}   fill="none" opacity={0.35} />
            <Circle cx={60} cy={60} r={25} stroke={c.hud}  strokeWidth={0.5} fill="none" opacity={0.25} />
            <Circle cx={60} cy={60} r={20} fill={c.logoCore} />
            <Path d="M53 63 Q60 53 67 63"   stroke={c.gold} strokeWidth={2}   fill="none" strokeLinecap="round" />
            <Path d="M48 68 Q60 47 72 68"   stroke={c.gold} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.8} />
            <Path d="M43 73 Q60 41 77 73"   stroke={c.hud}  strokeWidth={1}   fill="none" strokeLinecap="round" opacity={0.5} />
          </Svg>

          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: sweepRotation }] }]}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Defs>
                <SvgLinearGradient id="sweepGrad" x1="0.5" y1="1" x2="1" y2="0">
                  <Stop offset="0" stopColor={c.gold} stopOpacity="0" />
                  <Stop offset="1" stopColor={c.gold} stopOpacity="0.4" />
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
              <Circle cx={60} cy={60} r={57} stroke={c.gold} strokeWidth={1.5} fill="none" />
            </Svg>
          </Animated.View>
        </View>

        <View style={styles.wordmarkWrap}>
          <Animated.Text
            style={[
              styles.wordmarkBase,
              {
                color:             c.gold,
                opacity:           glowAnim,
                textShadowColor:   c.gold,
                textShadowRadius:  20,
                textShadowOffset:  { width: 0, height: 0 },
              },
            ]}
          >
            LAST SIGNAL
          </Animated.Text>
          <Text style={[styles.wordmarkBase, styles.wordmarkTop, { color: c.gold }]}>
            LAST SIGNAL
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: c.muted }]}>SISTEMA DE SUPERVIVENCIA</Text>

        <Svg width={280} height={2} style={styles.divider}>
          <Defs>
            <SvgLinearGradient id="divGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor={c.hud}    stopOpacity="0" />
              <Stop offset="0.3" stopColor={c.hud}    stopOpacity="0.7" />
              <Stop offset="0.5" stopColor={c.signal} stopOpacity="1" />
              <Stop offset="0.7" stopColor={c.hud}    stopOpacity="0.7" />
              <Stop offset="1"   stopColor={c.hud}    stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0.5} width={280} height={1} fill="url(#divGrad)" />
        </Svg>

        <Text style={[styles.authLabel, { color: c.muted }]}>AUTENTICACIÓN REQUERIDA</Text>

        <TouchableOpacity
          disabled={!request}
          onPress={() => promptAsync()}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={1}
          style={[
            styles.btn,
            {
              backgroundColor: pressed ? c.btnBgPressed     : c.btnBg,
              borderColor:     pressed ? c.btnBorderPressed : c.btnBorder,
            },
          ]}
        >
          {!request ? (
            <ActivityIndicator size="small" color={c.gold} />
          ) : (
            <>
              <GoogleLogo size={20} />
              <Text style={[styles.btnText, { color: c.btnText }]}>
                CONTINUAR CON GOOGLE
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Animated.View style={[styles.scanBar, { backgroundColor: c.gold, opacity: scanAnim }]} />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.muted }]}>14°15'N 87°12'W · ALT 2.847 KM</Text>
          <Text style={[styles.footerText, { color: c.muted }]}>LAST SIGNAL DS v2.0 · SPACE EDITION</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow:          1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 24,
    paddingTop:        48,
    paddingBottom:     32,
    gap:               16,
  },
  statusBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    width:          '100%',
    marginBottom:   -4,
  },
  statusText: {
    fontFamily:    'ShareTechMono',
    fontSize:      10,
    letterSpacing: 1,
  },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderRadius:      999,
    paddingHorizontal: 12,
    paddingVertical:   5,
    gap:               7,
  },
  badgeDot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontFamily:    'ShareTechMono',
    fontSize:      11,
    letterSpacing: 2,
  },
  logoWrap: {
    width:          120,
    height:         120,
    marginVertical: 8,
  },
  wordmarkWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginVertical: -4,
  },
  wordmarkBase: {
    fontFamily:    'BarlowCondensed-700',
    fontSize:      34,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  wordmarkTop: {
    position: 'absolute',
  },
  subtitle: {
    fontFamily:    'ShareTechMono',
    fontSize:      11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: 4,
  },
  authLabel: {
    fontFamily:    'ShareTechMono',
    fontSize:      9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  btn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               12,
    width:             280,
    paddingVertical:   15,
    paddingHorizontal: 24,
    borderRadius:      4,
    borderWidth:       1,
    marginTop:         4,
  },
  btnText: {
    fontFamily:    'BarlowCondensed-700',
    fontSize:      13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scanBar: {
    width:  280,
    height: 1,
  },
  footer: {
    alignItems: 'center',
    gap:        3,
    marginTop:  8,
  },
  footerText: {
    fontFamily:    'ShareTechMono',
    fontSize:      9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nebula1: {
    position:     'absolute',
    left:         -80,
    top:          height * 0.05,
    width:        320,
    height:       320,
    borderRadius: 160,
  },
  nebula2: {
    position:     'absolute',
    right:        -60,
    top:          height * 0.35,
    width:        260,
    height:       260,
    borderRadius: 130,
  },
});
