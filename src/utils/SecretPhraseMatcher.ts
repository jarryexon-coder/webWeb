// src/utils/SecretPhraseMatcher.ts

/**
 * Secret Phrase Matcher Utility
 * Provides functions to match user input to secret phrase definitions,
 * extract secret codes, and retrieve definition details.
 */

// ============================================================================
// Types
// ============================================================================

export interface SecretPhraseDefinition {
  id: string;
  category: string;
  title: string;
  description: string;
  rarity: 'Legendary' | 'Rare' | 'Uncommon' | 'Common';
  requiresPremium: boolean;
  sport: string; // e.g., "All", "NBA", "NBA, NHL", etc.
  icon: string;
  // Extended fields from file 2
  secretCode?: string;        // e.g., "26-PC"
  advancedProperty?: string;  // e.g., "predictive_clustering_analysis"
  apiEndpoint?: string;       // e.g., "/api/analytics/clustering"
  dataSource?: string;        // e.g., "api_advanced_analytics"
}

// ============================================================================
// Data: Merged Secret Phrase Definitions
// ============================================================================

export const SECRET_PHRASE_DEFINITIONS: SecretPhraseDefinition[] = [
  // ===== Advanced Analytics & Models =====
  {
    id: 'advanced_1',
    category: 'Advanced Analytics & Models',
    title: 'Predictive Clustering',
    description: 'Uses unsupervised learning to cluster similar game scenarios and predict outcomes',
    rarity: 'Legendary',
    requiresPremium: true,
    sport: 'All',
    icon: 'analytics',
    secretCode: '26-PC',
    advancedProperty: 'predictive_clustering_analysis',
    apiEndpoint: '/api/analytics/clustering',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'advanced_2',
    category: 'Advanced Analytics & Models',
    title: 'Bayesian Inference',
    description: 'Continuously updates probabilities with new information using Bayesian methods',
    rarity: 'Legendary',
    requiresPremium: true,
    sport: 'All',
    icon: 'trending-up',
    secretCode: '26-BI',
    advancedProperty: 'bayesian_inference_models',
    apiEndpoint: '/api/analytics/bayesian',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'advanced_3',
    category: 'Advanced Analytics & Models',
    title: 'Gradient Boosted Models',
    description: 'Ensemble machine learning model that combines multiple weak predictors',
    rarity: 'Legendary',
    requiresPremium: true,
    sport: 'All',
    icon: 'bar-chart',
    secretCode: '26-GBM',
    advancedProperty: 'gradient_boosted_models',
    apiEndpoint: '/api/analytics/gbm',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'advanced_4',
    category: 'Advanced Analytics & Models',
    title: 'Neural Network Ensemble',
    description: 'Combines multiple neural networks for higher accuracy predictions',
    rarity: 'Legendary',
    requiresPremium: true,
    sport: 'All',
    icon: 'git-network',
    secretCode: '26-NNE',
    advancedProperty: 'neural_network_ensemble',
    apiEndpoint: '/api/analytics/neural',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'advanced_5',
    category: 'Advanced Analytics & Models',
    title: 'Feature Importance',
    description: 'Identifies which statistics have highest predictive power for specific bets',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'All',
    icon: 'pulse',
    secretCode: '26-FI',
    advancedProperty: 'feature_importance_analysis',
    apiEndpoint: '/api/analytics/features',
    dataSource: 'api_advanced_analytics'
  },

  // ===== Advanced Injury Analytics =====
  {
    id: 'injury_1',
    category: 'Advanced Injury Analytics',
    title: 'Injury Cascades',
    description: 'Predicts secondary injury impacts (player B gets more minutes, then fatigues and gets injured)',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'All',
    icon: 'medical',
    secretCode: '26-IC',
    advancedProperty: 'injury_cascade_prediction',
    apiEndpoint: '/api/injury/cascades',
    dataSource: 'api_player_trends'
  },
  {
    id: 'injury_2',
    category: 'Advanced Injury Analytics',
    title: 'Recovery Timelines',
    description: 'Uses historical data to predict exact return dates from specific injuries',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'All',
    icon: 'calendar',
    secretCode: '26-RT',
    advancedProperty: 'recovery_timeline_analysis',
    apiEndpoint: '/api/injury/recovery',
    dataSource: 'api_player_trends'
  },
  {
    id: 'injury_3',
    category: 'Advanced Injury Analytics',
    title: 'Injury Propensity',
    description: 'Identifies players at high risk for future injuries based on workload and biomechanics',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'All',
    icon: 'warning',
    secretCode: '26-IP',
    advancedProperty: 'injury_propensity_score',
    apiEndpoint: '/api/injury/propensity',
    dataSource: 'api_player_trends'
  },
  {
    id: 'injury_4',
    category: 'Advanced Injury Analytics',
    title: 'Load Management Value',
    description: 'Finds value in games where stars are rested for load management',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NBA, NHL',
    icon: 'body',
    secretCode: '26-LMV',
    advancedProperty: 'load_management_value',
    apiEndpoint: '/api/injury/load',
    dataSource: 'api_player_trends'
  },
  {
    id: 'injury_5',
    category: 'Advanced Injury Analytics',
    title: 'Concussion Protocol Edge',
    description: 'Tracks teams/players with different concussion management approaches',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NFL, NHL',
    icon: 'shield-checkmark',
    secretCode: '26-CPE', // Not in file 2, but we can infer a code
    advancedProperty: 'concussion_protocol_edge',
    apiEndpoint: '/api/injury/concussion',
    dataSource: 'api_player_trends'
  },

  // ===== NHL-Specific Analytics =====
  {
    id: 'nhl_1',
    category: 'NHL-Specific Analytics',
    title: 'Goalie Fatigue',
    description: 'Tracks goalie workload and performance degradation with consecutive starts',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NHL',
    icon: 'ice-cream',
    secretCode: '26-GF',
    advancedProperty: 'goalie_fatigue_index',
    apiEndpoint: '/api/nhl/goalie',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_2',
    category: 'NHL-Specific Analytics',
    title: 'Special Teams Regression',
    description: 'Identifies power play/penalty kill units due for positive/negative regression',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NHL',
    icon: 'refresh-circle',
    secretCode: '26-STR',
    advancedProperty: 'special_teams_regression',
    apiEndpoint: '/api/nhl/special',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_3',
    category: 'NHL-Specific Analytics',
    title: 'Shot Quality Analytics',
    description: 'Uses expected goals (xG) models to find value in puck line/total markets',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NHL',
    icon: 'target',
    secretCode: '26-SQA',
    advancedProperty: 'shot_quality_analytics',
    apiEndpoint: '/api/nhl/shot',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_4',
    category: 'NHL-Specific Analytics',
    title: 'Back-to-Back Travel',
    description: 'Analyzes NHL team performance with different back-to-back travel scenarios',
    rarity: 'Common',
    requiresPremium: false,
    sport: 'NHL',
    icon: 'airplane',
    secretCode: '26-B2B',
    advancedProperty: 'back_to_back_travel',
    apiEndpoint: '/api/nhl/travel',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_5',
    category: 'NHL-Specific Analytics',
    title: 'Defensive Pairing Matchups',
    description: 'Tracks how specific defensive pairings perform against opponent lines',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NHL',
    icon: 'people',
    secretCode: '26-DPM',
    advancedProperty: 'defensive_pairing_matchups',
    apiEndpoint: '/api/nhl/pairings',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_6',
    category: 'NHL-Specific Analytics',
    title: 'Faceoff Leverage',
    description: 'Identifies critical faceoff situations and specialists who excel in them',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NHL',
    icon: 'hand-left',
    secretCode: '26-FL',
    advancedProperty: 'faceoff_leverage',
    apiEndpoint: '/api/nhl/faceoffs',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_7',
    category: 'NHL-Specific Analytics',
    title: 'Post-Goal Momentum',
    description: 'Tracks team performance in the 5 minutes after scoring/conceding',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NHL',
    icon: 'flash',
    secretCode: '26-PGM',
    advancedProperty: 'post_goal_momentum',
    apiEndpoint: '/api/nhl/momentum',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_8',
    category: 'NHL-Specific Analytics',
    title: 'Empty Net Strategies',
    description: 'Analyzes coach tendencies and success rates with empty net situations',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NHL',
    icon: 'networking',
    secretCode: '26-ENS',
    advancedProperty: 'empty_net_strategies',
    apiEndpoint: '/api/nhl/empty-net',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_9',
    category: 'NHL-Specific Analytics',
    title: 'Line Matching',
    description: 'Identifies which coaches aggressively match lines and the betting implications',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NHL',
    icon: 'git-compare',
    secretCode: '26-LM',
    advancedProperty: 'line_matching',
    apiEndpoint: '/api/nhl/line-matching',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nhl_10',
    category: 'NHL-Specific Analytics',
    title: 'Goalie Pull Timing',
    description: 'Analyzes optimal goalie pull times by team/coach and success rates',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NHL',
    icon: 'time',
    secretCode: '26-GPT',
    advancedProperty: 'goalie_pull_timing',
    apiEndpoint: '/api/nhl/goalie-pull',
    dataSource: 'api_advanced_analytics'
  },

  // ===== NFL-Specific Analytics =====
  {
    id: 'nfl_1',
    category: 'NFL-Specific Analytics',
    title: 'Red Zone Efficiency',
    description: 'Analyzes team performance inside the 20-yard line for touchdown predictions',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NFL',
    icon: 'american-football',
    secretCode: '26-RZE',
    advancedProperty: 'red_zone_efficiency',
    apiEndpoint: '/api/nfl/redzone',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nfl_2',
    category: 'NFL-Specific Analytics',
    title: 'Pass Rush Pressure',
    description: 'Tracks quarterback pressure rates and their impact on turnovers',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NFL',
    icon: 'flash',
    secretCode: '26-PRP',
    advancedProperty: 'pass_rush_pressure',
    apiEndpoint: '/api/nfl/pressure',
    dataSource: 'api_advanced_analytics'
  },

  // ===== NBA-Specific Analytics =====
  {
    id: 'nba_1',
    category: 'NBA-Specific Analytics',
    title: 'Three-Point Regression',
    description: 'Identifies teams due for positive/negative three-point shooting regression',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'NBA',
    icon: 'basketball',
    secretCode: '26-TPR',
    advancedProperty: 'three_point_regression',
    apiEndpoint: '/api/nba/threept',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'nba_2',
    category: 'NBA-Specific Analytics',
    title: 'Lineup Efficiency',
    description: 'Analyzes specific lineup combinations and their net ratings',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'NBA',
    icon: 'people',
    secretCode: '26-LE',
    advancedProperty: 'lineup_efficiency',
    apiEndpoint: '/api/nba/lineups',
    dataSource: 'api_advanced_analytics'
  },

  // ===== MLB-Specific Analytics =====
  {
    id: 'mlb_1',
    category: 'MLB-Specific Analytics',
    title: 'Pitcher Fatigue Index',
    description: 'Tracks pitcher workload and performance degradation',
    rarity: 'Rare',
    requiresPremium: true,
    sport: 'MLB',
    icon: 'baseball',
    secretCode: '26-PFI',
    advancedProperty: 'pitcher_fatigue_index',
    apiEndpoint: '/api/mlb/pitcher',
    dataSource: 'api_advanced_analytics'
  },
  {
    id: 'mlb_2',
    category: 'MLB-Specific Analytics',
    title: 'Bullpen Leverage',
    description: 'Analyzes bullpen usage patterns and leverage situations',
    rarity: 'Uncommon',
    requiresPremium: false,
    sport: 'MLB',
    icon: 'swap-horizontal',
    secretCode: '26-BL',
    advancedProperty: 'bullpen_leverage',
    apiEndpoint: '/api/mlb/bullpen',
    dataSource: 'api_advanced_analytics'
  }
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract the secret code (e.g., "26-PC") from a query string.
 * Returns null if no valid code is found.
 */
export function extractSecretCode(query: string): string | null {
  const match = query.match(/\b26-[A-Z]{2,3}\b/);
  return match ? match[0] : null;
}

/**
 * Retrieve a secret phrase definition by its secret code.
 * Returns undefined if not found.
 */
export function getDefinitionByCode(code: string): SecretPhraseDefinition | undefined {
  return SECRET_PHRASE_DEFINITIONS.find(def => def.secretCode === code);
}

/**
 * Find the closest matching secret phrase definition for a given query.
 * First tries exact code match, then falls back to word overlap scoring.
 *
 * @param query The user input string
 * @param threshold Minimum similarity score (0-1) to consider a match. Default 0.5.
 * @returns The best matching definition or null if none exceeds threshold.
 */
export function findClosestSecretPhrase(
  query: string,
  threshold = 0.5
): SecretPhraseDefinition | null {
  const lowerQuery = query.toLowerCase();

  // 1. Try exact code match first
  const code = extractSecretCode(query);
  if (code) {
    const def = getDefinitionByCode(code);
    if (def) return def;
  }

  // 2. Otherwise, score each definition by keyword overlap
  let bestMatch: { def: SecretPhraseDefinition; score: number } | null = null;

  for (const def of SECRET_PHRASE_DEFINITIONS) {
    // Build a set of keywords from title, description, category, and sport
    const keywords = [
      def.title,
      def.description,
      def.category,
      def.sport,
      def.secretCode || '',
      def.advancedProperty || ''
    ]
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Count how many keywords appear in the query
    let matchCount = 0;
    for (const word of keywords) {
      if (lowerQuery.includes(word)) matchCount++;
    }

    const score = matchCount / keywords.length;
    if (score > (bestMatch?.score || 0)) {
      bestMatch = { def, score };
    }
  }

  return bestMatch && bestMatch.score >= threshold ? bestMatch.def : null;
}

/**
 * Parse a full secret phrase string into its components.
 * Expected format: "26-CODE SPORT POSITION PLAYER_NAME"
 * Returns an object with code, sport, position, playerName, or null if parsing fails.
 */
export function parseSecretPhrase(
  phrase: string
): { code: string; sport: string; position: string; playerName: string } | null {
  const parts = phrase.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const code = parts[0];
  if (!code.startsWith('26-')) return null;

  const sport = parts[1];
  const position = parts[2];
  const playerName = parts.slice(3).join(' ');

  return { code, sport, position, playerName };
}
