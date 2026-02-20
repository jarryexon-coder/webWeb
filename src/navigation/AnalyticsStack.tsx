import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '../types/navigation.types';

// Screens
import { AdvancedAnalyticsScreen } from '../screens/AdvancedAnalyticsScreen';
import { PropDetailsScreen } from '../screens/analytics/PropDetailsScreen';
import { CorrelatedParlayDetailsScreen } from '../screens/analytics/CorrelatedParlayDetailsScreen';
import { ParlayBuilderScreen } from '../screens/ParlayBuilderScreen';
import { SportSpecificAnalyticsScreen } from '../screens/analytics/SportSpecificAnalyticsScreen';
import { AnalyticsDashboardScreen } from '../screens/analytics/AnalyticsDashboardScreen';

// Components
import { HeaderBackButton } from '../components/navigation/HeaderBackButton';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export const AnalyticsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboardScreen}
        options={{
          title: 'Analytics',
          headerShown: false,
        }}
      />
      
      <Stack.Screen 
        name="AdvancedAnalytics" 
        component={AdvancedAnalyticsScreen}
        options={({ route, navigation }) => ({
          title: route.params?.sport 
            ? `${route.params.sport.toUpperCase()} Parlay Analytics` 
            : 'Advanced Analytics',
          headerLeft: (props) => (
            <HeaderBackButton 
              {...props} 
              onPress={() => navigation.goBack()}
            />
          ),
        })}
      />
      
      <Stack.Screen 
        name="PropDetails" 
        component={PropDetailsScreen}
        options={({ route }) => ({
          title: `${route.params.player} - ${route.params.prop}`,
        })}
      />
      
      <Stack.Screen 
        name="CorrelatedParlayDetails" 
        component={CorrelatedParlayDetailsScreen}
        options={{
          title: 'Correlated Parlay Analysis',
        }}
      />
      
      <Stack.Screen 
        name="ParlayBuilder" 
        component={ParlayBuilderScreen}
        options={{
          title: 'Build Parlay',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="SportSpecificAnalytics" 
        component={SportSpecificAnalyticsScreen}
        options={({ route }) => ({
          title: `${route.params.sport.toUpperCase()} Advanced Metrics`,
        })}
      />
    </Stack.Navigator>
  );
};
