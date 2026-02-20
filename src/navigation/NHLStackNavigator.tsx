// src/navigation/NHLStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NHLStackParamList } from './types';

// Import screens (adjust paths as needed)
import NHLTrendsScreen from '../screens/nhl/NHLTrendsScreen';
import NHLGameDetailScreen from '../screens/nhl/NHLGameDetailScreen';
import NHLFourNationsScreen from '../screens/nhl/NHLFourNationsScreen';
import NHLTradeDeadlineScreen from '../screens/nhl/NHLTradeDeadlineScreen';

const Stack = createNativeStackNavigator<NHLStackParamList>();

export const NHLStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="NHLTrends"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="NHLTrends"
        component={NHLTrendsScreen}
        options={{ title: 'NHL • February 2026' }}
      />
      <Stack.Screen
        name="NHLGameDetail"
        component={NHLGameDetailScreen}
        options={({ route }) => ({
          title: route.params.game?.home_team 
            ? `${route.params.game.home_team} vs ${route.params.game.away_team}`
            : 'Game Details',
        })}
      />
      <Stack.Screen
        name="NHLFourNations"
        component={NHLFourNationsScreen}
        options={{ title: '4 Nations Face-Off' }}
      />
      <Stack.Screen
        name="NHLTradeDeadline"
        component={NHLTradeDeadlineScreen}
        options={{ title: 'Trade Deadline 2026' }}
      />
    </Stack.Navigator>
  );
};
