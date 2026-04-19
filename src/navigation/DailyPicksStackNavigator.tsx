import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';

// Screens
import DailyPicksScreen from '../screens/DailyPicksScreen';
import ComboDetailsScreen from '../screens/ComboDetailsScreen';
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
        name="ComboDetails"
        component={ComboDetailsScreen}
        options={({ route }) => ({
          title: route.params.parlayType === 'same_game_combo' 
            ? 'Same Game Combo' 
            : route.params.parlayType === 'teaser' 
            ? 'Point Adjustment Adjuster Details' 
            : 'Multi-Leg Combos',
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
          title: 'Multiplier Comparison',
        }}
      />
    </Stack.Navigator>
  );
};

export default DailyPicksStackNavigator;
