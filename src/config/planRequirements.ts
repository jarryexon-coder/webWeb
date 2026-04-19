// src/config/planRequirements.ts
export const PLAN_REQUIREMENTS = {
  // Starter Package Features
  'home': 'starter',
  'live-games': 'starter',
  'news-desk': 'starter',
  'team-rosters': 'starter',
  'match-analytics': 'starter',
  'nhl-trends': 'starter',
  'ncaab-teams': 'starter',
  'world-cup': 'starter',
  
  // Tennis (Starter)
  'tennis-players': 'starter',
  'tennis-tournaments': 'starter',
  'tennis-matches': 'starter',
  
  // Analytics Package Features
  'player-props': 'analytics',
  'player-stats': 'analytics',
  'season-stats': 'analytics',
  'parlay-analytics': 'analytics',
  'ai-suggestions': 'analytics',
  'analytics-dashboard': 'analytics',
  'nhl-dashboard': 'analytics',
  'mlb-spring-training': 'analytics',
  
  // Golf (Analytics)
  'golf-players': 'analytics',
  'golf-tournaments': 'analytics',
  'golf-leaderboard': 'analytics',
  
  // Generator Package Features
  'nba-dashboard': 'generator',
  'daily-picks': 'generator',
  'secret-phrases': 'generator',
  'sports-wire': 'analytics',        // changed from generator to analytics
  'sports-wireScreen': 'analytics',
  'fantasy-hub': 'generator',
  'prizepicks': 'generator',
  'kalshi-predictions': 'generator',
  'predictions-outcome': 'generator',
  'parlay-architect': 'generator',
  'same-game-parlay': 'generator',
  'ncaab-games': 'generator',
  'ncaab-standings': 'generator',
  'ncaab-players': 'generator',
  'ncaab-bracket': 'generator'
};

export const SCREEN_REQUIREMENTS: Record<string, string> = {
  // Starter screens
  'LiveGames': 'live-games',
  'NewsDesk': 'news-desk',
  'TeamRosters': 'team-rosters',
  'MatchAnalytics': 'match-analytics',
  'NHLTrends': 'nhl-trends',
  'NCAABTeams': 'ncaab-teams',
  'WorldCup': 'world-cup',
  'WorldCup2026Screen': 'world-cup',
  
  // Tennis (Starter)
  'TennisPlayers': 'tennis-players',
  'TennisPlayersScreen': 'tennis-players',
  'TennisTournaments': 'tennis-tournaments',
  'TennisTournamentsScreen': 'tennis-tournaments',
  'TennisMatches': 'tennis-matches',
  'TennisMatchesScreen': 'tennis-matches',
  
  // Analytics screens
  'PlayerProps': 'player-props',
  'PlayerStats': 'player-stats',
  'SeasonStats': 'season-stats',
  'ParlayAnalytics': 'parlay-analytics',
  'ParlayAnalyticsScreen': 'parlay-analytics',
  'AIParlaySuggestions': 'ai-suggestions',
  'AIParlaySuggestionsScreen': 'ai-suggestions',
  'AnalyticsDashboard': 'analytics-dashboard',
  'NHLDashboard': 'nhl-dashboard',
  'MLBSpringTraining': 'mlb-spring-training',
  'AdvancedAnalyticsScreen': 'analytics-dashboard',
  'MatchAnalyticsScreen': 'match-analytics',
  'SeasonStatsScreen': 'season-stats',
  'PlayerStatsScreen': 'player-stats',
  'PlayerPropsScreen': 'player-props',
  
  // Golf (Analytics)
  'GolfPlayers': 'golf-players',
  'GolfPlayersScreen': 'golf-players',
  'GolfTournaments': 'golf-tournaments',
  'GolfTournamentsScreen': 'golf-tournaments',
  'GolfLeaderboard': 'golf-leaderboard',
  'GolfLeaderboardScreen': 'golf-leaderboard',
  
  // Generator screens
  'NBADashboard': 'nba-dashboard',
  'DailyPicks': 'daily-picks',
  'SecretPhrasesHub': 'secret-phrases',
  'SportsWire': 'sports-wire',
  'SportsWireScreen': 'sports-wire',
  'FantasyHub': 'fantasy-hub',
  'PrizePicks': 'prizepicks',
  'KalshiPredictions': 'kalshi-predictions',
  'PredictionsOutcome': 'predictions-outcome',
  'ParlayArchitect': 'parlay-architect',
  'SameGameParlay': 'same-game-parlay',
  'NCAABGames': 'ncaab-games',
  'NCAABStandings': 'ncaab-standings',
  'NCAABPlayers': 'ncaab-players',
  'NCAABBracket': 'ncaab-bracket',
  'PrizePicksScreen': 'prizepicks',
  'FantasyHubScreen': 'fantasy-hub',
  'KalshiPredictionsScreen': 'kalshi-predictions',
  'PredictionsOutcomeScreen': 'predictions-outcome',
  'ParlayArchitectScreen': 'parlay-architect',
  'SameGameParlayScreen': 'same-game-parlay',
  'NCAABGamesPage': 'ncaab-games',
  'NCAABStandingsPage': 'ncaab-standings',
  'NCAABPlayersPage': 'ncaab-players',
  'NCAABBracketPage': 'ncaab-bracket',
  'NBADashboardScreen': 'nba-dashboard',
  'NHLDashboardScreen': 'nhl-dashboard',
  'MLBSpringTrainingScreen': 'mlb-spring-training',
  'AnalyticsDashboardScreen': 'analytics-dashboard',
  'DailyPicksScreen': 'daily-picks',
  'SecretPhraseScreen': 'secret-phrases'
};
