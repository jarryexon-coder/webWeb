import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../types/navigation.types';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ParlayScreen } from '../screens/ParlayScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// New screens
import { AnalyticsDashboardScreen } from '../screens/analytics/AnalyticsDashboardScreen';

// Icons
import Icon from 'react-native-vector-icons/Feather';

const Tab = createBottomTabNavigator<RootStackParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Parlay" 
        component={ParlayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="layers" size={size} color={color} />
          ),
        }}
      />
      
      {/* NEW: Analytics Tab */}
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart-2" size={size} color={color} />
          ),
          tabBarLabel: 'Analytics',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
