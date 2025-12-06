import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ParksListScreen from '../screens/ParksListScreen';
import ParkDetailScreen from '../screens/ParkDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CrewsScreen from '../screens/CrewsScreen';
import EventsScreen from '../screens/EventsScreen';
import ShopsScreen from '../screens/ShopsScreen';
import AddSpotScreen from '../screens/AddSpotScreen';
import TricksLibraryScreen from '../screens/TricksLibraryScreen';
import FeedScreen from '../screens/FeedScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="ParksList" component={ParksListScreen} />
            <Stack.Screen name="ParkDetail" component={ParkDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Crews" component={CrewsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="Shops" component={ShopsScreen} />
            <Stack.Screen name="AddSpot" component={AddSpotScreen} />
            <Stack.Screen name="TricksLibrary" component={TricksLibraryScreen} />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
