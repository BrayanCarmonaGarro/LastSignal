import { Animated, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '@/components/ui/TabBar';
import { SwipeTabsProvider, useSwipeTabsGesture } from '@/components/ui/SwipeTabsGesture';
import { useTheme } from '@/constants/theme';

import DashboardScreen from './dashboard';
import LogbookScreen   from './logbook/index';
import ResourcesScreen from './resources/index';
import TripsScreen     from './trips/index';

const SCREENS = [DashboardScreen, LogbookScreen, ResourcesScreen, TripsScreen] as const;

function TabsContent() {
  const { pageOffset, panHandlers } = useSwipeTabsGesture();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Pager area — fills all space above TabBar */}
      <View style={{ flex: 1, overflow: 'hidden' }} {...panHandlers}>
        {SCREENS.map((Screen, index) => {
          const translateX = pageOffset.interpolate({
            inputRange:  [index - 1, index, index + 1],
            outputRange: [width, 0, -width],
            extrapolate: 'extend',
          });
          return (
            <Animated.View
              key={index}
              style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
            >
              <Screen />
            </Animated.View>
          );
        })}

        {/* Hidden Tabs — routing only, keeps Expo Router's URL in sync */}
        <View style={{ height: 0, overflow: 'hidden' }}>
          <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
            <Tabs.Screen name="dashboard"  options={{ title: 'Base' }} />
            <Tabs.Screen name="logbook"    options={{ title: 'Bitácora' }} />
            <Tabs.Screen name="resources"  options={{ title: 'Recursos' }} />
            <Tabs.Screen name="trips"      options={{ title: 'Viajes' }} />
          </Tabs>
        </View>
      </View>

      <TabBar />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <SwipeTabsProvider>
      <TabsContent />
    </SwipeTabsProvider>
  );
}
