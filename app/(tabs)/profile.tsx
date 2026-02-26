import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { clearMockAuth, getMockAuthenticated } from '@/lib/mock-auth';
import { fetchReviewsByUser, fetchUserBookings } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const isMockAuth = getMockAuthenticated();

  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#fff';
  const cardShadow = colorScheme === 'dark' ? 'transparent' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    if (isMockAuth) {
      setUser({
        id: 'mock',
        email: 'user@example.com',
        user_metadata: { first_name: 'Guest', last_name: 'User' },
      } as User);
      return;
    }
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, [isMockAuth]);

  useEffect(() => {
    if (!user?.id || isMockAuth) return;
    Promise.all([fetchUserBookings(user.id), fetchReviewsByUser(user.id)]).then(
      ([bookings, reviews]) => {
        const today = new Date().toISOString().slice(0, 10);
        const visits = bookings.filter((b: { pass_date: string }) => b.pass_date < today).length;
        setVisitCount(visits);
        setReviewCount(reviews.length);
      }
    );
  }, [user?.id, isMockAuth]);

  const handleLogOut = async () => {
    clearMockAuth();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Member';
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>

        {/* Main user card */}
        <View style={[styles.userCard, { backgroundColor: cardBg, shadowColor: cardShadow }]}>
          <View style={styles.userCardLeft}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#E0E0E0' }]}>
                  <MaterialIcons name="person" size={48} color="#999" />
                </View>
              )}
            </View>
            <ThemedText type="defaultSemiBold" style={styles.displayName}>
              {displayName}
            </ThemedText>
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {visitCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Visits</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {reviewCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Reviews</ThemedText>
            </View>
          </View>
        </View>

        {/* Your passes - quick access */}
        <Pressable
          style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
          onPress={() => router.push('/your-passes')}>
          <MaterialIcons name="confirmation-number" size={24} color="#666" />
          <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
            Your passes
          </ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </Pressable>

        {/* Saved gyms - quick access */}
        <Pressable
          style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
          onPress={() => router.push('/saved-gyms')}>
          <MaterialCommunityIcons name="heart-outline" size={24} color="#666" />
          <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
            Saved gyms
          </ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </Pressable>

        {/* Bottom section: Account settings, Get help, etc. */}
        <View style={styles.bottomSection}>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => router.push('/account-settings')}>
            <MaterialIcons name="settings" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Account settings
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => {}}>
            <MaterialIcons name="help-outline" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Get help
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => router.push('/edit-profile')}>
            <MaterialIcons name="person-outline" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              View profile
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => {}}>
            <MaterialIcons name="lock-outline" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Privacy
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => {}}>
            <MaterialIcons name="card-giftcard" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Gift cards
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={() => {}}>
            <MaterialIcons name="description" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Legal
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
          <Pressable
            style={[styles.menuRow, styles.menuRowLogOut, { backgroundColor: cardBg, shadowColor: cardShadow }]}
            onPress={handleLogOut}>
            <MaterialIcons name="logout" size={24} color="#666" />
            <ThemedText type="defaultSemiBold" style={styles.menuRowLabel}>
              Log out
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  userCardLeft: {
    flex: 1,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
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
  menuRowLogOut: {
    marginTop: 8,
    marginBottom: 32,
  },
  bottomSection: {
    marginTop: 8,
  },
});
