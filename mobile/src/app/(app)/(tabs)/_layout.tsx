import { Tabs } from 'expo-router';
import TabBar from '@/components/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Base' }} />
      <Tabs.Screen name="logbook"    options={{ title: 'Bitácora' }} />
      <Tabs.Screen name="resources"  options={{ title: 'Recursos' }} />
      <Tabs.Screen name="trips"      options={{ title: 'Viajes' }} />
    </Tabs>
  );
}