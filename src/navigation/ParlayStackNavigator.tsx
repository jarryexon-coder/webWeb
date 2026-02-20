// src/navigation/ParlayStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParlayStackParamList } from './types';

// Import screens
import ParlayArchitectScreen from '../screens/parlay/ParlayArchitectScreen';
import ParlayBuilderScreen from '../screens/parlay/ParlayBuilderScreen';
import CrossSportParlayScreen from '../screens/parlay/CrossSportParlayScreen';
import ParlayDetailsScreen from '../screens/parlay/ParlayDetailsScreen';

const Stack = createNativeStackNavigator<ParlayStackParamList>();

export const ParlayStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ParlayArchitect"
      screenOptions={{
        headerStyle: { backgroundColor: '#2d3748' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="ParlayArchitect"
        component={ParlayArchitectScreen}
        options={{ title: 'Parlay Architect' }}
      />
      <Stack.Screen
        name="ParlayBuilder"
        component={ParlayBuilderScreen}
        options={{ title: 'Build Parlay' }}
      />
      <Stack.Screen
        name="CrossSportParlay"
        component={CrossSportParlayScreen}
        options={{ title: 'Cross-Sport Parlay' }}
      />
      <Stack.Screen
        name="ParlayDetails"
        component={ParlayDetailsScreen}
        options={{ title: 'Parlay Details' }}
      />
    </Stack.Navigator>
  );
};
