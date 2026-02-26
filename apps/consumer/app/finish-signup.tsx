import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

const AIRBNB_RED = '#FF5A5F';

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function FinishSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const firstNameRef = useRef(firstName);
  const lastNameRef = useRef(lastName);
  const dateOfBirthRef = useRef(dateOfBirth);
  const addressRef = useRef(address);
  const cityRef = useRef(city);
  const phoneRef = useRef(phone);

  useEffect(() => {
    firstNameRef.current = firstName;
    lastNameRef.current = lastName;
    dateOfBirthRef.current = dateOfBirth;
    addressRef.current = address;
    cityRef.current = city;
    phoneRef.current = phone;
  }, [firstName, lastName, dateOfBirth, address, city, phone]);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phone.trim().length > 0;

  // Load profile so returning users see existing data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      if (user.email) setEmail(user.email);
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth, address, city, phone')
        .eq('id', user.id)
        .single();
      if (cancelled || !profile) return;
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.date_of_birth) {
        const d = new Date(profile.date_of_birth);
        if (!isNaN(d.getTime())) setDateOfBirth(d);
      }
      if (profile.address) setAddress(profile.address);
      if (profile.city) setCity(profile.city);
      if (profile.phone) setPhone(profile.phone);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDateOfBirth(selectedDate);
  };

  const handleAgreeAndContinue = async () => {
    const first = firstNameRef.current.trim();
    const last = lastNameRef.current.trim();
    if (!first || !last) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not signed in');
        setLoading(false);
        return;
      }
      const dob = dateOfBirthRef.current;
      const addr = addressRef.current.trim();
      const c = cityRef.current.trim();
      const dobStr = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;

      const phoneVal = phoneRef.current.trim();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: first,
          last_name: last,
          date_of_birth: dobStr,
          ...(addr && { address: addr }),
          ...(c && { city: c }),
          ...(phoneVal && { phone: phoneVal }),
        },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      await supabase
        .from('profiles')
        .update({
          first_name: first,
          last_name: last,
          date_of_birth: dobStr,
          ...(addr && { address: addr }),
          ...(c && { city: c }),
          ...(phoneVal && { phone: phoneVal }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      await supabase.auth.refreshSession();
      router.replace('/');
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
          <Pressable
            onPress={() => router.replace('/login')}
            style={styles.backButton}
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            Finish signing up
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          {/* Legal name section - required */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Legal name *
          </ThemedText>
          <View style={[styles.card, { borderColor }]}>
            <View style={[styles.row, styles.borderBottom, { borderBottomColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="First name"
                placeholderTextColor={secondaryTextColor}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Last name"
                placeholderTextColor={secondaryTextColor}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Date of birth section - required */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Date of birth *
          </ThemedText>
          <Pressable
            style={[styles.card, styles.dateRow, { borderColor }]}
            onPress={() => setShowDatePicker(true)}>
            <ThemedText style={{ color: textColor }}>{formatDate(dateOfBirth)}</ThemedText>
            <MaterialIcons name="keyboard-arrow-down" size={24} color={secondaryTextColor} />
          </Pressable>
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}>
                  <ThemedText type="defaultSemiBold" style={styles.doneButtonText}>
                    Done
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* Email section - required (from account) */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Email *
          </ThemedText>
          <View style={[styles.card, styles.dateRow, { borderColor }]}>
            <ThemedText style={[styles.emailText, { color: secondaryTextColor }]}>
              {email || '—'}
            </ThemedText>
          </View>

          {/* Address section - optional */}
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

          {/* Phone section - required */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Phone number *
          </ThemedText>
          <View style={[styles.card, { borderColor }]}>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="e.g. (555) 123-4567"
                placeholderTextColor={secondaryTextColor}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

          {/* Agree and continue button - inside ScrollView for reliable touch delivery */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={[
                styles.button,
                (!isFormValid || loading) && styles.buttonDisabled,
              ]}
              disabled={!isFormValid || loading}
              onPress={handleAgreeAndContinue}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: isFormValid ? '#fff' : '#999' },
                  ]}>
                  Agree and continue
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
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
    paddingBottom: 32,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emailText: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 14,
    marginBottom: 16,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  doneButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: AIRBNB_RED,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: AIRBNB_RED,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E4E4E4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
