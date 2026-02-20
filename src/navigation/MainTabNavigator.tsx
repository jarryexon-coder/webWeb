import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useBetSlip } from '../context/BetSlipContext';
import { View, Text } from 'react-native';

// Stack Navigators
import HomeStackNavigator from './HomeStackNavigator';
import DailyPicksStackNavigator from './DailyPicksStackNavigator';
import ParlayBuilderStackNavigator from './ParlayBuilderStackNavigator';
import PredictionMarketsStackNavigator from './PredictionMarketsStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const { theme } = useTheme();
  const { betSlipCount } = useBetSlip();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="DailyPicks"
        component={DailyPicksStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="trophy" size={size} color={color} />
          ),
          tabBarLabel: 'Picks',
        }}
      />
      
      <Tab.Screen
        name="ParlayBuilder"
        component={ParlayBuilderStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="plus-circle" size={size + 4} color={theme.primary} />
            </View>
          ),
          tabBarLabel: 'Build',
        }}
      />
      
      <Tab.Screen
        name="PredictionMarkets"
        component={PredictionMarketsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bell-curve" size={size} color={color} />
          ),
          tabBarLabel: 'Markets',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="account" size={size} color={color} />
              {betSlipCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: -4,
                    backgroundColor: theme.primary,
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {betSlipCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
