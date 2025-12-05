import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  navigation: NavigationProp<any>;
}

interface Event {
  id: string;
  name: string;
  datetime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  organizer_id: string;
  attendees: string[];
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
}

export default function EventsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user?.id)
        .single();

      if (profile) setUserProfile(profile);

      // Load all upcoming events
      const now = new Date().toISOString();
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('datetime', now)
        .order('datetime', { ascending: true });

      if (eventsData) setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events data');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!eventName.trim() || !eventDate || !eventTime || !eventLocation.trim()) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }

    try {
      // Combine date and time
      const datetime = new Date(`${eventDate}T${eventTime}`);

      if (isNaN(datetime.getTime())) {
        Alert.alert('Error', 'Invalid date or time');
        return;
      }

      // Create event
      await supabase.from('events').insert({
        name: eventName.trim(),
        datetime: datetime.toISOString(),
        location: eventLocation.trim(),
        description: eventDescription.trim(),
        organizer_id: user?.id,
        attendees: [user?.id],
      });

      Alert.alert('Success', 'Event created successfully!');
      setShowCreateForm(false);
      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventDescription('');
      loadData();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const joinEvent = async (event: Event) => {
    if (event.attendees.includes(user?.id || '')) {
      Alert.alert('Info', "You're already attending this event");
      return;
    }

    try {
      await supabase
        .from('events')
        .update({
          attendees: [...event.attendees, user?.id],
        })
        .eq('id', event.id);

      Alert.alert('Success', "You're attending this event!");
      loadData();
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', 'Failed to join event');
    }
  };

  const leaveEvent = async (event: Event) => {
    try {
      const newAttendees = event.attendees.filter((id) => id !== user?.id);

      await supabase
        .from('events')
        .update({
          attendees: newAttendees,
        })
        .eq('id', event.id);

      Alert.alert('Success', 'RSVP cancelled');
      loadData();
    } catch (error) {
      console.error('Error leaving event:', error);
      Alert.alert('Error', 'Failed to cancel RSVP');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Events</Text>
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
        <Text style={styles.title}>Events</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Create Event Section */}
        <View style={styles.createSection}>
          {!showCreateForm ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={styles.createButtonText}>🎉 Create an Event</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>Create an Event</Text>
              <TextInput
                style={styles.input}
                placeholder="Event Name *"
                value={eventName}
                onChangeText={setEventName}
                maxLength={50}
              />
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD) *"
                value={eventDate}
                onChangeText={setEventDate}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM) *"
                value={eventTime}
                onChangeText={setEventTime}
              />
              <TextInput
                style={styles.input}
                placeholder="Location *"
                value={eventLocation}
                onChangeText={setEventLocation}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={eventDescription}
                onChangeText={setEventDescription}
                maxLength={300}
                multiline
                numberOfLines={3}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.submitButton} onPress={createEvent}>
                  <Text style={styles.submitButtonText}>Create Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateForm(false);
                    setEventName('');
                    setEventDate('');
                    setEventTime('');
                    setEventLocation('');
                    setEventDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Events List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Upcoming Events</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming events. Create one!</Text>
          ) : (
            events.map((event) => {
              const isAttending = event.attendees.includes(user?.id || '');
              return (
                <View
                  key={event.id}
                  style={[styles.eventCard, isAttending && styles.attendingCard]}
                >
                  <Text style={styles.eventName}>📅 {event.name}</Text>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDetail}>
                      📅 {formatDate(event.datetime)}
                    </Text>
                    <Text style={styles.eventDetail}>
                      🕐 {formatTime(event.datetime)}
                    </Text>
                    <Text style={styles.eventDetail}>📍 {event.location}</Text>
                    <Text style={styles.eventDetail}>
                      👥 {event.attendees.length} attending
                    </Text>
                  </View>
                  {event.description ? (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  ) : null}
                  <View style={styles.eventActions}>
                    {isAttending ? (
                      <>
                        <TouchableOpacity
                          style={styles.leaveEventButton}
                          onPress={() => leaveEvent(event)}
                        >
                          <Text style={styles.leaveEventButtonText}>Cancel RSVP</Text>
                        </TouchableOpacity>
                        <Text style={styles.attendingBadge}>✓ You're attending!</Text>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.joinEventButton}
                        onPress={() => joinEvent(event)}
                      >
                        <Text style={styles.joinEventButtonText}>RSVP / Join Event</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
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
  createSection: {
    padding: 15,
  },
  createButton: {
    backgroundColor: '#f5576c',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createForm: {
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
    backgroundColor: '#f5576c',
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
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#f5576c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendingCard: {
    backgroundColor: '#fff5f5',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5576c',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetail: {
    fontSize: 14,
    color: '#555',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  joinEventButton: {
    backgroundColor: '#f5576c',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  joinEventButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  leaveEventButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  leaveEventButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  attendingBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
