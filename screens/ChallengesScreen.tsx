import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  navigation: NavigationProp<any>;
}

export default function ChallengesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) {
        setChallenges(data);
      }
    } catch (error) {
      console.log('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    if (!user) return;

    Alert.alert(
      'Complete Challenge',
      'Upload proof to complete this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload Proof',
          onPress: () => {
            // TODO: Implement photo/video upload
            Alert.alert('Coming Soon', 'Photo/video upload feature coming soon!');
          },
        },
      ]
    );
  };

  const renderChallenge = ({ item }: any) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.trickText}>🎯 {item.trick}</Text>
        <Text style={styles.xpBadge}>+{item.xp_reward} XP</Text>
      </View>
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => completeChallenge(item.id)}
      >
        <Text style={styles.completeButtonText}>Complete Challenge</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Challenges</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Create challenge feature coming soon!')}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Loading challenges...</Text>
        </View>
      ) : challenges.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No active challenges</Text>
          <Text style={styles.emptySubtext}>Be the first to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  addButton: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  listContent: {
    padding: 15,
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trickText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  xpBadge: {
    backgroundColor: '#34C759',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
