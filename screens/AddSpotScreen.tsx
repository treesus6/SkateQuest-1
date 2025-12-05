import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

export default function AddSpotScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [spotName, setSpotName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [tricks, setTricks] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!spotName.trim() || !latitude || !longitude) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    try {
      setSubmitting(true);

      // Insert spot
      await supabase.from('skate_spots').insert({
        name: spotName.trim(),
        latitude: lat,
        longitude: lng,
        difficulty,
        tricks: tricks.split(',').map((t) => t.trim()).filter(Boolean),
        description: description.trim() || null,
        added_by: user?.id,
      });

      // Update user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, spots_added')
        .eq('id', user?.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            xp: profile.xp + 100,
            spots_added: profile.spots_added + 1,
          })
          .eq('id', user?.id);
      }

      Alert.alert('Success', 'Spot added! You earned 100 XP!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding spot:', error);
      Alert.alert('Error', 'Failed to add spot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Spot</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>Submit a New Spot</Text>

          <Text style={styles.label}>Spot Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Venice Skatepark"
            value={spotName}
            onChangeText={setSpotName}
          />

          <Text style={styles.label}>Latitude *</Text>
          <TextInput
            style={styles.input}
            placeholder="33.9850"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Longitude *</Text>
          <TextInput
            style={styles.input}
            placeholder="-118.4695"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyButtons}>
            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  difficulty === level && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty(level)}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    difficulty === level && styles.difficultyButtonTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tricks (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="kickflip, ollie, grind"
            value={tricks}
            onChangeText={setTricks}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the spot..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Adding...' : 'Add Spot (+100 XP)'}
            </Text>
          </TouchableOpacity>
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
  form: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  difficultyButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  difficultyButtonActive: {
    backgroundColor: '#d2673d',
    borderColor: '#d2673d',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#d2673d',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
