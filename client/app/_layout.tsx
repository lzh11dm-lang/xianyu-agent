import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { Provider } from '@/components/Provider';

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
      </Stack>
    </Provider>
  );
}
