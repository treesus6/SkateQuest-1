import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NavigationProp } from '@react-navigation/native';
import parksData from '../data/parks.json';

interface Park {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

interface Props {
  navigation: NavigationProp<any>;
}

export default function MapScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [region, setRegion] = useState({
    latitude: 39.8283, // Center of USA
    longitude: -98.5795,
    latitudeDelta: 40,
    longitudeDelta: 40,
  });

  const filteredParks = parksData.filter((park: Park) =>
    park.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.backButton} />
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search 2585 skateparks..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {filteredParks.map((park: Park) => (
          <Marker
            key={park.id}
            coordinate={{ latitude: park.lat, longitude: park.lng }}
            title={park.name}
            description={park.type}
            onPress={() => setSelectedPark(park)}
          />
        ))}
      </MapView>

      {selectedPark && (
        <Modal
          transparent
          visible={!!selectedPark}
          onRequestClose={() => setSelectedPark(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPark.name}</Text>
              <Text style={styles.modalType}>{selectedPark.type}</Text>
              <Text style={styles.modalCoords}>
                📍 {selectedPark.lat.toFixed(4)}, {selectedPark.lng.toFixed(4)}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setSelectedPark(null);
                    navigation.navigate('ParkDetail', { park: selectedPark });
                  }}
                >
                  <Text style={styles.modalButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setSelectedPark(null)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredParks.length} parks • Showing on map
        </Text>
      </View>
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
  searchInput: {
    margin: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  statsBar: {
    backgroundColor: '#000',
    padding: 10,
    alignItems: 'center',
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalCoords: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
