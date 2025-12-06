import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Trick {
  id: string;
  name: string;
  difficulty: string;
  category: string;
  tutorial_url: string;
}

// Sample tricks library with tutorial videos
const TRICKS_LIBRARY: Trick[] = [
  {
    id: 'ollie',
    name: 'Ollie',
    difficulty: 'Beginner',
    category: 'Basic',
    tutorial_url: 'https://www.youtube.com/watch?v=QkeOAcj8Y5k'
  },
  {
    id: 'kickflip',
    name: 'Kickflip',
    difficulty: 'Intermediate',
    category: 'Flip',
    tutorial_url: 'https://www.youtube.com/watch?v=339k4XEvbxY'
  },
  {
    id: 'heelflip',
    name: 'Heelflip',
    difficulty: 'Intermediate',
    category: 'Flip',
    tutorial_url: 'https://www.youtube.com/watch?v=LZAr1vBu8p4'
  },
  {
    id: 'pop-shuvit',
    name: 'Pop Shuvit',
    difficulty: 'Beginner',
    category: 'Shuvit',
    tutorial_url: 'https://www.youtube.com/watch?v=9dN3aS_6rCk'
  },
  {
    id: '360-flip',
    name: '360 Flip',
    difficulty: 'Advanced',
    category: 'Flip',
    tutorial_url: 'https://www.youtube.com/watch?v=tNfr0_AExNg'
  },
  {
    id: 'boardslide',
    name: 'Boardslide',
    difficulty: 'Intermediate',
    category: 'Grind',
    tutorial_url: 'https://www.youtube.com/watch?v=2Kl0nGwsU5Y'
  },
  {
    id: '50-50',
    name: '50-50 Grind',
    difficulty: 'Beginner',
    category: 'Grind',
    tutorial_url: 'https://www.youtube.com/watch?v=cOJQg0zXRhw'
  },
  {
    id: 'nosegrind',
    name: 'Nosegrind',
    difficulty: 'Advanced',
    category: 'Grind',
    tutorial_url: 'https://www.youtube.com/watch?v=gKfFU7GZJIM'
  },
  {
    id: 'manual',
    name: 'Manual',
    difficulty: 'Beginner',
    category: 'Balance',
    tutorial_url: 'https://www.youtube.com/watch?v=OcspKTYYpLo'
  },
  {
    id: 'nollie',
    name: 'Nollie',
    difficulty: 'Intermediate',
    category: 'Basic',
    tutorial_url: 'https://www.youtube.com/watch?v=OUMi8FIgfwY'
  },
];

export default function TricksLibraryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trickProgress, setTrickProgress] = useState<{[key: string]: string}>({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTrickProgress();
  }, []);

  const loadTrickProgress = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('trick_progress')
        .eq('id', user?.id)
        .single();

      if (profile?.trick_progress) {
        setTrickProgress(profile.trick_progress);
      }
    } catch (error) {
      console.error('Error loading trick progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTrickStatus = async (trickId: string, status: string) => {
    try {
      const newProgress = { ...trickProgress };

      if (status === 'not-started') {
        delete newProgress[trickId];
      } else {
        newProgress[trickId] = status;
      }

      await supabase
        .from('profiles')
        .update({
          trick_progress: newProgress,
        })
        .eq('id', user?.id);

      setTrickProgress(newProgress);

      // Award XP
      if (status === 'landed') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user?.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ xp: profile.xp + 50 })
            .eq('id', user?.id);

          Alert.alert('Success', 'Trick landed! +50 XP');
        }
      } else if (status === 'mastered') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user?.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ xp: profile.xp + 100 })
            .eq('id', user?.id);

          Alert.alert('Success', 'Trick mastered! +100 XP');
        }
      }
    } catch (error) {
      console.error('Error updating trick status:', error);
      Alert.alert('Error', 'Failed to update trick status');
    }
  };

  const filteredTricks = filter === 'all'
    ? TRICKS_LIBRARY
    : TRICKS_LIBRARY.filter(t => t.difficulty === filter);

  const statusColors = {
    'learning': '#FFA500',
    'landed': '#4CAF50',
    'mastered': '#9C27B0',
    'not-started': '#757575',
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tricks Library</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  // Calculate stats
  const learningCount = Object.values(trickProgress).filter(s => s === 'learning').length;
  const landedCount = Object.values(trickProgress).filter(s => s === 'landed').length;
  const masteredCount = Object.values(trickProgress).filter(s => s === 'mastered').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tricks Library</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>🎯 Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{learningCount}</Text>
              <Text style={styles.statLabel}>Learning</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{landedCount}</Text>
              <Text style={styles.statLabel}>Landed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Level:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {['all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.filterButton, filter === level && styles.filterButtonActive]}
                  onPress={() => setFilter(level)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === level && styles.filterButtonTextActive,
                    ]}
                  >
                    {level === 'all' ? 'All' : level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tricks List */}
        <View style={styles.tricksSection}>
          {filteredTricks.map((trick) => {
            const status = trickProgress[trick.id] || 'not-started';
            return (
              <View key={trick.id} style={styles.trickCard}>
                <View style={styles.trickInfo}>
                  <Text style={styles.trickName}>{trick.name}</Text>
                  <Text style={styles.trickMeta}>
                    {trick.category} • {trick.difficulty}
                  </Text>
                  <TouchableOpacity
                    style={styles.tutorialButton}
                    onPress={() => Linking.openURL(trick.tutorial_url)}
                  >
                    <Text style={styles.tutorialButtonText}>📹 Watch Tutorial</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statusButtons}>
                  {['not-started', 'learning', 'landed', 'mastered'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusButton,
                        status === s && { backgroundColor: statusColors[s as keyof typeof statusColors] },
                      ]}
                      onPress={() => updateTrickStatus(trick.id, s)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          status === s && styles.statusButtonTextActive,
                        ]}
                      >
                        {s === 'not-started' ? '⚪' : s === 'learning' ? '📚' : s === 'landed' ? '✅' : '⭐'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
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
    width: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#667eea',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  filterSection: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#d2673d',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  tricksSection: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  trickCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trickInfo: {
    flex: 1,
  },
  trickName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  trickMeta: {
    fontSize: 12,
    color: '#666',
  },
  tutorialButton: {
    marginTop: 8,
    backgroundColor: '#d2673d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tutorialButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 16,
  },
  statusButtonTextActive: {
    fontSize: 18,
  },
});
