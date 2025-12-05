import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Crew {
  id: string;
  name: string;
  tag: string;
  bio: string;
  founder_id: string;
  founder_name: string;
  members: string[];
  member_names: string[];
  total_xp: number;
  challenges_completed: number;
  spots_added: number;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  xp: number;
  spots_added: number;
  crew_id: string | null;
  crew_tag: string | null;
}

export default function CrewsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userCrew, setUserCrew] = useState<Crew | null>(null);
  const [allCrews, setAllCrews] = useState<Crew[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [crewName, setCrewName] = useState('');
  const [crewTag, setCrewTag] = useState('');
  const [crewBio, setCrewBio] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);

        // Load user's crew if they have one
        if (profile.crew_id) {
          const { data: crew } = await supabase
            .from('crews')
            .select('*')
            .eq('id', profile.crew_id)
            .single();

          if (crew) setUserCrew(crew);
        }
      }

      // Load all crews
      const { data: crews } = await supabase
        .from('crews')
        .select('*')
        .order('total_xp', { ascending: false });

      if (crews) setAllCrews(crews);
    } catch (error) {
      console.error('Error loading crews:', error);
      Alert.alert('Error', 'Failed to load crews data');
    } finally {
      setLoading(false);
    }
  };

  const createCrew = async () => {
    if (!crewName.trim() || !crewTag.trim()) {
      Alert.alert('Error', 'Please enter crew name and tag');
      return;
    }

    if (crewTag.length < 2 || crewTag.length > 5) {
      Alert.alert('Error', 'Crew tag must be 2-5 characters');
      return;
    }

    try {
      // Check if tag already exists
      const { data: existing } = await supabase
        .from('crews')
        .select('id')
        .eq('tag', crewTag.toUpperCase())
        .single();

      if (existing) {
        Alert.alert('Error', 'This crew tag is already taken');
        return;
      }

      // Create crew
      const { data: newCrew, error: crewError } = await supabase
        .from('crews')
        .insert({
          name: crewName.trim(),
          tag: crewTag.toUpperCase(),
          bio: crewBio.trim(),
          founder_id: user?.id,
          founder_name: userProfile?.username || 'Anonymous',
          members: [user?.id],
          member_names: [userProfile?.username || 'Anonymous'],
          total_xp: userProfile?.xp || 0,
          challenges_completed: 0,
          spots_added: userProfile?.spots_added || 0,
        })
        .select()
        .single();

      if (crewError) throw crewError;

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          crew_id: newCrew.id,
          crew_tag: crewTag.toUpperCase(),
        })
        .eq('id', user?.id);

      Alert.alert('Success', `Crew "${crewName}" created successfully!`);
      setShowCreateForm(false);
      setCrewName('');
      setCrewTag('');
      setCrewBio('');
      loadData();
    } catch (error) {
      console.error('Error creating crew:', error);
      Alert.alert('Error', 'Failed to create crew');
    }
  };

  const joinCrew = async (crew: Crew) => {
    if (userCrew) {
      Alert.alert('Error', 'You must leave your current crew first');
      return;
    }

    try {
      // Update crew
      await supabase
        .from('crews')
        .update({
          members: [...crew.members, user?.id],
          member_names: [...crew.member_names, userProfile?.username || 'Anonymous'],
          total_xp: crew.total_xp + (userProfile?.xp || 0),
          spots_added: crew.spots_added + (userProfile?.spots_added || 0),
        })
        .eq('id', crew.id);

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          crew_id: crew.id,
          crew_tag: crew.tag,
        })
        .eq('id', user?.id);

      Alert.alert('Success', `You've joined ${crew.name}!`);
      loadData();
    } catch (error) {
      console.error('Error joining crew:', error);
      Alert.alert('Error', 'Failed to join crew');
    }
  };

  const leaveCrew = async () => {
    if (!userCrew) return;

    Alert.alert(
      'Leave Crew',
      `Are you sure you want to leave "${userCrew.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const newMembers = userCrew.members.filter((id) => id !== user?.id);
              const newMemberNames = userCrew.member_names.filter(
                (name) => name !== (userProfile?.username || 'Anonymous')
              );

              if (newMembers.length === 0) {
                // Delete crew if no members left
                await supabase.from('crews').delete().eq('id', userCrew.id);
              } else {
                // Update crew
                await supabase
                  .from('crews')
                  .update({
                    members: newMembers,
                    member_names: newMemberNames,
                    total_xp: Math.max(0, userCrew.total_xp - (userProfile?.xp || 0)),
                    spots_added: Math.max(0, userCrew.spots_added - (userProfile?.spots_added || 0)),
                  })
                  .eq('id', userCrew.id);
              }

              // Update user profile
              await supabase
                .from('profiles')
                .update({
                  crew_id: null,
                  crew_tag: null,
                })
                .eq('id', user?.id);

              Alert.alert('Success', "You've left the crew");
              loadData();
            } catch (error) {
              console.error('Error leaving crew:', error);
              Alert.alert('Error', 'Failed to leave crew');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Crews</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crews</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* My Crew Section */}
        {userCrew ? (
          <View style={styles.myCrewSection}>
            <Text style={styles.sectionTitle}>👥 My Crew</Text>
            <View style={styles.crewCard}>
              <Text style={styles.crewName}>
                [{userCrew.tag}] {userCrew.name}
              </Text>
              {userCrew.bio ? (
                <Text style={styles.crewBio}>{userCrew.bio}</Text>
              ) : null}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{userCrew.members.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{userCrew.total_xp}</Text>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{userCrew.spots_added}</Text>
                  <Text style={styles.statLabel}>Spots</Text>
                </View>
              </View>
              <Text style={styles.membersLabel}>Members:</Text>
              <Text style={styles.membersList}>{userCrew.member_names.join(', ')}</Text>
              <TouchableOpacity style={styles.leaveButton} onPress={leaveCrew}>
                <Text style={styles.leaveButtonText}>Leave Crew</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.createCrewSection}>
            {!showCreateForm ? (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={styles.createButtonText}>🆕 Create a Crew</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createForm}>
                <Text style={styles.formTitle}>Create a Crew</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Crew Name"
                  value={crewName}
                  onChangeText={setCrewName}
                  maxLength={30}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Crew Tag (2-5 letters)"
                  value={crewTag}
                  onChangeText={(text) => setCrewTag(text.toUpperCase())}
                  maxLength={5}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Crew Bio (optional)"
                  value={crewBio}
                  onChangeText={setCrewBio}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={createCrew}
                  >
                    <Text style={styles.submitButtonText}>Create Crew</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCreateForm(false);
                      setCrewName('');
                      setCrewTag('');
                      setCrewBio('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* All Crews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 All Crews</Text>
          {allCrews.length === 0 ? (
            <Text style={styles.emptyText}>No crews yet. Be the first to create one!</Text>
          ) : (
            allCrews.map((crew) => (
              <View key={crew.id} style={styles.crewListCard}>
                <Text style={styles.crewListName}>
                  <Text style={styles.tagBadge}>{crew.tag}</Text> {crew.name}
                </Text>
                {crew.bio ? <Text style={styles.crewListBio}>{crew.bio}</Text> : null}
                <View style={styles.crewListStats}>
                  <Text style={styles.crewListStat}>👥 {crew.members.length}</Text>
                  <Text style={styles.crewListStat}>⭐ {crew.total_xp} XP</Text>
                  <Text style={styles.crewListStat}>📍 {crew.spots_added}</Text>
                </View>
                {!userCrew && crew.id !== userProfile?.crew_id ? (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => joinCrew(crew)}
                  >
                    <Text style={styles.joinButtonText}>Join Crew</Text>
                  </TouchableOpacity>
                ) : crew.id === userProfile?.crew_id ? (
                  <Text style={styles.yourCrewBadge}>✓ Your Crew</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Crew Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Crew Leaderboard</Text>
          {allCrews.slice(0, 10).map((crew, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const isUserCrew = crew.id === userProfile?.crew_id;
            return (
              <View
                key={crew.id}
                style={[styles.leaderboardCard, isUserCrew && styles.userCrewCard]}
              >
                <View style={styles.leaderboardLeft}>
                  <Text style={styles.rank}>{medals[index] || `#${index + 1}`}</Text>
                  <View>
                    <Text style={styles.leaderboardName}>
                      [{crew.tag}] {crew.name}
                    </Text>
                    <Text style={styles.leaderboardMembers}>
                      {crew.members.length} members
                    </Text>
                  </View>
                </View>
                <Text style={styles.leaderboardXP}>{crew.total_xp} XP</Text>
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
  myCrewSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  crewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  crewName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d2673d',
    marginBottom: 10,
  },
  crewBio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d2673d',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  membersLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  membersList: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  leaveButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  createCrewSection: {
    padding: 15,
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  crewListCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  crewListName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#667eea',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  crewListBio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  crewListStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  crewListStat: {
    fontSize: 14,
    color: '#555',
  },
  joinButton: {
    backgroundColor: '#667eea',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  yourCrewBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userCrewCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rank: {
    fontSize: 24,
    minWidth: 40,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderboardMembers: {
    fontSize: 12,
    color: '#666',
  },
  leaderboardXP: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
});
