import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import parksData from '../data/parks.json';

interface Park {
  id: string;
  name: string;
  location: string;
  description: string;
  difficulty: string;
  rating: number;
  image: string;
  isFree: boolean;
  price?: string;
}

interface Props {
  navigation: NavigationProp<any>;
}

export default function ParksListScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredParks = parksData.filter((park: Park) => {
    const matchesSearch = park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          park.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || park.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const renderPark = ({ item }: { item: Park }) => (
    <TouchableOpacity
      style={styles.parkCard}
      onPress={() => navigation.navigate('ParkDetail', { park: item })}
    >
      <Image source={{ uri: item.image }} style={styles.parkImage} />
      <View style={styles.parkInfo}>
        <Text style={styles.parkName}>{item.name}</Text>
        <Text style={styles.parkLocation}>{item.location}</Text>
        <View style={styles.parkMeta}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.price}>{item.isFree ? 'FREE' : item.price}</Text>
        </View>
      </View>
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

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedDifficulty && styles.filterChipActive]}
          onPress={() => setSelectedDifficulty(null)}
        >
          <Text style={[styles.filterText, !selectedDifficulty && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {difficulties.map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[styles.filterChip, selectedDifficulty === diff && styles.filterChipActive]}
            onPress={() => setSelectedDifficulty(diff)}
          >
            <Text style={[styles.filterText, selectedDifficulty === diff && styles.filterTextActive]}>
              {diff}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  parkCard: {
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
  parkImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  parkInfo: {
    padding: 15,
  },
  parkName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  parkLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  parkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  price: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
});
