import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
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

export default function ParksListScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParks = parksData.filter((park: Park) => {
    const matchesSearch = park.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderPark = ({ item }: { item: Park }) => (
    <TouchableOpacity
      style={styles.parkCard}
      onPress={() => navigation.navigate('ParkDetail', { park: item })}
    >
      <View style={styles.parkInfo}>
        <Text style={styles.parkName}>{item.name}</Text>
        <View style={styles.coordsContainer}>
          <Text style={styles.coordsText}>📍 {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skateparks</Text>
        <Text style={styles.subtitle}>{filteredParks.length} parks found</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search parks..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredParks}
        renderItem={renderPark}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  searchInput: {
    margin: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
  },
  parkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parkInfo: {
    flex: 1,
  },
  parkName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#000',
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
    marginLeft: 10,
  },
});
