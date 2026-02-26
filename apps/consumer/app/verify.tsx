import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

const AIRBNB_RED = '#FF5A5F';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const isCodeValid = code.replace(/\D/g, '').length === 6;

  const handleVerify = async () => {
    if (!phone || !isCodeValid) return;
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code.replace(/\D/g, ''),
      type: 'sms',
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.replace('/(tabs)');
  };

  if (!phone) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Missing phone number. Please go back and try again.</ThemedText>
        <Pressable onPress={() => router.replace('/login')} style={styles.backLink}>
          <ThemedText type="link">Back to Login</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Check your phone
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
            We sent a 6-digit code to {phone}
          </ThemedText>

          <TextInput
            style={[
              styles.codeInput,
              { color: textColor, borderColor },
            ]}
            placeholder="000000"
            placeholderTextColor={secondaryTextColor}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          <Pressable
            style={[
              styles.verifyButton,
              (!isCodeValid || loading) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isCodeValid || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText
                style={[
                  styles.verifyButtonText,
                  { color: isCodeValid ? '#fff' : '#999' },
                ]}>
                Verify
              </ThemedText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 14,
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: AIRBNB_RED,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#E4E4E4',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 16,
  },
});
