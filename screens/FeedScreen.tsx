import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Proof {
  id: string;
  challenge_id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  username: string;
  trick: string;
  xp_reward: number;
  likes: string[];
}

export default function FeedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      // Get all challenge proofs with user and challenge details
      const { data, error } = await supabase
        .from('challenge_proofs')
        .select(`
          *,
          profiles!challenge_proofs_user_id_fkey (username),
          challenges!challenge_proofs_challenge_id_fkey (trick, xp_reward)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const formatted = data.map((proof: any) => ({
          ...proof,
          username: proof.profiles?.username || 'Anonymous',
          trick: proof.challenges?.trick || 'Unknown',
          xp_reward: proof.challenges?.xp_reward || 0,
          likes: proof.likes || [],
        }));
        setProofs(formatted);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const likeProof = async (proof: Proof) => {
    if (!user) return;

    const hasLiked = proof.likes.includes(user.id);
    const newLikes = hasLiked
      ? proof.likes.filter(id => id !== user.id)
      : [...proof.likes, user.id];

    // Optimistic update
    setProofs(prev =>
      prev.map(p => (p.id === proof.id ? { ...p, likes: newLikes } : p))
    );

    try {
      await supabase
        .from('challenge_proofs')
        .update({ likes: newLikes })
        .eq('id', proof.id);
    } catch (error) {
      console.error('Error liking proof:', error);
      // Revert on error
      setProofs(prev =>
        prev.map(p => (p.id === proof.id ? { ...p, likes: proof.likes } : p))
      );
    }
  };

  const renderProof = ({ item }: { item: Proof }) => {
    const hasLiked = item.likes.includes(user?.id || '');
    const timeAgo = getTimeAgo(item.created_at);

    return (
      <View style={styles.proofCard}>
        <View style={styles.proofHeader}>
          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </View>

        <Text style={styles.trickText}>
          landed <Text style={styles.trickBold}>{item.trick}</Text>
        </Text>

        {item.media_url && (
          <Image
            source={{ uri: item.media_url }}
            style={styles.proofImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.proofFooter}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => likeProof(item)}
          >
            <Text style={styles.likeIcon}>{hasLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.likeCount}>{item.likes.length}</Text>
          </TouchableOpacity>

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{item.xp_reward} XP</Text>
          </View>
        </View>
      </View>
    );
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Challenge Feed</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Loading feed...</Text>
        </View>
      ) : proofs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No proofs yet!</Text>
          <Text style={styles.emptySubtext}>
            Complete a challenge to appear on the feed
          </Text>
        </View>
      ) : (
        <FlatList
          data={proofs}
          renderItem={renderProof}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    width: 70,
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
    padding: 20,
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
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  proofCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  trickText: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  trickBold: {
    fontWeight: 'bold',
    color: '#d2673d',
  },
  proofImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  proofFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeIcon: {
    fontSize: 24,
  },
  likeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  xpBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
