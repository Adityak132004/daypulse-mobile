import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const OPTIONS = [
  { id: 'methods', label: 'Payment methods', icon: 'credit-card' as const, href: '/payment-methods' as const },
  { id: 'history', label: 'Your Payments', icon: 'receipt-long' as const, href: null },
  { id: 'credits', label: 'Credits & coupons', icon: 'card-giftcard' as const, href: null },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#fff';
  const cardShadow = colorScheme === 'dark' ? 'transparent' : 'rgba(0,0,0,0.08)';
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'background',
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={28} color="#666" />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Payments
        </ThemedText>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => opt.href != null && router.push(opt.href)}>
            <MaterialIcons name={opt.icon} size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              {opt.label}
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
        ))}
      </ScrollView>
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 16,
  },
});
