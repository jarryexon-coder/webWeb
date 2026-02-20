// src/navigation/FantasyStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FantasyStackParamList } from './types';

// Import screens
import FantasyHubScreen from '../screens/fantasy/FantasyHubScreen';
import FantasyPlayerDetailScreen from '../screens/fantasy/FantasyPlayerDetailScreen';
import FantasyContestsScreen from '../screens/fantasy/FantasyContestsScreen';

const Stack = createNativeStackNavigator<FantasyStackParamList>();

export const FantasyStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="FantasyHub"
      screenOptions={{
        headerStyle: { backgroundColor: '#276749' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="FantasyHub"
        component={FantasyHubScreen}
        options={{ title: 'Fantasy Hub' }}
      />
      <Stack.Screen
        name="FantasyPlayerDetail"
        component={FantasyPlayerDetailScreen}
        options={({ route }) => ({ title: route.params.playerId })}
      />
      <Stack.Screen
        name="FantasyContests"
        component={FantasyContestsScreen}
        options={{ title: 'Contests' }}
      />
    </Stack.Navigator>
  );
};
