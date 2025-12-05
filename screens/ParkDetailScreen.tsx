import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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

export default function ParkDetailScreen({ navigation, route }: Props) {
  const { park } = route.params;
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfFavorite();
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
        </View>
      </ScrollView>
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
});
