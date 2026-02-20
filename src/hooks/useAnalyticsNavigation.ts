import { useNavigation } from '@react-navigation/native';
import { AnalyticsNavigationProp, RootNavigationProp } from '../types/navigation.types';

export const useAnalyticsNavigation = () => {
  const navigation = useNavigation<AnalyticsNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const navigateToAdvancedAnalytics = (params?: {
    sport?: 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
    parlayType?: 'standard' | 'same_game' | 'teaser' | 'pleaser';
    initialTab?: 'overview' | 'props' | 'correlated' | 'sharp';
  }) => {
    navigation.navigate('AdvancedAnalytics', params);
  };

  const navigateToPropDetails = (prop: {
    player: string;
    prop: string;
    game: string;
    line: number;
    marketOdds: number;
    projectedValue: number;
    edge: string;
  }) => {
    navigation.navigate('PropDetails', prop);
  };

  const navigateToCorrelatedParlay = (parlayId: string) => {
    navigation.navigate('CorrelatedParlayDetails', { parlayId });
  };

  const navigateToParlayBuilder = (correlatedParlay?: any) => {
    rootNavigation.navigate('ParlayBuilder', { 
      correlatedParlay,
      fromAnalytics: true 
    });
  };

  const navigateToSportAnalytics = (sport: 'nba' | 'nfl' | 'nhl' | 'mlb') => {
    navigation.navigate('SportSpecificAnalytics', { sport });
  };

  return {
    navigateToAdvancedAnalytics,
    navigateToPropDetails,
    navigateToCorrelatedParlay,
    navigateToParlayBuilder,
    navigateToSportAnalytics,
  };
};
