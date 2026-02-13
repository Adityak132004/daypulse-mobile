import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { useListings } from '@/contexts/ListingsContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const AIRBNB_RED = '#FF5A5F';

export default function HostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addListing } = useListings();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const priceNum = parseFloat(price) || 0;
  const isValid = title.trim().length > 0 && city.trim().length > 0 && priceNum > 0 && description.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid) return;
    const amenityList = amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    await addListing({
      title: title.trim(),
      location: city.trim(),
      price: priceNum,
      description: description.trim(),
      amenities: amenityList,
    });
    setTitle('');
    setCity('');
    setPrice('');
    setDescription('');
    setAmenities('');
    router.replace('/(tabs)/explore');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>
            Add a gym
          </ThemedText>

          <View style={styles.form}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Gym name
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="e.g. Iron Peak Fitness"
              placeholderTextColor={secondaryTextColor}
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              City
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor={secondaryTextColor}
              value={city}
              onChangeText={setCity}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Daily entry price ($)
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="e.g. 15"
              placeholderTextColor={secondaryTextColor}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { color: textColor, borderColor }]}
              placeholder="Describe the gym..."
              placeholderTextColor={secondaryTextColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Amenities (comma-separated)
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="e.g. 24/7 access, Free weights, Locker rooms"
              placeholderTextColor={secondaryTextColor}
              value={amenities}
              onChangeText={setAmenities}
            />
          </View>

          <Pressable
            style={[styles.createButton, !isValid && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!isValid}>
            <ThemedText
              style={[
                styles.createButtonText,
                { color: isValid ? '#fff' : '#999' },
              ]}>
              Add gym
            </ThemedText>
          </Pressable>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: AIRBNB_RED,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#E4E4E4',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
