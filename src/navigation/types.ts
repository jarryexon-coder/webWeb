// src/navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams, RouteProp } from '@react-navigation/native';

/**
 * Root Stack Navigation
 * Top-level navigation container
 */
export type RootStackParamList = {
  // Authentication
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Auth: undefined;
  
  // Main Tabs
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // 2026 Season Stack
  TwentyTwentySixHome: undefined;
  Season2026: NavigatorScreenParams<Season2026StackParamList>;
  WorldCup2026: { 
    stage?: 'qualifiers' | 'group' | 'knockout' | 'final';
    team?: string;
    matchId?: string;
  };
  AllStar2026: {
    event?: 'game' | 'three-point' | 'skills' | 'slam-dunk' | 'rising-stars';
    year?: string;
  };
  AllStarWeekend: undefined;
  Futures2026: {
    market?: 'nba' | 'nfl' | 'mlb' | 'nhl' | 'soccer';
    type?: 'championship' | 'mvp' | 'roy' | 'cy-young' | 'world-cup';
  };
  SeasonStatus: { sport?: string; season?: string };
  SeasonStats: {
    sport?: string;
    view?: 'overview' | 'trends' | 'leaderboard' | 'advanced';
    season?: string;
  };
  TradeDeadline: { sport?: string; year?: string };
  RookieWatch: { sport?: string; season?: string };
  
  // Parlay Stack
  ParlayArchitect: NavigatorScreenParams<ParlayStackParamList>;
  ParlayBuilder: { type?: string; sport?: string; legs?: any[]; initialLegs?: any[] };
  SameGameParlay: { gameId?: string; sport?: string; homeTeam?: string; awayTeam?: string };
  TeaserCalculator: { sport?: string; initialLegs?: any[] };
  RoundRobin: { legs?: any[]; initialSize?: '2' | '3' | '4' | '5' | '6' };
  ParlayBoosts: { parlayId?: string; odds?: number; legs?: any[] };
  ParlayHistory: undefined;
  ParlayDetails: { parlayId: string; parlayType?: string };
  ParlayTemplates: undefined;
  CreateTemplate: { parlayId?: string };
  CorrelationAnalysis: { legs: any[] };
  CorrelationExplorer: { sport?: string; gameId?: string };
  
  // AI Stack
  AIParlaySuggestions: { sport?: string; initialSport?: string };
  ParlayAnalytics: { parlayId?: string; legs?: any[] };
  
  // Prediction Markets
  PredictionMarkets: NavigatorScreenParams<PredictionMarketsStackParamList>;
  PredictionDetail: {
    id: string;
    type?: 'standard' | 'alt_line' | 'special' | 'futures';
    sport?: string;
  };
  
  // Daily Picks
  DailyPicks: NavigatorScreenParams<DailyPicksStackParamList>;
  PicksDashboard: undefined;
  PlayerTrends: { playerId: string; playerName: string; sport: string };
  GameDetails: { gameId: string; sport: string };
  OddsComparison: { market: string; player?: string; line: number };
  
  // Props & Markets
  PlayerProps: { sport?: string; playerId?: string; playerName?: string };
  AltLines: {
    player?: string;
    stat?: 'points' | 'assists' | 'rebounds' | 'steals' | 'blocks' | 'pra' | 'par';
    sport?: string;
  };
  
  // Sports Dashboards
  NBADashboard: { tab?: 'games' | 'props' | 'parlays' | 'stats' };
  NFLDashboard: { tab?: 'games' | 'props' | 'parlays' | 'stats' };
  NHLDashboard: { tab?: 'games' | 'props' | 'parlays' | 'stats' };
  MLBSpringTraining: { team?: string; date?: string };
  
  // Scores & Live
  Scores: { sport?: string; date?: string; isLive?: boolean };
  
  // Profile & Settings
  Profile: { tab?: 'overview' | 'bets' | 'parlays' | 'activity' };
  ProfileMain: undefined;
  BettingHistory: undefined;
  ParlayHistory: undefined;
  Settings: undefined;
  ApiKeys: undefined;
  Subscription: undefined;
  Help: undefined;
};

/**
 * Main Tab Navigation
 * Bottom tab navigator screens
 */
export type MainTabParamList = {
  Home: undefined;
  Predictions: undefined;
  DailyPicks: undefined;
  Parlay: undefined;
  ParlayBuilder: { sport?: string };
  PrizePicks: undefined;
  FantasyHub: undefined;
  Props: undefined;
  Outcomes: undefined;
  Season2026: undefined;
  Scores: undefined;
  Profile: undefined;
};

/**
 * Parlay Stack Navigation
 * Nested stack within Parlay tab
 */
export type ParlayStackParamList = {
  ParlayArchitect: { sport?: string; initialLegs?: any[] };
  ParlayBuilderMain: { sport?: string };
  AddLeg: { sport: string; existingLegs?: any[] };
  SameGameParlay: { gameId?: string; sport?: string };
  TeaserCalculator: { sport?: string };
  RoundRobin: { legs?: any[] };
  ParlayBoosts: { parlayId?: string; odds?: number };
  ParlayHistory: undefined;
  ParlayDetails: { parlayId: string };
  ParlayTemplates: undefined;
  CreateTemplate: { parlayId?: string };
  CorrelationAnalysis: { legs: any[] };
};

/**
 * AI Stack Navigation
 * AI-powered features
 */
export type AIStackParamList = {
  AIParlaySuggestions: { sport?: string };
  ParlayAnalytics: { parlayId?: string; legs?: any[] };
  CorrelationExplorer: { sport?: string; gameId?: string };
};

/**
 * Season 2026 Stack Navigation
 * 2026-specific features (World Cup, All-Star, etc.)
 */
export type Season2026StackParamList = {
  TwentyTwentySixHome: undefined;
  SeasonStatus: { sport?: string };
  WorldCup2026: { stage?: 'qualifiers' | 'group' | 'knockout'; team?: string };
  AllStar2026: { event?: 'game' | 'three-point' | 'skills' | 'slam-dunk' };
  AllStarWeekend: undefined;
  Futures2026: { market?: 'nba' | 'nfl' | 'mlb' | 'nhl'; type?: 'championship' | 'mvp' | 'roy' | 'cy-young' };
  TradeDeadline: { sport?: string };
  RookieWatch: undefined;
  SeasonStats: { sport?: string; view?: 'overview' | 'trends' | 'leaderboard' };
};

/**
 * Daily Picks Stack Navigation
 */
export type DailyPicksStackParamList = {
  PicksDashboard: undefined;
  ParlayDetails: { parlayId: string; parlayType: string };
  PlayerTrends: { playerId: string; playerName: string; sport: string };
  GameDetails: { gameId: string; sport: string };
  OddsComparison: { market: string; player?: string; line: number };
};

/**
 * Prediction Markets Stack Navigation
 */
export type PredictionMarketsStackParamList = {
  MarketsDashboard: { sport?: string };
  MarketDetails: { marketTicker: string };
  ArbitrageFinder: undefined;
  PositionHistory: undefined;
};

/**
 * Profile Stack Navigation
 */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  BettingHistory: undefined;
  ParlayHistory: undefined;
  Settings: undefined;
  ApiKeys: undefined;
  Subscription: undefined;
};

/**
 * Route Props
 * Type-safe route parameters for each screen
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  route: RouteProp<RootStackParamList, T>;
  navigation: StackNavigationProp<RootStackParamList, T>;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  route: RouteProp<MainTabParamList, T>;
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    StackNavigationProp<RootStackParamList>
  >;
};

export type ParlayStackScreenProps<T extends keyof ParlayStackParamList> = {
  route: RouteProp<ParlayStackParamList, T>;
  navigation: CompositeNavigationProp<
    StackNavigationProp<ParlayStackParamList, T>,
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList>,
      StackNavigationProp<RootStackParamList>
    >
  >;
};

/**
 * Navigation Prop Types
 * Reusable navigation prop types for components
 */
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type ParlayStackNavigationProp = StackNavigationProp<ParlayStackParamList>;
export type Season2026NavigationProp = StackNavigationProp<Season2026StackParamList>;

/**
 * Utility Types
 * For common navigation patterns
 */
export type AuthNavigationProp = StackNavigationProp<RootStackParamList, 'Login' | 'SignUp' | 'Onboarding'>;
export type ParlayBuilderNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ParlayStackParamList, 'ParlayBuilder' | 'ParlayArchitect'>,
  MainTabNavigationProp
>;

/**
 * Navigation Route Names
 * Centralized route name constants to avoid typos
 */
export const ROUTES = {
  // Root
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  SIGNUP: 'SignUp',
  MAIN_TABS: 'MainTabs',
  
  // Main Tabs
  HOME: 'Home',
  PREDICTIONS: 'Predictions',
  DAILY_PICKS: 'DailyPicks',
  PARLAY: 'Parlay',
  PRIZE_PICKS: 'PrizePicks',
  SEASON_2026: 'Season2026',
  PROFILE: 'Profile',
  
  // Parlay Stack
  PARLAY_ARCHITECT: 'ParlayArchitect',
  PARLAY_BUILDER: 'ParlayBuilder',
  SAME_GAME_PARLAY: 'SameGameParlay',
  TEASER_CALCULATOR: 'TeaserCalculator',
  ROUND_ROBIN: 'RoundRobin',
  PARLAY_BOOSTS: 'ParlayBoosts',
  PARLAY_HISTORY: 'ParlayHistory',
  PARLAY_DETAILS: 'ParlayDetails',
  PARLAY_TEMPLATES: 'ParlayTemplates',
  
  // AI Stack
  AI_PARLAY_SUGGESTIONS: 'AIParlaySuggestions',
  PARLAY_ANALYTICS: 'ParlayAnalytics',
  CORRELATION_EXPLORER: 'CorrelationExplorer',
  
  // 2026 Season
  TWENTY_TWENTY_SIX_HOME: 'TwentyTwentySixHome',
  WORLD_CUP_2026: 'WorldCup2026',
  ALL_STAR_2026: 'AllStar2026',
  ALL_STAR_WEEKEND: 'AllStarWeekend',
  FUTURES_2026: 'Futures2026',
  SEASON_STATUS: 'SeasonStatus',
  TRADE_DEADLINE: 'TradeDeadline',
  ROOKIE_WATCH: 'RookieWatch',
  
  // Props & Markets
  PLAYER_PROPS: 'PlayerProps',
  ALT_LINES: 'AltLines',
  PREDICTION_DETAIL: 'PredictionDetail',
  
  // Sports
  NBA_DASHBOARD: 'NBADashboard',
  NFL_DASHBOARD: 'NFLDashboard',
  NHL_DASHBOARD: 'NHLDashboard',
  MLB_SPRING_TRAINING: 'MLBSpringTraining',
  
  // Scores
  SCORES: 'Scores',
  
  // Profile
  BETTING_HISTORY: 'BettingHistory',
  SETTINGS: 'Settings',
  API_KEYS: 'ApiKeys',
  SUBSCRIPTION: 'Subscription',
  HELP: 'Help',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
