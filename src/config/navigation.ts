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
import NHLDashboard from '../pages/NHLDashboard';
import MLBSpringTraining from '../pages/MLBSpringTraining';

import TennisPlayers from '../pages/TennisPlayers';
import TennisTournaments from '../pages/TennisTournaments';
import TennisMatches from '../pages/TennisMatches';

import GolfPlayers from '../pages/GolfPlayers';
import GolfTournaments from '../pages/GolfTournaments';
import GolfLeaderboard from '../pages/GolfLeaderboard';

// NCAAB page imports
import NCAABGamesPage from '../pages/ncaab/NCAABGamesPage';
import NCAABStandingsPage from '../pages/ncaab/NCAABStandingsPage';
import NCAABPlayersPage from '../pages/ncaab/NCAABPlayersPage';
import NCAABTeamsPage from '../pages/ncaab/NCAABTeamsPage';
import NCAABRankingsPage from '../pages/ncaab/NCAABRankingsPage';
import NCAABBracketPage from '../pages/ncaab/NCAABBracketPage';

// Team Rosters page
import TeamRostersPage from '../pages/TeamRostersPage';

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
    title: 'ALL-ACCESS',
    items: [
      { label: 'Home', path: '/home', element: HomeScreen },
      { label: 'Live Games', path: '/live-games', element: LiveGamesScreen },
      { label: 'Newsdesk', path: '/newsdesk', element: NewsDeskScreen },
      { label: 'Team Rosters', path: '/team-rosters', element: TeamRostersPage },
    ],
  },
  {
    title: 'STATS',
    items: [
      { label: 'Player Props', path: '/player-props', element: PlayerPropsScreen },
      { label: 'Player Stats', path: '/player-stats', element: PlayerStatsScreen },
      { label: 'Match Analytics', path: '/match-analytics', element: MatchAnalyticsScreen },
      { label: 'Season Stats', path: '/season-stats', element: SeasonStatsScreen },
      { label: 'NHL Trends', path: '/nhl-trends', element: NHLTrendsScreen },
    ],
  },
  {
    title: 'GENERATOR$',
    items: [
      { label: 'Daily Picks', path: '/daily-picks', element: DailyPicksScreen },
      { label: 'Secret Phrases', path: '/secret-phrases', element: SecretPhraseScreen },
      { label: 'Sports Wire', path: '/sports-wire', element: SportsWireScreen },
      { label: 'Prize Picks', path: '/prize-picks', element: PrizePicksScreen },
      { label: 'Fantasy Hub', path: '/fantasy-hub', element: FantasyHubScreen },
      { label: 'Advanced Analytics', path: '/advanced-analytics', element: AdvancedAnalyticsScreen },
      { label: 'Kalshi Predictions', path: '/kalshi-predictions', element: KalshiPredictionsScreen },
      { label: 'Predictions Outcome', path: '/predictions-outcome', element: PredictionsOutcomeScreen },
    ],
  },
  {
    title: 'PARLAYPLUSPACKAGE-PPP',
    items: [
      { label: 'Parlay Architect', path: '/parlay-architect', element: ParlayArchitectScreen },
      { label: 'Same Game Parlay', path: '/same-game-parlay', element: SameGameParlayScreen },
      { label: 'Parlay Analytics', path: '/parlay-analytics', element: ParlayAnalyticsScreen },
      { label: 'AI Suggestions', path: '/ai-suggestions', element: AIParlaySuggestionsScreen },
    ],
  },
  {
    title: 'DASHBOARDS',
    items: [
      { label: 'Analytics Dashboard', path: '/analytics-dashboard', element: AnalyticsDashboardScreen },
      { label: 'NBA Dashboard', path: '/nba-dashboard', element: NBADashboard },
      { label: 'NHL Dashboard', path: '/nhl-dashboard', element: NHLDashboard },
      { label: 'MLB Spring Training', path: '/mlb-spring-training', element: MLBSpringTraining },
    ],
  },
  {
    title: 'NCAAB',
    items: [
      { label: 'Games', path: '/ncaab/games', element: NCAABGamesPage },
      { label: 'Standings', path: '/ncaab/standings', element: NCAABStandingsPage },
      { label: 'Players', path: '/ncaab/players', element: NCAABPlayersPage },
      { label: 'Teams', path: '/ncaab/teams', element: NCAABTeamsPage },
      { label: 'Rankings', path: '/ncaab/rankings', element: NCAABRankingsPage },
      { label: 'Bracket', path: '/ncaab/bracket', element: NCAABBracketPage },
    ],
  },
  {
    title: 'Misc. Sports',
    items: [
      { label: 'World Cup 2026', path: '/world-cup-2026', element: WorldCup2026Screen },
      { label: 'Tennis Players', path: '/tennis/players', element: TennisPlayers },
      { label: 'Tennis Tournaments', path: '/tennis/tournaments', element: TennisTournaments },
      { label: 'Tennis Matches', path: '/tennis/matches', element: TennisMatches },
      { label: 'Golf Players', path: '/golf/players', element: GolfPlayers },
      { label: 'Golf Tournaments', path: '/golf/tournaments', element: GolfTournaments },
      { label: 'Golf Leaderboard', path: '/golf/leaderboard', element: GolfLeaderboard },
    ],
  },
];

// Optional: Export a flat list of all routes for easy reference
export const allRoutes = navigationGroups.flatMap(group => group.items);
