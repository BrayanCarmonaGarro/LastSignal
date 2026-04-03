// src/app/(app)/theme-showcase.tsx
import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, useColorScheme } from 'react-native';
import {
  getTheme,
  palette,
  fonts,
  fontSizes,
  spacing,
  radii,
  animation,
  type ThemeTokens,
} from '@/constants/theme';

// ── Sub-componentes ───────────────────────────────────────────

const ColorSwatch = ({
  color,
  label,
  size = 80,
}: {
  color: string;
  label: string;
  size?: number;
}) => (
  <View style={{ alignItems: 'center', gap: spacing.sm }}>
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: '#00000015',
      }}
    />
    <Text style={{ fontSize: fontSizes.caption, textAlign: 'center', maxWidth: 100 }}>
      {label}
    </Text>
    <Text style={{ fontSize: fontSizes.micro, color: '#666', fontFamily: fonts.mono }}>
      {color}
    </Text>
  </View>
);

const Section = ({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ThemeTokens;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: spacing['3xl'], paddingHorizontal: spacing.lg }}>
    <Text
      style={{
        fontSize: fontSizes.h2,
        fontFamily: fonts.heading,
        marginBottom: spacing.lg,
        color: theme.textPrimary,
      }}
    >
      {title}
    </Text>
    {children}
  </View>
);

// ── Pantalla principal ────────────────────────────────────────

export default function ThemeShowcase() {
  const systemScheme = useColorScheme();
  const [lightMode, setLightMode] = useState(systemScheme === 'light');
  const theme = getTheme(lightMode ? 'light' : 'dark');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          marginBottom: spacing.xl,
          borderBottomWidth: 2,
          borderBottomColor: theme.borderDefault,
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.display,
            fontFamily: fonts.display,
            color: theme.primary,
            marginBottom: spacing.md,
          }}
        >
          THEME SHOWCASE
        </Text>
        <Text style={{ fontSize: fontSizes.body, color: theme.textSecondary }}>
          Demostración completa del Design System de LastSignal
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: theme.bgSecondary,
            borderRadius: radii.md,
          }}
        >
          <Text style={{ flex: 1, color: theme.textPrimary, fontFamily: fonts.body }}>
            {lightMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Text>
          <Switch
            value={lightMode}
            onValueChange={setLightMode}
            trackColor={{ false: theme.bgTertiary, true: theme.primaryDim }}
            thumbColor={theme.primary}
          />
        </View>
      </View>

      {/* PALETA BASE */}
      <Section title="🎨 Paleta Base" theme={theme}>
        <Text style={{ fontSize: fontSizes.body, color: theme.textSecondary, marginBottom: spacing.lg }}>
          Colores invariantes del sistema
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <ColorSwatch color={palette.black}    label="Black"     />
          <ColorSwatch color={palette.dark}     label="Dark"      />
          <ColorSwatch color={palette.surface}  label="Surface"   />
          <ColorSwatch color={palette.surface2} label="Surface 2" />
          <ColorSwatch color={palette.surface3} label="Surface 3" />
          <ColorSwatch color={palette.white}    label="White"     />
          <ColorSwatch color={palette.ochre}    label="Ochre"     />
          <ColorSwatch color={palette.greenBio} label="Green Bio" />
          <ColorSwatch color={palette.danger}   label="Danger"    />
          <ColorSwatch color={palette.oxygen}   label="Oxygen"    />
        </View>
      </Section>

      {/* TOKENS SEMÁNTICOS */}
      <Section title="🎭 Tokens Semánticos" theme={theme}>
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.h3, color: theme.textPrimary, marginBottom: spacing.md }}>
            Fondos
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <ColorSwatch color={theme.bgPrimary}   label="Primary BG"   size={60} />
            <ColorSwatch color={theme.bgSecondary} label="Secondary BG" size={60} />
            <ColorSwatch color={theme.bgTertiary}  label="Tertiary BG"  size={60} />
            <ColorSwatch color={theme.bgElevated}  label="Elevated BG"  size={60} />
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.h3, color: theme.textPrimary, marginBottom: spacing.md }}>
            Texto
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <ColorSwatch color={theme.textPrimary}   label="Primary"   size={60} />
            <ColorSwatch color={theme.textSecondary} label="Secondary" size={60} />
            <ColorSwatch color={theme.textMuted}     label="Muted"     size={60} />
            <ColorSwatch color={theme.textData}      label="Data"      size={60} />
            <ColorSwatch color={theme.textOxygen}    label="Oxygen"    size={60} />
            <ColorSwatch color={theme.textDanger}    label="Danger"    size={60} />
          </View>
        </View>

        <View>
          <Text style={{ fontSize: fontSizes.h3, color: theme.textPrimary, marginBottom: spacing.md }}>
            Interactivos
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <ColorSwatch color={theme.primary} label="Primary" size={60} />
            <ColorSwatch color={theme.danger}  label="Danger"  size={60} />
            <ColorSwatch color={theme.success} label="Success" size={60} />
            <ColorSwatch color={theme.oxygen}  label="Oxygen"  size={60} />
          </View>
        </View>
      </Section>

      {/* TIPOGRAFÍA */}
      <Section title="📝 Tipografía" theme={theme}>
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.h3, color: theme.textPrimary, marginBottom: spacing.md }}>
            Fuentes
          </Text>
          <View style={{ gap: spacing.md }}>
            {[
              { family: fonts.display, size: 20, label: 'Barlow Condensed (Display)' },
              { family: fonts.heading, size: 18, label: 'Barlow Condensed (Heading)' },
              { family: fonts.body,    size: 16, label: 'Barlow (Body) — Texto corrido normal' },
              { family: fonts.mono,    size: 14, label: 'ShareTechMono (Datos) 12345.67', color: theme.textData },
            ].map(({ family, size, label, color }) => (
              <View
                key={family}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: theme.bgSecondary,
                  borderRadius: radii.md,
                }}
              >
                <Text style={{ fontFamily: family, fontSize: size, color: color ?? theme.textPrimary }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={{ fontSize: fontSizes.h3, color: theme.textPrimary, marginBottom: spacing.md }}>
            Tamaños
          </Text>
          <View style={{ gap: spacing.md }}>
            {(
              [
                { key: 'display', size: fontSizes.display, name: 'Display' },
                { key: 'h1',      size: fontSizes.h1,      name: 'H1'      },
                { key: 'h2',      size: fontSizes.h2,      name: 'H2'      },
                { key: 'h3',      size: fontSizes.h3,      name: 'H3'      },
                { key: 'body',    size: fontSizes.body,    name: 'Body'    },
                { key: 'caption', size: fontSizes.caption, name: 'Caption' },
                { key: 'data',    size: fontSizes.data,    name: 'Data'    },
                { key: 'dataXl',  size: fontSizes.dataXl,  name: 'Data XL' },
              ] as const
            ).map(({ key, size, name }) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ width: 80, color: theme.textSecondary, fontFamily: fonts.body }}>
                  {name}
                </Text>
                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: theme.bgSecondary,
                    borderRadius: radii.md,
                  }}
                >
                  <Text style={{ fontSize: size, color: theme.textPrimary }}>
                    Sample Text ({size}px)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Section>

      {/* ESPACIADO */}
      <Section title="📏 Espaciado" theme={theme}>
        <View style={{ gap: spacing.lg }}>
          {(
            [
              { key: 'xs', value: spacing.xs, name: 'XS' },
              { key: 'sm', value: spacing.sm, name: 'SM' },
              { key: 'md', value: spacing.md, name: 'MD' },
              { key: 'lg', value: spacing.lg, name: 'LG' },
              { key: 'xl', value: spacing.xl, name: 'XL' },
            ] as const
          ).map(({ key, value, name }) => (
            <View key={key} style={{ alignItems: 'flex-start' }}>
              <Text style={{ color: theme.textSecondary, marginBottom: spacing.sm }}>
                {name} ({value}px)
              </Text>
              <View
                style={{
                  width: value * 4,
                  height: 30,
                  backgroundColor: theme.primary,
                  borderRadius: radii.sm,
                }}
              />
            </View>
          ))}
        </View>
      </Section>

      {/* BORDES Y RADIOS */}
      <Section title="⭕ Bordes & Radios" theme={theme}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
          {(
            [
              { key: 'sm', value: radii.sm, name: 'SM' },
              { key: 'md', value: radii.md, name: 'MD' },
              { key: 'lg', value: radii.lg, name: 'LG' },
              { key: 'xl', value: radii.xl, name: 'XL' },
            ] as const
          ).map(({ key, value, name }) => (
            <View key={key} style={{ alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: theme.primary,
                  borderRadius: value,
                }}
              />
              <Text style={{ fontSize: fontSizes.caption, color: theme.textSecondary }}>
                {name} ({value}px)
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* CLASIFICACIONES */}
      <Section title="🦠 Clasificaciones de Vida" theme={theme}>
        <View
          style={{
            gap: spacing.lg,
            borderLeftWidth: 4,
            paddingLeft: spacing.lg,
            borderLeftColor: theme.primary,
          }}
        >
          {[
            { name: 'ANIMAL',  bg: palette.ochreDim,  border: palette.ochre,    text: palette.ochreMid     },
            { name: 'PLANT',   bg: palette.greenDark, border: palette.green,    text: palette.greenBio     },
            { name: 'FUNGI',   bg: palette.fungiBg,   border: palette.fungi,    text: palette.fungiLight   },
            { name: 'MINERAL', bg: palette.mineralBg, border: palette.mineral,  text: palette.mineralLight },
          ].map(({ name, bg, border, text }) => (
            <View
              key={name}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: bg,
                borderLeftWidth: 3,
                borderLeftColor: border,
                borderRadius: radii.md,
              }}
            >
              <Text style={{ color: text, fontFamily: fonts.heading, fontSize: fontSizes.h3 }}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* RECURSOS */}
      <Section title="📦 Categorías de Recurso" theme={theme}>
        <View style={{ gap: spacing.lg }}>
          {[
            { name: 'VITAL',     color: palette.oxygenMid,    desc: 'Oxígeno, aire'        },
            { name: 'FOOD',      color: palette.ochre,         desc: 'Alimentos, nutrición' },
            { name: 'MEDICAL',   color: palette.greenBio,      desc: 'Medicina, salud'      },
            { name: 'EQUIPMENT', color: palette.textSecondary, desc: 'Equipamiento técnico' },
            { name: 'FUEL',      color: palette.rustMid,       desc: 'Combustible, energía' },
          ].map(({ name, color, desc }) => (
            <View
              key={name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: theme.bgSecondary,
                borderRadius: radii.md,
                borderLeftWidth: 4,
                borderLeftColor: color,
              }}
            >
              <View style={{ width: 50, height: 50, backgroundColor: color, borderRadius: radii.md }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontFamily: fonts.heading, fontSize: fontSizes.h3 }}>
                  {name}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: fontSizes.caption }}>
                  {desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {/* ANIMACIONES */}
      <Section title="⚡ Animaciones" theme={theme}>
        <View style={{ gap: spacing.md }}>
          {Object.entries(animation.duration).map(([key, value]) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: theme.bgSecondary,
                borderRadius: radii.md,
              }}
            >
              <Text style={{ color: theme.textPrimary, fontFamily: fonts.heading, textTransform: 'capitalize' }}>
                {key}
              </Text>
              <Text style={{ color: theme.textData, fontFamily: fonts.mono }}>
                {value}ms
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* FOOTER */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          marginTop: spacing['3xl'],
          borderTopWidth: 2,
          borderTopColor: theme.borderDefault,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: fontSizes.caption, color: theme.textMuted }}>
          LastSignal Design System v1.0
        </Text>
        <Text style={{ fontSize: fontSizes.micro, color: theme.textMuted, marginTop: spacing.sm }}>
          Post-apocalipsis espacial — Tema terrenal
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});