import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';

// Screens
import PredictionMarketsScreen from '../screens/PredictionMarketsScreen';
import MarketDetailsScreen from '../screens/MarketDetailsScreen';
import ArbitrageFinderScreen from '../screens/ArbitrageFinderScreen';
import PositionHistoryScreen from '../screens/PositionHistoryScreen';
import { PredictionMarketsStackParamList } from './types';

const Stack = createStackNavigator<PredictionMarketsStackParamList>();

const PredictionMarketsStackNavigator = () => {
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
        name="MarketsDashboard"
        component={PredictionMarketsScreen}
        options={({ route }) => ({
          title: route.params?.sport 
            ? `${route.params.sport.toUpperCase()} Markets` 
            : 'Prediction Markets',
        })}
      />
      
      <Stack.Screen
        name="MarketDetails"
        component={MarketDetailsScreen}
        options={({ route }) => ({
          title: route.params.marketTicker,
        })}
      />
      
      <Stack.Screen
        name="ArbitrageFinder"
        component={ArbitrageFinderScreen}
        options={{
          title: 'Arbitrage Opportunities',
        }}
      />
      
      <Stack.Screen
        name="PositionHistory"
        component={PositionHistoryScreen}
        options={{
          title: 'Your Positions',
        }}
      />
    </Stack.Navigator>
  );
};

export default PredictionMarketsStackNavigator;
