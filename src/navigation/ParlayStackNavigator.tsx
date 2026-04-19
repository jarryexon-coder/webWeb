// src/navigation/ComboStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComboStackParamList } from './types';

// Import screens
import ComboArchitectScreen from '../screens/parlay/ComboArchitectScreen';
import ComboBuilderScreen from '../screens/parlay/ComboBuilderScreen';
import CrossSportComboScreen from '../screens/parlay/CrossSportComboScreen';
import ComboDetailsScreen from '../screens/parlay/ComboDetailsScreen';

const Stack = createNativeStackNavigator<ComboStackParamList>();

export const ComboStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ComboArchitect"
      screenOptions={{
        headerStyle: { backgroundColor: '#2d3748' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="ComboArchitect"
        component={ComboArchitectScreen}
        options={{ title: 'Combo Architect' }}
      />
      <Stack.Screen
        name="ComboBuilder"
        component={ComboBuilderScreen}
        options={{ title: 'Build Combo' }}
      />
      <Stack.Screen
        name="CrossSportCombo"
        component={CrossSportComboScreen}
        options={{ title: 'Cross-Sport Combo' }}
      />
      <Stack.Screen
        name="ComboDetails"
        component={ComboDetailsScreen}
        options={{ title: 'Combo Details' }}
      />
    </Stack.Navigator>
  );
};
