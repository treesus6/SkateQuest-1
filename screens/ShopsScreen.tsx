import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Shop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  photo_url: string | null;
  added_by: string;
  created_at: string;
}

export default function ShopsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLat, setShopLat] = useState('');
  const [shopLng, setShopLng] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopWebsite, setShopWebsite] = useState('');
  const [shopDescription, setShopDescription] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setShops(data);
    } catch (error) {
      console.error('Error loading shops:', error);
      Alert.alert('Error', 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const addShop = async () => {
    if (!shopName.trim() || !shopAddress.trim() || !shopLat || !shopLng) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }

    const lat = parseFloat(shopLat);
    const lng = parseFloat(shopLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    try {
      await supabase.from('shops').insert({
        name: shopName.trim(),
        address: shopAddress.trim(),
        latitude: lat,
        longitude: lng,
        phone: shopPhone.trim() || null,
        website: shopWebsite.trim() || null,
        description: shopDescription.trim() || null,
        added_by: user?.id,
      });

      Alert.alert('Success', 'Shop added successfully!');
      setShowAddForm(false);
      setShopName('');
      setShopAddress('');
      setShopLat('');
      setShopLng('');
      setShopPhone('');
      setShopWebsite('');
      setShopDescription('');
      loadShops();
    } catch (error) {
      console.error('Error adding shop:', error);
      Alert.alert('Error', 'Failed to add shop');
    }
  };

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Shops</Text>
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
        <Text style={styles.title}>Skate Shops</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Add Shop Section */}
        <View style={styles.addSection}>
          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addButtonText}>➕ Add a Shop</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Add a Skate Shop</Text>
              <TextInput
                style={styles.input}
                placeholder="Shop Name *"
                value={shopName}
                onChangeText={setShopName}
              />
              <TextInput
                style={styles.input}
                placeholder="Address *"
                value={shopAddress}
                onChangeText={setShopAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Latitude *"
                value={shopLat}
                onChangeText={setShopLat}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Longitude *"
                value={shopLng}
                onChangeText={setShopLng}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={shopPhone}
                onChangeText={setShopPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Website"
                value={shopWebsite}
                onChangeText={setShopWebsite}
                keyboardType="url"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={shopDescription}
                onChangeText={setShopDescription}
                multiline
                numberOfLines={3}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.submitButton} onPress={addShop}>
                  <Text style={styles.submitButtonText}>Add Shop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setShopName('');
                    setShopAddress('');
                    setShopLat('');
                    setShopLng('');
                    setShopPhone('');
                    setShopWebsite('');
                    setShopDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Shops List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛹 Local Shops</Text>
          {shops.length === 0 ? (
            <Text style={styles.emptyText}>No shops yet. Add one!</Text>
          ) : (
            shops.map((shop) => (
              <View key={shop.id} style={styles.shopCard}>
                <Text style={styles.shopName}>🛒 {shop.name}</Text>
                <Text style={styles.shopAddress}>📍 {shop.address}</Text>
                {shop.description ? (
                  <Text style={styles.shopDescription}>{shop.description}</Text>
                ) : null}
                <View style={styles.shopActions}>
                  {shop.phone ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openPhone(shop.phone!)}
                    >
                      <Text style={styles.actionButtonText}>📞 Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  {shop.website ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openWebsite(shop.website!)}
                    >
                      <Text style={styles.actionButtonText}>🌐 Website</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  addSection: {
    padding: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addForm: {
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
    backgroundColor: '#4CAF50',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  shopAddress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  shopActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
