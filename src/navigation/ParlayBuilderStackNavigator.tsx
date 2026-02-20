import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';

// Screens
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';
import AddLegScreen from '../screens/AddLegScreen';
import ParlayTemplatesScreen from '../screens/ParlayTemplatesScreen';
import CreateTemplateScreen from '../screens/CreateTemplateScreen';
import CorrelationAnalysisScreen from '../screens/CorrelationAnalysisScreen';
import { ParlayBuilderStackParamList } from './types';

const Stack = createStackNavigator<ParlayBuilderStackParamList>();

const ParlayBuilderStackNavigator = () => {
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
        name="ParlayBuilderMain"
        component={ParlayBuilderScreen}
        options={({ route }) => ({
          title: route.params?.sport 
            ? `Build ${route.params.sport.toUpperCase()} Parlay` 
            : 'Build Parlay',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Icon name="content-save" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      
      <Stack.Screen
        name="AddLeg"
        component={AddLegScreen}
        options={{
          title: 'Add Bet',
        }}
      />
      
      <Stack.Screen
        name="ParlayTemplates"
        component={ParlayTemplatesScreen}
        options={{
          title: 'Parlay Templates',
        }}
      />
      
      <Stack.Screen
        name="CreateTemplate"
        component={CreateTemplateScreen}
        options={{
          title: 'Save Template',
        }}
      />
      
      <Stack.Screen
        name="CorrelationAnalysis"
        component={CorrelationAnalysisScreen}
        options={{
          title: 'Correlation Analysis',
        }}
      />
    </Stack.Navigator>
  );
};

export default ParlayBuilderStackNavigator;
