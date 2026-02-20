import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';

// Screens
import DailyPicksScreen from '../screens/DailyPicksScreen';
import ParlayDetailsScreen from '../screens/ParlayDetailsScreen';
import PlayerTrendsScreen from '../screens/PlayerTrendsScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import OddsComparisonScreen from '../screens/OddsComparisonScreen';
import { DailyPicksStackParamList } from './types';

const Stack = createStackNavigator<DailyPicksStackParamList>();

const DailyPicksStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: theme.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <Icon name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Stack.Screen
        name="PicksDashboard"
        component={DailyPicksScreen}
        options={{
          title: 'Daily Picks',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Icon name="tune" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen
        name="ParlayDetails"
        component={ParlayDetailsScreen}
        options={({ route }) => ({
          title: route.params.parlayType === 'same_game_parlay' 
            ? 'Same Game Parlay' 
            : route.params.parlayType === 'teaser' 
            ? 'Teaser Details' 
            : 'Round Robin',
        })}
      />
      
      <Stack.Screen
        name="PlayerTrends"
        component={PlayerTrendsScreen}
        options={({ route }) => ({
          title: `${route.params.playerName} - Trends`,
        })}
      />
      
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={({ route }) => ({
          title: route.params.gameId.replace('-', ' @ '),
        })}
      />
      
      <Stack.Screen
        name="OddsComparison"
        component={OddsComparisonScreen}
        options={{
          title: 'Odds Comparison',
        }}
      />
    </Stack.Navigator>
  );
};

export default DailyPicksStackNavigator;
