import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

interface Props {
  navigation: NavigationProp<any>;
}

export default function LeaderboardScreen({ navigation }: Props) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, xp, level, challenges_completed')
        .order('xp', { ascending: false })
        .limit(100);

      if (data) {
        setPlayers(data);
      }
    } catch (error) {
      console.log('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayer = ({ item, index }: any) => (
    <View style={styles.playerCard}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <View style={styles.playerInfo}>
        <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
        <Text style={styles.stats}>
          Level {item.level} • {item.xp} XP • {item.challenges_completed} challenges
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      ) : players.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No players yet</Text>
          <Text style={styles.emptySubtext}>Be the first to set up your profile!</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item: any, index) => `player-${index}`}
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
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d2673d',
    width: 50,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  stats: {
    fontSize: 14,
    color: '#666',
  },
});
