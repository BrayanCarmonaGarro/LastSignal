import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';

export function DashboardSkeleton() {
  const { colors, radii } = useTheme();

  const block = (height: number, opacity = 1) => ({
    height,
    backgroundColor: colors.bgTertiary,
    borderRadius:    radii.md,
    marginBottom:    10,
    opacity,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={{ padding: 16 }}>
        <View style={block(28, 0.6)} />
        <View style={block(100)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ ...block(80), flex: 1 }} />
          <View style={{ ...block(80), flex: 1 }} />
          <View style={{ ...block(80), flex: 1 }} />
        </View>
        <View style={block(200)} />
        <View style={block(60)} />
        <View style={block(60)} />
        <View style={block(60)} />
      </View>
    </SafeAreaView>
  );
}
