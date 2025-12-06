import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

interface VideoPost {
  id: string;
  user_id: string;
  video_url: string;
  caption: string;
  trick_tags: string[];
  likes: string[];
  username: string;
  created_at: string;
}

interface Props {
  navigation: NavigationProp<any>;
}

export default function VideosScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoPost | null>(null);
  const [caption, setCaption] = useState('');
  const [trickTags, setTrickTags] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('video_posts')
        .select(`
          *,
          profiles!video_posts_user_id_fkey (username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const formatted = data.map((video: any) => ({
          ...video,
          username: video.profiles?.username || 'Anonymous',
          likes: video.likes || [],
          trick_tags: video.trick_tags || [],
        }));
        setVideos(formatted);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
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
      setSelectedVideo(result.assets[0].uri);
      setShowUploadModal(true);
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo || !user) return;

    setUploading(true);

    try {
      const fileExt = selectedVideo.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(selectedVideo);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('video-posts')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('video-posts')
        .getPublicUrl(filePath);

      const tags = trickTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await supabase.from('video_posts').insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        caption: caption,
        trick_tags: tags,
      });

      Alert.alert('Success!', 'Video uploaded successfully!');
      setShowUploadModal(false);
      setSelectedVideo(null);
      setCaption('');
      setTrickTags('');
      loadVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const likeVideo = async (video: VideoPost) => {
    if (!user) return;

    const hasLiked = video.likes.includes(user.id);
    const newLikes = hasLiked
      ? video.likes.filter(id => id !== user.id)
      : [...video.likes, user.id];

    setVideos(prev =>
      prev.map(v => (v.id === video.id ? { ...v, likes: newLikes } : v))
    );

    try {
      await supabase
        .from('video_posts')
        .update({ likes: newLikes })
        .eq('id', video.id);
    } catch (error) {
      console.error('Error liking video:', error);
      setVideos(prev =>
        prev.map(v => (v.id === video.id ? { ...v, likes: video.likes } : v))
      );
    }
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
    const seconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderVideo = ({ item }: { item: VideoPost }) => {
    const hasLiked = user ? item.likes.includes(user.id) : false;

    return (
      <View style={styles.videoCard}>
        <TouchableOpacity
          style={styles.videoPreview}
          onPress={() => setPlayingVideo(item)}
        >
          <View style={styles.videoThumbnail}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.videoInfo}>
          <View style={styles.videoHeader}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
          </View>

          {item.caption && (
            <Text style={styles.caption}>{item.caption}</Text>
          )}

          {item.trick_tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.trick_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => likeVideo(item)}
            >
              <Text style={styles.actionIcon}>{hasLiked ? '❤️' : '🤍'}</Text>
              <Text style={styles.actionText}>{item.likes.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Videos</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickVideo}>
          <Text style={styles.uploadBtnText}>📹</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos yet</Text>
            <Text style={styles.emptySubtext}>Be the first to upload!</Text>
          </View>
        }
      />

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        onRequestClose={() => !uploading && setShowUploadModal(false)}
      >
        <View style={styles.uploadModal}>
          <View style={styles.uploadHeader}>
            <TouchableOpacity
              onPress={() => !uploading && setShowUploadModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.uploadTitle}>Upload Video</Text>
            <TouchableOpacity onPress={uploadVideo} disabled={uploading}>
              <Text style={[styles.postText, uploading && styles.postTextDisabled]}>
                {uploading ? 'Uploading...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />

          <TextInput
            style={styles.tagsInput}
            placeholder="Add trick tags (comma separated: kickflip, heelflip)"
            value={trickTags}
            onChangeText={setTrickTags}
          />

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading your video...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        transparent
        visible={!!playingVideo}
        onRequestClose={() => setPlayingVideo(null)}
      >
        <View style={styles.playerModalOverlay}>
          <TouchableOpacity
            style={styles.playerModalClose}
            onPress={() => setPlayingVideo(null)}
          >
            <Text style={styles.playerModalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {playingVideo && (
            <View style={styles.playerContainer}>
              <Video
                source={{ uri: playingVideo.video_url }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
              <View style={styles.playerInfo}>
                <Text style={styles.playerUsername}>{playingVideo.username}</Text>
                {playingVideo.caption && (
                  <Text style={styles.playerCaption}>{playingVideo.caption}</Text>
                )}
              </View>
            </View>
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
    width: 70,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: 24,
  },
  list: {
    padding: 15,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  videoThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 64,
  },
  videoInfo: {
    padding: 15,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
  },
  caption: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#d2673d',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#ccc',
  },
  uploadModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  postTextDisabled: {
    color: '#ccc',
  },
  captionInput: {
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagsInput: {
    padding: 15,
    fontSize: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  playerModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playerModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
  },
  videoPlayer: {
    flex: 1,
  },
  playerInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 12,
  },
  playerUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  playerCaption: {
    fontSize: 14,
    color: '#fff',
  },
});
