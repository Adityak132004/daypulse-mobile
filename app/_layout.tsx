import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ListingsProvider } from '@/contexts/ListingsContext';
import { SavedGymsProvider } from '@/contexts/SavedGymsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ListingsProvider>
        <SavedGymsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="listing/[id]"
            options={{
              headerShown: false,
              headerBackTitle: 'Back',
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="finish-signup" options={{ headerShown: false }} />
          <Stack.Screen name="confirm-pay" options={{ headerShown: false }} />
          <Stack.Screen name="your-passes" options={{ headerShown: false }} />
          <Stack.Screen name="saved-gyms" options={{ headerShown: false }} />
          <Stack.Screen name="account-settings" options={{ headerShown: false }} />
          <Stack.Screen name="payments" options={{ headerShown: false }} />
          <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
          <Stack.Screen name="verify" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        </SavedGymsProvider>
      </ListingsProvider>
    </ThemeProvider>
  );
}
