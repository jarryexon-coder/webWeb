import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();

  if (isLoading) {
    return null; // Or your loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
