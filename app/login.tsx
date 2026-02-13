import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { setMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

WebBrowser.maybeCompleteAuthSession();

const AIRBNB_RED = '#FF5A5F';

const COUNTRIES = [
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'India', code: '+91' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'Japan', code: '+81' },
  { name: 'Brazil', code: '+55' },
  { name: 'Mexico', code: '+52' },
] as const;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const modalRowSelectedBg = useThemeColor(
    { light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.08)' },
    'background',
  );
  const isPhoneValid = isValidPhone(phone);

  const handleCountrySelect = useCallback((c: (typeof COUNTRIES)[number]) => {
    setCountry(c);
    setCountryModalVisible(false);
  }, []);

  const buildFullPhone = useCallback(() => {
    const digits = phone.replace(/\D/g, '');
    const code = country.code.replace(/\D/g, '');
    return `+${code}${digits}`;
  }, [country.code, phone]);

  const handleContinue = async () => {
    if (!isPhoneValid) return;
    setLoading(true);
    setError(null);

    // TODO: replace with real Supabase auth - call signInWithOtp, then navigate to /verify
    // const fullPhone = buildFullPhone();
    // const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    // if (otpError) { setError(otpError.message); setLoading(false); return; }
    // router.push({ pathname: '/verify', params: { phone: fullPhone } });

    setMockAuthenticated();
    setLoading(false);
    router.replace('/(tabs)/profile');
  };

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = 'daypulse://google-auth/';
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (!data?.url) {
        setError('Could not start Google sign in');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
        showInRecents: true,
      });
      if (result?.type === 'success' && result.url) {
        const hash = result.url.split('#')[1];
        if (hash) {
          const params = Object.fromEntries(new URLSearchParams(hash));
          const { access_token, refresh_token } = params;
          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) {
              setError(sessionError.message);
              return;
            }
            router.replace('/finish-signup');
          } else {
            setError('Sign in was cancelled');
          }
        } else {
          setError('Sign in was cancelled');
        }
      } else {
        setError('Sign in was cancelled');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.closeButton}
            hitSlop={12}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            Welcome to DayPulse
          </ThemedText>

          {/* Input card */}
          <View style={[styles.card, { borderColor }]}>
            {/* Country/Region row */}
            <Pressable
              onPress={() => setCountryModalVisible(true)}
              style={[styles.row, styles.borderBottom, { borderBottomColor: borderColor }]}>
              <View style={styles.rowContent}>
                <ThemedText type="defaultSemiBold">Country/Region</ThemedText>
                <ThemedText style={[styles.rowValue, { color: secondaryTextColor }]}>
                  {country.name} {country.code}
                </ThemedText>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={secondaryTextColor} />
            </Pressable>

            {/* Phone number row */}
            <View style={styles.row}>
              <TextInput
                style={[styles.phoneInput, { color: textColor }]}
                placeholder="Phone number"
                placeholderTextColor={secondaryTextColor}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
          </View>

          <ThemedText style={[styles.helperText, { color: secondaryTextColor }]}>
            We’ll call or text you to confirm your number. Standard message and data rates apply.
          </ThemedText>

          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          {/* Continue button */}
          <Pressable
            style={[
              styles.continueButton,
              (!isPhoneValid || loading) && styles.continueButtonDisabled,
            ]}
            disabled={!isPhoneValid || loading}
            onPress={handleContinue}>
            {loading ? (
              <ActivityIndicator color="#999" />
            ) : (
              <ThemedText
                style={[
                  styles.continueButtonText,
                  { color: isPhoneValid ? '#fff' : '#999' },
                ]}>
                Continue
              </ThemedText>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            <ThemedText style={[styles.dividerText, { color: secondaryTextColor }]}>
              or
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
          </View>

          {/* Social login buttons */}
          <SocialButton
            icon="apple"
            label="Continue with Apple"
            borderColor={borderColor}
          />
          <SocialButton
            icon="facebook"
            label="Continue with Facebook"
            borderColor={borderColor}
          />
          <SocialButton
            icon="google"
            label="Continue with Google"
            borderColor={borderColor}
            onPress={handleGoogleSignIn}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country selector modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet">
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Select country</ThemedText>
            <Pressable
              onPress={() => setCountryModalVisible(false)}
              hitSlop={12}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalList}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.name}
                onPress={() => handleCountrySelect(c)}
                style={[
                  styles.modalRow,
                  c.name === country.name && { backgroundColor: modalRowSelectedBg },
                ]}>
                <ThemedText type="defaultSemiBold">{c.name}</ThemedText>
                <ThemedText style={{ color: secondaryTextColor }}>{c.code}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function SocialButton({
  icon,
  label,
  borderColor,
  onPress,
  disabled,
}: {
  icon: 'apple' | 'facebook' | 'google';
  label: string;
  borderColor: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const textColor = useThemeColor({}, 'text');

  return (
    <Pressable
      style={[styles.socialButton, { borderColor }]}
      onPress={onPress}
      disabled={disabled}>
      <MaterialCommunityIcons name={icon} size={22} color={textColor} />
      <ThemedText type="defaultSemiBold" style={styles.socialButtonText}>
        {label}
      </ThemedText>
    </Pressable>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    marginBottom: 32,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowValue: {
    fontSize: 16,
    marginTop: 4,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  phoneInput: {
    fontSize: 16,
    padding: 0,
    flex: 1,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 14,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: AIRBNB_RED,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E4E4E4',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalList: {
    flex: 1,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
