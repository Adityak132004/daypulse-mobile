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
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
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

  const handleLogOut = async () => {
    clearMockAuth();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Member';
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const address = user?.user_metadata?.address ?? '';
  const city = user?.user_metadata?.city ?? '';
  const locationText = city || address || 'Add your city';
  const memberSince = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : new Date().getFullYear();
  const yearsMember = new Date().getFullYear() - memberSince;

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
            <ThemedText style={styles.location}>{locationText}</ThemedText>
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                0
              </ThemedText>
              <ThemedText style={styles.statLabel}>Visits</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                0
              </ThemedText>
              <ThemedText style={styles.statLabel}>Reviews</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {yearsMember}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Years</ThemedText>
            </View>
          </View>
        </View>

        {/* Edit profile */}
        <Pressable
          style={[styles.yourPassesRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
          onPress={() => router.push('/edit-profile')}>
          <MaterialIcons name="edit" size={24} color="#666" />
          <ThemedText type="defaultSemiBold" style={styles.yourPassesLabel}>
            Edit profile
          </ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </Pressable>

        {/* Your passes */}
        <Pressable
          style={[styles.yourPassesRow, { backgroundColor: cardBg, shadowColor: cardShadow }]}
          onPress={() => router.push('/your-passes')}>
          <MaterialIcons name="confirmation-number" size={24} color="#666" />
          <ThemedText type="defaultSemiBold" style={styles.yourPassesLabel}>
            Your passes
          </ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </Pressable>

        {/* Feature cards */}
        <View style={styles.cardsRow}>
          <Pressable style={[styles.featureCard, { backgroundColor: cardBg, shadowColor: cardShadow }]}>
            <View style={styles.featureBadge}>
              <ThemedText style={styles.badgeText}>NEW</ThemedText>
            </View>
            <View style={styles.featureIconWrapper}>
              <MaterialCommunityIcons name="dumbbell" size={40} color="#666" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.featureLabel}>
              Visit history
            </ThemedText>
          </Pressable>

          <Pressable style={[styles.featureCard, { backgroundColor: cardBg, shadowColor: cardShadow }]}>
            <View style={styles.featureBadge}>
              <ThemedText style={styles.badgeText}>NEW</ThemedText>
            </View>
            <View style={styles.featureIconWrapper}>
              <MaterialCommunityIcons name="heart-outline" size={40} color="#666" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.featureLabel}>
              Saved gyms
            </ThemedText>
          </Pressable>
        </View>

        {/* Log out */}
        <Pressable
          onPress={handleLogOut}
          style={[styles.logOutButton, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E0E0E0' }]}>
          <ThemedText type="defaultSemiBold">Log out</ThemedText>
        </Pressable>
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
  location: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
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
  yourPassesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  yourPassesLabel: {
    flex: 1,
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  featureIconWrapper: {
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 14,
  },
  logOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
