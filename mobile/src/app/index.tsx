//src/app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, dbUser, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const authenticated = !!user && !!dbUser?.username;

  return authenticated
    ? <Redirect href="/(app)/(tabs)/dashboard" />
    : <Redirect href="/(auth)/login" />;
}