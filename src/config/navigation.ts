// src/config/navigation.ts
import HomeScreen from '../pages/HomeScreen';
import LiveGamesScreen from '../pages/LiveGamesScreen';
import NewsDeskScreen from '../pages/NewsDeskScreen';
import DailyPicksScreen from '../pages/DailyPicksScreen';
import SecretPhraseScreen from '../pages/SecretPhraseScreen';
import SportsWireScreen from '../pages/SportsWireScreen';
import PrizePicksScreen from '../pages/PrizePicksScreen';
import FantasyHubScreen from '../pages/FantasyHubScreen';
import AdvancedAnalyticsScreen from '../pages/AdvancedAnalyticsScreen';

import PlayerPropsScreen from '../pages/PlayerPropsScreen';
import PlayerStatsScreen from '../pages/PlayerStatsScreen';
import MatchAnalyticsScreen from '../pages/MatchAnalyticsScreen';
import SeasonStatsScreen from '../pages/SeasonStatsScreen';

import AnalyticsDashboardScreen from '../pages/AnalyticsDashboardScreen';

import ParlayArchitectScreen from '../pages/ParlayArchitectScreen';
import SameGameParlayScreen from '../pages/SameGameParlayScreen';
import AIParlaySuggestionsScreen from '../pages/AIParlaySuggestionsScreen';
import ParlayAnalyticsScreen from '../pages/ParlayAnalyticsScreen';

import KalshiPredictionsScreen from '../pages/KalshiPredictionsScreen';
import PredictionsOutcomeScreen from '../pages/PredictionsOutcomeScreen';

import NHLTrendsScreen from '../pages/NHLTrendsScreen';

import WorldCup2026Screen from '../pages/WorldCup2026Screen';

import NBADashboard from '../pages/NBADashboard';
import MLBSpringTraining from '../pages/MLBSpringTraining';

import TennisPlayers from '../pages/TennisPlayers';
import TennisTournaments from '../pages/TennisTournaments';
import TennisMatches from '../pages/TennisMatches';

import GolfPlayers from '../pages/GolfPlayers';
import GolfTournaments from '../pages/GolfTournaments';
import GolfLeaderboard from '../pages/GolfLeaderboard';

// Team Rosters page
import TeamRostersPage from '../pages/TeamRostersPage';

// Tutorials
import TutorialsScreen from '../pages/TutorialsScreen';

// Settings pages
import FAQPage from '../pages/FAQPage';
import InfoPage from '../pages/InfoPage';
import AboutPage from '../pages/AboutPage';
import SettingsPage from '../pages/SettingsPage';

// Account pages
import SportsAnalyticsDashboard from '../pages/SportsAnalyticsDashboard';
import SubscriptionScreen from '../pages/SubscriptionScreen';

export interface NavItem {
  label: string;
  path: string;
  element: React.ComponentType<any>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    title: 'Free 4 All',
    items: [
      { label: 'Livegames', path: '/live-games', element: LiveGamesScreen },
      { label: 'Newsdesk', path: '/newsdesk', element: NewsDeskScreen },
      { label: 'Team rosters', path: '/team-rosters', element: TeamRostersPage },
      { label: 'Tutorials', path: '/tutorials', element: TutorialsScreen },
    ],
  },
  {
    title: 'Starters package',
    items: [
      { label: 'Nhltrends', path: '/nhl-trends', element: NHLTrendsScreen },
      { label: 'Match Analytics', path: '/match-analytics', element: MatchAnalyticsScreen },
      { label: 'Worldcup 2026', path: '/world-cup-2026', element: WorldCup2026Screen },
      { label: 'Tennis Players', path: '/tennis/players', element: TennisPlayers },
      { label: 'Tennis matches', path: '/tennis/matches', element: TennisMatches },
      { label: 'Tennis tournaments', path: '/tennis/tournaments', element: TennisTournaments },
    ],
  },
  {
    title: 'Analytics package',
    items: [
      { label: 'Player stats', path: '/player-stats', element: PlayerStatsScreen },
      { label: 'Season Stats', path: '/season-stats', element: SeasonStatsScreen },
      { label: 'Parlayanalytics', path: '/parlay-analytics', element: ParlayAnalyticsScreen },
      { label: 'Ai parlay suggestions', path: '/ai-suggestions', element: AIParlaySuggestionsScreen },
      { label: 'Player props', path: '/player-props', element: PlayerPropsScreen },
      { label: 'Golf players', path: '/golf/players', element: GolfPlayers },
      { label: 'SportsWire', path: '/sports-wire', element: SportsWireScreen },
      { label: 'Golf leaderboard', path: '/golf/leaderboard', element: GolfLeaderboard },
      { label: 'Golf Tournaments', path: '/golf/tournaments', element: GolfTournaments },
      { label: 'Advanced Analytics', path: '/advanced-analytics', element: AdvancedAnalyticsScreen },
      { label: 'Mlb Spring Training', path: '/mlb-spring-training', element: MLBSpringTraining },
      { label: 'Nba dashboard', path: '/nba-dashboard', element: NBADashboard },
    ],
  },
  {
    title: 'Generators',
    items: [
      { label: 'Daily Picks', path: '/daily-picks', element: DailyPicksScreen },
      { label: 'Same game', path: '/same-game-parlay', element: SameGameParlayScreen },
      { label: 'Fantasy hub', path: '/fantasy-hub', element: FantasyHubScreen },
      { label: 'Prize picks', path: '/prize-picks', element: PrizePicksScreen },
      { label: 'Secret phrases', path: '/secret-phrases', element: SecretPhraseScreen },
      { label: 'Predictions outcome', path: '/predictions-outcome', element: PredictionsOutcomeScreen },
      { label: 'Kalshi Predictions', path: '/kalshi-predictions', element: KalshiPredictionsScreen },
      { label: 'Parlay Architect', path: '/parlay-architect', element: ParlayArchitectScreen },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Analytics Dashboard', path: '/analytics-dashboard', element: AnalyticsDashboardScreen },
      { label: 'FAQ', path: '/faq', element: FAQPage },
      { label: 'Info', path: '/info', element: InfoPage },
      { label: 'About', path: '/about', element: AboutPage },
      { label: 'Account Settings', path: '/settings', element: SettingsPage },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Dashboard', path: '/dashboard', element: SportsAnalyticsDashboard },
      { label: 'Subscription', path: '/subscription', element: SubscriptionScreen },
      { label: 'Buy Credits', path: '/subscription?tab=credits', element: SubscriptionScreen },
    ],
  },
];

// Flat list of all routes for easy reference
export const allRoutes = navigationGroups.flatMap(group => group.items);
