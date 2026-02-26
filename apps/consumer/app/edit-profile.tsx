import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.address) setAddress(user.user_metadata.address);
      if (user?.user_metadata?.city) setCity(user.user_metadata.city);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...(address.trim() && { address: address.trim() }),
          ...(city.trim() && { city: city.trim() }),
        },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      if (user) {
        await supabase
          .from('profiles')
          .update({
            address: address.trim() || null,
            city: city.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
      await supabase.auth.refreshSession();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            Edit profile
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {error ? (
            <ThemedText style={[styles.errorText, { color: '#FF5A5F' }]}>{error}</ThemedText>
          ) : null}

          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Address
          </ThemedText>
          <View style={[styles.card, { borderColor }]}>
            <View style={[styles.row, styles.borderBottom, { borderBottomColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Street address"
                placeholderTextColor={secondaryTextColor}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="City"
                placeholderTextColor={secondaryTextColor}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Save
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#FF5A5F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
