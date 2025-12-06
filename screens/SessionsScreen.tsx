import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  spots_visited: string[];
  distance_km: number;
  created_at: string;
}

export default function SessionsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadSessions();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeSession.started_at).getTime()) / 1000 / 60
        );
        setSessionTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Location permission is required for session tracking'
      );
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  const loadSessions = async () => {
    try {
      // Check for active session
      const { data: active } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .is('ended_at', null)
        .single();

      if (active) {
        setActiveSession(active);
      }

      // Load past sessions
      const { data: past } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .not('ended_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (past) {
        setPastSessions(past);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (activeSession) {
      Alert.alert('Error', 'You already have an active session');
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user?.id,
          started_at: new Date().toISOString(),
          start_lat: loc.coords.latitude,
          start_lng: loc.coords.longitude,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data);
      Alert.alert('Session Started', 'Your skate session is now being tracked!');
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const duration = Math.floor(
        (Date.now() - new Date(activeSession.started_at).getTime()) / 1000 / 60
      );

      // Calculate XP reward based on duration (10 XP per minute, max 500)
      const xpReward = Math.min(duration * 10, 500);

      // Update session
      await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          end_lat: loc.coords.latitude,
          end_lng: loc.coords.longitude,
          duration_minutes: duration,
        })
        .eq('id', activeSession.id);

      // Award XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user?.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ xp: profile.xp + xpReward })
          .eq('id', user?.id);
      }

      Alert.alert(
        'Session Ended',
        `Session duration: ${duration} minutes\nYou earned ${xpReward} XP!`
      );

      setActiveSession(null);
      setSessionTimer(0);
      loadSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session');
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPastSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{formatDate(item.started_at)}</Text>
        <Text style={styles.sessionDuration}>{formatDuration(item.duration_minutes)}</Text>
      </View>
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.spots_visited?.length || 0}</Text>
          <Text style={styles.statLabel}>Spots</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.distance_km?.toFixed(1) || 0}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.min(item.duration_minutes * 10, 500)}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sessions</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Active Session */}
        {activeSession ? (
          <View style={styles.activeSessionCard}>
            <Text style={styles.activeSessionTitle}>🛹 Active Session</Text>
            <Text style={styles.timer}>{formatDuration(sessionTimer)}</Text>
            <Text style={styles.timerLabel}>
              Started at {new Date(activeSession.started_at).toLocaleTimeString()}
            </Text>
            <TouchableOpacity style={styles.endButton} onPress={endSession}>
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startIcon}>▶️</Text>
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        )}

        {/* Session Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Session Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{pastSessions.length}</Text>
              <Text style={styles.statCardLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>
                {pastSessions.reduce((acc, s) => acc + s.duration_minutes, 0)}
              </Text>
              <Text style={styles.statCardLabel}>Total Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>
                {pastSessions.reduce((acc, s) => acc + (s.spots_visited?.length || 0), 0)}
              </Text>
              <Text style={styles.statCardLabel}>Spots Visited</Text>
            </View>
          </View>
        </View>

        {/* Past Sessions */}
        <View style={styles.pastSessionsSection}>
          <Text style={styles.sectionTitle}>Past Sessions</Text>
          {pastSessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet. Start your first one!</Text>
          ) : (
            <FlatList
              data={pastSessions}
              renderItem={renderPastSession}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
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
  content: {
    flex: 1,
  },
  activeSessionCard: {
    backgroundColor: '#667eea',
    margin: 15,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  timerLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 25,
  },
  endButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  endButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 30,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  startIcon: {
    fontSize: 32,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d2673d',
    marginBottom: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  pastSessionsSection: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 30,
  },
  sessionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
