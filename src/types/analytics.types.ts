export type Sport = 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
export type ParlayType = 'standard' | 'same_game' | 'teaser' | 'pleaser';
export type Confidence = 'high' | 'medium' | 'low';
export type Trend = 'up' | 'down' | 'stable' | 'warning';

export interface ParlaySuccessRate {
  success_rate: number;
  avg_odds: number;
  trend: Trend;
}

export interface PropValueOpportunity {
  player: string;
  prop: string;
  line: number;
  market_odds: number;
  projected_value: number;
  edge: string;
  confidence: Confidence;
  recommendation: 'Over' | 'Under';
  game: string;
  tipoff?: string;
  kickoff?: string;
}

export interface CorrelatedParlay {
  title: string;
  description: string;
  legs: string[];
  combined_odds: string;
  true_probability: string;
  edge: string;
  correlation_factor: number;
}

export interface SharpMoneyIndicators {
  line_moves: string;
  reverse_line_movement: string;
  steam_moves: string;
  liability_alerts: string;
}

export interface OptimalStrategy {
  recommended_legs: number;
  value_threshold: string;
  best_parlay_type: string;
  avoid_correlation: string[];
}

export interface ParlayAnalytics {
  parlay_success_rates: Record<string, Record<string, ParlaySuccessRate>>;
  prop_value_opportunities: PropValueOpportunity[];
  live_betting_trends: any[];
  correlated_parlay_opportunities: CorrelatedParlay[];
  sport_specific_metrics: any;
  optimal_strategy: OptimalStrategy;
  market_sentiment: any;
  sharp_money_movements: SharpMoneyIndicators;
  data_sources: string[];
  season_progress: string;
}
