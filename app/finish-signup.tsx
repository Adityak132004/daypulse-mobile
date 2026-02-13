import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Keyboard,
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
import { parseLicense } from '@/lib/parse-license';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [licenseImageUri, setLicenseImageUri] = useState<string | null>(null);
  const [parsingLicense, setParsingLicense] = useState(false);
  const firstNameRef = useRef(firstName);
  const lastNameRef = useRef(lastName);
  const dateOfBirthRef = useRef(dateOfBirth);
  const addressRef = useRef(address);
  const cityRef = useRef(city);

  useEffect(() => {
    firstNameRef.current = firstName;
    lastNameRef.current = lastName;
    dateOfBirthRef.current = dateOfBirth;
    addressRef.current = address;
    cityRef.current = city;
  }, [firstName, lastName, dateOfBirth, address, city]);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDateOfBirth(selectedDate);
  };

  const showLicenseImageOptions = () => {
    Alert.alert(
      'Add driver\'s license',
      'Choose how to add your photo',
      [
        { text: 'Take photo', onPress: handleTakePhoto },
        { text: 'Choose from library', onPress: handlePickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const processLicenseImage = async (uri: string, base64: string | null | undefined) => {
    setLicenseImageUri(uri);
    if (!base64) return;

    setParsingLicense(true);
    setError(null);
    try {
      const parsed = await parseLicense(base64, 'image/jpeg');
      InteractionManager.runAfterInteractions(() => {
        if (parsed.firstName) {
          setFirstName(parsed.firstName);
          firstNameRef.current = parsed.firstName;
        }
        if (parsed.lastName) {
          setLastName(parsed.lastName);
          lastNameRef.current = parsed.lastName;
        }
        if (parsed.dateOfBirth) {
          const d = new Date(parsed.dateOfBirth);
          if (!isNaN(d.getTime())) {
            setDateOfBirth(d);
            dateOfBirthRef.current = d;
          }
        }
        if (parsed.address) {
          setAddress(parsed.address);
          addressRef.current = parsed.address;
        }
        if (parsed.city) {
          setCity(parsed.city);
          cityRef.current = parsed.city;
        }
        setParsingLicense(false);
        Keyboard.dismiss();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read license details. Please enter manually.');
      setParsingLicense(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take a photo of your license.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await processLicenseImage(asset.uri, asset.base64 ?? undefined);
    }
  };

  const handlePickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await processLicenseImage(asset.uri, asset.base64 ?? undefined);
    }
  };

  const handleAgreeAndContinue = async () => {
    const first = firstNameRef.current.trim();
    const last = lastNameRef.current.trim();
    if (!first || !last) return;
    setLoading(true);
    setError(null);
    try {
      const dob = dateOfBirthRef.current;
      const addr = addressRef.current.trim();
      const c = cityRef.current.trim();
      const dobStr = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: first,
          last_name: last,
          date_of_birth: dobStr,
          ...(addr && { address: addr }),
          ...(c && { city: c }),
        },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            first_name: first,
            last_name: last,
            date_of_birth: dobStr,
            ...(addr && { address: addr }),
            ...(c && { city: c }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
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
          {/* Legal name section */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Legal name
          </ThemedText>
          <View style={[styles.card, { borderColor }]}>
            <View style={[styles.row, styles.borderBottom, { borderBottomColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="First name on ID"
                placeholderTextColor={secondaryTextColor}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Last name on ID"
                placeholderTextColor={secondaryTextColor}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Date of birth section */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Date of birth
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

          {/* Address section */}
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

          {/* Email section */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Email
          </ThemedText>
          <View style={[styles.card, styles.dateRow, { borderColor }]}>
            <ThemedText style={[styles.emailText, { color: secondaryTextColor }]}>
              {email || '—'}
            </ThemedText>
          </View>

          {/* Driver's license section */}
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Driver's license
          </ThemedText>
          <Pressable
            style={[styles.licenseCard, { borderColor }]}
            onPress={showLicenseImageOptions}>
            {licenseImageUri ? (
              <View style={styles.licensePreview}>
                {parsingLicense && (
                  <View style={styles.parsingOverlay}>
                    <ActivityIndicator color="#fff" />
                    <ThemedText style={styles.parsingText}>Scanning license...</ThemedText>
                  </View>
                )}
                <Image
                  source={{ uri: licenseImageUri }}
                  style={styles.licenseImage}
                />
                <Pressable
                  style={styles.changePhotoButton}
                  disabled={parsingLicense}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!parsingLicense) showLicenseImageOptions();
                  }}>
                  <ThemedText type="defaultSemiBold" style={styles.changePhotoText}>
                    Change photo
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.licensePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color={secondaryTextColor} />
                <ThemedText style={[styles.licensePlaceholderText, { color: secondaryTextColor }]}>
                  Add photo of your license
                </ThemedText>
                <ThemedText style={[styles.licensePlaceholderHint, { color: secondaryTextColor }]}>
                  Take a picture or choose from library
                </ThemedText>
              </View>
            )}
          </Pressable>

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
  licenseCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 160,
  },
  licensePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  licensePlaceholderText: {
    fontSize: 16,
    marginTop: 12,
  },
  licensePlaceholderHint: {
    fontSize: 14,
    marginTop: 4,
  },
  licensePreview: {
    padding: 16,
  },
  licenseImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  changePhotoButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  changePhotoText: {
    color: AIRBNB_RED,
    fontSize: 16,
  },
  parsingOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  parsingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
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
