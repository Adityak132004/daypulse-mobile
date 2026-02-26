import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type PaymentMethodOption = 'paypal' | 'card' | null;

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PaymentMethodOption>(null);

  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#fff';
  const cardShadow = colorScheme === 'dark' ? 'transparent' : 'rgba(0,0,0,0.08)';
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'background',
  );
  const modalBg = useThemeColor(
    { light: '#fff', dark: '#1C1C1E' },
    'background',
  );

  const openModal = () => {
    setSelectedOption(null);
    setAddModalVisible(true);
  };

  const closeModal = () => {
    setAddModalVisible(false);
    setSelectedOption(null);
  };

  const handleNext = () => {
    if (selectedOption) {
      closeModal();
      // TODO: Navigate to PayPal or card entry flow
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={28} color="#666" />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Payment methods
        </ThemedText>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        <Pressable
          style={[styles.addButton, { backgroundColor: cardBg, shadowColor: cardShadow }]}
          onPress={openModal}>
          <MaterialIcons name="add-circle-outline" size={24} color="#666" />
          <ThemedText type="defaultSemiBold" style={styles.addButtonLabel}>
            Add payment method
          </ThemedText>
        </Pressable>
      </ScrollView>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={[styles.modalCard, { backgroundColor: modalBg }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Payment method
            </ThemedText>

            <Pressable
              style={[styles.optionRow, selectedOption === 'paypal' && styles.optionRowSelected]}
              onPress={() => setSelectedOption('paypal')}>
              <View style={styles.optionLeft}>
                <Image
                  source={{ uri: 'https://www.paypalobjects.com/webstatic/icon/pp258.png' }}
                  style={styles.optionLogo}
                  contentFit="contain"
                />
                <ThemedText type="defaultSemiBold" style={styles.optionLabel}>
                  PayPal
                </ThemedText>
              </View>
              <View style={[styles.radioOuter, selectedOption === 'paypal' && styles.radioOuterSelected]}>
                {selectedOption === 'paypal' && <View style={styles.radioInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.optionRow, selectedOption === 'card' && styles.optionRowSelected]}
              onPress={() => setSelectedOption('card')}>
              <View style={styles.optionLeft}>
                <View style={styles.cardLogos}>
                  <FontAwesome5 name="cc-visa" size={28} color="#1A1F71" style={styles.cardLogoIcon} />
                  <FontAwesome5 name="cc-mastercard" size={28} color="#EB001B" style={styles.cardLogoIcon} />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.optionLabel}>
                  Credit or debit card
                </ThemedText>
              </View>
              <View style={[styles.radioOuter, selectedOption === 'card' && styles.radioOuterSelected]}>
                {selectedOption === 'card' && <View style={styles.radioInner} />}
              </View>
            </Pressable>

            <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
              <Pressable style={styles.cancelButton} onPress={closeModal}>
                <ThemedText type="defaultSemiBold" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!selectedOption}>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.nextButtonText, !selectedOption && styles.nextButtonTextDisabled]}>
                  Next
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonLabel: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionRowSelected: {
    opacity: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionLogo: {
    width: 48,
    height: 26,
  },
  cardLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLogoIcon: {
    marginRight: 0,
  },
  optionLabel: {
    fontSize: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0a7ea4',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0a7ea4',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingRight: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    paddingVertical: 10,
    paddingLeft: 16,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
});
