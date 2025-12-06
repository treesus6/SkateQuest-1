import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  navigation: NavigationProp<any>;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        await checkAndAwardBadges(data);
        await checkAndUpdateStreak(data);
      }
    } catch (error) {
      // Profile doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardBadges = async (profileData: any) => {
    const existingBadges = profileData.badges || [];
    const newBadges = [];

    // Define all possible badges
    const badges = [
      { id: 'first_spot', name: 'First Spot', desc: 'Added your first spot', condition: () => profileData.spots_added >= 1 },
      { id: '100_xp', name: '100 XP', desc: 'Earned 100 XP', condition: () => profileData.xp >= 100 },
      { id: '500_xp', name: '500 XP', desc: 'Earned 500 XP', condition: () => profileData.xp >= 500 },
      { id: '1000_xp', name: '1000 XP', desc: 'Earned 1000 XP', condition: () => profileData.xp >= 1000 },
      { id: 'first_challenge', name: 'Challenge Accepted', desc: 'Completed first challenge', condition: () => profileData.challenges_completed >= 1 },
      { id: '10_challenges', name: 'Challenge Master', desc: 'Completed 10 challenges', condition: () => profileData.challenges_completed >= 10 },
      { id: '5_day_streak', name: '5-Day Streak', desc: '5 consecutive days', condition: () => profileData.streak_days >= 5 },
      { id: '10_day_streak', name: '10-Day Streak', desc: '10 consecutive days', condition: () => profileData.streak_days >= 10 },
      { id: '30_day_streak', name: 'Dedicated', desc: '30 consecutive days', condition: () => profileData.streak_days >= 30 },
    ];

    // Check each badge
    for (const badge of badges) {
      if (!existingBadges.find((b: any) => b.id === badge.id) && badge.condition()) {
        newBadges.push({ id: badge.id, name: badge.name, desc: badge.desc, earned_at: new Date().toISOString() });
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const updatedBadges = [...existingBadges, ...newBadges];
      await supabase
        .from('profiles')
        .update({ badges: updatedBadges })
        .eq('id', user?.id);

      setProfile({ ...profileData, badges: updatedBadges });

      Alert.alert(
        'New Badge!',
        `You earned: ${newBadges.map(b => b.name).join(', ')}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
  };

  const checkAndUpdateStreak = async (profileData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = profileData.last_session_date;

    if (!lastSessionDate || lastSessionDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = 1;

      if (lastSessionDate === yesterday) {
        // Continue streak
        newStreak = (profileData.streak_days || 0) + 1;
      }

      await supabase
        .from('profiles')
        .update({
          last_session_date: today,
          streak_days: newStreak,
        })
        .eq('id', user?.id);

      setProfile({ ...profileData, streak_days: newStreak, last_session_date: today });
    }
  };

  const saveProfile = async () => {
    if (!user || !username) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          bio,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      Alert.alert('Success', 'Profile updated!');
      loadProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.levelText}>Level {profile?.level || 1}</Text>
          <Text style={styles.xpText}>{profile?.xp || 0} XP</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile?.spots_added || 0}</Text>
            <Text style={styles.statLabel}>Spots Added</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile?.challenges_completed || 0}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile?.streak_days || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>🏅 Badges ({profile?.badges?.length || 0})</Text>
          <View style={styles.badgesGrid}>
            {profile?.badges && profile.badges.length > 0 ? (
              profile.badges.map((badge: any) => (
                <View key={badge.id} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>
                    {badge.id.includes('xp') ? '⭐' :
                     badge.id.includes('challenge') ? '🎯' :
                     badge.id.includes('streak') ? '🔥' :
                     badge.id.includes('spot') ? '📍' : '🏅'}
                  </Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noBadges}>No badges earned yet. Keep skating to earn some!</Text>
            )}
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Email</Text>
          <Text style={styles.emailText}>{user?.email}</Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#d2673d',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  xpText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  form: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  badgesSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  noBadges: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});
