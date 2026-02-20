import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

// Existing navigators
import { TabNavigator } from './TabNavigator';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';

// New navigator
import { AnalyticsStack } from './AnalyticsStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth flow
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : !user.onboarded ? (
        // Onboarding flow
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        // Main app flow
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="AdvancedAnalytics" 
            component={AnalyticsStack}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="PropDetails" 
            component={PropDetailsScreen}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen 
            name="CorrelatedParlayDetails" 
            component={CorrelatedParlayDetailsScreen}
          />
          <Stack.Screen 
            name="ParlayBuilder" 
            component={ParlayBuilderScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="HistoricalAnalytics" 
            component={HistoricalAnalyticsScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
