import { View } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '@/components/ui/TabBar';
import { useTheme } from '@/constants/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => <TabBar />}>
        <Tabs.Screen name="dashboard"  options={{ title: 'Base' }} />
        <Tabs.Screen name="logbook"    options={{ title: 'Bitácora' }} />
        <Tabs.Screen name="resources"  options={{ title: 'Recursos' }} />
        <Tabs.Screen name="trips"      options={{ title: 'Viajes' }} />
      </Tabs>
    </View>
  );
}