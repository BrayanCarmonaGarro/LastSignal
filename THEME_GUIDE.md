# 🎨 Guía del Sistema de Diseño - LastSignal

## Estructura

```
src/
├── styles/
│   ├── types.ts          # Tipos del sistema de diseño
│   ├── tokens.ts         # Colores, tipografía, espaciado definidos
│   └── theme.ts          # Tema compilado + utilidades
├── hooks/
│   ├── useTheme.ts       # Hook principal para acceder al tema
│   └── useColorScheme.ts # Hook para detectar modo claro/oscuro
├── contexts/
│   └── ThemeContext.tsx  # Contexto global del tema
├── components/ui/
│   ├── StyledText.tsx    # Componente de texto con tema
│   ├── ThemedCard.tsx    # Componente de tarjeta con tema
│   └── ThemedButton.tsx  # Componente de botón con tema
└── constants/
    └── theme.ts          # Re-exportación para compatibilidad
```

## 🚀 Uso Básico

### 1. Envolver la app con ThemeProvider

En `app.tsx` o donde inicialices tu app:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      {/* Tu contenido aquí */}
    </ThemeProvider>
  );
}
```

### 2. Usar el hook `useTheme` en componentes

```tsx
import { useTheme } from '@/hooks/useTheme';
import { View, StyleSheet } from 'react-native';

export const MyComponent = () => {
  const { theme, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.body1,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hola desde {isDark ? 'modo oscuro' : 'modo claro'}
      </Text>
    </View>
  );
};
```

## 🎭 Paleta de Colores

### Colores Principales

| Token | Claro | Oscuro | Uso |
|-------|-------|--------|-----|
| `primary` | #0EA5E9 | #06B6D4 | Botones, iconos activos, elementos clave |
| `secondary` | #F97316 | #F97316 | Acciones secundarias, esporas/contaminación |
| `accent` | #A855F7 | #D946EF | Destacados, nebulosa, elementos especiales |

### Colores Neutros

```tsx
const { theme } = useTheme();

// Fondos
const bg = theme.colors.background;        // Fondo principal
const surface = theme.colors.surface;      // Superficie de componentes
const border = theme.colors.border;        // Bordes

// Textos
const textPrimary = theme.colors.text;           // Texto normal
const textSecondary = theme.colors.textSecondary; // Texto secundario
const textDisabled = theme.colors.textDisabled;   // Texto deshabilitado
```

### Colores Especiales (Temáticos)

```tsx
const { theme } = useTheme();

theme.colors.spaceDeep;      // Negro profundo del espacio
theme.colors.spaceGlow;      // Glow cian (luz de nave)
theme.colors.sporeOrange;    // Naranja contaminación
theme.colors.sporeRed;       // Rojo apocalíptico
theme.colors.oxidGray;       // Gris oxidado
```

## 📐 Tipografía

### Variantes de Texto

```tsx
import { StyledText } from '@/components/ui/StyledText';

<StyledText variant="h1">Título Principal</StyledText>
<StyledText variant="h2">Subtítulo</StyledText>
<StyledText variant="body1">Texto normal</StyledText>
<StyledText variant="caption">Texto pequeño</StyledText>

// Con color
<StyledText variant="body1" color="secondary">Texto secundario</StyledText>

// Con peso
<StyledText variant="body1" weight="bold">Texto en negrita</StyledText>
```

### Acceso Manual a Tipografía

```tsx
const { theme } = useTheme();

const fontSize = theme.typography.sizes.h1;        // 32
const fontFamily = theme.typography.fontFamilyPrimary;
const weight = theme.typography.weights.bold;       // '700'
const lineHeight = theme.typography.lineHeights.normal;
```

## 📏 Espaciado

Sistema base de 4px:

```tsx
const { theme } = useTheme();

theme.spacing.xs;    // 4px  - espacios muy pequeños
theme.spacing.sm;    // 8px  - espacios pequeños
theme.spacing.md;    // 16px - espacios medianos (default)
theme.spacing.lg;    // 24px - espacios grandes
theme.spacing.xl;    // 32px - espacios muy grandes
theme.spacing.'2xl'; // 48px
theme.spacing.'3xl'; // 64px

// Uso en estilos
const padding = theme.spacing.md;     // 16px
const margin = theme.spacing.lg;      // 24px
const gap = theme.spacing.sm;         // 8px
```

## 🔲 Border Radius

```tsx
const { theme } = useTheme();

theme.radius.none;   // 0
theme.radius.sm;     // 4px
theme.radius.md;     // 8px
theme.radius.lg;     // 12px
theme.radius.xl;     // 16px
theme.radius.full;   // 9999px (circular)
```

## 🌫️ Sombras

```tsx
const { theme } = useTheme();

theme.shadows.none;  // 'none'
theme.shadows.sm;    // Sombra pequeña
theme.shadows.md;    // Sombra media
theme.shadows.lg;    // Sombra grande
theme.shadows.xl;    // Sombra extra grande
theme.shadows.glow;  // Glow especial (cian en claro, intenso en oscuro)
```

## 🎨 Componentes Temáticos

### StyledText

```tsx
import { StyledText } from '@/components/ui/StyledText';

<StyledText 
  variant="h1"
  color="primary"
  weight="bold"
>
  Mi Título
</StyledText>
```

**Propiedades:**
- `variant`: 'h1' | 'h2' | 'h3' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption'
- `color`: 'primary' | 'secondary' | 'disabled'
- `weight`: keyof weights ('bold', 'semibold', 'normal', etc.)

### ThemedCard

```tsx
import { ThemedCard } from '@/components/ui/ThemedCard';

<ThemedCard variant="default" padding="md">
  <StyledText>Contenido de tarjeta</StyledText>
</ThemedCard>
```

**Propiedades:**
- `variant`: 'default' | 'highlighted' | 'minimal'
- `padding`: 'sm' | 'md' | 'lg'

### ThemedButton

```tsx
import { ThemedButton } from '@/components/ui/ThemedButton';

<ThemedButton 
  variant="primary" 
  size="md"
  onPress={() => console.log('Click')}
>
  Click aquí
</ThemedButton>

<ThemedButton variant="secondary" loading={isLoading}>
  Cargando...
</ThemedButton>

<ThemedButton variant="ghost" disabled>
  Deshabilitado
</ThemedButton>
```

**Propiedades:**
- `variant`: 'primary' | 'secondary' | 'accent' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `disabled`: boolean
- `icon`: React.ReactNode (opcional)

## 🌓 Modo Oscuro/Claro

El sistema detecta automáticamente la preferencia del usuario. Los colores cambian automáticamente sin necesidad de hacer nada.

### Forzar esquema de color

```tsx
import { useColorSchemeOverride } from '@/hooks/useColorScheme';

export const ThemeToggle = () => {
  const { currentScheme, setOverride } = useColorSchemeOverride();

  return (
    <ThemedButton
      onPress={() => setOverride(currentScheme === 'dark' ? 'light' : 'dark')}
    >
      Cambiar a {currentScheme === 'dark' ? 'claro' : 'oscuro'}
    </ThemedButton>
  );
};
```

## 🎬 Animaciones

```tsx
import { animations, beziers } from '@/styles/theme';

const duration = animations.normal;  // 300ms
const easing = beziers.easeInOut;    // [0.4, 0, 0.2, 1]
```

## 🌈 Degradados

```tsx
import { gradients } from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { theme } = useTheme();

<LinearGradient
  colors={gradients.primaryToSecondary(theme.colors).split(', ')}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Contenido */}
</LinearGradient>
```

## 🔧 Crear Componentes Nuevos

Patrón recomendado:

```tsx
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MyComponentProps extends ViewProps {
  variant?: 'default' | 'alternate';
}

export const MyComponent = React.forwardRef<View, MyComponentProps>(
  ({ variant = 'default', style, children, ...props }, ref) => {
    const { theme } = useTheme();

    // Crear estilos basados en el tema
    const styles = StyleSheet.create({
      container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        // ... más estilos
      },
    });

    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        {children}
      </View>
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

## 📋 Checklist para nuevos componentes

- [ ] Importar `useTheme`
- [ ] Usar `theme.colors.*` para colores
- [ ] Usar `theme.spacing.*` para márgenes/padding
- [ ] Usar `theme.typography.*` para fuentes
- [ ] Usar `theme.radius.*` para bordes redondeados
- [ ] Usar `theme.shadows.*` para sombras
- [ ] Definir propiedades temáticas (variant, size, etc.)
- [ ] Soportar `style` prop para sobreescribir
- [ ] Usar `React.forwardRef` para acceso a ref (recomendado)

## 🎯 Mejores Prácticas

1. **Nunca hardcodear colores** - Siempre usar `theme.colors.*`
2. **Reutilizar tokens** - Usar espaciado, radius, etc. definidos
3. **Componentes reutilizables** - Crear componentes con variantes
4. **Naming semántico** - Usar nombres que describan el propósito
5. **Documentar variantes** - Dejar claro qué hace cada prop
6. **Testear ambos modos** - Verificar que se vea bien en claro y oscuro

## 🚨 Troubleshooting

### Los colores no chanfan entre claro y oscuro
- Asegúrate de estar dentro de `<ThemeProvider>`
- Verifica que estés usando `useTheme()` o `useThemeContext()`

### Las sombras no se ven
- En Android, agrega `elevation` además de `shadowColor`
- Verifica que el contenedor padre no tenga `overflow: hidden`

### Los componentes se ven raros
- Revisa que estén usando los mismos tokens y espaciado
- Verifica consistencia en padding/margin
- Asegúrate de usar `ThemedCard` y `ThemedButton` para consistencia
