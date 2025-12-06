import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  navigation: NavigationProp<any>;
}

export default function ChallengesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

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

  const completeChallenge = async (challenge: any) => {
    if (!user) return;
    setSelectedChallenge(challenge);
    setUploadModalVisible(true);
  };

  const pickMedia = async (type: 'photo' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0]);
    }
  };

  const uploadProof = async () => {
    if (!selectedMedia || !selectedChallenge || !user) return;

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = selectedMedia.uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(selectedMedia.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('challenge-proofs')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('challenge-proofs')
        .getPublicUrl(filePath);

      // Save proof to database
      await supabase.from('challenge_proofs').insert({
        challenge_id: selectedChallenge.id,
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: selectedMedia.type,
      });

      // Update user's completed challenges
      const { data: challenge } = await supabase
        .from('challenges')
        .select('completed_by')
        .eq('id', selectedChallenge.id)
        .single();

      if (challenge && !challenge.completed_by?.includes(user.id)) {
        await supabase
          .from('challenges')
          .update({
            completed_by: [...(challenge.completed_by || []), user.id],
          })
          .eq('id', selectedChallenge.id);
      }

      // Award XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, challenges_completed')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            xp: profile.xp + selectedChallenge.xp_reward,
            challenges_completed: profile.challenges_completed + 1,
          })
          .eq('id', user.id);
      }

      Alert.alert(
        'Success!',
        `Challenge completed! You earned ${selectedChallenge.xp_reward} XP!`
      );
      setUploadModalVisible(false);
      setSelectedMedia(null);
      setSelectedChallenge(null);
      loadChallenges();
    } catch (error) {
      console.error('Error uploading proof:', error);
      Alert.alert('Error', 'Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
    }
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
        onPress={() => completeChallenge(item)}
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

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Proof</Text>
            <Text style={styles.modalSubtitle}>
              {selectedChallenge?.trick}
            </Text>

            {selectedMedia ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setSelectedMedia(null)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.optionIcon}>📷</Text>
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => pickMedia('photo')}
                >
                  <Text style={styles.optionIcon}>🖼️</Text>
                  <Text style={styles.optionText}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => pickMedia('video')}
                >
                  <Text style={styles.optionIcon}>🎥</Text>
                  <Text style={styles.optionText}>Choose Video</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              {selectedMedia ? (
                <TouchableOpacity
                  style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                  onPress={uploadProof}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadButtonText}>Submit Proof</Text>
                  )}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setUploadModalVisible(false);
                  setSelectedMedia(null);
                  setSelectedChallenge(null);
                }}
                disabled={uploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadOptions: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalActions: {
    gap: 10,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
