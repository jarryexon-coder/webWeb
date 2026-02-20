// src/config/navigation.ts
import HomeScreen from '../pages/HomeScreen';
import LiveGamesScreen from '../pages/LiveGamesScreen';
import NewsDeskScreen from '../pages/NewsDeskScreen';
import DailyPicksScreen from '../pages/DailyPicksScreen';
import LoginScreenEnhanced from '../pages/LoginScreenEnhanced';
import Health from '../pages/Health';
import DiagnosticScreen from '../pages/DiagnosticScreen';
import SubscriptionScreen from '../pages/SubscriptionScreen';
import BackendTestScreen from '../pages/BackendTestScreen';
import SecretPhraseScreen from '../pages/SecretPhraseScreen';
import SportsWireScreen from '../pages/SportsWireScreen';
import PrizePicksScreen from '../pages/PrizePicksScreen';
import FantasyHubScreen from '../pages/FantasyHubScreen';
import AdvancedAnalyticsScreen from '../pages/AdvancedAnalyticsScreen';

import PlayerPropsScreen from '../pages/PlayerPropsScreen';
import PropsDetailsScreen from '../pages/PropsDetailsScreen';
import PlayerStatsScreen from '../pages/PlayerStatsScreen';
import MatchAnalyticsScreen from '../pages/MatchAnalyticsScreen';
import SeasonStatsScreen from '../pages/SeasonStatsScreen';

import AltLinesScreen from '../pages/AltLinesScreen';
import TrendAnalysisScreen from '../pages/TrendAnalysisScreen';
import SportsSpecificAnalyticsScreen from '../pages/SportsSpecificAnalyticsScreen';
import HistoricalAnalyticsScreen from '../pages/HistoricalAnalyticsScreen';
import AnalyticsDashboardScreen from '../pages/AnalyticsDashboardScreen';
import CorrelationExplorerScreen from '../pages/CorrelationExplorerScreen';
import CorrelatedParlayDetailsScreen from '../pages/CorrelatedParlayDetailsScreen';

import ParlayArchitectScreen from '../pages/ParlayArchitectScreen';
import SameGameParlayScreen from '../pages/SameGameParlayScreen';
import ParlayDetailScreen from '../pages/ParlayDetailScreen';
import AIParlaySuggestionsScreen from '../pages/AIParlaySuggestionsScreen';
import ParlayAnalyticsScreen from '../pages/ParlayAnalyticsScreen';
import TeaserCalculatorScreen from '../pages/TeaserCalculatorScreen';
import RoundRobinScreen from '../pages/RoundRobinScreen';
import ParlayBoostsScreen from '../pages/ParlayBoostsScreen';
import ParlayHistoryScreen from '../pages/ParlayHistoryScreen';

import PredictionMarketsScreen from '../pages/PredictionMarketsScreen';
import PredictionDetailScreen from '../pages/PredictionDetailScreen';
import KalshiPredictionsScreen from '../pages/KalshiPredictionsScreen';
import PredictionsOutcomeScreen from '../pages/PredictionsOutcomeScreen';

import NHLDashboard from '../pages/NHLDashboard';
import NHLTrendsScreen from '../pages/NHLTrendsScreen';

import WorldCup2026Screen from '../pages/WorldCup2026Screen';
import Futures2026Screen from '../pages/Futures2026Screen';
import RookieWatchScreen from '../pages/RookieWatchScreen';
import AllStar2026Screen from '../pages/AllStar2026Screen';
import AllStarWeekendScreen from '../pages/AllStarWeekendScreen';
import SeasonStatusScreen from '../pages/SeasonStatusScreen';
import TradeDeadlineScreen from '../pages/TradeDeadlineScreen';

import NBADashboard from '../pages/NBADashboard';
import MLBSpringTraining from '../pages/MLBSpringTraining';
import NFLDashboard from '../pages/NFLDashboard';

import TennisPlayers from '../pages/TennisPlayers';
import TennisTournaments from '../pages/TennisTournaments';
import TennisMatches from '../pages/TennisMatches';

import GolfPlayers from '../pages/GolfPlayers';
import GolfTournaments from '../pages/GolfTournaments';
import GolfLeaderboard from '../pages/GolfLeaderboard';

export interface NavItem {
  label: string;
  path: string;
  element: React.ComponentType<any>; // for potential future use
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    title: 'Core',
    items: [
      { label: 'Home', path: '/', element: HomeScreen },
      { label: 'Live Games', path: '/live-games', element: LiveGamesScreen },
      { label: 'News Desk', path: '/news-desk', element: NewsDeskScreen },
      { label: 'Daily Picks', path: '/daily-picks', element: DailyPicksScreen },
      { label: 'Login', path: '/login', element: LoginScreenEnhanced },
      { label: 'Health', path: '/health', element: Health },
      { label: 'Diagnostic', path: '/diagnostic', element: DiagnosticScreen },
      { label: 'Subscription', path: '/subscription', element: SubscriptionScreen },
      { label: 'Backend Test', path: '/backend-test', element: BackendTestScreen },
      { label: 'Secret Phrases', path: '/secret-phrases', element: SecretPhraseScreen },
      { label: 'Sports Wire', path: '/sports-wire', element: SportsWireScreen },
      { label: 'Prize Picks', path: '/prize-picks', element: PrizePicksScreen },
      { label: 'Fantasy Hub', path: '/fantasy-hub', element: FantasyHubScreen },
      { label: 'Advanced Analytics', path: '/advanced-analytics', element: AdvancedAnalyticsScreen },
    ],
  },
  {
    title: 'Stats & Props',
    items: [
      { label: 'Player Props', path: '/player-props', element: PlayerPropsScreen },
      { label: 'Props Details', path: '/props-details/:propId', element: PropsDetailsScreen }, // dynamic
      { label: 'Player Stats', path: '/player-stats', element: PlayerStatsScreen },
      { label: 'Match Analytics', path: '/match-analytics', element: MatchAnalyticsScreen },
      { label: 'Season Stats', path: '/season-stats', element: SeasonStatsScreen },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Alt Lines', path: '/alt-lines', element: AltLinesScreen },
      { label: 'Trend Analysis', path: '/trend-analysis', element: TrendAnalysisScreen },
      { label: 'Sports Specific', path: '/sports-analytics/:sport', element: SportsSpecificAnalyticsScreen },
      { label: 'Historical', path: '/historical-analytics', element: HistoricalAnalyticsScreen },
      { label: 'Analytics Dashboard', path: '/analytics-dashboard', element: AnalyticsDashboardScreen },
      { label: 'Correlation Explorer', path: '/correlation-explorer', element: CorrelationExplorerScreen },
      { label: 'Correlated Parlay', path: '/correlated-parlay/:id', element: CorrelatedParlayDetailsScreen },
    ],
  },
  {
    title: 'Parlay Builders',
    items: [
      { label: 'Parlay Architect', path: '/parlay-architect', element: ParlayArchitectScreen },
      { label: 'Same Game Parlay', path: '/same-game-parlay', element: SameGameParlayScreen },
      { label: 'Parlay Details', path: '/parlay-details/:id', element: ParlayDetailScreen },
      { label: 'AI Suggestions', path: '/ai-suggestions', element: AIParlaySuggestionsScreen },
      { label: 'Parlay Analytics', path: '/parlay-analytics', element: ParlayAnalyticsScreen },
      { label: 'Teaser Calculator', path: '/teaser-calculator', element: TeaserCalculatorScreen },
      { label: 'Round Robin', path: '/round-robin', element: RoundRobinScreen },
      { label: 'Parlay Boosts', path: '/parlay-boosts', element: ParlayBoostsScreen },
      { label: 'Parlay History', path: '/parlay-history', element: ParlayHistoryScreen },
    ],
  },
  {
    title: 'Predictions',
    items: [
      { label: 'Prediction Markets', path: '/prediction-markets', element: PredictionMarketsScreen },
      { label: 'Prediction Detail', path: '/prediction/:id', element: PredictionDetailScreen },
      { label: 'Kalshi Predictions', path: '/kalshi-predictions', element: KalshiPredictionsScreen },
      { label: 'Predictions Outcome', path: '/predictions-outcome', element: PredictionsOutcomeScreen },
    ],
  },
  {
    title: 'NHL',
    items: [
      { label: 'NHL Dashboard', path: '/nhl-dashboard', element: NHLDashboard },
      { label: 'NHL Trends', path: '/nhl-trends', element: NHLTrendsScreen },
    ],
  },
  {
    title: 'Soccer / Futures',
    items: [
      { label: 'World Cup 2026', path: '/world-cup-2026', element: WorldCup2026Screen },
      { label: 'Futures 2026', path: '/futures-2026', element: Futures2026Screen },
      { label: 'Rookie Watch', path: '/rookie-watch', element: RookieWatchScreen },
      { label: 'All Star 2026', path: '/all-star-2026', element: AllStar2026Screen },
      { label: 'All Star Weekend', path: '/all-star-weekend', element: AllStarWeekendScreen },
      { label: 'Season Status', path: '/season-status', element: SeasonStatusScreen },
      { label: 'Trade Deadline', path: '/trade-deadline', element: TradeDeadlineScreen },
    ],
  },
  {
    title: 'Sports Dashboards',
    items: [
      { label: 'NBA Dashboard', path: '/nba-dashboard', element: NBADashboard },
      { label: 'MLB Spring Training', path: '/mlb-spring-training', element: MLBSpringTraining },
      { label: 'NFL Dashboard', path: '/nfl-dashboard', element: NFLDashboard },
    ],
  },
  {
    title: 'Tennis',
    items: [
      { label: 'Tennis Players', path: '/tennis/players', element: TennisPlayers },
      { label: 'Tennis Tournaments', path: '/tennis/tournaments', element: TennisTournaments },
      { label: 'Tennis Matches', path: '/tennis/matches', element: TennisMatches },
    ],
  },
  {
    title: 'Golf',
    items: [
      { label: 'Golf Players', path: '/golf/players', element: GolfPlayers },
      { label: 'Golf Tournaments', path: '/golf/tournaments', element: GolfTournaments },
      { label: 'Golf Leaderboard', path: '/golf/leaderboard', element: GolfLeaderboard },
    ],
  },
];
