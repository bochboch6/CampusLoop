import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/src/context/AppContext';

// Anchor the root to the (tabs) group so "/" resolves to (tabs)/index
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="map" />
        <Stack.Screen name="events" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="destination" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" />
      </Stack>
    </AppProvider>
  );
}
