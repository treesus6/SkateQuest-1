import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

interface Park {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

interface Props {
  navigation: NavigationProp<any>;
  route: RouteProp<{ params: { park: Park } }, 'params'>;
}

interface SpotVideo {
  id: string;
  user_id: string;
  park_id: string;
  video_url: string;
  username: string;
  created_at: string;
}

export default function ParkDetailScreen({ navigation, route }: Props) {
  const { park } = route.params;
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<SpotVideo[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    checkIfFavorite();
    loadVideos();
  }, []);

  const checkIfFavorite = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('park_id', park.id)
        .single();

      if (data) {
        setIsFavorite(true);
      }
    } catch (error) {
      // Not favorite
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save favorites');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('park_id', park.id);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            park_id: park.id,
            park_name: park.name,
            park_location: `${park.lat}, ${park.lng}`,
          });

        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorites!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${park.lat},${park.lng}`;
    Linking.openURL(url);
  };

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('spot_videos')
        .select(`
          *,
          profiles!spot_videos_user_id_fkey (username)
        `)
        .eq('park_id', park.id)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((video: any) => ({
          ...video,
          username: video.profiles?.username || 'Anonymous',
        }));
        setVideos(formatted);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const pickVideo = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to upload videos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadVideo(result.assets[0].uri);
    }
  };

  const uploadVideo = async (uri: string) => {
    setUploading(true);
    setShowUploadModal(true);

    try {
      const fileExt = uri.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('spot-videos')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('spot-videos')
        .getPublicUrl(filePath);

      await supabase.from('spot_videos').insert({
        user_id: user?.id,
        park_id: park.id,
        video_url: urlData.publicUrl,
      });

      Alert.alert('Success!', 'Video uploaded successfully!');
      loadVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setShowUploadModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>📍 Map View</Text>
          <Text style={styles.coordsText}>{park.lat.toFixed(6)}, {park.lng.toFixed(6)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{park.name}</Text>
              <TouchableOpacity
                style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
                onPress={toggleFavorite}
                disabled={loading}
              >
                <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{park.type}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.infoText}>Latitude: {park.lat}</Text>
            <Text style={styles.infoText}>Longitude: {park.lng}</Text>
            <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.infoText}>
              This is a {park.type} location. Tap the map button above to get directions and see nearby amenities.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.videoHeader}>
              <Text style={styles.sectionTitle}>Spot Videos ({videos.length})</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
                <Text style={styles.uploadButtonText}>📹 Upload</Text>
              </TouchableOpacity>
            </View>

            {videos.length === 0 ? (
              <Text style={styles.emptyText}>No videos yet. Be the first to upload!</Text>
            ) : (
              <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.videoCard}
                    onPress={() => setSelectedVideo(item.video_url)}
                  >
                    <View style={styles.videoThumbnail}>
                      <Text style={styles.playIcon}>▶️</Text>
                    </View>
                    <Text style={styles.videoUsername}>{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        transparent
        visible={showUploadModal}
        onRequestClose={() => !uploading && setShowUploadModal(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.uploadModalText}>Uploading video...</Text>
          </View>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        transparent
        visible={!!selectedVideo}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalOverlay}>
          <TouchableOpacity
            style={styles.videoModalClose}
            onPress={() => setSelectedVideo(null)}
          >
            <Text style={styles.videoModalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {selectedVideo && (
            <Video
              source={{ uri: selectedVideo }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 10,
  },
  coordsText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
  },
  favoriteButtonActive: {
    backgroundColor: '#FFE5E5',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  typeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 5,
  },
  mapButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#d2673d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  videoCard: {
    marginRight: 15,
    width: 150,
  },
  videoThumbnail: {
    width: 150,
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 48,
  },
  videoUsername: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  uploadModalText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  videoModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});
