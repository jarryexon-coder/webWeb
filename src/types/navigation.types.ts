// types/navigation.types.ts - February 2026
// Complete navigation type definitions

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Prediction } from './predictions.types';

// ========== ROOT STACK ==========

export type RootStackParamList = {
  // Main navigation
  MainTabs: undefined;
  Auth: undefined;
  Onboarding: undefined;
  
  // Predictions & Props
  PredictionDetails: {
    prediction: Prediction;
    title?: string;
  };
  PropDetails: {
    player: string;
    prop: string;
    game: string;
    line: number;
    marketOdds: number;
    projectedValue: number;
    edge: string;
  };
  PlayerProps: undefined;
  
  // Parlay features
  ParlayBuilder: {
    initialLegs?: any[];
    correlatedParlay?: any;
    fromAnalytics?: boolean;
  };
  ParlayArchitect: undefined;
  CorrelatedParlayDetails: {
    parlayId: string;
    title: string;
    legs: string[];
    combinedOdds: string;
    correlationFactor: number;
  };
  
  // Analytics
  AdvancedAnalytics: {
    sport?: 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
    parlayType?: 'standard' | 'same_game' | 'teaser' | 'pleaser';
    initialTab?: 'overview' | 'props' | 'correlated' | 'sharp';
  };
  HistoricalAnalytics: {
    sport?: string;
    dateRange?: string;
  };
  SportSpecificAnalytics: {
    sport: 'nba' | 'nfl' | 'nhl' | 'mlb';
  };
  
  // Outcomes & Sharp Money
  Outcomes: undefined;
  SharpMoneyDetails: {
    league: string;
    lineMovements: any;
  };
  
  // Secret Phrase (Easter egg / admin)
  SecretPhrase: {
    sport?: string;
    category?: string;
  };
};

// ========== BOTTOM TABS ==========

export type TabParamList = {
  Predictions: undefined;
  PlayerProps: undefined;
  ParlayArchitect: undefined;
  Outcomes: undefined;
};

// ========== ANALYTICS STACK ==========

export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
  AdvancedAnalytics: {
    sport?: 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
    parlayType?: 'standard' | 'same_game' | 'teaser' | 'pleaser';
  };
  PropDetails: {
    player: string;
    prop: string;
    game: string;
    line: number;
    marketOdds: number;
    projectedValue: number;
    edge: string;
  };
  CorrelatedParlayDetails: {
    parlayId: string;
  };
  ParlayBuilder: {
    correlatedParlay?: any;
  };
  SportSpecificAnalytics: {
    sport: 'nba' | 'nfl' | 'nhl' | 'mlb';
  };
  HistoricalAnalytics: {
    sport?: string;
    dateRange?: string;
  };
  SharpMoneyDetails: {
    league: string;
    lineMovements: any;
  };
};

// ========== NAVIGATION PROP TYPES ==========

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;
export type AnalyticsNavigationProp = NativeStackNavigationProp<AnalyticsStackParamList>;

// ========== SCREEN PROP TYPES ==========

// Root Stack Screen Props
export type PredictionDetailsScreenProps = NativeStackNavigationProp<
  RootStackParamList,
  'PredictionDetails'
>;

export type ParlayBuilderScreenProps = NativeStackNavigationProp<
  RootStackParamList,
  'ParlayBuilder'
>;

export type AdvancedAnalyticsScreenProps = NativeStackNavigationProp<
  RootStackParamList,
  'AdvancedAnalytics'
>;

export type SecretPhraseScreenProps = NativeStackNavigationProp<
  RootStackParamList,
  'SecretPhrase'
>;

// Tab Screen Props
export type PredictionsTabScreenProps = BottomTabNavigationProp<
  TabParamList,
  'Predictions'
>;

export type PlayerPropsTabScreenProps = BottomTabNavigationProp<
  TabParamList,
  'PlayerProps'
>;

export type ParlayArchitectTabScreenProps = BottomTabNavigationProp<
  TabParamList,
  'ParlayArchitect'
>;

export type OutcomesTabScreenProps = BottomTabNavigationProp<
  TabParamList,
  'Outcomes'
>;

// ========== NAVIGATION UTILITIES ==========

export type Sport = 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
export type ParlayType = 'standard' | 'same_game' | 'teaser' | 'pleaser';
export type AnalyticsTab = 'overview' | 'props' | 'correlated' | 'sharp';

// Helper type to extract route params
export type RouteParams<T extends keyof RootStackParamList> = 
  RootStackParamList[T] extends undefined ? undefined : RootStackParamList[T];

// Type guard for checking if route has params
export type HasParams<T extends keyof RootStackParamList> = 
  RootStackParamList[T] extends undefined ? false : true;
